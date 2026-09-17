// Camada server function (TanStack Start) — ponte tipada entre a UI e os
// repositories server-only. Nenhum componente importa supabaseDomain
// diretamente; só isso aqui, que roda no servidor e nunca embarca a
// service_role key no bundle do cliente.
import { createServerFn } from "@tanstack/react-start";
import { DEMO_WORKSPACE_ID } from "@/data/demo-workspace";
import type { Client, KnowledgeArticle, Obligation, Pendency, Process, Project, Task, TimelineEvent } from "@/data/office";

export const fetchDomainBootstrap = createServerFn({ method: "GET" }).handler(async () => {
  const [
    { listTasks },
    { listPendencies },
    { listObligations },
    { listClients },
    { listProcesses },
    { listProjects },
    { listKnowledgeArticles },
    { listTimelineEvents },
  ] = await Promise.all([
    import("@/data/repositories/tasks.server"),
    import("@/data/repositories/pendencies.server"),
    import("@/data/repositories/obligations.server"),
    import("@/data/repositories/clients.server"),
    import("@/data/repositories/processes.server"),
    import("@/data/repositories/projects.server"),
    import("@/data/repositories/knowledge.server"),
    import("@/data/repositories/timeline.server"),
  ]);
  const [tasks, pendencies, obligations, clients, processes, projects, knowledgeArticles, timelineEvents] = await Promise.all([
    listTasks(DEMO_WORKSPACE_ID),
    listPendencies(DEMO_WORKSPACE_ID),
    listObligations(DEMO_WORKSPACE_ID),
    listClients(DEMO_WORKSPACE_ID),
    listProcesses(DEMO_WORKSPACE_ID),
    listProjects(DEMO_WORKSPACE_ID),
    listKnowledgeArticles(DEMO_WORKSPACE_ID),
    listTimelineEvents(DEMO_WORKSPACE_ID),
  ]);
  return { tasks, pendencies, obligations, clients, processes, projects, knowledgeArticles, timelineEvents };
});

export const persistTask = createServerFn({ method: "POST" })
  .validator((data: Task) => data)
  .handler(async ({ data }) => {
    const { upsertTask } = await import("@/data/repositories/tasks.server");
    await upsertTask(DEMO_WORKSPACE_ID, data);
    return null;
  });

export const persistPendency = createServerFn({ method: "POST" })
  .validator((data: Pendency) => data)
  .handler(async ({ data }) => {
    const { upsertPendency } = await import("@/data/repositories/pendencies.server");
    await upsertPendency(DEMO_WORKSPACE_ID, data);
    return null;
  });

export const persistObligation = createServerFn({ method: "POST" })
  .validator((data: Obligation) => data)
  .handler(async ({ data }) => {
    const { upsertObligation } = await import("@/data/repositories/obligations.server");
    await upsertObligation(DEMO_WORKSPACE_ID, data);
    return null;
  });

export const persistClient = createServerFn({ method: "POST" })
  .validator((data: Client) => data)
  .handler(async ({ data }) => {
    const { upsertClient } = await import("@/data/repositories/clients.server");
    await upsertClient(DEMO_WORKSPACE_ID, data);
    return null;
  });

export const persistProcess = createServerFn({ method: "POST" })
  .validator((data: Process) => data)
  .handler(async ({ data }) => {
    const { upsertProcess } = await import("@/data/repositories/processes.server");
    await upsertProcess(DEMO_WORKSPACE_ID, data);
    return null;
  });

export const persistProject = createServerFn({ method: "POST" })
  .validator((data: Project) => data)
  .handler(async ({ data }) => {
    const { upsertProject } = await import("@/data/repositories/projects.server");
    await upsertProject(DEMO_WORKSPACE_ID, data);
    return null;
  });

export const persistKnowledgeArticle = createServerFn({ method: "POST" })
  .validator((data: KnowledgeArticle) => data)
  .handler(async ({ data }) => {
    const { upsertKnowledgeArticle } = await import("@/data/repositories/knowledge.server");
    await upsertKnowledgeArticle(DEMO_WORKSPACE_ID, data);
    return null;
  });

export const deleteKnowledgeArticleFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { deleteKnowledgeArticle } = await import("@/data/repositories/knowledge.server");
    await deleteKnowledgeArticle(DEMO_WORKSPACE_ID, data.id);
    return null;
  });

export const persistTimelineEvent = createServerFn({ method: "POST" })
  .validator((data: TimelineEvent) => data)
  .handler(async ({ data }) => {
    const { upsertTimelineEvent } = await import("@/data/repositories/timeline.server");
    await upsertTimelineEvent(DEMO_WORKSPACE_ID, data);
    return null;
  });
