/**
 * Regressão da auditoria de hardening final: GmailProvider.listNewMessages
 * buscava só a primeira página (maxResults=20) da busca do Gmail — que
 * devolve os resultados do mais novo para o mais antigo — e calculava o
 * próximo cursor a partir da mensagem mais recente VISTA, não da mais
 * recente que existe. Numa caixa com mais de 20 mensagens novas entre
 * sincronizações, as mensagens além da primeira página nunca eram buscadas
 * E o cursor avançava mesmo assim, fazendo-as sumir para sempre (a próxima
 * busca `after:cursor` as excluía permanentemente).
 *
 * Este teste não usa Supabase — GmailProvider fala com a API do Gmail via
 * fetch puro, então basta simular o fetch (sem rede real, sem credencial).
 */
import { afterAll, afterEach, describe, expect, test } from "bun:test";
import { GmailProvider } from "@/lib/email/gmail-provider.server";
import type { EmailTokens } from "@/lib/email/provider.types";

const originalFetch = globalThis.fetch;

function installFetchMock(totalPages: number, pageSize: number) {
  let messageCounter = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    if (url.pathname.endsWith("/messages")) {
      const pageToken = url.searchParams.get("pageToken");
      const pageNum = pageToken ? Number(pageToken) : 0;
      const ids = Array.from({ length: pageSize }, () => ({ id: `msg-${messageCounter++}` }));
      const nextPageToken = pageNum + 1 < totalPages ? String(pageNum + 1) : undefined;
      return new Response(JSON.stringify({ messages: ids, nextPageToken }), { status: 200 });
    }
    const match = url.pathname.match(/\/messages\/([^/]+)$/);
    if (match) {
      return new Response(
        JSON.stringify({
          id: match[1],
          threadId: match[1],
          internalDate: String(Date.now()),
          payload: { headers: [{ name: "From", value: "remetente@example.com" }], parts: [] },
        }),
        { status: 200 },
      );
    }
    throw new Error(`URL inesperada no mock de fetch: ${url.toString()}`);
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});
afterAll(() => {
  globalThis.fetch = originalFetch;
});

const TOKENS: EmailTokens = {
  accessToken: "fake-access",
  refreshToken: "fake-refresh",
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
};

describe("GmailProvider.listNewMessages — paginação não perde mensagem nem avança cursor demais", () => {
  test("janela com mais mensagens que o teto de segurança: não avança o cursor (evita perder as mais antigas)", async () => {
    // 6 páginas de 20 = 120 mensagens disponíveis, teto de segurança é 100 —
    // a busca para em 100 mas ainda há nextPageToken (mensagens mais antigas
    // não buscadas ficam faltando).
    installFetchMock(6, 20);
    const provider = new GmailProvider("client-id", "client-secret", "https://redirect.example");
    const sinceCursor = String(Math.floor(Date.now() / 1000) - 86_400);

    const result = await provider.listNewMessages(TOKENS, sinceCursor);

    expect(result.messages.length).toBe(100);
    // Cursor não avança — a próxima sincronização revarre a mesma janela em
    // vez de pular as mensagens mais antigas que não deu tempo de buscar.
    expect(result.nextCursor).toBe(sinceCursor);
  });

  test("janela com menos mensagens que uma página: busca tudo e avança o cursor normalmente", async () => {
    installFetchMock(1, 3);
    const provider = new GmailProvider("client-id", "client-secret", "https://redirect.example");
    const sinceCursor = String(Math.floor(Date.now() / 1000) - 86_400);

    const result = await provider.listNewMessages(TOKENS, sinceCursor);

    expect(result.messages.length).toBe(3);
    expect(result.nextCursor).not.toBe(sinceCursor);
  });
});
