/**
 * Workspace demo fixo (sem login) — ver supabase/migrations/20260914160100_demo_seed.sql
 * e a decisão registrada em /Users/ivo.neto/.claude/plans/glistening-watching-lollipop.md.
 * Toda leitura/escrita do domínio nesta fase usa este workspace_id; quando o
 * login (bootstrap_workspace) for ligado ao frontend, isso vira dinâmico
 * (workspace da sessão autenticada) em vez de uma constante.
 */
export const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";
