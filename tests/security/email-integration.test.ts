/**
 * Testes da integração real de e-mail (Gmail OAuth) — mesma convenção real
 * de tests/security/*.test.ts: login de verdade contra o Supabase ao vivo,
 * usuários seedados por scripts/seed-identity.ts, e providers (e-mail e IA)
 * INJETÁVEIS (syncEmailAccountCore/connectEmailAccountCore recebem
 * providerFactory, mesmo desenho de processDocumentCore/handleCopilotQuery)
 * — nenhum teste aqui precisa de credencial OAuth real do Google nem de
 * GEMINI_API_KEY, e nenhum faz chamada de rede real.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";
import { createSessionScopedClient } from "@/data/repositories/domain-client.server";
import type { DomainDatabase } from "@/data/repositories/domain-types";
import type { AuthContext } from "@/data/server-functions/auth-context.server";
import type { AppRole } from "@/data/office";
import {
  connectEmailAccountCore,
  syncEmailAccountCore,
} from "@/data/server-functions/email-integration";
import {
  EmailProviderError,
  type EmailProvider,
  type EmailTokens,
  type InboundEmailMessage,
  type ListNewMessagesResult,
} from "@/lib/email/provider.types";
import type {
  LlmCompleteRequest,
  LlmExtractDocumentRequest,
  LlmProvider,
  LlmResult,
  LlmStructuredResult,
  LlmUsage,
} from "@/lib/ai/provider.types";
import { LlmProviderError } from "@/lib/ai/provider.types";
import type { RawEmailClassification } from "@/lib/ai/email-classification-schema";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
const PASSWORD = process.env["SEED_PASSWORD"];

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !PASSWORD) {
  throw new Error(
    "Faltam variáveis de ambiente para os testes de e-mail (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SEED_PASSWORD). " +
      "Rode `bun run scripts/seed-identity.ts` e confirme que .env.test existe.",
  );
}

const WORKSPACE_A = "00000000-0000-0000-0000-000000000001";
const WORKSPACE_B = "00000000-0000-0000-0000-000000000002";
/** Semeado em 20260920100000_email_integration.sql — contato real de c1. */
const CONTACT_C1_EMAIL = "ana.ferreira@vettaalimentos.com.br";

async function buildAuthContext(
  email: string | undefined,
  workspaceId: string,
  role: AppRole,
  clientId: string | null,
): Promise<AuthContext> {
  if (!email) throw new Error("E-mail de teste ausente em .env.test.");
  const anon = createClient<DomainDatabase>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD! });
  if (error || !data.session) throw new Error(`Falha ao logar como ${email}: ${error?.message}`);
  return {
    userId: data.session.user.id,
    workspaceId,
    role,
    clientId,
    client: createSessionScopedClient(data.session.access_token),
  };
}

class FakeEmailProvider implements EmailProvider {
  readonly name = "fake-gmail";
  listCallCount = 0;
  constructor(
    private readonly opts: {
      emailAddress?: string;
      listNewMessagesImpl?: (
        tokens: EmailTokens,
        sinceCursor: string | null,
        callIndex: number,
      ) => Promise<ListNewMessagesResult>;
    } = {},
  ) {}
  getAuthUrl(state: string): string {
    return `https://fake.example/auth?state=${encodeURIComponent(state)}`;
  }
  async exchangeCode(_code: string) {
    return {
      tokens: {
        accessToken: "fake-access",
        refreshToken: "fake-refresh",
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      },
      emailAddress: this.opts.emailAddress ?? "conta-teste@example.com",
    };
  }
  async refreshTokens(refreshToken: string): Promise<EmailTokens> {
    return {
      accessToken: `fake-access-refreshed-${Date.now()}`,
      refreshToken,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    };
  }
  async listNewMessages(
    tokens: EmailTokens,
    sinceCursor: string | null,
  ): Promise<ListNewMessagesResult> {
    const callIndex = this.listCallCount++;
    if (this.opts.listNewMessagesImpl)
      return this.opts.listNewMessagesImpl(tokens, sinceCursor, callIndex);
    return { messages: [], nextCursor: String(Date.now()) };
  }
  async downloadAttachment(): Promise<{ bytes: ArrayBuffer }> {
    const bytes = MINIMAL_PDF_BYTES.slice();
    return { bytes: bytes.buffer };
  }
}

