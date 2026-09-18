// Server functions do Portal do Cliente — caminho separado de
// src/data/server-functions/domain.ts (staff-only) de propósito: a
// separação estrutural em arquivos diferentes torna o limite de segurança
// óbvio na leitura do código, além da RLS que já garante o isolamento no
// banco. requireClientRole() barra qualquer chamada de um usuário staff por
// engano (não é o caminho deles).
import { createServerFn } from "@tanstack/react-start";
import type { NewDocumentInput } from "@/data/store";

// auth-context.server.ts nunca é importado no topo deste arquivo (só tipos,
// se precisasse) — este módulo não é `.server.ts` e é alcançável a partir de
// componentes do navegador, então um import estático de valor puxaria
// @tanstack/react-start/server (getRequest) para o bundle do cliente, que o
// plugin de import-protection do Vite bloqueia. Importado dinamicamente aqui.
async function requireClientContext() {
  const { AuthError, requireAuthContext } = await import("./auth-context.server");
  const ctx = await requireAuthContext();
  if (ctx.role !== "client")
    throw new AuthError("FORBIDDEN", "Este caminho é exclusivo do Portal do Cliente.");
  if (!ctx.clientId)
    throw new AuthError("FORBIDDEN", "Usuário com papel 'client' sem cliente associado.");
  return { ...ctx, clientId: ctx.clientId };
}

export const fetchPortalBootstrap = createServerFn({ method: "GET" }).handler(async () => {
  const ctx = await requireClientContext();
  const [
    { listClients },
    { listPendencies },
    { listObligations },
    { listDocuments },
    { listCommunications },
    { listAnnouncements },
  ] = await Promise.all([
    import("@/data/repositories/clients.server"),
    import("@/data/repositories/pendencies.server"),
    import("@/data/repositories/obligations.server"),
    import("@/data/repositories/documents.server"),
    import("@/data/repositories/communications.server"),
    import("@/data/repositories/announcements.server"),
  ]);
  // Cada listXxx aqui já roda com o client autenticado como este usuário —
  // as policies *_client_read (RLS) filtram para a própria clientId antes
  // mesmo de qualquer .eq() no código. Não há como este bootstrap devolver
  // outro cliente mesmo que o código abaixo tivesse um bug.
  const [clients, pendencies, obligations, documents, communications, announcements] =
    await Promise.all([
      listClients(ctx.client, ctx.workspaceId),
      listPendencies(ctx.client, ctx.workspaceId),
      listObligations(ctx.client, ctx.workspaceId),
      listDocuments(ctx.client, ctx.workspaceId),
      listCommunications(ctx.client, ctx.workspaceId),
      listAnnouncements(ctx.client, ctx.workspaceId),
    ]);
  return {
    clientId: ctx.clientId,
    clients,
    pendencies,
    obligations,
    documents,
    communications,
    announcements,
  };
});

export const completePortalPendency = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const ctx = await requireClientContext();
    const { completeClientPendency } = await import("@/data/repositories/pendencies.server");
    await completeClientPendency(ctx.client, data.id);
    return null;
  });

export const createPortalMessage = createServerFn({ method: "POST" })
  .validator((data: { content: string }) => data)
  .handler(async ({ data }) => {
    const ctx = await requireClientContext();
    const { upsertCommunication } = await import("@/data/repositories/communications.server");
    const { classifyContent, summarize } = await import("@/lib/communication-engine");
    const { listClients } = await import("@/data/repositories/clients.server");
    const clients = await listClients(ctx.client, ctx.workspaceId);
    const client = clients.find((c) => c.id === ctx.clientId);
    const classification = classifyContent(data.content);
    const subject = data.content.length > 60 ? `${data.content.slice(0, 60)}…` : data.content;
    const id = `cm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    await upsertCommunication(ctx.client, ctx.workspaceId, {
      id,
      clientId: ctx.clientId,
      threadId: `thread-${id}`,
      sender: client?.name ?? "Cliente",
      channel: "Portal",
      direction: "Recebida",
      createdAt: new Date().toISOString().slice(0, 10),
      subject,
      content: data.content,
      summary: summarize(data.content),
      priority: classification.priority,
      sentiment: classification.sentiment,
      classification: classification.category,
      assignee: client?.owner ?? "Equipe",
      status: "Novo",
      requiresAction: classification.requiresAction,
      suggestedAction: classification.suggestedAction,
    });
    return null;
  });

export const uploadPortalDocument = createServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    const ctx = await requireClientContext();
    const file = data.get("file");
    const type = String(data.get("type") ?? "");
    const category = String(data.get("category") ?? "");
    const competence = String(data.get("competence") ?? "");
    const pendencyId = data.get("pendencyId") ? String(data.get("pendencyId")) : null;
    if (!(file instanceof File)) throw new Error("Nenhum arquivo enviado.");

    const { validateDocumentFile } = await import("@/lib/documents-engine");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateDocumentFile(file, bytes);
    if (!validation.ok) throw new Error(validation.reason);

    const [
      { documentStoragePath, uploadDocumentBytes, upsertDocument },
      { listClients },
      { completeClientPendency },
    ] = await Promise.all([
      import("@/data/repositories/documents.server"),
      import("@/data/repositories/clients.server"),
      import("@/data/repositories/pendencies.server"),
    ]);
    const clients = await listClients(ctx.client, ctx.workspaceId);
    const client = clients.find((c) => c.id === ctx.clientId);
    const path = documentStoragePath(ctx.workspaceId, ctx.clientId, file.name);
    await uploadDocumentBytes(ctx.client, path, file);

    const id = `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    await upsertDocument(ctx.client, ctx.workspaceId, {
      id,
      clientId: ctx.clientId,
      name: `${type} — ${client?.name ?? ctx.clientId}`,
      type: type as NewDocumentInput["type"],
      category: category as NewDocumentInput["category"],
      competence,
      assignee: client?.owner ?? "Equipe",
      status: "Recebido",
      pipelineStage: "Recebido",
      uploadedAt: new Date().toISOString().slice(0, 10),
      extraction: null,
      linkedObligationId: null,
      linkedPendencyId: pendencyId,
      storagePath: path,
    });
    if (pendencyId) await completeClientPendency(ctx.client, pendencyId);
    return { id };
  });

/** Link de download protegido para o cliente — mesma função de signed URL do lado staff; RLS (documents_client_read) já garante que só o próprio cliente acessa. */
export const getPortalDocumentDownloadUrlFn = createServerFn({ method: "POST" })
  .validator((data: { documentId: string }) => data)
  .handler(async ({ data }): Promise<{ url: string }> => {
    const ctx = await requireClientContext();
    const { listDocuments, createSignedDocumentUrl } =
      await import("@/data/repositories/documents.server");
    const documents = await listDocuments(ctx.client, ctx.workspaceId);
    const doc = documents.find((d) => d.id === data.documentId && d.clientId === ctx.clientId);
    if (!doc || !doc.storagePath)
      throw new Error("Documento não encontrado ou sem arquivo real associado.");
    const url = await createSignedDocumentUrl(ctx.client, doc.storagePath);
    return { url };
  });
