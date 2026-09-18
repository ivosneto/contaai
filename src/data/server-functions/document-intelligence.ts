// OCR/Document Intelligence real — reaproveita a mesma infra de IA do
// Copilot (LlmProvider, ai_actions/Action Engine, ai_interactions) em vez de
// criar uma segunda arquitetura. Assim como handleCopilotQuery, o núcleo
// (processDocumentCore) recebe o provider por injeção (providerFactory) para
// ser testável sem chave real nem custo de rede — só o server function
// (processDocumentFn) usa getLlmProvider() de verdade.
// auth-context.server.ts nunca é importado no topo como VALOR — só `import
// type` (apagado na compilação). Este módulo não é `.server.ts` e é
// alcançável a partir de componentes do navegador (documents-page.tsx), então
// um import estático de valor puxaria @tanstack/react-start/server
// (getRequest) para o bundle do cliente, que o plugin de import-protection do
// Vite bloqueia. Cada handler importa requireAuthContext/requireStaff
// dinamicamente.
import { createServerFn } from "@tanstack/react-start";
import type { AuthContext } from "./auth-context.server";
import type { LlmProvider } from "@/lib/ai/provider.types";
import {
  DOCUMENT_EXTRACTION_SCHEMA,
  EXTRACTABLE_FIELDS,
  type RawDocumentExtraction,
} from "@/lib/ai/document-extraction-schema";
import {
  buildDocumentExtractionInstructions,
  buildDocumentExtractionSystemPrompt,
} from "@/lib/ai/system-prompt";
import { ALL_DOCUMENT_TYPES, ALL_PENDENCY_CATEGORIES } from "@/lib/documents-engine";
import type { AiActionKind } from "@/data/repositories/ai-actions.server";
import type {
  ClientDocument,
  DocumentExtraction,
  DocumentType,
  ExtractedFieldConfidence,
  PendencyCategory,
  TimelineEvent,
} from "@/data/office";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  return btoa(binary);
}

/** Índice determinístico a partir do id — só alimenta o fallback simulado (mesma função já usada em store.tsx para o mesmo propósito). */
function hashIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return h;
}

/**
 * Converte a saída bruta do Gemini para o DocumentExtraction canônico do
 * app. A defesa central contra invenção: um campo só vira valor se estiver
 * em `fieldsFound` — se o modelo preencheu `valor` mas não o listou como
 * encontrado, o código descarta o valor e trata como ausente.
 */
function rawToExtraction(
  raw: RawDocumentExtraction,
  expectedType: DocumentType,
  expectedCategory: PendencyCategory,
  expectedCompetence: string,
): DocumentExtraction {
  const found = new Set(raw.fieldsFound ?? []);
  const has = (f: (typeof EXTRACTABLE_FIELDS)[number]) => found.has(f);

  const fieldConfidence: ExtractedFieldConfidence = {};
  for (const f of EXTRACTABLE_FIELDS) {
    const c = raw.fieldConfidence?.[f];
    if (has(f) && typeof c === "number") fieldConfidence[f] = c;
  }
  const confidences = Object.values(fieldConfidence).filter(
    (v): v is number => typeof v === "number",
  );
  const overallConfidence =
    confidences.length > 0
      ? Math.round(confidences.reduce((s, v) => s + v, 0) / confidences.length)
      : 0;

  const tipoDetectado =
    has("tipoDetectado") && ALL_DOCUMENT_TYPES.includes(raw.tipoDetectado as DocumentType)
      ? (raw.tipoDetectado as DocumentType)
      : expectedType;
  const categoria =
    has("categoria") && ALL_PENDENCY_CATEGORIES.includes(raw.categoria as PendencyCategory)
      ? (raw.categoria as PendencyCategory)
      : expectedCategory;

  return {
    tipoDetectado,
    cnpj: has("cnpj") ? (raw.cnpj ?? "") : "",
    competencia: has("competencia") ? (raw.competencia ?? expectedCompetence) : expectedCompetence,
    valor: has("valor") && typeof raw.valor === "number" ? raw.valor : null,
    vencimento: has("vencimento") ? (raw.vencimento ?? null) : null,
    numero: has("numero") ? (raw.numero ?? "") : "",
    categoria,
    confidence: overallConfidence,
    razaoSocial: has("razaoSocial") ? (raw.razaoSocial ?? null) : null,
    fornecedor: has("fornecedor") ? (raw.fornecedor ?? null) : null,
    fieldConfidence,
    source: "gemini",
  };
}