class FakeLlmProvider implements LlmProvider {
  readonly name = "fake-llm";
  constructor(private readonly produce: RawEmailClassification | (() => never)) {}
  async complete<T>(_req: LlmCompleteRequest): Promise<{ result: LlmResult<T>; usage: LlmUsage }> {
    if (typeof this.produce === "function") return this.produce();
    return {
      result: { kind: "structured", data: this.produce as unknown as T },
      usage: { tokensIn: 1, tokensOut: 1 },
    };
  }
  async extractDocument<T>(
    _req: LlmExtractDocumentRequest,
  ): Promise<{ result: LlmStructuredResult<T>; usage: LlmUsage }> {
    throw new Error("FakeLlmProvider.extractDocument não é usado por estes testes.");
  }
}

const NEUTRAL_CLASSIFICATION: RawEmailClassification = {
  category: "Outros",
  sentiment: "Neutro",
  priority: "Baixa",
  requiresAction: false,
  suggestedAction: "",
  summary: "Mensagem de teste.",
};
const neutralLlm = new FakeLlmProvider(NEUTRAL_CLASSIFICATION);

const MINIMAL_PDF_BYTES = new TextEncoder().encode(
  "%PDF-1.4\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<< /Root 1 0 R >>\n%%EOF",
);
/** Sufixo único por execução — evita colidir com timeline_events de uma execução anterior (append-only na RLS, sem policy de DELETE, então não são limpáveis pelo teste). */
const RUN_ID = Date.now().toString(36);

function makeMessage(
  overrides: Partial<InboundEmailMessage> & { providerMessageId: string },
): InboundEmailMessage {
  return {
    threadId: `thread-${overrides.providerMessageId}`,
    from: "remetente@example.com",
    fromName: null,
    subject: "Assunto de teste",
    bodyText: "Corpo de teste.",
    receivedAt: new Date().toISOString(),
    attachments: [],
    ...overrides,
  };
}

let ownerA: AuthContext;
let ownerB: AuthContext;
const createdCommunicationIds: string[] = [];

beforeAll(async () => {
  [ownerA, ownerB] = await Promise.all([
    buildAuthContext(process.env["SEED_OWNER_A_EMAIL"], WORKSPACE_A, "owner", null),
    buildAuthContext(process.env["SEED_OWNER_B_EMAIL"], WORKSPACE_B, "owner", null),
  ]);
  await connectEmailAccountCore(ownerA, "seed-code", () => new FakeEmailProvider());
});

afterAll(async () => {
  const { disconnectEmailAccount } = await import("@/data/repositories/email-accounts.server");
  await disconnectEmailAccount(ownerA.client, WORKSPACE_A);
  if (createdCommunicationIds.length > 0) {
    await ownerA.client.from("communications").delete().in("id", createdCommunicationIds);
    await ownerA.client
      .from("timeline_events")
      .delete()
      .in(
        "id",
        createdCommunicationIds.map((id) => `tl-${id}`),
      );
    await ownerA.client.from("documents").delete().like("id", "doc-email-fake-gmail-%");
    await ownerA.client
      .from("ai_actions")
      .delete()
      .eq("workspace_id", WORKSPACE_A)
      .filter(
        "payload->>communicationId",
        "in",
        `(${createdCommunicationIds.map((id) => `"${id}"`).join(",")})`,
      );
  }
  await Promise.all([ownerA.client.auth.signOut(), ownerB.client.auth.signOut()]);
});

