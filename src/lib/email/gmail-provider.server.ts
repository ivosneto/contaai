// Único provider concreto de e-mail hoje — Gmail (OAuth 2.0 + Gmail API REST
// pura via fetch, sem SDK novo). GOOGLE_OAUTH_CLIENT_ID/_SECRET/_REDIRECT_URI
// nunca são lidos aqui: chegam pelo construtor, resolvidos por
// provider.server.ts (mesmo espírito de gemini-provider.server.ts). Este
// arquivo é .server.ts: nunca importado por um componente, só por
// provider.server.ts e pelos testes.
import type {
  EmailProvider,
  EmailTokens,
  InboundEmailAttachment,
  InboundEmailMessage,
  ListNewMessagesResult,
} from "./provider.types";
import { EmailProviderError } from "./provider.types";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
/** Primeira sincronização de uma caixa recém-conectada: só as mensagens dos últimos 7 dias, não o histórico inteiro — evita um sync inicial gigante e imprevisível. */
const FIRST_SYNC_WINDOW_DAYS = 7;
const PAGE_SIZE = 20;
/** Teto de segurança por chamada de sync — evita um loop de páginas sem fim numa caixa muito cheia. */
const MAX_MESSAGES_PER_SYNC = 100;

type GmailHeader = { name: string; value: string };
type GmailPart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { data?: string; attachmentId?: string; size?: number };
  parts?: GmailPart[];
};
type GmailMessage = {
  id: string;
  threadId: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailPart;
};

