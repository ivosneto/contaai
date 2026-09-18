-- ContaAI — isolamento real por workspace e por papel (staff vs. client).
--
-- Até aqui, toda leitura/escrita passava por supabaseDomain (service_role),
-- que IGNORA RLS — as policies de 20260914160000_domain_core.sql nunca
-- foram exercidas de verdade. Esta migration corrige dois problemas
-- encontrados na auditoria desta tarefa:
--
-- 1. workspace_members.client_id / invitations.client_id eram `uuid` sem FK
--    — incompatíveis com clients.id (`text`, ex. "c1"). Nunca havia dado
--    gravado ali (login real nunca existiu), então é seguro trocar o tipo.
--
-- 2. As policies existentes usam só is_workspace_member(), que é true tanto
--    pra staff quanto pra um membro com papel 'client' — ou seja, hoje um
--    usuário 'client' teria acesso de leitura/escrita a tarefas, pendências
--    internas, outros clientes, funcionários etc. Esta migration separa
--    staff de client em toda tabela, e para as tabelas que o Portal do
--    Cliente usa (pendencies/obligations/documents/communications/meetings),
--    a policy de client fica restrita à própria linha (client_id =
--    my_client_id()) e às categorias/canais definidos em
--    src/lib/client-portal-engine.ts (CLIENT_VISIBLE_PENDENCY_CATEGORIES,
--    CLIENT_VISIBLE_CHANNELS) — replicados aqui em SQL para não depender só
--    do código.

-- ============================================================
-- 0. Corrige o tipo de client_id (Fase 1 assumia uuid; clients.id é text)
-- ============================================================

ALTER TABLE public.workspace_members DROP COLUMN client_id;
ALTER TABLE public.workspace_members ADD COLUMN client_id text REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.invitations DROP COLUMN client_id;
ALTER TABLE public.invitations ADD COLUMN client_id text REFERENCES public.clients(id) ON DELETE SET NULL;

-- ============================================================
-- 1. Funções de identidade (mesmo padrão SECURITY DEFINER da Fase 1)
-- ============================================================

CREATE OR REPLACE FUNCTION public.my_client_id(_workspace_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wm.client_id FROM public.workspace_members wm
  WHERE wm.workspace_id = _workspace_id AND wm.user_id = _user_id AND wm.status = 'active'
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.my_client_id(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_client_id(uuid, uuid) TO authenticated;

-- Staff = qualquer papel que não seja 'client'. Reaproveita has_workspace_role
-- (Fase 1), não duplica a checagem de papel.
CREATE OR REPLACE FUNCTION public.is_staff_member(_workspace_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_workspace_role(_workspace_id, ARRAY['owner','admin','manager','employee']::public.app_role[], _user_id)
$$;
REVOKE ALL ON FUNCTION public.is_staff_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_member(uuid, uuid) TO authenticated;

-- ============================================================
-- 2. Cadastro/organização — staff-only (cliente nunca vê outros clientes,
--    a equipe interna ou o catálogo bruto de serviços)
-- ============================================================

-- services: nomes do catálogo não são sensíveis (é o cardápio de serviços do
-- escritório) — cliente também lê, precisa pra resolver os nomes dos
-- próprios serviços contratados no Portal.
DROP POLICY services_read ON public.services;
CREATE POLICY services_read ON public.services FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

DROP POLICY employees_read ON public.employees;
CREATE POLICY employees_staff_read ON public.employees FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
-- employees_write já exige owner/admin/manager (has_workspace_role) — já exclui client, mantido.

DROP POLICY clients_read ON public.clients;
CREATE POLICY clients_staff_read ON public.clients FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY clients_client_read ON public.clients FOR SELECT TO authenticated USING (id = public.my_client_id(workspace_id));
-- clients_write já exige owner/admin/manager — mantido (client nunca edita o próprio cadastro).

DROP POLICY client_services_read ON public.client_services;
CREATE POLICY client_services_staff_read ON public.client_services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND public.is_staff_member(c.workspace_id)));
-- Portal do Cliente mostra "Serviços contratados" — cliente lê só o próprio join.
CREATE POLICY client_services_client_read ON public.client_services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.id = public.my_client_id(c.workspace_id)));

DROP POLICY contacts_read ON public.contacts;
DROP POLICY contacts_write ON public.contacts;
CREATE POLICY contacts_staff_read ON public.contacts FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY contacts_staff_write ON public.contacts FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));

DROP POLICY contracts_read ON public.contracts;
CREATE POLICY contracts_staff_read ON public.contracts FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