function trackedSync(messages: InboundEmailMessage[], llm: LlmProvider = neutralLlm) {
  for (const m of messages) createdCommunicationIds.push(`email-fake-gmail-${m.providerMessageId}`);
  const provider = new FakeEmailProvider({
    listNewMessagesImpl: async () => ({ messages, nextCursor: String(Date.now()) }),
  });
  return syncEmailAccountCore(
    ownerA,
    () => provider,
    () => llm,
  );
}

describe("1. OAuth — conexão real (tokens nunca em claro)", () => {
  test("connectEmailAccountCore troca code por tokens, criptografa e nunca retorna em claro", async () => {
    const summary = await connectEmailAccountCore(
      ownerA,
      "fake-code",
      () => new FakeEmailProvider(),
    );
    expect(summary.status).toBe("connected");
    expect(summary.emailAddress).toBe("conta-teste@example.com");
    expect(Object.keys(summary)).not.toContain("tokens");
    expect(Object.keys(summary)).not.toContain("access_token_encrypted");

    const { data } = await ownerA.client
      .from("email_accounts")
      .select("access_token_encrypted,refresh_token_encrypted")
      .eq("workspace_id", WORKSPACE_A)
      .single();
    expect(data?.access_token_encrypted).not.toBe("fake-access");
    expect(data?.access_token_encrypted?.split(".").length).toBe(3); // iv.authTag.ciphertext
  });
});

describe("2. Token expirado — sync tenta renovar, marca erro se falhar de novo", () => {
  test("listNewMessages sempre expirado → status error, sem crash", async () => {
    const provider = new FakeEmailProvider({
      listNewMessagesImpl: async () => {
        throw new EmailProviderError("AUTH_EXPIRED", "expirado (teste)");
      },
    });
    const result = await syncEmailAccountCore(
      ownerA,
      () => provider,
      () => neutralLlm,
    );
    expect(result.status).toBe("error");
    expect(provider.listCallCount).toBe(2); // 1ª tentativa + 1 retry após refresh
    const { data } = await ownerA.client
      .from("email_accounts")
      .select("status,last_error")
      .eq("workspace_id", WORKSPACE_A)
      .single();
    expect(data?.status).toBe("error");
    expect(data?.last_error).toBeTruthy();
  });
});

describe("9. Provider indisponível — degrada sem crash, nada parcial", () => {
  test("listNewMessages indisponível → status error, sem retry, sem dado corrompido", async () => {
    const provider = new FakeEmailProvider({
      listNewMessagesImpl: async () => {
        throw new EmailProviderError("UNAVAILABLE", "indisponível (teste)");
      },
    });
    const result = await syncEmailAccountCore(
      ownerA,
      () => provider,
      () => neutralLlm,
    );
    expect(result.status).toBe("error");
    expect(provider.listCallCount).toBe(1); // UNAVAILABLE não tenta refresh/retry
  });
});

describe("3. Duplicação — identificador estável evita reprocessar", () => {
  test("mesma providerMessageId sincronizada duas vezes gera uma única comunicação", async () => {
    const message = makeMessage({
      providerMessageId: `dup-msg-1-${RUN_ID}`,
      from: CONTACT_C1_EMAIL,
      subject: "Teste dedupe",
    });
    createdCommunicationIds.push(`email-fake-gmail-dup-msg-1-${RUN_ID}`);
    const provider = new FakeEmailProvider({
      listNewMessagesImpl: async () => ({ messages: [message], nextCursor: "cursor-fixo" }),
    });
    await syncEmailAccountCore(
      ownerA,
      () => provider,
      () => neutralLlm,
    );
    await syncEmailAccountCore(
      ownerA,
      () => provider,
      () => neutralLlm,
    );
    const { data } = await ownerA.client
      .from("communications")
      .select("id")
      .eq("id", `email-fake-gmail-dup-msg-1-${RUN_ID}`);
    expect(data).toHaveLength(1);
  });
});