function base64UrlDecode(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseFromHeader(raw: string): { email: string; name: string | null } {
  const match = raw.match(/^(.*?)<(.+)>$/);
  if (match)
    return {
      name: match[1]?.trim().replace(/^"|"$/g, "") || null,
      email: (match[2] ?? "").trim().toLowerCase(),
    };
  return { email: raw.trim().toLowerCase(), name: null };
}

function findPlainTextBody(part: GmailPart | undefined): string | null {
  if (!part) return null;
  if (part.mimeType === "text/plain" && part.body?.data) return base64UrlDecode(part.body.data);
  for (const child of part.parts ?? []) {
    const found = findPlainTextBody(child);
    if (found) return found;
  }
  return null;
}

function collectAttachments(part: GmailPart | undefined): InboundEmailAttachment[] {
  if (!part) return [];
  const attachments: InboundEmailAttachment[] = [];
  if (part.filename && part.body?.attachmentId) {
    attachments.push({
      filename: part.filename,
      mimeType: part.mimeType ?? "application/octet-stream",
      attachmentId: part.body.attachmentId,
      sizeBytes: part.body.size ?? 0,
    });
  }
  for (const child of part.parts ?? []) attachments.push(...collectAttachments(child));
  return attachments;
}

function toInboundMessage(message: GmailMessage): InboundEmailMessage {
  const headers = message.payload?.headers;
  const from = parseFromHeader(headerValue(headers, "From"));
  const receivedAt = message.internalDate
    ? new Date(Number(message.internalDate)).toISOString()
    : new Date().toISOString();
  return {
    providerMessageId: message.id,
    threadId: message.threadId,
    from: from.email,
    fromName: from.name,
    subject: headerValue(headers, "Subject") || "(sem assunto)",
    bodyText: findPlainTextBody(message.payload) ?? message.snippet ?? "",
    receivedAt,
    attachments: collectAttachments(message.payload),
  };
}

export class GmailProvider implements EmailProvider {
  readonly name = "gmail";

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string,
  ) {}

  private async request<T>(accessToken: string, url: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    } catch (err) {
      throw new EmailProviderError(
        "UNAVAILABLE",
        err instanceof Error ? err.message : "Falha ao contatar a API do Gmail.",
      );
    }
    if (response.status === 401)
      throw new EmailProviderError(
        "AUTH_EXPIRED",
        "Token de acesso do Gmail expirado ou revogado.",
      );
    if (response.status === 429)
      throw new EmailProviderError("RATE_LIMITED", "Limite de requisições do Gmail atingido.");
    if (!response.ok)
      throw new EmailProviderError("UNAVAILABLE", `Gmail API retornou ${response.status}.`);
    return (await response.json()) as T;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: SCOPE,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{ tokens: EmailTokens; emailAddress: string }> {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok)
      throw new EmailProviderError(
        "UNAVAILABLE",
        `Falha ao trocar o código OAuth do Gmail (${tokenRes.status}).`,
      );
    const body = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    if (!body.refresh_token)
      throw new EmailProviderError(
        "UNAVAILABLE",
        "Google não retornou refresh_token — reconecte com `prompt=consent`.",
      );
    const tokens: EmailTokens = {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: new Date(Date.now() + body.expires_in * 1000).toISOString(),
    };
    const profile = await this.request<{ emailAddress: string }>(
      tokens.accessToken,
      `${API_BASE}/profile`,
    );
    return { tokens, emailAddress: profile.emailAddress };
  }

  async refreshTokens(refreshToken: string): Promise<EmailTokens> {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
      }),
    });
    if (tokenRes.status === 400 || tokenRes.status === 401)
      throw new EmailProviderError(
        "AUTH_EXPIRED",
        "Refresh token do Gmail inválido ou revogado — é preciso reconectar.",
      );
    if (!tokenRes.ok)
      throw new EmailProviderError(
        "UNAVAILABLE",
        `Falha ao renovar o token do Gmail (${tokenRes.status}).`,
      );
    const body = (await tokenRes.json()) as { access_token: string; expires_in: number };
    return {
      accessToken: body.access_token,
      refreshToken,
      expiresAt: new Date(Date.now() + body.expires_in * 1000).toISOString(),
    };
  }

  async listNewMessages(
    tokens: EmailTokens,
    sinceCursor: string | null,
  ): Promise<ListNewMessagesResult> {
    const afterSeconds = sinceCursor
      ? Number(sinceCursor)
      : Math.floor(Date.now() / 1000) - FIRST_SYNC_WINDOW_DAYS * 24 * 60 * 60;
    const q = `after:${afterSeconds} in:inbox`;

    // Gmail devolve os resultados de busca do mais novo para o mais antigo.
    // Segue nextPageToken até esgotar a janela OU até o teto de segurança —
    // se parar por causa do teto (ainda há nextPageToken), as mensagens não
    // buscadas são necessariamente MAIS ANTIGAS que as já buscadas, então o
    // cursor não pode avançar: fazê-lo pularia essas mensagens mais antigas
    // para sempre na próxima sincronização (elas nunca voltariam a cair
    // depois de `after:cursor`). Sem avançar, a próxima chamada revarre a
    // mesma janela — as já processadas são ignoradas via dedupe por id em
    // syncEmailAccountCore, então isso só custa chamadas de API extras,
    // nunca perde mensagem.
    const messages: InboundEmailMessage[] = [];
    let latestInternalDate = afterSeconds * 1000;
    let pageToken: string | undefined;
    let truncated = false;
    do {
      const params = new URLSearchParams({ q, maxResults: String(PAGE_SIZE) });
      if (pageToken) params.set("pageToken", pageToken);
      const list = await this.request<{ messages?: { id: string }[]; nextPageToken?: string }>(
        tokens.accessToken,
        `${API_BASE}/messages?${params.toString()}`,
      );
      const ids = list.messages ?? [];
      for (const { id } of ids) {
        const full = await this.request<GmailMessage>(
          tokens.accessToken,
          `${API_BASE}/messages/${id}?format=full`,
        );
        messages.push(toInboundMessage(full));
        const internalDate = Number(full.internalDate ?? 0);
        if (internalDate > latestInternalDate) latestInternalDate = internalDate;
      }
      pageToken = list.nextPageToken;
      if (pageToken && messages.length >= MAX_MESSAGES_PER_SYNC) {
        truncated = true;
        break;
      }
    } while (pageToken);

    // Cursor = 1s depois da mensagem mais recente vista, em segundos (formato que `after:` do Gmail espera) — nunca reprocessa a mesma mensagem na próxima sincronização. Só avança quando a janela inteira foi varrida (ver comentário acima).
    const nextCursor = truncated
      ? (sinceCursor ?? String(afterSeconds))
      : String(Math.floor(latestInternalDate / 1000) + 1);
    return { messages, nextCursor };
  }

  async downloadAttachment(
    tokens: EmailTokens,
    messageId: string,
    attachmentId: string,
  ): Promise<{ bytes: ArrayBuffer }> {
    const data = await this.request<{ data: string; size: number }>(
      tokens.accessToken,
      `${API_BASE}/messages/${messageId}/attachments/${attachmentId}`,
    );
    const normalized = data.data.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Buffer.from(normalized, "base64");
    return { bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  }
}