DROP POLICY contract_services_read ON public.contract_services;
CREATE POLICY contract_services_staff_read ON public.contract_services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND public.is_staff_member(c.workspace_id)));

-- ============================================================
-- 3. Operação
-- ============================================================

-- tasks: só staff — Portal do Cliente nunca mostra tarefas internas.
DROP POLICY tasks_read ON public.tasks;
DROP POLICY tasks_write ON public.tasks;
CREATE POLICY tasks_staff_read ON public.tasks FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY tasks_staff_write ON public.tasks FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));

-- processes/process_steps: só staff (não existia policy de escrita — o
-- repository usava service_role; agora fica real).
DROP POLICY processes_read ON public.processes;
CREATE POLICY processes_staff_read ON public.processes FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY processes_staff_write ON public.processes FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));
GRANT INSERT, UPDATE ON public.processes TO authenticated;

DROP POLICY process_steps_read ON public.process_steps;
CREATE POLICY process_steps_staff_read ON public.process_steps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id AND public.is_staff_member(p.workspace_id)));
CREATE POLICY process_steps_staff_write ON public.process_steps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id AND public.is_staff_member(p.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id AND public.is_staff_member(p.workspace_id)));
GRANT INSERT, DELETE ON public.process_steps TO authenticated;

-- obligations: staff completo; client só lê as suas (sem escrita — o Portal
-- nunca muda obrigação diretamente, só gera pendência/documento).
DROP POLICY obligations_read ON public.obligations;
DROP POLICY obligations_write ON public.obligations;
CREATE POLICY obligations_staff_read ON public.obligations FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY obligations_staff_write ON public.obligations FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));
CREATE POLICY obligations_client_read ON public.obligations FOR SELECT TO authenticated USING (client_id = public.my_client_id(workspace_id));

-- obligation_checklist_items: só staff (Portal não mostra checklist).
DROP POLICY checklist_read ON public.obligation_checklist_items;
DROP POLICY checklist_update ON public.obligation_checklist_items;
CREATE POLICY checklist_staff_read ON public.obligation_checklist_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.obligations o WHERE o.id = obligation_id AND public.is_staff_member(o.workspace_id)));
CREATE POLICY checklist_staff_update ON public.obligation_checklist_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.obligations o WHERE o.id = obligation_id AND public.is_staff_member(o.workspace_id)));

-- pendencies: staff completo; client só lê/atualiza status das suas, nas
-- categorias visíveis (mesma lista de CLIENT_VISIBLE_PENDENCY_CATEGORIES em
-- src/lib/client-portal-engine.ts — mudar lá exige mudar aqui também).
DROP POLICY pendencies_read ON public.pendencies;
DROP POLICY pendencies_write ON public.pendencies;
CREATE POLICY pendencies_staff_read ON public.pendencies FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY pendencies_staff_write ON public.pendencies FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));
CREATE POLICY pendencies_client_read ON public.pendencies FOR SELECT TO authenticated USING (
  client_id = public.my_client_id(workspace_id)
  AND category = ANY (ARRAY['Documento', 'Folha', 'Financeiro', 'Cliente'])
);
CREATE POLICY pendencies_client_update ON public.pendencies FOR UPDATE TO authenticated
  USING (client_id = public.my_client_id(workspace_id) AND category = ANY (ARRAY['Documento', 'Folha', 'Financeiro', 'Cliente']))
  WITH CHECK (client_id = public.my_client_id(workspace_id) AND category = ANY (ARRAY['Documento', 'Folha', 'Financeiro', 'Cliente']));

-- documents: staff completo; client lê/envia (insere) só os próprios.
DROP POLICY documents_read ON public.documents;
CREATE POLICY documents_staff_read ON public.documents FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY documents_staff_write ON public.documents FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));
CREATE POLICY documents_client_read ON public.documents FOR SELECT TO authenticated USING (client_id = public.my_client_id(workspace_id));
CREATE POLICY documents_client_insert ON public.documents FOR INSERT TO authenticated
  WITH CHECK (client_id = public.my_client_id(workspace_id));

-- projects: só staff.
DROP POLICY projects_read ON public.projects;
CREATE POLICY projects_staff_read ON public.projects FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY projects_staff_write ON public.projects FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));
GRANT INSERT, UPDATE ON public.projects TO authenticated;

-- ============================================================
-- 4. Comunicação
-- ============================================================

