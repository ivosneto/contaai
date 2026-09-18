// Ponte segura pro navegador: este arquivo NÃO é .server.ts, então
// src/data/session.tsx (componente cliente) pode importá-lo no topo sem
// puxar getRequest()/o client de sessão pro bundle público — o import de
// auth-context.server.ts só acontece dinamicamente, dentro do handler,
// mesmo padrão de src/data/server-functions/domain.ts.
import { createServerFn } from "@tanstack/react-start";
import type { MySession } from "./auth-context.server";

/**
 * Versão "segura para o navegador" de requireAuthContext(): nunca devolve o
 * client Supabase (não é serializável) nem lança erro pro caller — devolve
 * um status, pra SessionProvider (src/data/session.tsx) decidir o que
 * renderizar (login, criar workspace, portal do cliente, ou o painel).
 */
export const fetchMySession = createServerFn({ method: "GET" }).handler(async (): Promise<MySession> => {
  const { requireAuthContext, AuthError } = await import("./auth-context.server");
  try {
    const ctx = await requireAuthContext();
    return { status: "signed-in", userId: ctx.userId, workspaceId: ctx.workspaceId, role: ctx.role, clientId: ctx.clientId };
  } catch (err) {
    if (err instanceof AuthError && err.code === "NO_WORKSPACE") return { status: "no-workspace" };
    return { status: "signed-out" };
  }
});
