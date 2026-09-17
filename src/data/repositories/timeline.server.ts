import { supabaseDomain } from "./domain-client.server";
import type { TimelineEvent } from "@/data/office";
import type { TimelineEventRow } from "./domain-types";

function fromRow(row: TimelineEventRow): TimelineEvent {
  return {
    id: row.id,
    clientId: row.client_id,
    date: row.occurred_at.slice(0, 10),
    type: row.event_type as TimelineEvent["type"],
    title: row.title,
    detail: row.detail,
  };
}

/** Histórico completo do workspace — Customer 360 filtra por clientId no componente, igual já faz hoje com o activityLog em memória. */
export async function listTimelineEvents(workspaceId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabaseDomain
    .from("timeline_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    // today() em store.tsx é uma data fixa de demonstração — id (com
    // timestamp em base36) é o desempate estável para ordem real de criação.
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(500);
  if (error) throw new Error(`Falha ao listar timeline: ${error.message}`);
  return (data ?? []).map(fromRow);
}

export async function upsertTimelineEvent(workspaceId: string, event: TimelineEvent): Promise<void> {
  const { error } = await supabaseDomain.from("timeline_events").upsert({
    id: event.id,
    workspace_id: workspaceId,
    client_id: event.clientId,
    event_type: event.type,
    title: event.title,
    detail: event.detail,
    occurred_at: `${event.date}T00:00:00Z`,
  });
  if (error) throw new Error(`Falha ao salvar evento de timeline ${event.id}: ${error.message}`);
}