describe("4. Mensagem sem cliente — não vincula automaticamente", () => {
  test("remetente desconhecido fica com client_id null, sem documentos/ai_actions", async () => {
    const message = makeMessage({
      providerMessageId: `unknown-sender-1-${RUN_ID}`,
      from: "desconhecido@dominio-sem-contato.example",
      subject: "Dúvida geral",
    });
    const result = await trackedSync([message]);
    expect(result.unlinkedCount).toBe(1);
    expect(result.linkedCount).toBe(0);
    const { data } = await ownerA.client
      .from("communications")
      .select("client_id")
      .eq("id", `email-fake-gmail-unknown-sender-1-${RUN_ID}`)
      .single();
    expect(data?.client_id).toBeNull();
  });
});

describe("5. Matching incorreto — ambiguidade nunca vincula sozinho", () => {
  test("domínio compartilhado por contatos de clientes diferentes não vincula", async () => {
    const tempContactId = `test-contact-amb-${Date.now().toString(36)}`;
    const { error: insertError } = await ownerA.client
      .from("contacts")
      .insert({
        id: tempContactId,
        workspace_id: WORKSPACE_A,
        client_id: "c2",
        name: "Contato Ambíguo (teste)",
        role: "Teste",
        email: "outro@vettaalimentos.com.br",
        phone: "",
        is_primary: false,
      });
    expect(insertError).toBeNull();
    try {
      const message = makeMessage({
        providerMessageId: `ambiguous-1-${RUN_ID}`,
        from: "qualquercoisa@vettaalimentos.com.br",
        subject: "Assunto ambíguo",
      });
      const result = await trackedSync([message]);
      expect(result.unlinkedCount).toBe(1);
      const { data } = await ownerA.client
        .from("communications")
        .select("client_id")
        .eq("id", `email-fake-gmail-ambiguous-1-${RUN_ID}`)
        .single();
      expect(data?.client_id).toBeNull();
    } finally {
      await ownerA.client.from("contacts").delete().eq("id", tempContactId);
    }
  });
});

describe("6. Anexo — vai para o pipeline de Documentos, nunca processa OCR sozinho", () => {
  test("e-mail vinculado com anexo cria documento em 'Recebido'", async () => {
    const message = makeMessage({
      providerMessageId: `with-attachment-1-${RUN_ID}`,
      from: CONTACT_C1_EMAIL,
      subject: "Nota fiscal em anexo",
      attachments: [
        {
          filename: "nota-teste.pdf",
          mimeType: "application/pdf",
          attachmentId: "att-1",
          sizeBytes: MINIMAL_PDF_BYTES.length,
        },
      ],
    });
    await trackedSync([message]);
    const docId = `doc-email-fake-gmail-with-attachment-1-${RUN_ID}-att-1`;
    const { data } = await ownerA.client
      .from("documents")
      .select("pipeline_stage,status,client_id,storage_path,extraction")
      .eq("id", docId)
      .single();
    expect(data?.pipeline_stage).toBe("Recebido");
    expect(data?.status).toBe("Recebido");
    expect(data?.client_id).toBe("c1");
    expect(data?.extraction).toBeNull(); // nunca processa OCR sozinho
    if (data?.storage_path)
      await ownerA.client.storage.from("documents").remove([data.storage_path]);
    await ownerA.client.from("documents").delete().eq("id", docId);
  });
});