export type ProposedActionSummary = {
  id: string;
  label: string;
  description: string;
  kind: AiActionKind;
};

export type ProcessDocumentResult = {
  document: ClientDocument;
  timelineEvent: TimelineEvent;
  proposedActions: ProposedActionSummary[];
};

/**
 * Núcleo testável (mesmo desenho de handleCopilotQuery em copilot.ts):
 * 1) busca o documento via listDocuments (RLS-bound — de outro workspace,
 *    simplesmente não aparece: fecha o cenário cross-tenant em código, não
 *    só na RLS); 2) baixa os bytes reais do Storage; 3) tenta o OCR real,
 *    cai para simulateExtraction em qualquer falha do provider (indisponível,
 *    timeout, credencial ausente, saída inválida); 4) valida e tenta casar
 *    com uma obrigação (motores puros já existentes, sem mudança de
 *    contrato); 5) NUNCA escreve pendência/obrigação direto — só propõe via
 *    ai_actions (mesmo Action Engine do Copilot), sempre esperando
 *    aprovação humana; 6) loga em ai_interactions/audit_logs sempre, mesmo
 *    em fallback.
 */
export async function processDocumentCore(
  ctx: AuthContext,
  documentId: string,
  providerFactory: () => LlmProvider,
): Promise<ProcessDocumentResult> {
  const [{ listDocuments, downloadDocumentBytes }, { listClients }, { listObligations }] =
    await Promise.all([
      import("@/data/repositories/documents.server"),
      import("@/data/repositories/clients.server"),
      import("@/data/repositories/obligations.server"),
    ]);

  const documents = await listDocuments(ctx.client, ctx.workspaceId);
  const doc = documents.find((d) => d.id === documentId);
  if (!doc) throw new Error("Documento não encontrado neste workspace.");
  if (!doc.storagePath)
    throw new Error(
      "Este documento não tem um arquivo real associado (documento de demonstração).",
    );

  const clients = await listClients(ctx.client, ctx.workspaceId);
  const client = clients.find((c) => c.id === doc.clientId);
  if (!client) throw new Error("Cliente do documento não encontrado neste workspace.");

  const docForEngines = { type: doc.type, category: doc.category, competence: doc.competence };
  let extraction: DocumentExtraction;
  let ocrError: string | null = null;

  try {
    const provider = providerFactory();
    const blob = await downloadDocumentBytes(ctx.client, doc.storagePath);
    const base64 = arrayBufferToBase64(await blob.arrayBuffer());
    const { result } = await provider.extractDocument<RawDocumentExtraction>({
      systemPrompt: buildDocumentExtractionSystemPrompt(),
      instructions: buildDocumentExtractionInstructions({
        expectedType: doc.type,
        expectedCategory: doc.category,
        competence: doc.competence,
        clientName: client.name,
        clientCnpj: client.cnpj,
      }),
      file: { mimeType: blob.type || "application/pdf", base64 },
      responseSchema: DOCUMENT_EXTRACTION_SCHEMA,
    });
    extraction = rawToExtraction(result.data, doc.type, doc.category, doc.competence);
  } catch (err) {
    ocrError = err instanceof Error ? err.message : "Falha desconhecida no provider de OCR.";
    const { simulateExtraction } = await import("@/lib/documents-engine");
    extraction = simulateExtraction(docForEngines, client, hashIndex(doc.id));
  }

  const { validateExtraction, matchObligation } = await import("@/lib/documents-engine");
  const validation = validateExtraction(extraction, client, docForEngines);
  extraction.needsReview = validation.issues.length > 0;

  const obligations = await listObligations(ctx.client, ctx.workspaceId);
  const matched =
    validation.status !== "Rejeitado"
      ? matchObligation(docForEngines, doc.clientId, obligations)
      : null;

  const updatedDocument: ClientDocument = {
    ...doc,
    extraction,
    status: validation.status,
    pipelineStage: "Concluído",
  };

  const { proposeAiAction } = await import("@/data/repositories/ai-actions.server");
  const proposedActions: ProposedActionSummary[] = [];

  if (validation.issues.length > 0) {
    const row = await proposeAiAction(ctx.client, {
      workspaceId: ctx.workspaceId,
      proposedByUserId: ctx.userId,
      kind: "create-pendency",
      payload: {
        clientId: doc.clientId,
        title: `Revisar documento — ${doc.name}`,
        description: validation.issues.join(" "),
        assignee: doc.assignee,
        priority: "Alta",
        category: doc.category,
        documentId: doc.id,
      },
    });
    proposedActions.push({
      id: row.id,
      label: `Revisar documento "${doc.name}"`,
      description: validation.issues.join(" "),
      kind: "create-pendency",
    });
  }
  if (matched) {
    const description = `Documento corresponde à obrigação ${matched.type} do cliente na competência ${matched.competence}.`;
    const row = await proposeAiAction(ctx.client, {
      workspaceId: ctx.workspaceId,
      proposedByUserId: ctx.userId,
      kind: "link-obligation-evidence",
      payload: { obligationId: matched.id, documentId: doc.id },
    });
    proposedActions.push({
      id: row.id,
      label: `Vincular "${doc.name}" à obrigação ${matched.type} (${matched.competence})`,
      description,
      kind: "link-obligation-evidence",
    });
  }

  const timelineEvent: TimelineEvent = {
    id: `tl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    clientId: doc.clientId,
    date: new Date().toISOString().slice(0, 10),
    type: "documento",
    title:
      extraction.source === "gemini"
        ? "Documento processado (OCR)"
        : "Documento processado (modo DEMO — OCR simulado)",
    detail: `${doc.name}: status ${validation.status}${validation.issues.length > 0 ? " · " + validation.issues.join(" ") : ""}`,
  };

  const { upsertDocument } = await import("@/data/repositories/documents.server");
  await upsertDocument(ctx.client, ctx.workspaceId, updatedDocument);
  const { upsertTimelineEvent } = await import("@/data/repositories/timeline.server");
  await upsertTimelineEvent(ctx.client, ctx.workspaceId, timelineEvent);

  const [{ logAiInteraction }, { logAuditEvent }] = await Promise.all([
    import("@/data/repositories/ai-interactions.server"),
    import("@/data/repositories/audit.server"),
  ]);
  await logAiInteraction(ctx.client, {
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    question: `[OCR] ${doc.name}`,
    model: extraction.source === "gemini" ? "gemini" : "fallback-mock",
    toolCalls: [],
    response: `status=${validation.status}${extraction.needsReview ? " needsReview" : ""}`,
    proposedActionIds: proposedActions.map((a) => a.id),
    tokensIn: null,
    tokensOut: null,
    estimatedCostUsd: null,
    latencyMs: 0,
    error: ocrError,
  });
  await logAuditEvent(ctx.client, {
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    action: "document.processed",
    entityType: "document",
    entityId: doc.id,
    newValue: {
      status: validation.status,
      source: extraction.source,
      needsReview: extraction.needsReview,
    },
  });

  return { document: updatedDocument, timelineEvent, proposedActions };
}

export const processDocumentFn = createServerFn({ method: "POST" })
  .validator((data: { documentId: string }) => data)
  .handler(async ({ data }): Promise<ProcessDocumentResult> => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { getLlmProvider } = await import("@/lib/ai/provider.server");
    return processDocumentCore(ctx, data.documentId, getLlmProvider);
  });

/** Link de download protegido (staff) — nunca uma URL pública; expira em 5 min. Verifica que o documento pertence ao workspace antes de gerar o link. */
export const getDocumentDownloadUrlFn = createServerFn({ method: "POST" })
  .validator((data: { documentId: string }) => data)
  .handler(async ({ data }): Promise<{ url: string }> => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { listDocuments, createSignedDocumentUrl } =
      await import("@/data/repositories/documents.server");
    const documents = await listDocuments(ctx.client, ctx.workspaceId);
    const doc = documents.find((d) => d.id === data.documentId);
    if (!doc || !doc.storagePath)
      throw new Error("Documento não encontrado ou sem arquivo real associado.");
    const url = await createSignedDocumentUrl(ctx.client, doc.storagePath);
    return { url };
  });
