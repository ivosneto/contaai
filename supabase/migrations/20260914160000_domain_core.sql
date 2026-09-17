-- ContaAI — domínio operacional (Fase 2+ do roadmap).
-- Convenções desta migration seguem exatamente a Fase 1
-- (20260914124352_...sql): uuid/gen_random_uuid() para tabelas que não
-- precisam interoperar com ids já existentes no app, RLS habilitada em toda
-- tabela com policy via public.is_workspace_member()/has_workspace_role(),
-- GRANT explícito por role, trigger set_updated_at() para updated_at,
-- CHECK em vez de ENUM para status/categoria de uma tabela só (mesmo padrão
-- usado em invitations.status na Fase 1).
--
-- Departamento NÃO vira enum aqui: a Fase 1 já criou public.departments
-- (tabela, não enum) — toda tabela abaixo referencia essa mesma tabela via
-- department_id em vez de duplicar a lista de departamentos.
--
-- clients/employees/services/tasks/pendencies/obligations usam
-- `id text PRIMARY KEY` (não uuid) DE PROPÓSITO: o app já gera esses ids no
-- cliente (ex. genId() em src/data/store.tsx, "c1"/"e1" em src/data/office.ts)
-- e depende deles em dezenas de arquivos (14 motores em src/lib/*-engine.ts).
-- São strings opacas (timestamp+random ou índice de seed), não sequenciais —
-- trocar para uuid exigiria reconciliar id-otimista-no-cliente com
-- id-gerado-no-servidor em todo o Action Engine, fora do escopo desta tarefa.

-- ============================================================
-- 1. Cadastro/organização
-- ============================================================

CREATE TABLE public.services (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Recorrente', 'Pontual')),
  description text NOT NULL DEFAULT '',
  default_fee numeric NOT NULL DEFAULT 0,
  default_hours numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);
GRANT SELECT ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_read ON public.services FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE TABLE public.employees (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  manager text,
  capacity_hours numeric NOT NULL DEFAULT 0,
  allocated_hours numeric NOT NULL DEFAULT 0,
  monthly_cost numeric NOT NULL DEFAULT 0,
  cost_per_hour numeric NOT NULL DEFAULT 0,
  productivity numeric NOT NULL DEFAULT 0,
  sla numeric NOT NULL DEFAULT 0,
  rework numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);
GRANT SELECT, INSERT, UPDATE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY employees_read ON public.employees FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY employees_write ON public.employees FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['owner','admin','manager']::public.app_role[]))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner','admin','manager']::public.app_role[]));
CREATE TRIGGER set_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX employees_workspace_idx ON public.employees(workspace_id);

CREATE TABLE public.clients (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  cnpj text NOT NULL,
  segment text NOT NULL,
  regime text NOT NULL CHECK (regime IN ('Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI')),
  revenue numeric NOT NULL DEFAULT 0,
  revenue_last_period numeric NOT NULL DEFAULT 0,
  headcount integer NOT NULL DEFAULT 0,
  headcount_last_period integer NOT NULL DEFAULT 0,
  fee numeric NOT NULL DEFAULT 0,
  fee_last_period numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  owner text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  nps integer,
  health integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('Ativo', 'Em onboarding', 'Em risco', 'Inadimplente', 'Sem atividade')),
  since date NOT NULL,
  overdue numeric NOT NULL DEFAULT 0,
  hours_month numeric NOT NULL DEFAULT 0,
  movements integer NOT NULL DEFAULT 0,
  movements_last_period integer NOT NULL DEFAULT 0,
  complexity integer NOT NULL DEFAULT 0,
  complexity_last_period integer NOT NULL DEFAULT 0,
  service_count_last_period integer NOT NULL DEFAULT 0,
  fee_last_adjusted_at date,
  complaints_30d integer NOT NULL DEFAULT 0,
  late_tasks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, cnpj)
);
GRANT SELECT, INSERT, UPDATE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_read ON public.clients FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY clients_write ON public.clients FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['owner','admin','manager']::public.app_role[]))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner','admin','manager']::public.app_role[]));
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX clients_workspace_idx ON public.clients(workspace_id);
CREATE INDEX clients_status_idx ON public.clients(workspace_id, status);

CREATE TABLE public.client_services (
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id text NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  PRIMARY KEY (client_id, service_id)
);
GRANT SELECT, INSERT, DELETE ON public.client_services TO authenticated;
GRANT ALL ON public.client_services TO service_role;
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY client_services_read ON public.client_services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND public.is_workspace_member(c.workspace_id)));

CREATE TABLE public.contacts (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_read ON public.contacts FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY contacts_write ON public.contacts FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE INDEX contacts_client_idx ON public.contacts(client_id);

CREATE TABLE public.contracts (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  value numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  renewal_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('Ativo', 'Em revisão', 'Encerrado')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contracts_read ON public.contracts FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX contracts_client_idx ON public.contracts(client_id);

CREATE TABLE public.contract_services (
  contract_id text NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  service_id text NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  PRIMARY KEY (contract_id, service_id)
);
GRANT SELECT ON public.contract_services TO authenticated;
GRANT ALL ON public.contract_services TO service_role;
ALTER TABLE public.contract_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY contract_services_read ON public.contract_services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND public.is_workspace_member(c.workspace_id)));

-- ============================================================
-- 2. Operação — a fatia religada nesta tarefa (tasks/pendencies/obligations)
-- ============================================================

CREATE TABLE public.tasks (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  assignee text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('A fazer', 'Em andamento', 'Em revisão', 'Concluída')),
  priority text NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  late boolean NOT NULL DEFAULT false,
  hours numeric NOT NULL DEFAULT 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_read ON public.tasks FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY tasks_write ON public.tasks FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX tasks_workspace_idx ON public.tasks(workspace_id);
CREATE INDEX tasks_client_idx ON public.tasks(client_id);
CREATE INDEX tasks_status_idx ON public.tasks(workspace_id, status);
CREATE INDEX tasks_assignee_idx ON public.tasks(workspace_id, assignee);

CREATE TABLE public.processes (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  progress integer NOT NULL DEFAULT 0,
  sla_ok boolean NOT NULL DEFAULT true,
  rework numeric NOT NULL DEFAULT 0,
  cycle_days numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.processes TO authenticated;
GRANT ALL ON public.processes TO service_role;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY processes_read ON public.processes FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX processes_client_idx ON public.processes(client_id);

CREATE TABLE public.process_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id text NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  owner text NOT NULL,
  sla_days numeric NOT NULL DEFAULT 0,
  avg_days numeric NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('Concluída', 'Em andamento', 'Pendente', 'Atrasada'))
);
GRANT SELECT ON public.process_steps TO authenticated;
GRANT ALL ON public.process_steps TO service_role;
ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY process_steps_read ON public.process_steps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id AND public.is_workspace_member(p.workspace_id)));
CREATE INDEX process_steps_process_idx ON public.process_steps(process_id, position);

CREATE TABLE public.obligations (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('DAS', 'SPED Fiscal', 'SPED Contribuições', 'eSocial', 'DCTFWeb', 'GFIP', 'DIRF', 'ECF')),
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  competence text NOT NULL,
  due_date date NOT NULL,
  regime text NOT NULL,
  municipality text NOT NULL,
  assignee text NOT NULL,
  status text NOT NULL CHECK (status IN ('Pendente', 'Em andamento', 'Aguardando cliente', 'Concluída', 'Atrasada')),
  priority text NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  evidence_document_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.obligations TO authenticated;
GRANT ALL ON public.obligations TO service_role;
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY obligations_read ON public.obligations FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY obligations_write ON public.obligations FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE TRIGGER set_obligations_updated_at BEFORE UPDATE ON public.obligations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX obligations_workspace_idx ON public.obligations(workspace_id);
CREATE INDEX obligations_client_competence_idx ON public.obligations(client_id, competence);
CREATE INDEX obligations_due_idx ON public.obligations(workspace_id, due_date);
CREATE INDEX obligations_status_idx ON public.obligations(workspace_id, status);

-- id NÃO é globalmente único: buildChecklist() (src/lib/obligations-engine.ts)
-- gera "chk-0".."chk-3" reaproveitados em toda obrigação — chave composta.
CREATE TABLE public.obligation_checklist_items (
  id text NOT NULL,
  obligation_id text NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  PRIMARY KEY (obligation_id, id)
);
GRANT SELECT, UPDATE ON public.obligation_checklist_items TO authenticated;
GRANT ALL ON public.obligation_checklist_items TO service_role;
ALTER TABLE public.obligation_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY checklist_read ON public.obligation_checklist_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.obligations o WHERE o.id = obligation_id AND public.is_workspace_member(o.workspace_id)));
CREATE POLICY checklist_update ON public.obligation_checklist_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.obligations o WHERE o.id = obligation_id AND public.is_workspace_member(o.workspace_id)));
CREATE INDEX checklist_obligation_idx ON public.obligation_checklist_items(obligation_id, position);

CREATE TABLE public.pendencies (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('Documento', 'Fiscal', 'Contábil', 'Folha', 'Financeiro', 'Comercial', 'Cliente', 'Interna')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  origin text NOT NULL,
  assignee text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  sla_hours numeric NOT NULL DEFAULT 24,
  due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('Aberta', 'Em andamento', 'Concluída', 'Cancelada')),
  recommended_action text NOT NULL DEFAULT '',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendencies TO authenticated;
GRANT ALL ON public.pendencies TO service_role;
ALTER TABLE public.pendencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY pendencies_read ON public.pendencies FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY pendencies_write ON public.pendencies FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE TRIGGER set_pendencies_updated_at BEFORE UPDATE ON public.pendencies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX pendencies_workspace_idx ON public.pendencies(workspace_id);
CREATE INDEX pendencies_client_idx ON public.pendencies(client_id);
CREATE INDEX pendencies_status_idx ON public.pendencies(workspace_id, status);
CREATE INDEX pendencies_due_idx ON public.pendencies(workspace_id, due_date);

CREATE TABLE public.documents (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Nota fiscal', 'Extrato bancário', 'Folha de ponto', 'Contrato social', 'Guia de imposto', 'Relatório gerencial')),
  category text NOT NULL CHECK (category IN ('Documento', 'Fiscal', 'Contábil', 'Folha', 'Financeiro', 'Comercial', 'Cliente', 'Interna')),
  competence text NOT NULL,
  assignee text NOT NULL,
  status text NOT NULL CHECK (status IN ('Pendente', 'Recebido', 'Processando', 'Aprovado', 'Vencido', 'Rejeitado')),
  pipeline_stage text NOT NULL CHECK (pipeline_stage IN ('Recebido', 'Identificação', 'Classificação', 'Extração', 'Validação', 'Relacionamento com cliente', 'Verificação da obrigação', 'Concluído')),
  uploaded_at date NOT NULL,
  extraction jsonb,
  linked_obligation_id text REFERENCES public.obligations(id) ON DELETE SET NULL,
  linked_pendency_id text REFERENCES public.pendencies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_read ON public.documents FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX documents_client_idx ON public.documents(client_id);
CREATE INDEX documents_obligation_idx ON public.documents(linked_obligation_id);

ALTER TABLE public.obligations
  ADD CONSTRAINT obligations_evidence_document_fkey FOREIGN KEY (evidence_document_id) REFERENCES public.documents(id) ON DELETE SET NULL;

CREATE TABLE public.projects (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('Planejado', 'Em andamento', 'Em aprovação', 'Concluído')),
  progress integer NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_read ON public.projects FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX projects_client_idx ON public.projects(client_id);

-- ============================================================
-- 3. Comunicação
-- ============================================================

CREATE TABLE public.communications (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  thread_id text NOT NULL,
  sender text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('E-mail', 'WhatsApp', 'Mensagem interna', 'Portal')),
  direction text NOT NULL CHECK (direction IN ('Recebida', 'Enviada')),
  subject text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  priority text NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  sentiment text NOT NULL CHECK (sentiment IN ('Positivo', 'Neutro', 'Negativo')),
  classification text NOT NULL,
  assignee text NOT NULL,
  status text NOT NULL CHECK (status IN ('Novo', 'Em andamento', 'Aguardando cliente', 'Respondida', 'Resolvida')),
  requires_action boolean NOT NULL DEFAULT false,
  suggested_action text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.communications TO authenticated;
GRANT ALL ON public.communications TO service_role;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY communications_read ON public.communications FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX communications_client_idx ON public.communications(client_id);
CREATE INDEX communications_thread_idx ON public.communications(thread_id);

CREATE TABLE public.emails (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('Recebido', 'Enviado')),
  subject text NOT NULL,
  snippet text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL,
  read boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.emails TO authenticated;
GRANT ALL ON public.emails TO service_role;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY emails_read ON public.emails FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX emails_client_idx ON public.emails(client_id);

CREATE TABLE public.meetings (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('Relacionamento', 'Onboarding', 'Cobrança', 'Consultoria')),
  scheduled_at timestamptz NOT NULL,
  attendees text[] NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT ''
);
GRANT SELECT ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY meetings_read ON public.meetings FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX meetings_client_idx ON public.meetings(client_id);

CREATE TABLE public.announcements (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'Todos os clientes',
  published_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY announcements_read ON public.announcements FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

-- ============================================================
-- 4. Financeiro
-- ============================================================

CREATE TABLE public.financial_accounts (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Corrente', 'Caixa', 'Aplicação')),
  balance numeric NOT NULL DEFAULT 0
);
GRANT SELECT ON public.financial_accounts TO authenticated;
GRANT ALL ON public.financial_accounts TO service_role;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY financial_accounts_read ON public.financial_accounts FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE TABLE public.invoices (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  competence text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('Paga', 'Pendente', 'Vencida'))
);
GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_read ON public.invoices FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX invoices_client_idx ON public.invoices(client_id);
CREATE INDEX invoices_status_idx ON public.invoices(workspace_id, status);

CREATE TABLE public.payments (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_id text NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  paid_at date NOT NULL,
  method text NOT NULL CHECK (method IN ('Pix', 'Boleto', 'Cartão'))
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_read ON public.payments FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX payments_client_idx ON public.payments(client_id);

CREATE TABLE public.transactions (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id text NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  client_id text REFERENCES public.clients(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('Receita', 'Despesa')),
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  occurred_at date NOT NULL
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transactions_read ON public.transactions FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX transactions_account_idx ON public.transactions(account_id);

CREATE TABLE public.time_entries (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  employee_id text NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  task_id text REFERENCES public.tasks(id) ON DELETE SET NULL,
  entry_date date NOT NULL,
  hours numeric NOT NULL DEFAULT 0
);
GRANT SELECT ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY time_entries_read ON public.time_entries FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX time_entries_employee_idx ON public.time_entries(employee_id);
CREATE INDEX time_entries_client_idx ON public.time_entries(client_id);

-- ============================================================
-- 5. Comercial
-- ============================================================

CREATE TABLE public.opportunities (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company text NOT NULL,
  contact text NOT NULL,
  seller text NOT NULL,
  source text NOT NULL,
  mrr numeric NOT NULL DEFAULT 0,
  setup numeric NOT NULL DEFAULT 0,
  probability integer NOT NULL DEFAULT 0,
  stage text NOT NULL CHECK (stage IN ('Lead', 'Diagnóstico', 'Proposta', 'Negociação', 'Fechado', 'Perdido', 'Onboarding')),
  expected_at date,
  competitor text,
  loss_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY opportunities_read ON public.opportunities FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE INDEX opportunities_stage_idx ON public.opportunities(workspace_id, stage);

CREATE TABLE public.opportunity_services (
  opportunity_id text NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  service_id text NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  PRIMARY KEY (opportunity_id, service_id)
);
GRANT SELECT ON public.opportunity_services TO authenticated;
GRANT ALL ON public.opportunity_services TO service_role;
ALTER TABLE public.opportunity_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY opportunity_services_read ON public.opportunity_services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND public.is_workspace_member(o.workspace_id)));

CREATE TABLE public.proposals (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  opportunity_id text NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  value numeric NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('Rascunho', 'Enviada', 'Aceita', 'Recusada')),
  sent_at date
);
GRANT SELECT ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY proposals_read ON public.proposals FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

-- ============================================================
-- 6. Sistema — automações, timeline e overlay de status de insights
-- ============================================================

CREATE TABLE public.automations (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger jsonb NOT NULL,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Pausada')),
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.automations TO authenticated;
GRANT ALL ON public.automations TO service_role;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY automations_read ON public.automations FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE TABLE public.automation_runs (
  id text PRIMARY KEY,
  automation_id text NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  ran_at timestamptz NOT NULL DEFAULT now(),
  matched_count integer NOT NULL DEFAULT 0,
  executed_count integer NOT NULL DEFAULT 0,
  summary text NOT NULL DEFAULT ''
);
GRANT SELECT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY automation_runs_read ON public.automation_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND public.is_workspace_member(a.workspace_id)));
CREATE INDEX automation_runs_automation_idx ON public.automation_runs(automation_id, ran_at DESC);

-- Substitui o `activityLog` hoje só em memória (src/data/store.tsx): cada
-- ação relevante do Action Engine grava aqui, por cliente, de forma durável.
CREATE TABLE public.timeline_events (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('mensagem', 'reunião', 'tarefa', 'documento', 'fatura', 'email', 'pendência', 'solicitação', 'pagamento', 'reclamação', 'oportunidade', 'contrato')),
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_by uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY timeline_events_read ON public.timeline_events FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY timeline_events_insert ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id));
CREATE INDEX timeline_events_client_idx ON public.timeline_events(client_id, occurred_at DESC);

-- Overlay de status sobre insights CALCULADOS (nunca armazenados) pelos
-- motores em src/lib/intelligence-engine.ts e correlatos — mesma ideia do
-- `insightStatus`/`alertStatus` em memória hoje: o insight em si nasce de um
-- cálculo sobre outras tabelas, só o status "resolvido"/"ignorado" precisa
-- persistir.
CREATE TABLE public.insight_status (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  insight_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('resolvido', 'ignorado')),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, insight_id)
);
GRANT SELECT, INSERT, UPDATE ON public.insight_status TO authenticated;
GRANT ALL ON public.insight_status TO service_role;
ALTER TABLE public.insight_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY insight_status_read ON public.insight_status FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY insight_status_write ON public.insight_status FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

CREATE TABLE public.knowledge_articles (
  id text PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  summary text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knowledge_articles TO authenticated;
GRANT ALL ON public.knowledge_articles TO service_role;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_articles_read ON public.knowledge_articles FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
