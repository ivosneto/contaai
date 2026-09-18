/**
 * Testes de OCR/Document Intelligence — mesma convenção real de
 * tests/security/*.test.ts: login de verdade contra o Supabase ao vivo,
 * usuários seedados por scripts/seed-identity.ts, e um provider de IA
 * INJETÁVEL (processDocumentCore recebe providerFactory, mesmo desenho de
 * handleCopilotQuery) para os cenários de falha/baixa confiança — nenhum
 * teste aqui precisa de GEMINI_API_KEY nem faz uma chamada de rede real ao
 * Gemini.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";
import { createSessionScopedClient } from "@/data/repositories/domain-client.server";
import type { DomainDatabase } from "@/data/repositories/domain-types";
import type { AuthContext } from "@/data/server-functions/auth-context.server";
import type { AppRole } from "@/data/office";
import { processDocumentCore } from "@/data/server-functions/document-intelligence";
import { executeApprovedAiAction } from "@/data/server-functions/copilot";
import {
  documentStoragePath,
  uploadDocumentBytes,
  upsertDocument,
} from "@/data/repositories/documents.server";
import { MAX_DOCUMENT_BYTES, validateDocumentFile } from "@/lib/documents-engine";
import { listTimelineEvents } from "@/data/repositories/timeline.server";
import type {
  LlmCompleteRequest,
  LlmExtractDocumentRequest,
  LlmProvider,
  LlmResult,
  LlmStructuredResult,
  LlmUsage,
} from "@/lib/ai/provider.types";
import { LlmProviderError } from "@/lib/ai/provider.types";
import type { RawDocumentExtraction } from "@/lib/ai/document-extraction-schema";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
const PASSWORD = process.env["SEED_PASSWORD"];

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !PASSWORD) {
  throw new Error(
    "Faltam variáveis de ambiente para os testes de OCR (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SEED_PASSWORD). " +
      "Rode `bun run scripts/seed-identity.ts` e confirme que .env.test existe.",
  );
}

const WORKSPACE_A = "00000000-0000-0000-0000-000000000001";
const WORKSPACE_B = "00000000-0000-0000-0000-000000000002";

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

/** Provider fake — só extractDocument importa aqui; complete() nunca é chamado por processDocumentCore. */
class FakeExtractProvider implements LlmProvider {
  readonly name = "fake";
  constructor(private readonly produce: () => RawDocumentExtraction) {}
  async complete<T>(_req: LlmCompleteRequest): Promise<{ result: LlmResult<T>; usage: LlmUsage }> {
    throw new Error("FakeExtractProvider.complete não é usado por processDocumentCore.");
  }
  async extractDocument<T>(
    _req: LlmExtractDocumentRequest,
  ): Promise<{ result: LlmStructuredResult<T>; usage: LlmUsage }> {
    return {
      result: { kind: "structured", data: this.produce() as unknown as T },
      usage: { tokensIn: 10, tokensOut: 10 },
    };
  }
}

const MINIMAL_PDF_BYTES = new TextEncoder().encode(
  "%PDF-1.4\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<< /Root 1 0 R >>\n%%EOF",
);

let ownerA: AuthContext;
let ownerB: AuthContext;
let testDocumentId: string;
let testStoragePath: string;
/** CNPJ real do cliente c1 (não hardcoded — buscado do banco) — usado nos fakes de extração para isolar o cenário testado (confiança/campo ausente) do cenário de CNPJ divergente, que é testado à parte em tenant-isolation/RLS. */
let clientC1Cnpj: string;

