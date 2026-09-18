// Camada server function (TanStack Start) — ponte tipada entre a UI e os
// repositories server-only. Nenhum componente importa supabaseDomain ou o
// client por-sessão diretamente; só isso aqui (e os irmãos deste diretório),
// que roda no servidor. Toda função abaixo é STAFF-ONLY (requireStaff) — o
// caminho do Portal do Cliente é src/data/server-functions/portal.ts.
//
// auth-context.server.ts nunca é importado no topo deste arquivo (só
// `import type`, que é apagado na compilação) — este módulo é comum (não
// `.server.ts`) e é importado por componentes do navegador (ex.: store.tsx),
// então um import estático de valor puxaria @tanstack/react-start/server
// (getRequest) para o bundle do cliente, o que o plugin de import-protection
// do Vite bloqueia. Cada handler importa dinamicamente o que precisa.
import { createServerFn } from "@tanstack/react-start";
import type {
  Client,
  KnowledgeArticle,
  Obligation,
  Pendency,
  Process,
  Project,
  Task,
  TimelineEvent,
} from "@/data/office";

export const fetchDomainBootstrap = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAuthContext, requireStaff } = await import("./auth-context.server");
  const ctx = await requireAuthContext();
  requireStaff(ctx);
  const [
    { listTasks },
    { listPendencies },
    { listObligations },
    { listClients },
    { listProcesses },
    { listProjects },
    { listKnowledgeArticles },
    { listTimelineEvents },
    { listDocuments },
    { listCommunications },
    { listAnnouncements },
  ] = await Promise.all([
    import("@/data/repositories/tasks.server"),
    import("@/data/repositories/pendencies.server"),
    import("@/data/repositories/obligations.server"),
    import("@/data/repositories/clients.server"),
    import("@/data/repositories/processes.server"),
    import("@/data/repositories/projects.server"),
    import("@/data/repositories/knowledge.server"),
    import("@/data/repositories/timeline.server"),
    import("@/data/repositories/documents.server"),
    import("@/data/repositories/communications.server"),
    import("@/data/repositories/announcements.server"),
  ]);
  const [
    tasks,
    pendencies,
    obligations,
    clients,
    processes,
    projects,
    knowledgeArticles,
    timelineEvents,
    documents,
    communications,
    announcements,
  ] = await Promise.all([
    listTasks(ctx.client, ctx.workspaceId),
    listPendencies(ctx.client, ctx.workspaceId),
    listObligations(ctx.client, ctx.workspaceId),
    listClients(ctx.client, ctx.workspaceId),
    listProcesses(ctx.client, ctx.workspaceId),
    listProjects(ctx.client, ctx.workspaceId),
    listKnowledgeArticles(ctx.client, ctx.workspaceId),
    listTimelineEvents(ctx.client, ctx.workspaceId),
    listDocuments(ctx.client, ctx.workspaceId),
    listCommunications(ctx.client, ctx.workspaceId),
    listAnnouncements(ctx.client, ctx.workspaceId),
  ]);
  return {
    role: ctx.role,
    tasks,
    pendencies,
    obligations,
    clients,
    processes,
    projects,
    knowledgeArticles,
    timelineEvents,
    documents,
    communications,
    announcements,
  };
});

export const persistTask = createServerFn({ method: "POST" })
  .validator((data: Task) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { upsertTask } = await import("@/data/repositories/tasks.server");
    await upsertTask(ctx.client, ctx.workspaceId, data);
    return null;
  });

export const persistPendency = createServerFn({ method: "POST" })
  .validator((data: Pendency) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { upsertPendency } = await import("@/data/repositories/pendencies.server");
    await upsertPendency(ctx.client, ctx.workspaceId, data);
    return null;
  });

export const persistObligation = createServerFn({ method: "POST" })
  .validator((data: Obligation) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { upsertObligation } = await import("@/data/repositories/obligations.server");
    await upsertObligation(ctx.client, ctx.workspaceId, data);
    return null;
  });

export const persistClient = createServerFn({ method: "POST" })
  .validator((data: Client) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireManagerOrAbove } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireManagerOrAbove(ctx);
    const { upsertClient } = await import("@/data/repositories/clients.server");
    const { logAuditEvent } = await import("@/data/repositories/audit.server");
    await upsertClient(ctx.client, ctx.workspaceId, data);
    await logAuditEvent(ctx.client, {
      workspaceId: ctx.workspaceId,
      actorId: ctx.userId,
      action: "client.updated",
      entityType: "client",
      entityId: data.id,
      newValue: { name: data.name, status: data.status, fee: data.fee, services: data.services },
    });
    return null;
  });

