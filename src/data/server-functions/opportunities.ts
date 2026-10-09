// Fecha o loop Revenue Intelligence → Oportunidade → CRM → Ação → Resultado.
// Propor uma oportunidade nunca escreve direto — sempre via Action Engine
// (proposeAiAction, kind "create-opportunity"), executado só depois de
// aprovação humana em executeApprovedAiAction (copilot.ts), exatamente como
// OCR e e-mail já propõem create-pendency/link-obligation-evidence. Marcar
// ganha/perdida é edição direta de um registro que já existe e já pertence
// ao responsável — mesmo nível de "editar metadado" que outras telas do app
// já fazem sem passar pelo Action Engine (ver ASSIGN_MESSAGE em store.tsx).
//
// auth-context.server.ts nunca é importado no topo como VALOR — só `import
// type` (mesmo motivo documentado nos outros arquivos deste diretório).
import { createServerFn } from "@tanstack/react-start";
import type { Opportunity } from "@/data/office";

export const listOpportunitiesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Opportunity[]> => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { listOpportunities } = await import("@/data/repositories/opportunities.server");
    return listOpportunities(ctx.client, ctx.workspaceId);
  },
);

type ProposeCreateOpportunityInput = {
  clientId: string;
  situation: string;
  evidence: string[];
  currentFee: number;
  targetFee: number;
  recommendedMin: number;
  recommendedMax: number;
  estimatedImpact: string;
};

export const proposeCreateOpportunityFn = createServerFn({ method: "POST" })
  .validator((data: ProposeCreateOpportunityInput) => data)
  .handler(async ({ data }): Promise<{ actionId: string }> => {
    const { requireAuthContext, requireManagerOrAbove } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireManagerOrAbove(ctx);
    // Confirma que o cliente é real e deste workspace antes até de propor —
    // a revalidação definitiva acontece de novo na aprovação
    // (executeApprovedAiAction), esta é só uma checagem cedo para não deixar
    // uma proposta óbviamente inválida na fila de aprovação do gestor.
    const { listClients } = await import("@/data/repositories/clients.server");
    const clients = await listClients(ctx.client, ctx.workspaceId);
    if (!clients.some((c) => c.id === data.clientId))
      throw new Error(`Cliente ${data.clientId} não encontrado neste workspace.`);

    const { proposeAiAction } = await import("@/data/repositories/ai-actions.server");
    const row = await proposeAiAction(ctx.client, {
      workspaceId: ctx.workspaceId,
      proposedByUserId: ctx.userId,
      kind: "create-opportunity",
      payload: {
        clientId: data.clientId,
        situation: data.situation,
        evidence: data.evidence,
        currentFee: data.currentFee,
        targetFee: data.targetFee,
        recommendedMin: data.recommendedMin,
        recommendedMax: data.recommendedMax,
        estimatedImpact: data.estimatedImpact,
      },
    });
    return { actionId: row.id };
  });

const RESULT_STAGES = ["Fechado", "Perdido"] as const;

export const updateOpportunityStageFn = createServerFn({ method: "POST" })
  .validator(
    (data: { id: string; stage: Opportunity["stage"]; lossReason?: string }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { listOpportunities, upsertOpportunity } =
      await import("@/data/repositories/opportunities.server");
    const opportunities = await listOpportunities(ctx.client, ctx.workspaceId);
    const opportunity = opportunities.find((o) => o.id === data.id);
    if (!opportunity) throw new Error(`Oportunidade ${data.id} não encontrada neste workspace.`);
    await upsertOpportunity(ctx.client, ctx.workspaceId, {
      ...opportunity,
      stage: data.stage,
      ...(data.lossReason ? { lossReason: data.lossReason } : {}),
    });

    // Preserva o resultado na Timeline do cliente — é o ponto de "fechamento
    // do loop": ganha/perdida vira histórico permanente (timeline_events é
    // append-only), disponível pra alimentar a inteligência no futuro.
    if (opportunity.clientId && (RESULT_STAGES as readonly string[]).includes(data.stage)) {
      const { upsertTimelineEvent } = await import("@/data/repositories/timeline.server");
      await upsertTimelineEvent(ctx.client, ctx.workspaceId, {
        id: `tl-${data.id}-${data.stage}`,
        clientId: opportunity.clientId,
        date: new Date().toISOString().slice(0, 10),
        type: "oportunidade",
        title: data.stage === "Fechado" ? "Oportunidade ganha" : "Oportunidade perdida",
        detail:
          data.stage === "Perdido" && data.lossReason
            ? `${opportunity.company}: ${data.lossReason}`
            : `${opportunity.company}: ${opportunity.recommendation ?? "resultado registrado"}`,
      });
    }
  });
