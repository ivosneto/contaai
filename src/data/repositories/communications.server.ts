import type { DomainClient } from "./domain-client.server";
import type { Communication } from "@/data/office";
import type { CommunicationRow } from "./domain-types";

function fromRow(row: CommunicationRow): Communication {
  return {
    id: row.id,
    clientId: row.client_id, // já nullable — ver CommunicationRow/ALTER COLUMN em 20260920100000_email_integration.sql
    threadId: row.thread_id,
    sender: row.sender,
    channel: row.channel as Communication["channel"],
    direction: row.direction as Communication["direction"],
    createdAt: row.created_at.slice(0, 10),
    subject: row.subject,
    content: row.content,
    summary: row.summary,
    priority: row.priority as Communication["priority"],
    sentiment: row.sentiment as Communication["sentiment"],
    classification: row.classification as Communication["classification"],
    assignee: row.assignee,
    status: row.status as Communication["status"],
    requiresAction: row.requires_action,
    suggestedAction: row.suggested_action,
  };
}

/** Staff vê tudo; Portal (papel client) vê só as próprias, nos canais visíveis (communications_client_read na RLS). */
export async function listCommunications(
  client: DomainClient,
  workspaceId: string,
): Promise<Communication[]> {
  const { data, error } = await client
    .from("communications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar comunicações: ${error.message}`);
  return (data ?? []).map(fromRow);
}

export async function upsertCommunication(
  client: DomainClient,
  workspaceId: string,
  m: Communication,
): Promise<void> {
  const { error } = await client.from("communications").upsert({
    id: m.id,
    workspace_id: workspaceId,
    client_id: m.clientId,
    thread_id: m.threadId,
    sender: m.sender,
    channel: m.channel,
    direction: m.direction,
    subject: m.subject,
    content: m.content,
    summary: m.summary,
    priority: m.priority,
    sentiment: m.sentiment,
    classification: m.classification,
    assignee: m.assignee,
    status: m.status,
    requires_action: m.requiresAction,
    suggested_action: m.suggestedAction,
    created_at: `${m.createdAt}T00:00:00Z`,
  });
  if (error) throw new Error(`Falha ao salvar comunicação ${m.id}: ${error.message}`);
}
