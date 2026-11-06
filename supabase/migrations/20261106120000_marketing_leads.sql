-- Leads do site de divulgação do ContaAI (contaai-umber.vercel.app, página
-- pública antes do login) — nunca é dado de workspace/tenant, é informação
-- sobre quem quer VIRAR cliente da ContaAI. Por isso fica fora de
-- DomainDatabase (que é só dado por workspace) e dentro do Database
-- genérico (mesmo nível de workspaces/profiles em types.ts).
--
-- RLS habilitado SEM nenhuma policy para anon/authenticated de propósito:
-- o INSERT só acontece via submitLeadFn (server function, usa
-- supabaseAdmin/service_role) — o formulário público nunca fala com o
-- Supabase direto do navegador. Isso é defesa em profundidade: mesmo que a
-- chave publicável vaze, ninguém escreve ou lê esta tabela diretamente.
CREATE TABLE public.marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  phone text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.marketing_leads TO service_role;

CREATE INDEX marketing_leads_created_at_idx ON public.marketing_leads (created_at DESC);
