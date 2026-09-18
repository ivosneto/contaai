// Integração real de e-mail (Gmail OAuth) — reaproveita a mesma infra de IA
// do Copilot/OCR (LlmProvider, ai_actions/Action Engine, ai_interactions,
// pipeline de Documentos) em vez de criar uma segunda arquitetura. Assim
// como processDocumentCore/handleCopilotQuery, o núcleo de sincronização
// recebe os providers por injeção — testável sem chave real nem custo de
// rede. auth-context.server.ts nunca é importado no topo como VALOR (só
// `import type`) — este módulo é alcançável a partir de componentes do
// navegador (integrations-page.tsx), então cada handler importa
// requireAuthContext/requireStaff/requireManagerOrAbove dinamicamente (ver
// o bug de import-protection corrigido na tarefa de OCR).
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import type { AuthContext } from "./auth-context.server";
import type { EmailAccountSummary } from "@/data/repositories/email-accounts.server";
import {
  EmailProviderError,
  type EmailProvider,
  type InboundEmailMessage,
} from "@/lib/email/provider.types";
import type { LlmProvider } from "@/lib/ai/provider.types";
import { LlmProviderError } from "@/lib/ai/provider.types";
import type { RawEmailClassification } from "@/lib/ai/email-classification-schema";

const STATE_TTL_MS = 10 * 60 * 1000;