-- communications: staff completo; client lê/envia só nos canais visíveis
-- (CLIENT_VISIBLE_CHANNELS em client-portal-engine.ts) e só "Portal" ao criar.
DROP POLICY communications_read ON public.communications;
CREATE POLICY communications_staff_read ON public.communications FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY communications_staff_write ON public.communications FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));
CREATE POLICY communications_client_read ON public.communications FOR SELECT TO authenticated USING (
  client_id = public.my_client_id(workspace_id) AND channel = ANY (ARRAY['E-mail', 'WhatsApp', 'Portal'])
);
CREATE POLICY communications_client_insert ON public.communications FOR INSERT TO authenticated
  WITH CHECK (client_id = public.my_client_id(workspace_id) AND channel = 'Portal');

DROP POLICY emails_read ON public.emails;
CREATE POLICY emails_staff_read ON public.emails FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

-- meetings: Portal mostra reuniões do próprio cliente (aba Calendário).
DROP POLICY meetings_read ON public.meetings;
CREATE POLICY meetings_staff_read ON public.meetings FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY meetings_client_read ON public.meetings FOR SELECT TO authenticated USING (client_id = public.my_client_id(workspace_id));

-- announcements: sem dado sensível — qualquer membro do workspace (staff ou
-- client) lê; a UI já filtra por audiência/departamento. Policy original
-- (is_workspace_member) já cobre isso corretamente, mantida sem alteração.

-- ============================================================
-- 5. Financeiro — ainda não religado a nenhum repository (Financeiro
--    continua em office.ts). Só aperta staff-only por consistência.
-- ============================================================

DROP POLICY financial_accounts_read ON public.financial_accounts;
CREATE POLICY financial_accounts_staff_read ON public.financial_accounts FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

DROP POLICY invoices_read ON public.invoices;
CREATE POLICY invoices_staff_read ON public.invoices FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

DROP POLICY payments_read ON public.payments;
CREATE POLICY payments_staff_read ON public.payments FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

DROP POLICY transactions_read ON public.transactions;
CREATE POLICY transactions_staff_read ON public.transactions FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

DROP POLICY time_entries_read ON public.time_entries;
CREATE POLICY time_entries_staff_read ON public.time_entries FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

-- ============================================================
-- 6. Comercial — staff-only (pipeline interno, nunca visível ao cliente)
-- ============================================================

DROP POLICY opportunities_read ON public.opportunities;
CREATE POLICY opportunities_staff_read ON public.opportunities FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

DROP POLICY opportunity_services_read ON public.opportunity_services;
CREATE POLICY opportunity_services_staff_read ON public.opportunity_services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND public.is_staff_member(o.workspace_id)));

DROP POLICY proposals_read ON public.proposals;
CREATE POLICY proposals_staff_read ON public.proposals FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

-- ============================================================
-- 7. Sistema
-- ============================================================

DROP POLICY automations_read ON public.automations;
CREATE POLICY automations_staff_read ON public.automations FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));

DROP POLICY automation_runs_read ON public.automation_runs;
CREATE POLICY automation_runs_staff_read ON public.automation_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND public.is_staff_member(a.workspace_id)));

DROP POLICY timeline_events_read ON public.timeline_events;
DROP POLICY timeline_events_insert ON public.timeline_events;
CREATE POLICY timeline_events_staff_read ON public.timeline_events FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY timeline_events_staff_insert ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (public.is_staff_member(workspace_id));

DROP POLICY insight_status_read ON public.insight_status;
DROP POLICY insight_status_write ON public.insight_status;
CREATE POLICY insight_status_staff_read ON public.insight_status FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY insight_status_staff_write ON public.insight_status FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));

-- knowledge_articles: staff-only, com escrita agora real (era só leitura).
DROP POLICY knowledge_articles_read ON public.knowledge_articles;
CREATE POLICY knowledge_articles_staff_read ON public.knowledge_articles FOR SELECT TO authenticated USING (public.is_staff_member(workspace_id));
CREATE POLICY knowledge_articles_staff_write ON public.knowledge_articles FOR ALL TO authenticated
  USING (public.is_staff_member(workspace_id)) WITH CHECK (public.is_staff_member(workspace_id));
GRANT INSERT, UPDATE, DELETE ON public.knowledge_articles TO authenticated;

-- ============================================================
-- 8. Auditoria — permite staff gravar seus próprios eventos; leitura
--    continua restrita a owner/admin (audit_read_privileged, Fase 1).
-- ============================================================

GRANT INSERT ON public.audit_logs TO authenticated;
CREATE POLICY audit_logs_staff_insert ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_member(workspace_id) AND actor_id = auth.uid());