export const persistProcess = createServerFn({ method: "POST" })
  .validator((data: Process) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { upsertProcess } = await import("@/data/repositories/processes.server");
    await upsertProcess(ctx.client, ctx.workspaceId, data);
    return null;
  });

export const persistProject = createServerFn({ method: "POST" })
  .validator((data: Project) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { upsertProject } = await import("@/data/repositories/projects.server");
    await upsertProject(ctx.client, ctx.workspaceId, data);
    return null;
  });

export const persistKnowledgeArticle = createServerFn({ method: "POST" })
  .validator((data: KnowledgeArticle) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { upsertKnowledgeArticle } = await import("@/data/repositories/knowledge.server");
    await upsertKnowledgeArticle(ctx.client, ctx.workspaceId, data);
    return null;
  });

export const deleteKnowledgeArticleFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireManagerOrAbove } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireManagerOrAbove(ctx);
    const { deleteKnowledgeArticle } = await import("@/data/repositories/knowledge.server");
    const { logAuditEvent } = await import("@/data/repositories/audit.server");
    await deleteKnowledgeArticle(ctx.client, ctx.workspaceId, data.id);
    await logAuditEvent(ctx.client, {
      workspaceId: ctx.workspaceId,
      actorId: ctx.userId,
      action: "knowledge_article.deleted",
      entityType: "knowledge_article",
      entityId: data.id,
    });
    return null;
  });

export const persistTimelineEvent = createServerFn({ method: "POST" })
  .validator((data: TimelineEvent) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { upsertTimelineEvent } = await import("@/data/repositories/timeline.server");
    await upsertTimelineEvent(ctx.client, ctx.workspaceId, data);
    return null;
  });

export const persistDocument = createServerFn({ method: "POST" })
  .validator((data: import("@/data/office").ClientDocument) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { upsertDocument } = await import("@/data/repositories/documents.server");
    await upsertDocument(ctx.client, ctx.workspaceId, data);
    return null;
  });

export const persistCommunication = createServerFn({ method: "POST" })
  .validator((data: import("@/data/office").Communication) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { upsertCommunication } = await import("@/data/repositories/communications.server");
    await upsertCommunication(ctx.client, ctx.workspaceId, data);
    return null;
  });

/** Upload de documento pelo time interno — mesma ideia de uploadPortalDocument, mas o cliente é escolhido no formulário (staff atende qualquer cliente do workspace) em vez de vir da própria sessão. */
export const uploadStaffDocumentFn = createServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(async ({ data }): Promise<import("@/data/office").ClientDocument> => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const file = data.get("file");
    const clientId = String(data.get("clientId") ?? "");
    const type = String(data.get("type") ?? "");
    const category = String(data.get("category") ?? "");
    const competence = String(data.get("competence") ?? "");
    const assignee = String(data.get("assignee") ?? "");
    if (!(file instanceof File)) throw new Error("Nenhum arquivo enviado.");
    if (!clientId) throw new Error("Selecione um cliente.");

    const { validateDocumentFile } = await import("@/lib/documents-engine");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateDocumentFile(file, bytes);
    if (!validation.ok) throw new Error(validation.reason);

    const [{ documentStoragePath, uploadDocumentBytes, upsertDocument }, { listClients }] =
      await Promise.all([
        import("@/data/repositories/documents.server"),
        import("@/data/repositories/clients.server"),
      ]);
    const clients = await listClients(ctx.client, ctx.workspaceId);
    const client = clients.find((c) => c.id === clientId);
    if (!client) throw new Error("Cliente não encontrado neste workspace.");

    const path = documentStoragePath(ctx.workspaceId, clientId, file.name);
    await uploadDocumentBytes(ctx.client, path, file);

    const id = `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const doc: import("@/data/office").ClientDocument = {
      id,
      clientId,
      name: `${type} — ${client.name}`,
      type: type as import("@/data/office").DocumentType,
      category: category as import("@/data/office").PendencyCategory,
      competence,
      assignee,
      status: "Recebido",
      pipelineStage: "Recebido",
      uploadedAt: new Date().toISOString().slice(0, 10),
      extraction: null,
      linkedObligationId: null,
      linkedPendencyId: null,
      storagePath: path,
    };
    await upsertDocument(ctx.client, ctx.workspaceId, doc);
    return doc;
  });
