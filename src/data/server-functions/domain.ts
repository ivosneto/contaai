// Camada server function (TanStack Start) — ponte tipada entre a UI e os
// repositories server-only. Nenhum componente importa supabaseDomain
// diretamente; só isso aqui, que roda no servidor e nunca embarca a
// service_role key no bundle do cliente.
import { createServerFn } from "@tanstack/react-start";
import { DEMO_WORKSPACE_ID } from "@/data/demo-workspace";
import type { Obligation, Pendency, Task } from "@/data/office";

export const fetchDomainBootstrap = createServerFn({ method: "GET" }).handler(async () => {
  const [{ listTasks }, { listPendencies }, { listObligations }] = await Promise.all([
    import("@/data/repositories/tasks.server"),
    import("@/data/repositories/pendencies.server"),
    import("@/data/repositories/obligations.server"),
  ]);
  const [tasks, pendencies, obligations] = await Promise.all([
    listTasks(DEMO_WORKSPACE_ID),
    listPendencies(DEMO_WORKSPACE_ID),
    listObligations(DEMO_WORKSPACE_ID),
  ]);
  return { tasks, pendencies, obligations };
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
