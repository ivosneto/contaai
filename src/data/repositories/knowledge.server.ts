import type { DomainClient } from "./domain-client.server";
import type { KnowledgeArticle } from "@/data/office";
import type { KnowledgeArticleRow } from "./domain-types";

function fromRow(row: KnowledgeArticleRow): KnowledgeArticle {
  return { id: row.id, category: row.category, title: row.title, summary: row.summary, content: row.content };
}

export async function listKnowledgeArticles(client: DomainClient, workspaceId: string): Promise<KnowledgeArticle[]> {
  const { data, error } = await client.from("knowledge_articles").select("*").eq("workspace_id", workspaceId).order("title");
  if (error) throw new Error(`Falha ao listar artigos: ${error.message}`);
  return (data ?? []).map(fromRow);
}

export async function upsertKnowledgeArticle(client: DomainClient, workspaceId: string, article: KnowledgeArticle): Promise<void> {
  const { error } = await client.from("knowledge_articles").upsert({
    id: article.id,
    workspace_id: workspaceId,
    title: article.title,
    category: article.category,
    summary: article.summary,
    content: article.content,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Falha ao salvar artigo ${article.id}: ${error.message}`);
}

export async function deleteKnowledgeArticle(client: DomainClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await client.from("knowledge_articles").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(`Falha ao excluir artigo ${id}: ${error.message}`);
}
