-- Fecha o loop Revenue Intelligence → Oportunidade → CRM → Ação → Resultado.
-- Antes desta migration, o pipeline comercial (Opportunity, CommercialPage)
-- era 100% estático em src/data/office.ts — nunca persistia, uma oportunidade
-- "criada" desaparecia no próximo reload. Esta tabela é o destino real para
-- oportunidades propostas pelo Revenue Intelligence via Action Engine
-- (ai_actions.kind = 'create-opportunity', ver executeApprovedAiAction em
-- src/data/server-functions/copilot.ts) — nunca escrita direto pela IA.
--
-- RLS staff-only (mesmo padrão de ai_actions/email_accounts, não
-- is_workspace_member): cliente nunca vê o pipeline comercial do escritório.
-- Sem GRANT/policy de DELETE — resultado (ganho/perdido) é preservado para
-- sempre, nunca apagado, para eventualmente alimentar a inteligência.
CREATE TABLE public.opportunities (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  company text NOT NULL,
  contact text NOT NULL DEFAULT '',
  seller text NOT NULL,
  source text NOT NULL,
  services text[] NOT NULL DEFAULT '{}',
  mrr numeric NOT NULL DEFAULT 0,
  setup numeric NOT NULL DEFAULT 0,
  probability integer NOT NULL DEFAULT 50,
  stage text NOT NULL DEFAULT 'Diagnóstico'
    CHECK (stage IN ('Lead', 'Diagnóstico', 'Proposta', 'Negociação', 'Fechado', 'Perdido', 'Onboarding')),
  expected_at date,
  competitor text,
  loss_reason text,
  -- Contexto que originou a recomendação (Revenue Intelligence) — carregado
  -- junto pra "por que esta oportunidade foi criada" nunca depender de
  -- memória/re-cálculo posterior.
  origin text NOT NULL DEFAULT 'Manual',
  reasoning text[] NOT NULL DEFAULT '{}',
  current_fee numeric,
  recommendation text,
  next_action text,
  ai_action_id uuid REFERENCES public.ai_actions(id) ON DELETE SET NULL,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY opportunities_staff_read ON public.opportunities FOR SELECT TO authenticated
  USING (public.is_staff_member(workspace_id));
CREATE POLICY opportunities_staff_insert ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_member(workspace_id));
CREATE POLICY opportunities_staff_update ON public.opportunities FOR UPDATE TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));

CREATE INDEX opportunities_workspace_stage_idx ON public.opportunities (workspace_id, stage);
CREATE TRIGGER set_opportunities_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