function signState(payload: {
  workspaceId: string;
  userId: string;
  nonce: string;
  issuedAt: number;
}): string {
  const key = process.env["EMAIL_TOKEN_ENCRYPTION_KEY"];
  if (!key) throw new Error("EMAIL_TOKEN_ENCRYPTION_KEY ausente.");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${signature}`;
}

/** Prova que o callback OAuth é uma continuação legítima de um getGmailAuthUrlFn emitido por este servidor para este usuário/workspace, não um `state` forjado — proteção de CSRF padrão de fluxo OAuth. */
function verifyState(state: string, expected: { workspaceId: string; userId: string }): boolean {
  const key = process.env["EMAIL_TOKEN_ENCRYPTION_KEY"];
  if (!key) return false;
  const [body, signature] = state.split(".");
  if (!body || !signature) return false;
  const expectedSignature = createHmac("sha256", key).update(body).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      workspaceId: string;
      userId: string;
      issuedAt: number;
    };
    if (payload.workspaceId !== expected.workspaceId || payload.userId !== expected.userId)
      return false;
    return Date.now() - payload.issuedAt <= STATE_TTL_MS;
  } catch {
    return false;
  }
}

export const getGmailAuthUrlFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ url: string }> => {
    const { requireAuthContext, requireManagerOrAbove } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireManagerOrAbove(ctx);
    const { getEmailProvider } = await import("@/lib/email/provider.server");
    const provider = getEmailProvider();
    const state = signState({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      nonce: randomUUID(),
      issuedAt: Date.now(),
    });
    return { url: provider.getAuthUrl(state) };
  },
);

/**
 * Núcleo testável da conclusão do OAuth — troca `code` por tokens, criptografa
 * e grava. Separado da validação de `state`/requireAuthContext (que só fazem
 * sentido com uma requisição HTTP real) para ser chamável direto por teste.
 */
export async function connectEmailAccountCore(
  ctx: AuthContext,
  code: string,
  providerFactory: () => EmailProvider,
): Promise<EmailAccountSummary> {
  const provider = providerFactory();
  const { tokens, emailAddress } = await provider.exchangeCode(code);
  const { upsertEmailAccountConnection, getEmailAccountSummary } =
    await import("@/data/repositories/email-accounts.server");
  await upsertEmailAccountConnection(ctx.client, ctx.workspaceId, {
    emailAddress,
    tokens,
    connectedByUserId: ctx.userId,
  });
  const summary = await getEmailAccountSummary(ctx.client, ctx.workspaceId);
  if (!summary) throw new Error("Falha ao gravar a conexão de e-mail.");
  return summary;
}

export const completeGmailOAuthFn = createServerFn({ method: "POST" })
  .validator((data: { code: string; state: string }) => data)
  .handler(async ({ data }): Promise<EmailAccountSummary> => {
    const { requireAuthContext, requireManagerOrAbove } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireManagerOrAbove(ctx);
    if (!verifyState(data.state, { workspaceId: ctx.workspaceId, userId: ctx.userId })) {
      throw new Error("Sessão de conexão OAuth inválida ou expirada — tente conectar novamente.");
    }
    const { getEmailProvider } = await import("@/lib/email/provider.server");
    return connectEmailAccountCore(ctx, data.code, getEmailProvider);
  });

export const disconnectEmailAccountFn = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAuthContext, requireManagerOrAbove } = await import("./auth-context.server");
  const ctx = await requireAuthContext();
  requireManagerOrAbove(ctx);
  const { disconnectEmailAccount } = await import("@/data/repositories/email-accounts.server");
  await disconnectEmailAccount(ctx.client, ctx.workspaceId);
  return null;
});

export const getEmailAccountStatusFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailAccountSummary | null> => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { getEmailAccountSummary } = await import("@/data/repositories/email-accounts.server");
    return getEmailAccountSummary(ctx.client, ctx.workspaceId);
  },
);

async function classifyEmail(
  message: InboundEmailMessage,
  llmProviderFactory: () => LlmProvider,
): Promise<RawEmailClassification> {
  try {
    const provider = llmProviderFactory();
    const { buildEmailClassificationSystemPrompt, buildEmailClassificationInstructions } =
      await import("@/lib/ai/system-prompt");
    const { EMAIL_CLASSIFICATION_SCHEMA } = await import("@/lib/ai/email-classification-schema");
    const { result } = await provider.complete<RawEmailClassification>({
      systemPrompt: buildEmailClassificationSystemPrompt(),
      messages: [
        {
          role: "user",
          text: buildEmailClassificationInstructions(message.subject, message.bodyText),
        },
      ],
      responseSchema: EMAIL_CLASSIFICATION_SCHEMA,
    });
    if (result.kind !== "structured")
      throw new LlmProviderError(
        "INVALID_OUTPUT",
        "Classificação de e-mail sem saída estruturada.",
      );
    return result.data;
  } catch {
    // Provider de IA indisponível ou saída inválida — cai para o motor de regras já existente (mesmo padrão do Copilot/OCR).
    const { classifyContent, summarize } = await import("@/lib/communication-engine");
    const fallback = classifyContent(message.bodyText);
    return {
      category: fallback.category,
      sentiment: fallback.sentiment,
      priority: fallback.priority,
      requiresAction: fallback.requiresAction,
      suggestedAction: fallback.suggestedAction,
      summary: summarize(message.bodyText),
    };
  }
}

export type SyncResult = {
  status: "connected" | "error";
  syncedCount: number;
  linkedCount: number;
  unlinkedCount: number;
  error: string | null;
};

/**
 * Núcleo de sincronização — testável (mesmo desenho de processDocumentCore/
 * handleCopilotQuery). 1) carrega a conta com tokens decriptados;
 * 2) lista mensagens novas, renovando o token uma vez se expirado;
 * 3) para cada mensagem: dedupe por id determinístico, identifica cliente
 * (sem vincular se a confiança for baixa), classifica (IA → fallback regra),
 * grava a comunicação, timeline, anexos (sem processar) e propõe pendência
 * via ai_actions quando aplicável — nunca escreve pendência/vínculo direto;
 * 4) atualiza o estado da conta (sucesso ou erro), nunca deixa "presa".
 */
export async function syncEmailAccountCore(
  ctx: AuthContext,
  emailProviderFactory: () => EmailProvider,
  llmProviderFactory: () => LlmProvider,
): Promise<SyncResult> {
  const { getEmailAccountForSync, updateEmailAccountSyncState, tryStartEmailSync } =
    await import("@/data/repositories/email-accounts.server");
  const account = await getEmailAccountForSync(ctx.client, ctx.workspaceId);
  if (!account) throw new Error("Nenhuma conta de e-mail conectada neste workspace.");

  // Lock condicional: se já existe uma sincronização em andamento (outra aba,
  // duplo clique), esta chamada não reprocessa nada — evita mensagens
  // duplicadas/anexos duplicados/propostas de ai_actions duplicadas que o
  // dedupe por id só previne entre execuções sequenciais, não concorrentes.
  const acquired = await tryStartEmailSync(ctx.client, account.id);
  if (!acquired) {
    return {
      status: "connected",
      syncedCount: 0,
      linkedCount: 0,
      unlinkedCount: 0,
      error: "Sincronização já em andamento — aguarde a atual terminar.",
    };
  }

  const fail = async (message: string): Promise<SyncResult> => {
    await updateEmailAccountSyncState(ctx.client, account.id, {
      status: "error",
      lastError: message,
    });
    return { status: "error", syncedCount: 0, linkedCount: 0, unlinkedCount: 0, error: message };
  };

  let provider: EmailProvider;
  try {
    provider = emailProviderFactory();
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Provider de e-mail indisponível.");
  }

  let tokens = account.tokens;
  let listResult;
  try {
    try {
      listResult = await provider.listNewMessages(tokens, account.syncCursor);
    } catch (err) {
      if (err instanceof EmailProviderError && err.code === "AUTH_EXPIRED") {
        tokens = await provider.refreshTokens(tokens.refreshToken);
        listResult = await provider.listNewMessages(tokens, account.syncCursor);
      } else {
        throw err;
      }
    }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Falha desconhecida ao sincronizar e-mail.");
  }

  const [
    { listContacts },
    { listCommunications, upsertCommunication },
    { identifyClientForSender },
  ] = await Promise.all([
    import("@/data/repositories/contacts.server"),
    import("@/data/repositories/communications.server"),
    import("@/lib/email/client-matching"),
  ]);
  const [contacts, pastCommunications] = await Promise.all([
    listContacts(ctx.client, ctx.workspaceId),
    listCommunications(ctx.client, ctx.workspaceId),
  ]);

  // timeline_events é append-only na RLS (staff só tem INSERT, nunca UPDATE)
  // — reprocessar uma mensagem já sincronizada não pode tentar reescrever o
  // mesmo evento de timeline. Prevenção de duplicação real: se o id
  // determinístico já existe em communications, a mensagem já foi
  // processada nesta ou numa sincronização anterior — pula por completo
  // (nunca reclassifica, nunca reenvia anexo pra um novo path de Storage,
  // nunca propõe uma segunda ai_action para a mesma mensagem).
  const existingCommunicationIds = new Set(pastCommunications.map((m) => m.id));

  let linkedCount = 0;
  let unlinkedCount = 0;

  for (const message of listResult.messages) {
    const communicationId = `email-${provider.name}-${message.providerMessageId}`;
    if (existingCommunicationIds.has(communicationId)) continue;
    const match = identifyClientForSender(message.from, contacts, pastCommunications);
    if (match) linkedCount++;
    else unlinkedCount++;

    const classification = await classifyEmail(message, llmProviderFactory);

    await upsertCommunication(ctx.client, ctx.workspaceId, {
      id: communicationId,
      clientId: match?.clientId ?? null,
      threadId: message.threadId,
      sender: message.from,
      channel: "E-mail",
      direction: "Recebida",
      createdAt: message.receivedAt.slice(0, 10),
      subject: message.subject,
      content: message.bodyText,
      summary: classification.summary,
      priority: classification.priority,
      sentiment: classification.sentiment,
      classification: classification.category,
      assignee: "Equipe",
      status: "Novo",
      requiresAction: classification.requiresAction,
      suggestedAction: classification.suggestedAction,
    });

    if (match) {
      const { upsertTimelineEvent } = await import("@/data/repositories/timeline.server");
      await upsertTimelineEvent(ctx.client, ctx.workspaceId, {
        id: `tl-${communicationId}`,
        clientId: match.clientId,
        date: message.receivedAt.slice(0, 10),
        type: "email",
        title: `E-mail recebido: ${message.subject}`,
        detail: `De ${message.from} — classificado como ${classification.category} (confiança do vínculo: ${match.confidence}).`,
      });

      // Anexos → pipeline de Documentos/OCR já existente, sem processar automaticamente (não duplica o OCR).
      if (message.attachments.length > 0) {
        const [
          { documentStoragePath, uploadDocumentBytes, upsertDocument },
          { validateDocumentFile },
        ] = await Promise.all([
          import("@/data/repositories/documents.server"),
          import("@/lib/documents-engine"),
        ]);
        for (const attachment of message.attachments) {
          try {
            const download = await provider.downloadAttachment(
              tokens,
              message.providerMessageId,
              attachment.attachmentId,
            );
            const bytes = new Uint8Array(download.bytes);
            const validation = validateDocumentFile(
              { type: attachment.mimeType, size: bytes.length },
              bytes,
            );
            if (!validation.ok) continue;
            const path = documentStoragePath(ctx.workspaceId, match.clientId, attachment.filename);
            await uploadDocumentBytes(
              ctx.client,
              path,
              new Blob([bytes], { type: attachment.mimeType }),
            );
            await upsertDocument(ctx.client, ctx.workspaceId, {
              id: `doc-${communicationId}-${attachment.attachmentId}`,
              clientId: match.clientId,
              name: attachment.filename,
              type: "Relatório gerencial",
              category: "Documento",
              competence: message.receivedAt.slice(0, 7),
              assignee: "Equipe",
              status: "Recebido",
              pipelineStage: "Recebido",
              extraction: null,
              linkedObligationId: null,
              linkedPendencyId: null,
              storagePath: path,
              uploadedAt: message.receivedAt.slice(0, 10),
            });
          } catch {
            // Um anexo falhando (formato rejeitado, download indisponível) não derruba a mensagem inteira.
          }
        }
      }

      // Pendência/recomendação — nunca direto, sempre proposta via ai_actions (mesmo Action Engine do Copilot/OCR).
      if (classification.requiresAction) {
        const { proposeAiAction } = await import("@/data/repositories/ai-actions.server");
        await proposeAiAction(ctx.client, {
          workspaceId: ctx.workspaceId,
          proposedByUserId: ctx.userId,
          kind: "create-pendency",
          payload: {
            clientId: match.clientId,
            title: classification.suggestedAction || message.subject,
            description: message.bodyText.slice(0, 500),
            assignee: "Equipe",
            priority: classification.priority,
            category:
              classification.category === "Cobrança"
                ? "Financeiro"
                : classification.category === "Documento"
                  ? "Documento"
                  : "Cliente",
            communicationId,
          },
        });
      }
    }
  }

  await updateEmailAccountSyncState(ctx.client, account.id, {
    status: "connected",
    syncCursor: listResult.nextCursor,
    lastError: null,
    ...(tokens !== account.tokens ? { tokens } : {}),
  });

  const { logAiInteraction } = await import("@/data/repositories/ai-interactions.server");
  await logAiInteraction(ctx.client, {
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    question: `[E-mail] sincronização (${listResult.messages.length} mensagem(ns))`,
    model: "gmail-sync",
    toolCalls: [],
    response: `${linkedCount} vinculada(s), ${unlinkedCount} sem cliente identificado`,
    proposedActionIds: [],
    tokensIn: null,
    tokensOut: null,
    estimatedCostUsd: null,
    latencyMs: 0,
    error: null,
  });

  return {
    status: "connected",
    syncedCount: listResult.messages.length,
    linkedCount,
    unlinkedCount,
    error: null,
  };
}

export const triggerEmailSyncFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<SyncResult> => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const [{ getEmailProvider }, { getLlmProvider }] = await Promise.all([
      import("@/lib/email/provider.server"),
      import("@/lib/ai/provider.server"),
    ]);
    return syncEmailAccountCore(ctx, getEmailProvider, getLlmProvider);
  },
);
