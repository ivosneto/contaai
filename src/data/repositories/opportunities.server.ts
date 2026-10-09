import type { DomainClient } from "./domain-client.server";
import type { Opportunity, ServiceName } from "@/data/office";
import type { OpportunityRow } from "./domain-types";

function fromRow(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    clientId: row.client_id,
    company: row.company,
    contact: row.contact,
    seller: row.seller,
    source: row.source,
    services: row.services as ServiceName[],
    mrr: Number(row.mrr),
    setup: Number(row.setup),
    probability: row.probability,
    stage: row.stage as Opportunity["stage"],
    expectedAt: row.expected_at ?? "",
    ...(row.competitor ? { competitor: row.competitor } : {}),
    ...(row.loss_reason ? { lossReason: row.loss_reason } : {}),
    origin: row.origin,
    reasoning: row.reasoning,
    ...(row.current_fee !== null ? { currentFee: Number(row.current_fee) } : {}),
    ...(row.recommendation ? { recommendation: row.recommendation } : {}),
    ...(row.next_action ? { nextAction: row.next_action } : {}),
    updatedAt: row.updated_at,
  };
}

/** Só as reais (nasceram via Action Engine) — as 30 de demonstração de src/data/office.ts continuam só no cliente, nunca gravadas aqui. */
export async function listOpportunities(
  client: DomainClient,
  workspaceId: string,
): Promise<Opportunity[]> {
  const { data, error } = await client
    .from("opportunities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar oportunidades: ${error.message}`);
  return (data ?? []).map(fromRow);
}

/** Usado por executeApprovedAiAction (criação, sempre com aiActionId) e pela troca manual de estágio (ganha/perdida) — nunca chamado pela IA diretamente. */
export async function upsertOpportunity(
  client: DomainClient,
  workspaceId: string,
  opportunity: Opportunity,
  aiActionId?: string,
): Promise<void> {
  const { error } = await client.from("opportunities").upsert({
    id: opportunity.id,
    workspace_id: workspaceId,
    client_id: opportunity.clientId ?? "",
    company: opportunity.company,
    contact: opportunity.contact,
    seller: opportunity.seller,
    source: opportunity.source,
    services: opportunity.services,
    mrr: opportunity.mrr,
    setup: opportunity.setup,
    probability: opportunity.probability,
    stage: opportunity.stage,
    expected_at: opportunity.expectedAt || null,
    competitor: opportunity.competitor ?? null,
    loss_reason: opportunity.lossReason ?? null,
    origin: opportunity.origin ?? "Manual",
    reasoning: opportunity.reasoning ?? [],
    current_fee: opportunity.currentFee ?? null,
    recommendation: opportunity.recommendation ?? null,
    next_action: opportunity.nextAction ?? null,
    ...(aiActionId ? { ai_action_id: aiActionId } : {}),
  });
  if (error) throw new Error(`Falha ao salvar oportunidade ${opportunity.id}: ${error.message}`);
}
