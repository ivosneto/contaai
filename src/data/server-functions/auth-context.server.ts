// Verificação de sessão para toda server function sensível — nunca confia
// em workspace/role vindos do cliente (React), sempre descobre pelo token.
// Mesmo padrão de verificação de src/integrations/supabase/auth-middleware.ts
// (getClaims no client autenticado), reaproveitado em vez de duplicado.
//
// Este arquivo é .server.ts: só pode ser importado (top-level) por outro
// .server.ts, ou dinamicamente (import() dentro de um handler) por uma
// server function comum — nunca por um componente/hook do lado do
// navegador (src/data/server-functions/session.ts é a ponte segura para
// isso; ver o comentário em src/integrations/supabase/client.server.ts).
import { getRequest } from "@tanstack/react-start/server";
import { createSessionScopedClient } from "@/data/repositories/domain-client.server";
import type { AppRole } from "@/data/office";

export class AuthError extends Error {
  constructor(
    public code: "UNAUTHENTICATED" | "NO_WORKSPACE" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
  }
}

export type AuthContext = {
  userId: string;
  workspaceId: string;
  role: AppRole;
  clientId: string | null;
  client: ReturnType<typeof createSessionScopedClient>;
};

const STAFF_ROLES: AppRole[] = ["owner", "admin", "manager", "employee"];

/**
 * Único ponto de entrada de identidade para as server functions. Extrai o
 * bearer token (attachSupabaseAuth já anexa em toda chamada — ver
 * src/start.ts), verifica com o próprio Supabase (não decodifica o JWT à
 * mão), e descobre workspace/papel/cliente consultando workspace_members/
 * user_roles com o client já autenticado como aquele usuário — essas
 * consultas só devolvem a própria linha do usuário graças às RLS policies
 * (members_read/roles_read da Fase 1), então não há como um usuário puxar
 * workspace de outra pessoa por aqui.
 */
export async function requireAuthContext(): Promise<AuthContext> {
  const request = getRequest();
  const authHeader = request?.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("UNAUTHENTICATED", "Sessão ausente ou expirada.");
  }
  const token = authHeader.slice("Bearer ".length);
  const client = createSessionScopedClient(token);

  const { data: claims, error: claimsError } = await client.auth.getClaims(token);
  if (claimsError || !claims?.claims?.sub) {
    throw new AuthError("UNAUTHENTICATED", "Sessão ausente ou expirada.");
  }
  const userId = claims.claims.sub;

  const { data: member, error: memberError } = await client
    .from("workspace_members")
    .select("workspace_id, client_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (memberError) throw new AuthError("NO_WORKSPACE", memberError.message);
  if (!member) throw new AuthError("NO_WORKSPACE", "Usuário autenticado, mas sem workspace ativo.");

  const { data: roleRow, error: roleError } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("workspace_id", member.workspace_id)
    .limit(1)
    .maybeSingle();
  if (roleError) throw new AuthError("NO_WORKSPACE", roleError.message);

  return {
    userId,
    workspaceId: member.workspace_id,
    role: (roleRow?.role ?? "employee") as AppRole,
    clientId: member.client_id,
    client,
  };
}

/** Para ações restritas a staff (nunca 'client') — checagem em código além da RLS, que já bloqueia a maioria dos casos por conta própria. */
export function requireStaff(ctx: AuthContext): void {
  if (!STAFF_ROLES.includes(ctx.role)) {
    throw new AuthError("FORBIDDEN", "Esta ação não está disponível para o papel 'client'.");
  }
}

/** Para ações restritas a owner/admin/manager (ex.: editar cadastro de cliente, excluir artigo) — espelha clients_write/employees_write no banco. */
export function requireManagerOrAbove(ctx: AuthContext): void {
  if (!["owner", "admin", "manager"].includes(ctx.role)) {
    throw new AuthError("FORBIDDEN", "Esta ação exige papel owner, admin ou manager.");
  }
}

export type MySession =
  | { status: "signed-out" }
  | { status: "no-workspace" }
  | { status: "signed-in"; userId: string; workspaceId: string; role: AppRole; clientId: string | null };
