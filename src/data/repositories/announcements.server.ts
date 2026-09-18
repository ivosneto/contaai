import type { DomainClient } from "./domain-client.server";
import type { Announcement } from "@/data/office";
import type { AnnouncementRow } from "./domain-types";

function fromRow(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    publishedAt: row.published_at.slice(0, 10),
    audience: row.audience as Announcement["audience"],
  };
}

/** Sem dado sensível — qualquer membro do workspace lê (staff e client); a UI filtra por audiência. */
export async function listAnnouncements(client: DomainClient, workspaceId: string): Promise<Announcement[]> {
  const { data, error } = await client.from("announcements").select("*").eq("workspace_id", workspaceId).order("published_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar comunicados: ${error.message}`);
  return (data ?? []).map(fromRow);
}