describe("7. Classificação — IA com fallback pro motor de regras", () => {
  test("classificação por IA é refletida na comunicação", async () => {
    const message = makeMessage({
      providerMessageId: `classify-1-${RUN_ID}`,
      from: CONTACT_C1_EMAIL,
      subject: "Cobrança urgente",
      bodyText: "Preciso da segunda via do boleto vencido, é urgente.",
    });
    const classification: RawEmailClassification = {
      category: "Cobrança",
      sentiment: "Negativo",
      priority: "Alta",
      requiresAction: true,
      suggestedAction: "Enviar 2ª via do boleto",
      summary: "Cliente pede 2ª via de boleto vencido.",
    };
    await trackedSync([message], new FakeLlmProvider(classification));
    const { data } = await ownerA.client
      .from("communications")
      .select("classification,priority,requires_action,suggested_action")
      .eq("id", `email-fake-gmail-classify-1-${RUN_ID}`)
      .single();
    expect(data?.classification).toBe("Cobrança");
    expect(data?.requires_action).toBe(true);
    expect(data?.suggested_action).toBe("Enviar 2ª via do boleto");
  });

  test("classificação cai para o motor de regras quando o provider de IA falha", async () => {
    const message = makeMessage({
      providerMessageId: `classify-fallback-1-${RUN_ID}`,
      from: CONTACT_C1_EMAIL,
      subject: "Reclamação",
      bodyText: "Muito insatisfeito, isso já aconteceu de novo.",
    });
    const failingLlm = new FakeLlmProvider(() => {
      throw new LlmProviderError("UNAVAILABLE", "fora do ar (teste)");
    });
    await trackedSync([message], failingLlm);
    const { data } = await ownerA.client
      .from("communications")
      .select("classification")
      .eq("id", `email-fake-gmail-classify-fallback-1-${RUN_ID}`)
      .single();
    expect(data?.classification).toBe("Reclamação");
  });
});

describe("8. Isolamento entre workspaces", () => {
  test("sync do workspace A nunca cria/expõe dados no workspace B", async () => {
    const message = makeMessage({
      providerMessageId: `tenant-check-1-${RUN_ID}`,
      from: CONTACT_C1_EMAIL,
      subject: "Isolamento",
    });
    await trackedSync([message]);
    const { data, error } = await ownerB.client
      .from("communications")
      .select("id")
      .eq("id", `email-fake-gmail-tenant-check-1-${RUN_ID}`);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test("ownerB não consegue ler a conta de e-mail (nem tokens) do workspace A", async () => {
    const { data, error } = await ownerB.client
      .from("email_accounts")
      .select("*")
      .eq("workspace_id", WORKSPACE_A);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

/**
 * Regressão da auditoria de hardening final: duas chamadas concorrentes de
 * "Sincronizar agora" (duplo clique, duas abas) liam a mesma lista de
 * comunicações já existentes ANTES de qualquer uma escrever — o dedupe por
 * id só protegia entre sincronizações sequenciais. syncEmailAccountCore
 * agora adquire um lock condicional (tryStartEmailSync, CAS para status
 * "syncing") antes de processar: a segunda chamada concorrente encontra a
 * conta já "syncing" e retorna sem reprocessar nada.
 */
describe("10. Concorrência — duas sincronizações simultâneas não processam em paralelo", () => {
  test("segunda chamada concorrente encontra a conta 'syncing' e não reprocessa", async () => {
    const message = makeMessage({
      providerMessageId: `concurrent-1-${RUN_ID}`,
      from: CONTACT_C1_EMAIL,
      subject: "Concorrência",
    });
    createdCommunicationIds.push(`email-fake-gmail-concurrent-1-${RUN_ID}`);

    let releaseFirstCall: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseFirstCall = resolve;
    });
    const provider = new FakeEmailProvider({
      listNewMessagesImpl: async () => {
        await gate;
        return { messages: [message], nextCursor: String(Date.now()) };
      },
    });

    const first = syncEmailAccountCore(
      ownerA,
      () => provider,
      () => neutralLlm,
    );
    // Dá tempo do primeiro chamador terminar o CAS (tryStartEmailSync) antes
    // do segundo tentar — é essa ordem que expõe a corrida real.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const second = await syncEmailAccountCore(
      ownerA,
      () => provider,
      () => neutralLlm,
    );
    expect(second.syncedCount).toBe(0);
    expect(second.error).toMatch(/já em andamento/);

    releaseFirstCall();
    const firstResult = await first;
    expect(firstResult.status).toBe("connected");
    expect(firstResult.syncedCount).toBe(1);

    const { data } = await ownerA.client
      .from("communications")
      .select("id")
      .eq("id", `email-fake-gmail-concurrent-1-${RUN_ID}`);
    expect(data).toHaveLength(1);
  });
});
