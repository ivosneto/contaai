import type { DomainClient } from "./domain-client.server";
import type { ClientDocument, DocumentExtraction } from "@/data/office";
import type { DocumentRow } from "./domain-types";

function fromRow(row: DocumentRow): ClientDocument {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    type: row.type as ClientDocument["type"],
    category: row.category as ClientDocument["category"],
    competence: row.competence,
    assignee: row.assignee,
    status: row.status as ClientDocument["status"],
    pipelineStage: row.pipeline_stage as ClientDocument["pipelineStage"],
    uploadedAt: row.uploaded_at,
    extraction: (row.extraction as unknown as DocumentExtraction | null) ?? null,
    linkedObligationId: row.linked_obligation_id,
    linkedPendencyId: row.linked_pendency_id,
    storagePath: row.storage_path,
  };
}

/** Chamada por staff (todos os documentos do workspace) e pelo Portal — RLS (documents_client_read) já restringe o resultado aos documentos do próprio cliente autenticado. */
export async function listDocuments(
  client: DomainClient,
  workspaceId: string,
): Promise<ClientDocument[]> {
  const { data, error } = await client
    .from("documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("uploaded_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar documentos: ${error.message}`);
  return (data ?? []).map(fromRow);
}

/** Upsert do metadado — nunca mexe no arquivo em si (ver uploadDocumentBytes). Usado tanto pela criação inicial quanto pelas atualizações do pipeline (applyProcessDocument). */
export async function upsertDocument(
  client: DomainClient,
  workspaceId: string,
  doc: ClientDocument,
): Promise<void> {
  const { error } = await client.from("documents").upsert({
    id: doc.id,
    workspace_id: workspaceId,
    client_id: doc.clientId,
    name: doc.name,
    type: doc.type,
    category: doc.category,
    competence: doc.competence,
    assignee: doc.assignee,
    status: doc.status,
    pipeline_stage: doc.pipelineStage,
    uploaded_at: doc.uploadedAt,
    extraction: doc.extraction as unknown as Record<string, unknown> | null,
    linked_obligation_id: doc.linkedObligationId,
    linked_pendency_id: doc.linkedPendencyId,
    storage_path: doc.storagePath,
  });
  if (error) throw new Error(`Falha ao salvar documento ${doc.id}: ${error.message}`);
}

/** Bucket "documents", path "<workspace_id>/<client_id>/<arquivo>" — RLS de storage.objects (20260918090100_documents_storage.sql) é quem garante que outro tenant/cliente nunca acessa este caminho, mesmo sabendo o nome do arquivo. */
export function documentStoragePath(
  workspaceId: string,
  clientId: string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${workspaceId}/${clientId}/${Date.now()}-${safeName}`;
}

export async function uploadDocumentBytes(
  client: DomainClient,
  path: string,
  file: File | Blob,
): Promise<void> {
  const { error } = await client.storage.from("documents").upload(path, file, { upsert: false });
  if (error) throw new Error(`Falha ao enviar arquivo: ${error.message}`);
}

/** Lê os bytes reais do arquivo já enviado — usado pelo processamento de OCR (document-intelligence.ts). Mesma RLS de storage.objects que já protege upload/leitura: um path de outro workspace/cliente nunca é acessível por este client. */
export async function downloadDocumentBytes(client: DomainClient, path: string): Promise<Blob> {
  const { data, error } = await client.storage.from("documents").download(path);
  if (error || !data)
    throw new Error(`Falha ao baixar arquivo: ${error?.message ?? "desconhecido"}`);
  return data;
}

/** Nunca URL pública — o bucket é privado; um link assinado expira e é escopado ao próprio arquivo. */
export async function createSignedDocumentUrl(
  client: DomainClient,
  path: string,
  expiresInSeconds = 300,
): Promise<string> {
  const { data, error } = await client.storage
    .from("documents")
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data)
    throw new Error(`Falha ao gerar link de acesso: ${error?.message ?? "desconhecido"}`);
  return data.signedUrl;
}
