-- Integração real de e-mail (Gmail OAuth) — ver src/lib/email/, src/data/server-functions/email-integration.ts.
--
-- 1) communications.client_id vira nullable: com um provedor de e-mail real,
--    nem toda mensagem recebida tem um remetente identificável com
--    confiança suficiente (ver identifyClientForSender em
--    src/lib/email/client-matching.ts) — "não vincular automaticamente"
--    exige que essa ausência seja representável no banco, não só na UI.
--    As RLS existentes já toleram NULL sem mudança: communications_client_read
--    exige client_id = my_client_id(workspace_id), que nunca é verdadeiro
--    para NULL, então uma comunicação não identificada nunca aparece no
--    Portal do Cliente.
ALTER TABLE public.communications ALTER COLUMN client_id DROP NOT NULL;

-- 2) email_accounts: uma conexão OAuth por workspace (hoje só Gmail).
-- Tokens sempre gravados já criptografados pela aplicação (AES-256-GCM,
-- chave só em EMAIL_TOKEN_ENCRYPTION_KEY, nunca no banco) — a RLS staff-only
-- é a segunda camada, não a única.
CREATE TABLE public.email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'gmail' CHECK (provider IN ('gmail')),
  email_address text NOT NULL,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'syncing', 'error', 'disconnected')),
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  sync_cursor text,
  last_synced_at timestamptz,
  last_error text,
  connected_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, email_address)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_accounts TO authenticated;
GRANT ALL ON public.email_accounts TO service_role;
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_accounts_staff_read ON public.email_accounts FOR SELECT TO authenticated
  USING (public.is_staff_member(workspace_id));
CREATE POLICY email_accounts_staff_write ON public.email_accounts FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));

CREATE INDEX email_accounts_workspace_idx ON public.email_accounts (workspace_id);

-- 3) Ativa a tabela contacts (já existia, nunca era usada pela aplicação):
-- registra o repository na app e semeia contatos reais para os clientes já
-- seedados, para identifyClientForSender ter algo de verdade para casar.
INSERT INTO public.contacts (id, workspace_id, client_id, name, role, email, phone, is_primary) VALUES
  ('ct-c1-1', '00000000-0000-0000-0000-000000000001', 'c1', 'Ana Ferreira', 'Financeiro', 'ana.ferreira@vettaalimentos.com.br', '(11) 98888-0001', true),
  ('ct-c2-1', '00000000-0000-0000-0000-000000000001', 'c2', 'Bruno Lima', 'Controladoria', 'bruno.lima@clientec2.com.br', '(11) 98888-0002', true),
  ('ct-bc1-1', '00000000-0000-0000-0000-000000000002', 'b-c1', 'Carla Souza', 'Financeiro', 'carla.souza@empresaconfidencialb.com.br', '(11) 98888-0003', true)
ON CONFLICT (id) DO NOTHING;