beforeAll(async () => {
  [ownerA, ownerB] = await Promise.all([
    buildAuthContext(process.env["SEED_OWNER_A_EMAIL"], WORKSPACE_A, "owner", null),
    buildAuthContext(process.env["SEED_OWNER_B_EMAIL"], WORKSPACE_B, "owner", null),
  ]);
  const { data: c1 } = await ownerA.client.from("clients").select("cnpj").eq("id", "c1").single();
  clientC1Cnpj = c1!.cnpj;

  testDocumentId = `test-ocr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  testStoragePath = documentStoragePath(WORKSPACE_A, "c1", "nota-fiscal-teste.pdf");
  await uploadDocumentBytes(
    ownerA.client,
    testStoragePath,
    new Blob([MINIMAL_PDF_BYTES], { type: "application/pdf" }),
  );
  await upsertDocument(ownerA.client, WORKSPACE_A, {
    id: testDocumentId,
    clientId: "c1",
    name: "Nota fiscal de teste (OCR)",
    type: "Nota fiscal",
    category: "Fiscal",
    competence: "2026-09",
    assignee: "Equipe",
    status: "Recebido",
    pipelineStage: "Recebido",
    uploadedAt: new Date().toISOString().slice(0, 10),
    extraction: null,
    linkedObligationId: null,
    linkedPendencyId: null,
    storagePath: testStoragePath,
  });
});

afterAll(async () => {
  await ownerA.client.storage.from("documents").remove([testStoragePath]);
  await ownerA.client.from("documents").delete().eq("id", testDocumentId);
  await ownerA.client
    .from("ai_actions")
    .delete()
    .eq("workspace_id", WORKSPACE_A)
    .contains("payload", { documentId: testDocumentId });
  await Promise.all([ownerA.client.auth.signOut(), ownerB.client.auth.signOut()]);
});

describe("1. Validação de upload — arquivo real", () => {
  test("documento válido (PDF real, mime correto, tamanho ok) é aceito", () => {
    const result = validateDocumentFile(
      { type: "application/pdf", size: MINIMAL_PDF_BYTES.length },
      MINIMAL_PDF_BYTES,
    );
    expect(result.ok).toBe(true);
  });

  test("documento inválido — bytes não batem com o mime declarado (arquivo falsificado)", () => {
    const fakeBytes = new TextEncoder().encode("isto nao e um pdf de verdade");
    const result = validateDocumentFile(
      { type: "application/pdf", size: fakeBytes.length },
      fakeBytes,
    );
    expect(result.ok).toBe(false);
  });

  test("documento inválido — tipo fora da allowlist", () => {
    const result = validateDocumentFile(
      { type: "application/x-msdownload", size: 100 },
      new Uint8Array([0x4d, 0x5a]),
    );
    expect(result.ok).toBe(false);
  });

  test("documento inválido — maior que o limite de tamanho", () => {
    const result = validateDocumentFile(
      { type: "application/pdf", size: MAX_DOCUMENT_BYTES + 1 },
      MINIMAL_PDF_BYTES,
    );
    expect(result.ok).toBe(false);
  });

  test("documento inválido — vazio", () => {
    const result = validateDocumentFile({ type: "application/pdf", size: 0 }, new Uint8Array());
    expect(result.ok).toBe(false);
  });
});

describe("2. OCR com baixa confiança entra em revisão", () => {
  test("extração com confiança baixa gera status Pendente, needsReview e uma proposta de pendência", async () => {
    const provider = new FakeExtractProvider(() => ({
      fieldsFound: ["cnpj", "numero", "valor"],
      fieldConfidence: { cnpj: 40, numero: 45, valor: 42 },
      cnpj: clientC1Cnpj,
      numero: "123",
      valor: 500,
    }));
    const result = await processDocumentCore(ownerA, testDocumentId, () => provider);
    expect(result.document.extraction?.source).toBe("gemini");
    expect(result.document.extraction?.needsReview).toBe(true);
    expect(result.document.status).toBe("Pendente");
    expect(result.proposedActions.some((a) => a.kind === "create-pendency")).toBe(true);
  });
});

describe("3. Provider indisponível — cai para o fallback simulado", () => {
  test("provider lança UNAVAILABLE e o documento ainda é processado (modo DEMO)", async () => {
    const providerFactory = () => {
      throw new LlmProviderError("UNAVAILABLE", "provider indisponível (teste)");
    };
    const result = await processDocumentCore(ownerA, testDocumentId, providerFactory);
    expect(result.document.extraction?.source).toBe("mock");
  });
});

describe("4. Credencial ausente — mesmo caminho gracioso do provider indisponível", () => {
  test("providerFactory lança por falta de GEMINI_API_KEY e ainda assim processa via fallback", async () => {
    const providerFactory = () => {
      throw new LlmProviderError("UNAVAILABLE", "GEMINI_API_KEY ausente (teste)");
    };
    const result = await processDocumentCore(ownerA, testDocumentId, providerFactory);
    expect(result.document.extraction?.source).toBe("mock");
    expect(result.document.extraction?.needsReview).not.toBeUndefined();
  });
});

describe("5. Documento de outro tenant — acesso cross-tenant bloqueado", () => {
  test("ownerB (workspace B) não consegue processar um documento do workspace A", async () => {
    const provider = new FakeExtractProvider(() => ({ fieldsFound: [], fieldConfidence: {} }));
    await expect(processDocumentCore(ownerB, testDocumentId, () => provider)).rejects.toThrow(
      /não encontrado/i,
    );
  });
});

describe("6. Extração parcial — campo ausente nunca é inventado", () => {
  test("tipo espera valor/vencimento e o OCR não encontra — campos ficam null, needsReview true", async () => {
    const provider = new FakeExtractProvider(() => ({
      fieldsFound: ["cnpj", "razaoSocial"],
      fieldConfidence: { cnpj: 92, razaoSocial: 90 },
      cnpj: clientC1Cnpj,
      razaoSocial: "Vetta Alimentos LTDA",
      // NUNCA envia "valor"/"vencimento" em fieldsFound — mesmo que o modelo tivesse preenchido esses campos no raw, o código deve ignorá-los.
      valor: 999999,
      vencimento: "2020-01-01",
    }));
    const result = await processDocumentCore(ownerA, testDocumentId, () => provider);
    expect(result.document.extraction?.valor).toBeNull();
    expect(result.document.extraction?.vencimento).toBeNull();
    expect(result.document.extraction?.razaoSocial).toBe("Vetta Alimentos LTDA");
    expect(result.document.extraction?.needsReview).toBe(true);
  });
});

describe("7. Fallback mock fica explicitamente marcado", () => {
  test("extração real (source: gemini) e extração de fallback (source: mock) são distinguíveis", async () => {
    const okProvider = new FakeExtractProvider(() => ({
      fieldsFound: ["cnpj", "numero", "valor"],
      fieldConfidence: { cnpj: 95, numero: 93, valor: 90 },
      cnpj: clientC1Cnpj,
      numero: "555",
      valor: 1200,
    }));
    const real = await processDocumentCore(ownerA, testDocumentId, () => okProvider);
    expect(real.document.extraction?.source).toBe("gemini");

    const failingFactory = () => {
      throw new LlmProviderError("UNAVAILABLE", "indisponível (teste)");
    };
    const fallback = await processDocumentCore(ownerA, testDocumentId, failingFactory);
    expect(fallback.document.extraction?.source).toBe("mock");
    expect(fallback.document.extraction?.source).not.toBe(real.document.extraction?.source);
  });
});

describe("8. Ação proposta pelo OCR não executa sem aprovação humana", () => {
  // Timeout maior que o padrão (5s): processDocumentCore + executeApprovedAiAction
  // encadeiam bem mais round-trips reais de rede que só ela sozinha (a
  // persistência real do resultado do OCR — upsertDocument/upsertTimelineEvent,
  // ver describe 9 — e a revalidação de posse do documento antes de vincular
  // à obrigação, ambas correções desta auditoria de hardening).
  test(
    "link-obligation-evidence nasce 'proposed' e a obrigação só muda depois de executeApprovedAiAction",
    async () => {
    // Cria uma obrigação real de teste (mesma competência/tipo do documento) para o matchObligation encontrar.
    const obligationId = `test-obl-${Date.now().toString(36)}`;
    const { upsertObligation, listObligations } =
      await import("@/data/repositories/obligations.server");
    await upsertObligation(ownerA.client, WORKSPACE_A, {
      id: obligationId,
      clientId: "c1",
      type: "SPED Fiscal",
      department: "Fiscal",
      competence: "2026-09",
      dueDate: "2026-10-20",
      regime: "Simples Nacional",
      municipality: "São Paulo",
      assignee: "Equipe",
      status: "Em andamento",
      priority: "Alta",
      evidenceDocumentId: null,
      checklist: [],
    });

    try {
      const provider = new FakeExtractProvider(() => ({
        fieldsFound: ["cnpj", "numero", "valor"],
        fieldConfidence: { cnpj: 95, numero: 93, valor: 90 },
        cnpj: clientC1Cnpj,
        numero: "777",
        valor: 800,
      }));
      const result = await processDocumentCore(ownerA, testDocumentId, () => provider);
      const linkAction = result.proposedActions.find((a) => a.kind === "link-obligation-evidence");
      expect(linkAction).toBeDefined();

      const { data: proposedRow } = await ownerA.client
        .from("ai_actions")
        .select("status")
        .eq("id", linkAction!.id)
        .single();
      expect(proposedRow?.status).toBe("proposed");
      const beforeObligations = await listObligations(ownerA.client, WORKSPACE_A);
      expect(beforeObligations.find((o) => o.id === obligationId)?.evidenceDocumentId).toBeNull();

      await executeApprovedAiAction(ownerA, linkAction!.id);

      const { data: executedRow } = await ownerA.client
        .from("ai_actions")
        .select("status")
        .eq("id", linkAction!.id)
        .single();
      expect(executedRow?.status).toBe("executed");
      const afterObligations = await listObligations(ownerA.client, WORKSPACE_A);
      expect(afterObligations.find((o) => o.id === obligationId)?.evidenceDocumentId).toBe(
        testDocumentId,
      );
    } finally {
      await ownerA.client.from("obligations").delete().eq("id", obligationId);
    }
    },
    15000,
  );
});

/**
 * Regressão da auditoria de hardening final: processDocumentCore calculava
 * `updatedDocument`/`timelineEvent` mas nunca chamava upsertDocument/
 * upsertTimelineEvent — o resultado só existia na resposta HTTP e no estado
 * local do navegador que disparou o processamento; um reload, outra aba ou
 * outro membro da equipe continuavam vendo o documento como "Recebido", sem
 * extração nenhuma.
 */
describe("9. Persistência real — o resultado do OCR sobrevive além da resposta HTTP", () => {
  test("extração, status e pipelineStage ficam gravados no banco (visíveis numa nova leitura)", async () => {
    const { listDocuments } = await import("@/data/repositories/documents.server");
    const provider = new FakeExtractProvider(() => ({
      fieldsFound: ["cnpj", "numero", "valor"],
      fieldConfidence: { cnpj: 95, numero: 93, valor: 90 },
      cnpj: clientC1Cnpj,
      numero: "999",
      valor: 321,
    }));
    const result = await processDocumentCore(ownerA, testDocumentId, () => provider);

    // Simula "outra aba"/reload: relê do banco com um client novo, não o
    // objeto devolvido pela chamada acima.
    const reloaded = await listDocuments(ownerA.client, WORKSPACE_A);
    const persisted = reloaded.find((d) => d.id === testDocumentId);
    expect(persisted?.pipelineStage).toBe("Concluído");
    expect(persisted?.status).toBe(result.document.status);
    expect(persisted?.extraction?.numero).toBe("999");
    expect(persisted?.extraction?.valor).toBe(321);

    const timeline = await listTimelineEvents(ownerA.client, WORKSPACE_A);
    expect(timeline.some((e) => e.id === result.timelineEvent.id)).toBe(true);
  });
});
