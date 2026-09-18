/**
 * Abstração de provider de e-mail — nenhum segredo aqui, só tipos. Mesmo
 * espírito de src/lib/ai/provider.types.ts: um único provider concreto
 * existe hoje (GmailProvider, em gmail-provider.server.ts), o resto do
 * sistema (server functions, testes) só conhece esta interface — trocar de
 * provider (Outlook, IMAP genérico) no futuro é implementar de novo e
 * adicionar um caso em provider.server.ts, sem tocar em mais nada.
 */

export type EmailTokens = {
  accessToken: string;
  refreshToken: string;
  /** ISO 8601 */
  expiresAt: string;
};

export type InboundEmailAttachment = {
  filename: string;
  mimeType: string;
  /** id da própria API do provider — usado só para baixar o anexo, nunca persistido fora do processamento da mensagem. */
  attachmentId: string;
  sizeBytes: number;
};

export type InboundEmailMessage = {
  /** Identificador estável do provider (ex.: Gmail message id) — chave de dedupe: communications.id = `email-<provider>-<providerMessageId>`, então sincronizar a mesma mensagem duas vezes é um upsert idempotente, nunca uma duplicata. */
  providerMessageId: string;
  threadId: string;
  /** Endereço do remetente (só o e-mail, sem "Nome <...>"). */
  from: string;
  fromName: string | null;
  subject: string;
  bodyText: string;
  /** ISO 8601 */
  receivedAt: string;
  attachments: InboundEmailAttachment[];
};

export type ListNewMessagesResult = {
  messages: InboundEmailMessage[];
  /** Cursor a salvar em email_accounts.sync_cursor — próxima sincronização começa daqui. */
  nextCursor: string;
};

export interface EmailProvider {
  readonly name: string;
  /** Monta a URL de consentimento OAuth — `state` deve ser gerado e validado pelo chamador (CSRF + workspaceId). */
  getAuthUrl(state: string): string;
  /** Troca o `code` do callback OAuth pelos tokens + descobre o endereço da caixa conectada. */
  exchangeCode(code: string): Promise<{ tokens: EmailTokens; emailAddress: string }>;
  refreshTokens(refreshToken: string): Promise<EmailTokens>;
  listNewMessages(tokens: EmailTokens, sinceCursor: string | null): Promise<ListNewMessagesResult>;
  /** Filename/mimeType já vêm de InboundEmailAttachment (metadados da mensagem) — a API de anexo do Gmail só devolve os bytes. */
  downloadAttachment(
    tokens: EmailTokens,
    messageId: string,
    attachmentId: string,
  ): Promise<{ bytes: ArrayBuffer }>;
}

export class EmailProviderError extends Error {
  constructor(
    public code: "UNAVAILABLE" | "AUTH_EXPIRED" | "RATE_LIMITED",
    message: string,
  ) {
    super(message);
  }
}
