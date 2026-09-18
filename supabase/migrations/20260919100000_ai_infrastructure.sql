-- Infraestrutura real de IA (Copilot com LLM) — duas tabelas:
--   ai_actions: o LLM PROPÕE, um humano aprova/rejeita — nunca o LLM escreve
--     direto. RLS espelha o padrão staff-only já usado em tasks/pendencies
--     (is_staff_member), definido em 20260918090000_identity_rls.sql.
--   ai_interactions: log de auditoria/custo de cada chamada ao LLM — mesma
--     forma de audit_logs (leitura restrita a owner/admin via
--     has_workspace_role), mas é um mecanismo separado (é específico de
--     IA: modelo, tokens, custo, tool_calls), não substitui audit_logs.

CREATE TABLE public.ai_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  proposed_by_user_id uuid,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'executed')),
  decided_by uuid,
  decided_at timestamptz,
  executed_at timestamptz,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ai_actions TO authenticated;
GRANT ALL ON public.ai_actions TO service_role;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_actions_staff_read ON public.ai_actions FOR SELECT TO authenticated
  USING (public.is_staff_member(workspace_id));
CREATE POLICY ai_actions_staff_insert ON public.ai_actions FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_member(workspace_id));
CREATE POLICY ai_actions_staff_update ON public.ai_actions FOR UPDATE TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));

CREATE INDEX ai_actions_workspace_status_idx ON public.ai_actions (workspace_id, status);

CREATE TABLE public.ai_interactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question text NOT NULL,
  model text NOT NULL,
  tool_calls jsonb NOT NULL DEFAULT '[]'::jsonb,
  response text,
  proposed_action_ids uuid[] NOT NULL DEFAULT '{}',
  tokens_in integer,
  tokens_out integer,
  estimated_cost_usd numeric,
  latency_ms integer NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_interactions TO authenticated;
GRANT ALL ON public.ai_interactions TO service_role;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- Leitura restrita a owner/admin (mesmo padrão de audit_read_privileged) —
-- um "client" ou "employee" nunca navega o log de custo/interações de IA,
-- nem mesmo as próprias, porque é um artefato interno de operação, não uma
-- feature do Portal.
CREATE POLICY ai_interactions_read_privileged ON public.ai_interactions FOR SELECT TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']::public.app_role[]));
-- Qualquer membro autenticado (staff ou client) pode gravar a PRÓPRIA
-- interação — o Copilot também atende o papel 'client' (com toolset restrito).
CREATE POLICY ai_interactions_self_insert ON public.ai_interactions FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id) AND user_id = auth.uid());

CREATE INDEX ai_interactions_workspace_created_idx ON public.ai_interactions (workspace_id, created_at DESC);
