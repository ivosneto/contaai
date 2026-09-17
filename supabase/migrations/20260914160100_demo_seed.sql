-- Gerado por scripts/generate-domain-seed.ts a partir de src/data/office.ts — não editar manualmente, regenerar o script.
-- Idempotente (ON CONFLICT DO NOTHING) para poder rodar mais de uma vez com segurança.

-- ============================================================
-- Workspace demo fixo (sem login) + departamentos
-- ============================================================
INSERT INTO public.workspaces (id, name, slug, plan, timezone, currency, onboarding_step, onboarding_completed_at, created_by)
VALUES ('00000000-0000-0000-0000-000000000001', 'ContaAI Demo', 'contaai-demo', 'growth', 'America/Fortaleza', 'BRL', 8, now(), '00000000-0000-0000-0000-000000000009')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (workspace_id, name, active) VALUES ('00000000-0000-0000-0000-000000000001', 'Fiscal', true) ON CONFLICT (workspace_id, name) DO NOTHING;
INSERT INTO public.departments (workspace_id, name, active) VALUES ('00000000-0000-0000-0000-000000000001', 'Contábil', true) ON CONFLICT (workspace_id, name) DO NOTHING;
INSERT INTO public.departments (workspace_id, name, active) VALUES ('00000000-0000-0000-0000-000000000001', 'Pessoal', true) ON CONFLICT (workspace_id, name) DO NOTHING;
INSERT INTO public.departments (workspace_id, name, active) VALUES ('00000000-0000-0000-0000-000000000001', 'Societário', true) ON CONFLICT (workspace_id, name) DO NOTHING;
INSERT INTO public.departments (workspace_id, name, active) VALUES ('00000000-0000-0000-0000-000000000001', 'Financeiro', true) ON CONFLICT (workspace_id, name) DO NOTHING;
INSERT INTO public.departments (workspace_id, name, active) VALUES ('00000000-0000-0000-0000-000000000001', 'Comercial', true) ON CONFLICT (workspace_id, name) DO NOTHING;

-- ============================================================
-- Serviços (catálogo estático)
-- ============================================================
INSERT INTO public.services (id, workspace_id, name, category, description, default_fee, default_hours)
VALUES ('svc-contabil', '00000000-0000-0000-0000-000000000001', 'Contábil', 'Recorrente', 'Escrituração contábil mensal, balancetes e demonstrações.', 900, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.services (id, workspace_id, name, category, description, default_fee, default_hours)
VALUES ('svc-fiscal', '00000000-0000-0000-0000-000000000001', 'Fiscal', 'Recorrente', 'Apuração de impostos e obrigações acessórias.', 1100, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.services (id, workspace_id, name, category, description, default_fee, default_hours)
VALUES ('svc-pessoal', '00000000-0000-0000-0000-000000000001', 'Pessoal', 'Recorrente', 'Folha de pagamento e departamento pessoal.', 850, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.services (id, workspace_id, name, category, description, default_fee, default_hours)
VALUES ('svc-bpo', '00000000-0000-0000-0000-000000000001', 'BPO', 'Recorrente', 'BPO financeiro: contas a pagar, a receber e conciliação.', 1800, 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.services (id, workspace_id, name, category, description, default_fee, default_hours)
VALUES ('svc-societario', '00000000-0000-0000-0000-000000000001', 'Societário', 'Pontual', 'Alterações contratuais, abertura e encerramento de empresas.', 650, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.services (id, workspace_id, name, category, description, default_fee, default_hours)
VALUES ('svc-consultoria', '00000000-0000-0000-0000-000000000001', 'Consultoria', 'Pontual', 'Consultoria tributária e planejamento financeiro.', 1400, 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Funcionários
-- ============================================================
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e1', '00000000-0000-0000-0000-000000000001', 'João Ferreira', 'Analista Fiscal Sênior', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 'Renata Barros', 168, 198, 4788, 29, 73, 96, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e2', '00000000-0000-0000-0000-000000000001', 'Marina Costa', 'Analista Fiscal', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 'Renata Barros', 168, 172, 6280, 37, 92, 98, 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e3', '00000000-0000-0000-0000-000000000001', 'Rodrigo Melo', 'Assistente Fiscal', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 'Renata Barros', 168, 151, 3088, 18, 85, 83, 15)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e4', '00000000-0000-0000-0000-000000000001', 'Pedro Lima', 'Contador', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 'Pedro Lima', 168, 153, 9408, 56, 78, 85, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e5', '00000000-0000-0000-0000-000000000001', 'Bianca Souza', 'Analista Contábil', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 'Pedro Lima', 168, 139, 4300, 26, 97, 87, 11)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e6', '00000000-0000-0000-0000-000000000001', 'Tiago Rocha', 'Assistente Contábil', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 'Pedro Lima', 168, 118, 5728, 34, 90, 89, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e7', '00000000-0000-0000-0000-000000000001', 'Maria Souza', 'Analista de DP', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 'Camila Nunes', 168, 124, 4740, 28, 83, 91, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e8', '00000000-0000-0000-0000-000000000001', 'Lucas Prado', 'Assistente de DP', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 'Camila Nunes', 168, 101, 6080, 36, 76, 93, 12)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e9', '00000000-0000-0000-0000-000000000001', 'Camila Nunes', 'Coordenadora de DP', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 'Camila Nunes', 168, 147, 7252, 43, 95, 95, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e10', '00000000-0000-0000-0000-000000000001', 'Eduardo Reis', 'Analista Societário', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 'Camila Nunes', 168, 96, 8040, 48, 88, 97, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e11', '00000000-0000-0000-0000-000000000001', 'Patrícia Gomes', 'Analista Financeiro', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), 'Camila Nunes', 168, 133, 5620, 33, 81, 82, 13)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e12', '00000000-0000-0000-0000-000000000001', 'Vitor Andrade', 'Assistente Financeiro', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), 'Camila Nunes', 168, 88, 2560, 15, 74, 84, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e13', '00000000-0000-0000-0000-000000000001', 'Ana Beatriz', 'Executiva Comercial', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Comercial'), 'Camila Nunes', 168, 142, 8484, 51, 93, 86, 9)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e14', '00000000-0000-0000-0000-000000000001', 'Carlos Menezes', 'Executivo Comercial', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Comercial'), 'Camila Nunes', 168, 129, 5096, 30, 86, 88, 14)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)
VALUES ('e15', '00000000-0000-0000-0000-000000000001', 'Fernanda Dias', 'Gerente de Contas', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Comercial'), 'Camila Nunes', 168, 160, 9100, 54, 79, 90, 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Clientes
-- ============================================================
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c1', '00000000-0000-0000-0000-000000000001', 'Vetta Alimentos', '10.300.100/0001-10', 'Comércio varejista', 'Lucro Presumido', 8740000, 6828125, 20, 19, 2580, 2345, 1754, 'Ana Beatriz', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 7, 81, 'Ativo', '2019-02-14', 0, 13, 197, 171, 3, 1, 2, '2026-03-11', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c2', '00000000-0000-0000-0000-000000000001', 'TecnoAlfa Sistemas', '11.307.103/0001-11', 'Indústria alimentícia', 'Lucro Real', 8960000, 8000000, 11, 9, 4260, 4260, 3451, 'Carlos Menezes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 5, 61, 'Ativo', '2023-07-18', 0, 14, 138, 105, 8, 6, 3, '2025-11-10', 3, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c3', '00000000-0000-0000-0000-000000000001', 'Grupo Prado', '12.314.106/0001-12', 'Tecnologia / SaaS', 'MEI', 9180000, 7524590, 72, 69, 2160, 1831, 2419, 'Fernanda Dias', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 10, 61, 'Inadimplente', '2018-04-13', 3900, 15, 79, 83, 5, 3, 3, '2025-07-12', 0, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c4', '00000000-0000-0000-0000-000000000001', 'Clínica Ventura', '13.321.109/0001-13', 'Serviços médicos', 'Simples Nacional', 9400000, 9791667, 63, 63, 3840, 3491, 1613, 'Rafael Torres', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 8, 76, 'Em onboarding', '2022-01-17', 0, 16, 200, 196, 2, 1, 3, '2025-03-13', 2, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c5', '00000000-0000-0000-0000-000000000001', 'Construtora Ipê', '14.328.112/0001-14', 'Construção civil', 'Lucro Presumido', 9620000, 8152542, 54, 54, 1740, 1891, 957, 'Juliana Alves', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 6, 81, 'Ativo', '2017-06-12', 0, 17, 141, 114, 7, 6, 2, '2026-05-06', 0, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c6', '00000000-0000-0000-0000-000000000001', 'LogMais Transportes', '15.335.115/0001-15', 'Logística', 'Lucro Real', 9840000, 9283019, 45, 44, 3420, 2898, 2326, 'Ana Beatriz', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 4, 70, 'Ativo', '2021-03-16', 0, 18, 82, 78, 4, 4, 3, '2026-01-05', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c7', '00000000-0000-0000-0000-000000000001', 'Colégio Horizonte', '16.342.118/0001-16', 'Educação', 'MEI', 10060000, 9862745, 36, 34, 1320, 1553, 1069, 'Carlos Menezes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), NULL, 51, 'Inadimplente', '2016-08-11', 2100, 19, 203, 177, 9, 9, 2, '2025-09-06', 0, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c8', '00000000-0000-0000-0000-000000000001', 'AgroSerra', '17.349.121/0001-17', 'Agronegócio', 'Simples Nacional', 10280000, 8031250, 27, 24, 3000, 3261, 3360, 'Fernanda Dias', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 7, 86, 'Ativo', '2020-05-15', 0, 20, 144, 109, 6, 6, 2, '2025-05-08', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c9', '00000000-0000-0000-0000-000000000001', 'Loja Nordeste', '18.356.124/0001-18', 'E-commerce', 'Lucro Presumido', 10500000, 9375000, 18, 18, 900, 720, 378, 'Rafael Torres', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), NULL, 79, 'Ativo', '2015-02-10', 0, 21, 85, 89, 3, 3, 2, '2026-07-01', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c10', '00000000-0000-0000-0000-000000000001', 'Duo Consultoria', '19.363.127/0001-19', 'Consultoria', 'Lucro Real', 10720000, 8786885, 9, 9, 2580, 3035, 1419, 'Juliana Alves', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 10, 71, 'Inadimplente', '2019-07-14', 4800, 22, 206, 202, 8, 5, 3, '2026-03-02', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c11', '00000000-0000-0000-0000-000000000001', 'Padaria Estrela', '20.370.130/0001-20', 'Comércio varejista', 'MEI', 10940000, 11395833, 70, 69, 4260, 4260, 2897, 'Ana Beatriz', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 8, 73, 'Sem atividade', '2023-04-18', 0, 23, 147, 119, 5, 3, 1, '2025-11-01', 3, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c12', '00000000-0000-0000-0000-000000000001', 'MedPrime Saúde', '21.377.133/0001-21', 'Indústria alimentícia', 'Simples Nacional', 11160000, 9457627, 61, 59, 2160, 1728, 1750, 'Carlos Menezes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 6, 79, 'Ativo', '2018-01-13', 0, 24, 88, 84, 2, 1, 3, '2025-07-03', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c13', '00000000-0000-0000-0000-000000000001', 'Nortek Metais', '22.384.136/0001-22', 'Tecnologia / SaaS', 'Lucro Presumido', 11380000, 10735849, 52, 49, 3840, 3840, 4301, 'Fernanda Dias', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 4, 74, 'Ativo', '2022-06-17', 0, 25, 209, 182, 7, 6, 3, '2025-03-04', 2, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c14', '00000000-0000-0000-0000-000000000001', 'Casa Bahia Verde', '23.391.139/0001-23', 'Serviços médicos', 'Lucro Real', 11600000, 11372549, 43, 43, 1740, 1740, 731, 'Rafael Torres', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 9, 67, 'Inadimplente', '2017-03-12', 3000, 26, 150, 114, 4, 3, 3, '2026-04-27', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c15', '00000000-0000-0000-0000-000000000001', 'Studio Arq+', '24.398.142/0001-24', 'Construção civil', 'MEI', 11820000, 9234375, 34, 34, 3420, 3420, 1881, 'Juliana Alves', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 7, 80, 'Ativo', '2021-08-16', 0, 27, 91, 96, 9, 9, 3, '2025-12-27', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c16', '00000000-0000-0000-0000-000000000001', 'Rede Farmalife', '25.405.145/0001-25', 'Logística', 'Simples Nacional', 12040000, 10750000, 25, 24, 1320, 1320, 898, 'Ana Beatriz', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 5, 73, 'Ativo', '2016-05-11', 0, 28, 212, 208, 6, 6, 3, '2025-08-28', 0, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c17', '00000000-0000-0000-0000-000000000001', 'Vale Digital', '26.412.148/0001-26', 'Educação', 'Lucro Presumido', 12260000, 10049180, 16, 14, 3000, 3000, 2430, 'Carlos Menezes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 10, 76, 'Inadimplente', '2020-02-15', 5700, 29, 153, 123, 3, 3, 3, '2025-04-29', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c18', '00000000-0000-0000-0000-000000000001', 'Ferragens União', '27.419.151/0001-27', 'Agronegócio', 'Lucro Real', 12480000, 13000000, 7, 4, 900, 900, 1008, 'Fernanda Dias', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), NULL, 54, 'Ativo', '2015-07-10', 0, 30, 94, 90, 8, 8, 1, '2026-06-22', 0, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c19', '00000000-0000-0000-0000-000000000001', 'Bistrô Marina', '28.426.154/0001-28', 'E-commerce', 'MEI', 12700000, 10762712, 68, 68, 2580, 2580, 1084, 'Rafael Torres', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 6, 64, 'Ativo', '2019-04-14', 0, 31, 215, 187, 5, 2, 3, '2026-02-21', 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)
VALUES ('c20', '00000000-0000-0000-0000-000000000001', 'Sertão Energia', '29.433.157/0001-29', 'Consultoria', 'Simples Nacional', 12920000, 12188679, 59, 59, 4260, 3873, 2343, 'Juliana Alves', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), NULL, 58, 'Ativo', '2023-01-18', 0, 32, 156, 118, 2, 1, 2, '2025-10-23', 3, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Serviços contratados por cliente
-- ============================================================
INSERT INTO public.client_services (client_id, service_id) VALUES ('c1', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c1', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c2', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c2', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c2', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c3', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c3', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c3', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c4', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c4', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c4', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c5', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c5', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c5', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c6', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c6', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c6', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c7', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c7', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c7', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c8', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c8', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c9', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c9', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c9', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c10', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c10', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c10', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c11', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c11', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c12', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c12', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c12', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c13', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c13', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c13', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c14', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c14', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c14', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c15', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c15', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c15', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c16', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c16', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c16', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c17', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c17', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c17', 'svc-pessoal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c18', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c18', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c19', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c19', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c19', 'svc-bpo') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c20', 'svc-contabil') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c20', 'svc-fiscal') ON CONFLICT DO NOTHING;
INSERT INTO public.client_services (client_id, service_id) VALUES ('c20', 'svc-bpo') ON CONFLICT DO NOTHING;

-- ============================================================
-- Tarefas
-- ============================================================
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t1', '00000000-0000-0000-0000-000000000001', 'c1', 'Apuração de impostos — Vetta Alimentos', 'João Ferreira', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-01', 'Em andamento', 'Média', true, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t2', '00000000-0000-0000-0000-000000000001', 'c2', 'Envio de SPED Fiscal — TecnoAlfa Sistemas', 'Marina Costa', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-02', 'Em revisão', 'Alta', true, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t3', '00000000-0000-0000-0000-000000000001', 'c3', 'Conciliação bancária — Grupo Prado', 'Rodrigo Melo', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-03', 'Concluída', 'Crítica', true, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t4', '00000000-0000-0000-0000-000000000001', 'c4', 'Folha de pagamento — Clínica Ventura', 'Pedro Lima', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-04', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t5', '00000000-0000-0000-0000-000000000001', 'c5', 'Fechamento contábil — Construtora Ipê', 'Bianca Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-05', 'Em andamento', 'Média', false, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t6', '00000000-0000-0000-0000-000000000001', 'c6', 'Emissão de guias — LogMais Transportes', 'Tiago Rocha', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-06', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t7', '00000000-0000-0000-0000-000000000001', 'c7', 'Conferência de notas — Colégio Horizonte', 'Maria Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-07', 'Concluída', 'Crítica', false, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t8', '00000000-0000-0000-0000-000000000001', 'c8', 'Alteração contratual — AgroSerra', 'Lucas Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-08', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t9', '00000000-0000-0000-0000-000000000001', 'c9', 'Solicitação de documentos — Loja Nordeste', 'Camila Nunes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-09', 'Em andamento', 'Média', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t10', '00000000-0000-0000-0000-000000000001', 'c10', 'Relatório gerencial — Duo Consultoria', 'Eduardo Reis', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), '2026-09-10', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t11', '00000000-0000-0000-0000-000000000001', 'c11', 'Apuração de impostos — Padaria Estrela', 'Patrícia Gomes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-11', 'Concluída', 'Crítica', true, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t12', '00000000-0000-0000-0000-000000000001', 'c12', 'Envio de SPED Fiscal — MedPrime Saúde', 'Vitor Andrade', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-12', 'A fazer', 'Baixa', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t13', '00000000-0000-0000-0000-000000000001', 'c13', 'Conciliação bancária — Nortek Metais', 'João Ferreira', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-13', 'Em andamento', 'Média', true, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t14', '00000000-0000-0000-0000-000000000001', 'c14', 'Folha de pagamento — Casa Bahia Verde', 'Marina Costa', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-14', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t15', '00000000-0000-0000-0000-000000000001', 'c15', 'Fechamento contábil — Studio Arq+', 'Rodrigo Melo', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-15', 'Concluída', 'Crítica', false, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t16', '00000000-0000-0000-0000-000000000001', 'c16', 'Emissão de guias — Rede Farmalife', 'Pedro Lima', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-16', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t17', '00000000-0000-0000-0000-000000000001', 'c17', 'Conferência de notas — Vale Digital', 'Bianca Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-17', 'Em andamento', 'Média', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t18', '00000000-0000-0000-0000-000000000001', 'c18', 'Alteração contratual — Ferragens União', 'Tiago Rocha', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-18', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t19', '00000000-0000-0000-0000-000000000001', 'c19', 'Solicitação de documentos — Bistrô Marina', 'Maria Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-19', 'Concluída', 'Crítica', false, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t20', '00000000-0000-0000-0000-000000000001', 'c20', 'Relatório gerencial — Sertão Energia', 'Lucas Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-20', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t21', '00000000-0000-0000-0000-000000000001', 'c1', 'Apuração de impostos — Vetta Alimentos', 'Camila Nunes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-21', 'Em andamento', 'Média', true, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t22', '00000000-0000-0000-0000-000000000001', 'c2', 'Envio de SPED Fiscal — TecnoAlfa Sistemas', 'Eduardo Reis', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), '2026-09-22', 'Em revisão', 'Alta', true, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t23', '00000000-0000-0000-0000-000000000001', 'c3', 'Conciliação bancária — Grupo Prado', 'Patrícia Gomes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-23', 'Concluída', 'Crítica', true, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t24', '00000000-0000-0000-0000-000000000001', 'c4', 'Folha de pagamento — Clínica Ventura', 'Vitor Andrade', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-24', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t25', '00000000-0000-0000-0000-000000000001', 'c5', 'Fechamento contábil — Construtora Ipê', 'João Ferreira', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-25', 'Em andamento', 'Média', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t26', '00000000-0000-0000-0000-000000000001', 'c6', 'Emissão de guias — LogMais Transportes', 'Marina Costa', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-26', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t27', '00000000-0000-0000-0000-000000000001', 'c7', 'Conferência de notas — Colégio Horizonte', 'Rodrigo Melo', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-27', 'Concluída', 'Crítica', false, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t28', '00000000-0000-0000-0000-000000000001', 'c8', 'Alteração contratual — AgroSerra', 'Pedro Lima', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-28', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t29', '00000000-0000-0000-0000-000000000001', 'c9', 'Solicitação de documentos — Loja Nordeste', 'Bianca Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-01', 'Em andamento', 'Média', false, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t30', '00000000-0000-0000-0000-000000000001', 'c10', 'Relatório gerencial — Duo Consultoria', 'Tiago Rocha', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-02', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t31', '00000000-0000-0000-0000-000000000001', 'c11', 'Apuração de impostos — Padaria Estrela', 'Maria Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-03', 'Concluída', 'Crítica', true, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t32', '00000000-0000-0000-0000-000000000001', 'c12', 'Envio de SPED Fiscal — MedPrime Saúde', 'Lucas Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-04', 'A fazer', 'Baixa', true, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t33', '00000000-0000-0000-0000-000000000001', 'c13', 'Conciliação bancária — Nortek Metais', 'Camila Nunes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-05', 'Em andamento', 'Média', true, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t34', '00000000-0000-0000-0000-000000000001', 'c14', 'Folha de pagamento — Casa Bahia Verde', 'Eduardo Reis', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), '2026-09-06', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t35', '00000000-0000-0000-0000-000000000001', 'c15', 'Fechamento contábil — Studio Arq+', 'Patrícia Gomes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-07', 'Concluída', 'Crítica', false, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t36', '00000000-0000-0000-0000-000000000001', 'c16', 'Emissão de guias — Rede Farmalife', 'Vitor Andrade', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-08', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t37', '00000000-0000-0000-0000-000000000001', 'c17', 'Conferência de notas — Vale Digital', 'João Ferreira', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-09', 'Em andamento', 'Média', false, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t38', '00000000-0000-0000-0000-000000000001', 'c18', 'Alteração contratual — Ferragens União', 'Marina Costa', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-10', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t39', '00000000-0000-0000-0000-000000000001', 'c19', 'Solicitação de documentos — Bistrô Marina', 'Rodrigo Melo', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-11', 'Concluída', 'Crítica', false, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t40', '00000000-0000-0000-0000-000000000001', 'c20', 'Relatório gerencial — Sertão Energia', 'Pedro Lima', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-12', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t41', '00000000-0000-0000-0000-000000000001', 'c1', 'Apuração de impostos — Vetta Alimentos', 'Bianca Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-13', 'Em andamento', 'Média', true, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t42', '00000000-0000-0000-0000-000000000001', 'c2', 'Envio de SPED Fiscal — TecnoAlfa Sistemas', 'Tiago Rocha', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-14', 'Em revisão', 'Alta', true, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t43', '00000000-0000-0000-0000-000000000001', 'c3', 'Conciliação bancária — Grupo Prado', 'Maria Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-15', 'Concluída', 'Crítica', true, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t44', '00000000-0000-0000-0000-000000000001', 'c4', 'Folha de pagamento — Clínica Ventura', 'Lucas Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-16', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t45', '00000000-0000-0000-0000-000000000001', 'c5', 'Fechamento contábil — Construtora Ipê', 'Camila Nunes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-17', 'Em andamento', 'Média', false, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t46', '00000000-0000-0000-0000-000000000001', 'c6', 'Emissão de guias — LogMais Transportes', 'Eduardo Reis', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), '2026-09-18', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t47', '00000000-0000-0000-0000-000000000001', 'c7', 'Conferência de notas — Colégio Horizonte', 'Patrícia Gomes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-19', 'Concluída', 'Crítica', false, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t48', '00000000-0000-0000-0000-000000000001', 'c8', 'Alteração contratual — AgroSerra', 'Vitor Andrade', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-20', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t49', '00000000-0000-0000-0000-000000000001', 'c9', 'Solicitação de documentos — Loja Nordeste', 'João Ferreira', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-21', 'Em andamento', 'Média', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t50', '00000000-0000-0000-0000-000000000001', 'c10', 'Relatório gerencial — Duo Consultoria', 'Marina Costa', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-22', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t51', '00000000-0000-0000-0000-000000000001', 'c11', 'Apuração de impostos — Padaria Estrela', 'Rodrigo Melo', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-23', 'Concluída', 'Crítica', true, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t52', '00000000-0000-0000-0000-000000000001', 'c12', 'Envio de SPED Fiscal — MedPrime Saúde', 'Pedro Lima', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-24', 'A fazer', 'Baixa', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t53', '00000000-0000-0000-0000-000000000001', 'c13', 'Conciliação bancária — Nortek Metais', 'Bianca Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-25', 'Em andamento', 'Média', true, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t54', '00000000-0000-0000-0000-000000000001', 'c14', 'Folha de pagamento — Casa Bahia Verde', 'Tiago Rocha', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-26', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t55', '00000000-0000-0000-0000-000000000001', 'c15', 'Fechamento contábil — Studio Arq+', 'Maria Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-27', 'Concluída', 'Crítica', false, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t56', '00000000-0000-0000-0000-000000000001', 'c16', 'Emissão de guias — Rede Farmalife', 'Lucas Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-28', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t57', '00000000-0000-0000-0000-000000000001', 'c17', 'Conferência de notas — Vale Digital', 'Camila Nunes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-01', 'Em andamento', 'Média', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t58', '00000000-0000-0000-0000-000000000001', 'c18', 'Alteração contratual — Ferragens União', 'Eduardo Reis', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), '2026-09-02', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t59', '00000000-0000-0000-0000-000000000001', 'c19', 'Solicitação de documentos — Bistrô Marina', 'Patrícia Gomes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-03', 'Concluída', 'Crítica', false, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t60', '00000000-0000-0000-0000-000000000001', 'c20', 'Relatório gerencial — Sertão Energia', 'Vitor Andrade', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-04', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t61', '00000000-0000-0000-0000-000000000001', 'c1', 'Apuração de impostos — Vetta Alimentos', 'João Ferreira', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-05', 'Em andamento', 'Média', true, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t62', '00000000-0000-0000-0000-000000000001', 'c2', 'Envio de SPED Fiscal — TecnoAlfa Sistemas', 'Marina Costa', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-06', 'Em revisão', 'Alta', true, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t63', '00000000-0000-0000-0000-000000000001', 'c3', 'Conciliação bancária — Grupo Prado', 'Rodrigo Melo', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-07', 'Concluída', 'Crítica', true, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t64', '00000000-0000-0000-0000-000000000001', 'c4', 'Folha de pagamento — Clínica Ventura', 'Pedro Lima', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-08', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t65', '00000000-0000-0000-0000-000000000001', 'c5', 'Fechamento contábil — Construtora Ipê', 'Bianca Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-09', 'Em andamento', 'Média', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t66', '00000000-0000-0000-0000-000000000001', 'c6', 'Emissão de guias — LogMais Transportes', 'Tiago Rocha', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-10', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t67', '00000000-0000-0000-0000-000000000001', 'c7', 'Conferência de notas — Colégio Horizonte', 'Maria Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-11', 'Concluída', 'Crítica', false, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t68', '00000000-0000-0000-0000-000000000001', 'c8', 'Alteração contratual — AgroSerra', 'Lucas Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-12', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t69', '00000000-0000-0000-0000-000000000001', 'c9', 'Solicitação de documentos — Loja Nordeste', 'Camila Nunes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-13', 'Em andamento', 'Média', false, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t70', '00000000-0000-0000-0000-000000000001', 'c10', 'Relatório gerencial — Duo Consultoria', 'Eduardo Reis', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), '2026-09-14', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t71', '00000000-0000-0000-0000-000000000001', 'c11', 'Apuração de impostos — Padaria Estrela', 'Patrícia Gomes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-15', 'Concluída', 'Crítica', true, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t72', '00000000-0000-0000-0000-000000000001', 'c12', 'Envio de SPED Fiscal — MedPrime Saúde', 'Vitor Andrade', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-16', 'A fazer', 'Baixa', true, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t73', '00000000-0000-0000-0000-000000000001', 'c13', 'Conciliação bancária — Nortek Metais', 'João Ferreira', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-17', 'Em andamento', 'Média', true, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t74', '00000000-0000-0000-0000-000000000001', 'c14', 'Folha de pagamento — Casa Bahia Verde', 'Marina Costa', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-18', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t75', '00000000-0000-0000-0000-000000000001', 'c15', 'Fechamento contábil — Studio Arq+', 'Rodrigo Melo', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-19', 'Concluída', 'Crítica', false, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t76', '00000000-0000-0000-0000-000000000001', 'c16', 'Emissão de guias — Rede Farmalife', 'Pedro Lima', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-20', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t77', '00000000-0000-0000-0000-000000000001', 'c17', 'Conferência de notas — Vale Digital', 'Bianca Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-21', 'Em andamento', 'Média', false, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t78', '00000000-0000-0000-0000-000000000001', 'c18', 'Alteração contratual — Ferragens União', 'Tiago Rocha', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-22', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t79', '00000000-0000-0000-0000-000000000001', 'c19', 'Solicitação de documentos — Bistrô Marina', 'Maria Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-23', 'Concluída', 'Crítica', false, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t80', '00000000-0000-0000-0000-000000000001', 'c20', 'Relatório gerencial — Sertão Energia', 'Lucas Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-24', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t81', '00000000-0000-0000-0000-000000000001', 'c1', 'Apuração de impostos — Vetta Alimentos', 'Camila Nunes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-25', 'Em andamento', 'Média', true, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t82', '00000000-0000-0000-0000-000000000001', 'c2', 'Envio de SPED Fiscal — TecnoAlfa Sistemas', 'Eduardo Reis', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), '2026-09-26', 'Em revisão', 'Alta', true, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t83', '00000000-0000-0000-0000-000000000001', 'c3', 'Conciliação bancária — Grupo Prado', 'Patrícia Gomes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-27', 'Concluída', 'Crítica', true, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t84', '00000000-0000-0000-0000-000000000001', 'c4', 'Folha de pagamento — Clínica Ventura', 'Vitor Andrade', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-28', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t85', '00000000-0000-0000-0000-000000000001', 'c5', 'Fechamento contábil — Construtora Ipê', 'João Ferreira', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-01', 'Em andamento', 'Média', false, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t86', '00000000-0000-0000-0000-000000000001', 'c6', 'Emissão de guias — LogMais Transportes', 'Marina Costa', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-02', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t87', '00000000-0000-0000-0000-000000000001', 'c7', 'Conferência de notas — Colégio Horizonte', 'Rodrigo Melo', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-03', 'Concluída', 'Crítica', false, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t88', '00000000-0000-0000-0000-000000000001', 'c8', 'Alteração contratual — AgroSerra', 'Pedro Lima', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-04', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t89', '00000000-0000-0000-0000-000000000001', 'c9', 'Solicitação de documentos — Loja Nordeste', 'Bianca Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-05', 'Em andamento', 'Média', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t90', '00000000-0000-0000-0000-000000000001', 'c10', 'Relatório gerencial — Duo Consultoria', 'Tiago Rocha', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-06', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t91', '00000000-0000-0000-0000-000000000001', 'c11', 'Apuração de impostos — Padaria Estrela', 'Maria Souza', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-07', 'Concluída', 'Crítica', true, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t92', '00000000-0000-0000-0000-000000000001', 'c12', 'Envio de SPED Fiscal — MedPrime Saúde', 'Lucas Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-08', 'A fazer', 'Baixa', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t93', '00000000-0000-0000-0000-000000000001', 'c13', 'Conciliação bancária — Nortek Metais', 'Camila Nunes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-09-09', 'Em andamento', 'Média', true, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t94', '00000000-0000-0000-0000-000000000001', 'c14', 'Folha de pagamento — Casa Bahia Verde', 'Eduardo Reis', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), '2026-09-10', 'Em revisão', 'Alta', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t95', '00000000-0000-0000-0000-000000000001', 'c15', 'Fechamento contábil — Studio Arq+', 'Patrícia Gomes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-11', 'Concluída', 'Crítica', false, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t96', '00000000-0000-0000-0000-000000000001', 'c16', 'Emissão de guias — Rede Farmalife', 'Vitor Andrade', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Financeiro'), '2026-09-12', 'A fazer', 'Baixa', false, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t97', '00000000-0000-0000-0000-000000000001', 'c17', 'Conferência de notas — Vale Digital', 'João Ferreira', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-13', 'Em andamento', 'Média', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t98', '00000000-0000-0000-0000-000000000001', 'c18', 'Alteração contratual — Ferragens União', 'Marina Costa', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-14', 'Em revisão', 'Alta', false, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t99', '00000000-0000-0000-0000-000000000001', 'c19', 'Solicitação de documentos — Bistrô Marina', 'Rodrigo Melo', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09-15', 'Concluída', 'Crítica', false, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)
VALUES ('t100', '00000000-0000-0000-0000-000000000001', 'c20', 'Relatório gerencial — Sertão Energia', 'Pedro Lima', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09-16', 'A fazer', 'Baixa', false, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Obrigações + checklist
-- ============================================================
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob1', '00000000-0000-0000-0000-000000000001', 'c1', 'DAS', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-10', 'Lucro Presumido', 'São Paulo', 'João Ferreira', 'Atrasada', 'Crítica', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob1', 0, 'Apurar impostos do período', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob1', 1, 'Gerar guia DAS', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob1', 2, 'Enviar guia ao cliente', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob1', 3, 'Confirmar pagamento', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob2', '00000000-0000-0000-0000-000000000001', 'c2', 'SPED Fiscal', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09', '2026-09-28', 'Lucro Real', 'Curitiba', 'Marina Costa', 'Aguardando cliente', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob2', 0, 'Conferir notas fiscais', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob2', 1, 'Validar escrituração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob2', 2, 'Transmitir SPED Fiscal', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob2', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob3', '00000000-0000-0000-0000-000000000001', 'c3', 'SPED Contribuições', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-16', 'MEI', 'Belo Horizonte', 'Rodrigo Melo', 'Pendente', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob3', 0, 'Apurar PIS/COFINS', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob3', 1, 'Validar apuração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob3', 2, 'Transmitir SPED Contribuições', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob3', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob4', '00000000-0000-0000-0000-000000000001', 'c4', 'eSocial', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-05', 'Simples Nacional', 'Fortaleza', 'Pedro Lima', 'Concluída', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob4', 0, 'Conferir eventos de admissão/desligamento', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob4', 1, 'Validar folha', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob4', 2, 'Transmitir eventos ao eSocial', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob4', 3, 'Confirmar recibo', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob5', '00000000-0000-0000-0000-000000000001', 'c5', 'DCTFWeb', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-23', 'Lucro Presumido', 'Salvador', 'Bianca Souza', 'Aguardando cliente', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob5', 0, 'Conferir débitos declarados', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob5', 1, 'Validar cruzamento com eSocial', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob5', 2, 'Transmitir DCTFWeb', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob5', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob6', '00000000-0000-0000-0000-000000000001', 'c6', 'GFIP', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-13', 'Lucro Real', 'Rio de Janeiro', 'Tiago Rocha', 'Concluída', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob6', 0, 'Apurar FGTS/INSS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob6', 1, 'Validar GFIP', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob6', 2, 'Transmitir GFIP', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob6', 3, 'Confirmar recibo', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob7', '00000000-0000-0000-0000-000000000001', 'c7', 'DIRF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09', '2026-10-04', 'MEI', 'Porto Alegre', 'Maria Souza', 'Em andamento', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob7', 0, 'Conferir retenções do ano', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob7', 1, 'Validar declaração', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob7', 2, 'Transmitir DIRF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob7', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob8', '00000000-0000-0000-0000-000000000001', 'c8', 'ECF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-08', '2026-09-19', 'Simples Nacional', 'Recife', 'Lucas Prado', 'Aguardando cliente', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob8', 0, 'Conferir apuração do IRPJ/CSLL', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob8', 1, 'Validar ECF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob8', 2, 'Transmitir ECF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob8', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob9', '00000000-0000-0000-0000-000000000001', 'c9', 'DAS', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-10', 'Lucro Presumido', 'São Paulo', 'Camila Nunes', 'Concluída', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob9', 0, 'Apurar impostos do período', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob9', 1, 'Gerar guia DAS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob9', 2, 'Enviar guia ao cliente', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob9', 3, 'Confirmar pagamento', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob10', '00000000-0000-0000-0000-000000000001', 'c10', 'SPED Fiscal', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09', '2026-09-28', 'Lucro Real', 'Curitiba', 'Eduardo Reis', 'Em andamento', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob10', 0, 'Conferir notas fiscais', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob10', 1, 'Validar escrituração', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob10', 2, 'Transmitir SPED Fiscal', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob10', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob11', '00000000-0000-0000-0000-000000000001', 'c11', 'SPED Contribuições', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-16', 'MEI', 'Belo Horizonte', 'Patrícia Gomes', 'Aguardando cliente', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob11', 0, 'Apurar PIS/COFINS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob11', 1, 'Validar apuração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob11', 2, 'Transmitir SPED Contribuições', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob11', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob12', '00000000-0000-0000-0000-000000000001', 'c12', 'eSocial', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-05', 'Simples Nacional', 'Fortaleza', 'Vitor Andrade', 'Atrasada', 'Crítica', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob12', 0, 'Conferir eventos de admissão/desligamento', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob12', 1, 'Validar folha', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob12', 2, 'Transmitir eventos ao eSocial', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob12', 3, 'Confirmar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob13', '00000000-0000-0000-0000-000000000001', 'c13', 'DCTFWeb', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-23', 'Lucro Presumido', 'Salvador', 'Ana Beatriz', 'Em andamento', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob13', 0, 'Conferir débitos declarados', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob13', 1, 'Validar cruzamento com eSocial', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob13', 2, 'Transmitir DCTFWeb', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob13', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob14', '00000000-0000-0000-0000-000000000001', 'c14', 'GFIP', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-13', 'Lucro Real', 'Rio de Janeiro', 'Carlos Menezes', 'Concluída', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob14', 0, 'Apurar FGTS/INSS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob14', 1, 'Validar GFIP', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob14', 2, 'Transmitir GFIP', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob14', 3, 'Confirmar recibo', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob15', '00000000-0000-0000-0000-000000000001', 'c15', 'DIRF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09', '2026-10-04', 'MEI', 'Porto Alegre', 'Fernanda Dias', 'Pendente', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob15', 0, 'Conferir retenções do ano', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob15', 1, 'Validar declaração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob15', 2, 'Transmitir DIRF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob15', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob16', '00000000-0000-0000-0000-000000000001', 'c16', 'ECF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-08', '2026-09-19', 'Simples Nacional', 'Recife', 'João Ferreira', 'Em andamento', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob16', 0, 'Conferir apuração do IRPJ/CSLL', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob16', 1, 'Validar ECF', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob16', 2, 'Transmitir ECF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob16', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob17', '00000000-0000-0000-0000-000000000001', 'c17', 'DAS', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-10', 'Lucro Presumido', 'São Paulo', 'Marina Costa', 'Concluída', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob17', 0, 'Apurar impostos do período', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob17', 1, 'Gerar guia DAS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob17', 2, 'Enviar guia ao cliente', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob17', 3, 'Confirmar pagamento', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob18', '00000000-0000-0000-0000-000000000001', 'c18', 'SPED Fiscal', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09', '2026-09-28', 'Lucro Real', 'Curitiba', 'Rodrigo Melo', 'Pendente', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob18', 0, 'Conferir notas fiscais', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob18', 1, 'Validar escrituração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob18', 2, 'Transmitir SPED Fiscal', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob18', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob19', '00000000-0000-0000-0000-000000000001', 'c19', 'SPED Contribuições', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-16', 'MEI', 'Belo Horizonte', 'Pedro Lima', 'Em andamento', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob19', 0, 'Apurar PIS/COFINS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob19', 1, 'Validar apuração', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob19', 2, 'Transmitir SPED Contribuições', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob19', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob20', '00000000-0000-0000-0000-000000000001', 'c20', 'eSocial', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-05', 'Simples Nacional', 'Fortaleza', 'Bianca Souza', 'Concluída', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob20', 0, 'Conferir eventos de admissão/desligamento', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob20', 1, 'Validar folha', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob20', 2, 'Transmitir eventos ao eSocial', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob20', 3, 'Confirmar recibo', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob21', '00000000-0000-0000-0000-000000000001', 'c1', 'DCTFWeb', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-23', 'Lucro Presumido', 'São Paulo', 'Tiago Rocha', 'Pendente', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob21', 0, 'Conferir débitos declarados', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob21', 1, 'Validar cruzamento com eSocial', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob21', 2, 'Transmitir DCTFWeb', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob21', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob22', '00000000-0000-0000-0000-000000000001', 'c2', 'GFIP', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-13', 'Lucro Real', 'Curitiba', 'Maria Souza', 'Atrasada', 'Crítica', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob22', 0, 'Apurar FGTS/INSS', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob22', 1, 'Validar GFIP', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob22', 2, 'Transmitir GFIP', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob22', 3, 'Confirmar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob23', '00000000-0000-0000-0000-000000000001', 'c3', 'DIRF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09', '2026-10-04', 'MEI', 'Belo Horizonte', 'Lucas Prado', 'Aguardando cliente', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob23', 0, 'Conferir retenções do ano', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob23', 1, 'Validar declaração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob23', 2, 'Transmitir DIRF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob23', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob24', '00000000-0000-0000-0000-000000000001', 'c4', 'ECF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-08', '2026-09-19', 'Simples Nacional', 'Fortaleza', 'Camila Nunes', 'Pendente', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob24', 0, 'Conferir apuração do IRPJ/CSLL', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob24', 1, 'Validar ECF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob24', 2, 'Transmitir ECF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob24', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob25', '00000000-0000-0000-0000-000000000001', 'c5', 'DAS', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-10', 'Lucro Presumido', 'Salvador', 'Eduardo Reis', 'Concluída', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob25', 0, 'Apurar impostos do período', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob25', 1, 'Gerar guia DAS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob25', 2, 'Enviar guia ao cliente', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob25', 3, 'Confirmar pagamento', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob26', '00000000-0000-0000-0000-000000000001', 'c6', 'SPED Fiscal', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09', '2026-09-28', 'Lucro Real', 'Rio de Janeiro', 'Patrícia Gomes', 'Aguardando cliente', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob26', 0, 'Conferir notas fiscais', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob26', 1, 'Validar escrituração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob26', 2, 'Transmitir SPED Fiscal', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob26', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob27', '00000000-0000-0000-0000-000000000001', 'c7', 'SPED Contribuições', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-16', 'MEI', 'Porto Alegre', 'Vitor Andrade', 'Pendente', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob27', 0, 'Apurar PIS/COFINS', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob27', 1, 'Validar apuração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob27', 2, 'Transmitir SPED Contribuições', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob27', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob28', '00000000-0000-0000-0000-000000000001', 'c8', 'eSocial', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-05', 'Simples Nacional', 'Recife', 'Ana Beatriz', 'Concluída', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob28', 0, 'Conferir eventos de admissão/desligamento', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob28', 1, 'Validar folha', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob28', 2, 'Transmitir eventos ao eSocial', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob28', 3, 'Confirmar recibo', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob29', '00000000-0000-0000-0000-000000000001', 'c9', 'DCTFWeb', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-23', 'Lucro Presumido', 'São Paulo', 'Carlos Menezes', 'Aguardando cliente', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob29', 0, 'Conferir débitos declarados', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob29', 1, 'Validar cruzamento com eSocial', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob29', 2, 'Transmitir DCTFWeb', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob29', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob30', '00000000-0000-0000-0000-000000000001', 'c10', 'GFIP', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-13', 'Lucro Real', 'Curitiba', 'Fernanda Dias', 'Concluída', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob30', 0, 'Apurar FGTS/INSS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob30', 1, 'Validar GFIP', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob30', 2, 'Transmitir GFIP', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob30', 3, 'Confirmar recibo', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob31', '00000000-0000-0000-0000-000000000001', 'c11', 'DIRF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09', '2026-10-04', 'MEI', 'Belo Horizonte', 'João Ferreira', 'Em andamento', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob31', 0, 'Conferir retenções do ano', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob31', 1, 'Validar declaração', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob31', 2, 'Transmitir DIRF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob31', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob32', '00000000-0000-0000-0000-000000000001', 'c12', 'ECF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-08', '2026-09-19', 'Simples Nacional', 'Fortaleza', 'Marina Costa', 'Aguardando cliente', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob32', 0, 'Conferir apuração do IRPJ/CSLL', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob32', 1, 'Validar ECF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob32', 2, 'Transmitir ECF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob32', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob33', '00000000-0000-0000-0000-000000000001', 'c13', 'DAS', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-10', 'Lucro Presumido', 'Salvador', 'Rodrigo Melo', 'Atrasada', 'Crítica', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob33', 0, 'Apurar impostos do período', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob33', 1, 'Gerar guia DAS', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob33', 2, 'Enviar guia ao cliente', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob33', 3, 'Confirmar pagamento', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob34', '00000000-0000-0000-0000-000000000001', 'c14', 'SPED Fiscal', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-09', '2026-09-28', 'Lucro Real', 'Rio de Janeiro', 'Pedro Lima', 'Em andamento', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob34', 0, 'Conferir notas fiscais', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob34', 1, 'Validar escrituração', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob34', 2, 'Transmitir SPED Fiscal', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob34', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob35', '00000000-0000-0000-0000-000000000001', 'c15', 'SPED Contribuições', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-16', 'MEI', 'Porto Alegre', 'Bianca Souza', 'Aguardando cliente', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob35', 0, 'Apurar PIS/COFINS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob35', 1, 'Validar apuração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob35', 2, 'Transmitir SPED Contribuições', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob35', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob36', '00000000-0000-0000-0000-000000000001', 'c16', 'eSocial', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-05', 'Simples Nacional', 'Recife', 'Tiago Rocha', 'Concluída', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob36', 0, 'Conferir eventos de admissão/desligamento', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob36', 1, 'Validar folha', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob36', 2, 'Transmitir eventos ao eSocial', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob36', 3, 'Confirmar recibo', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob37', '00000000-0000-0000-0000-000000000001', 'c17', 'DCTFWeb', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-23', 'Lucro Presumido', 'São Paulo', 'Maria Souza', 'Em andamento', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob37', 0, 'Conferir débitos declarados', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob37', 1, 'Validar cruzamento com eSocial', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob37', 2, 'Transmitir DCTFWeb', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob37', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob38', '00000000-0000-0000-0000-000000000001', 'c18', 'GFIP', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), '2026-08', '2026-09-13', 'Lucro Real', 'Curitiba', 'Lucas Prado', 'Concluída', 'Alta', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob38', 0, 'Apurar FGTS/INSS', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob38', 1, 'Validar GFIP', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob38', 2, 'Transmitir GFIP', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob38', 3, 'Confirmar recibo', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob39', '00000000-0000-0000-0000-000000000001', 'c19', 'DIRF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-09', '2026-10-04', 'MEI', 'Belo Horizonte', 'Camila Nunes', 'Pendente', 'Baixa', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob39', 0, 'Conferir retenções do ano', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob39', 1, 'Validar declaração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob39', 2, 'Transmitir DIRF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob39', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob40', '00000000-0000-0000-0000-000000000001', 'c20', 'ECF', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), '2026-08', '2026-09-19', 'Simples Nacional', 'Fortaleza', 'Eduardo Reis', 'Em andamento', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob40', 0, 'Conferir apuração do IRPJ/CSLL', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob40', 1, 'Validar ECF', true) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob40', 2, 'Transmitir ECF', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob40', 3, 'Guardar recibo', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)
VALUES ('ob41', '00000000-0000-0000-0000-000000000001', 'c3', 'SPED Fiscal', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), '2026-08', '2026-09-18', 'MEI', 'Belo Horizonte', 'João Ferreira', 'Pendente', 'Média', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-0', 'ob41', 0, 'Conferir notas fiscais', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-1', 'ob41', 1, 'Validar escrituração', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-2', 'ob41', 2, 'Transmitir SPED Fiscal', false) ON CONFLICT (obligation_id, id) DO NOTHING;
INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES ('chk-3', 'ob41', 3, 'Guardar recibo de entrega', false) ON CONFLICT (obligation_id, id) DO NOTHING;

-- ============================================================
-- Pendências
-- ============================================================
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd1', '00000000-0000-0000-0000-000000000001', 'c1', 'Documento', 'Enviar extratos bancários do mês — Vetta Alimentos', 'Cliente ainda não enviou os extratos para conciliação.', 'Obrigação', 'João Ferreira', 'Média', 24, '2026-09-21', 'Aberta', 'Enviar lembrete automático ao cliente.', '2026-09-17'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd2', '00000000-0000-0000-0000-000000000001', 'c2', 'Fiscal', 'Apurar impostos do período — TecnoAlfa Sistemas', 'Apuração pendente antes do vencimento da guia.', 'Comunicação', 'Marina Costa', 'Alta', 48, '2026-09-22', 'Em andamento', 'Priorizar apuração com o responsável do Fiscal.', '2026-09-17'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd3', '00000000-0000-0000-0000-000000000001', 'c3', 'Contábil', 'Conciliar lançamentos do mês — Grupo Prado', 'Divergência entre extrato bancário e lançamentos contábeis.', 'Documento', 'Rodrigo Melo', 'Crítica', 72, '2026-09-23', 'Em andamento', 'Revisar lançamentos com o analista contábil.', '2026-09-17'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd4', '00000000-0000-0000-0000-000000000001', 'c4', 'Folha', 'Confirmar admissões e desligamentos — Clínica Ventura', 'Folha aguardando confirmação de movimentações de pessoal.', 'Manual', 'Pedro Lima', 'Baixa', 4, '2026-09-04', 'Aberta', 'Solicitar confirmação ao RH do cliente.', '2026-08-28'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd5', '00000000-0000-0000-0000-000000000001', 'c5', 'Interna', 'Revisar checklist de fechamento — Construtora Ipê', 'Checklist interno do fechamento mensal incompleto.', 'Obrigação', 'Bianca Souza', 'Média', 8, '2026-09-05', 'Aberta', 'Concluir checklist antes da entrega.', '2026-08-28'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd6', '00000000-0000-0000-0000-000000000001', 'c6', 'Comercial', 'Enviar proposta de reajuste — LogMais Transportes', 'Cliente elegível a reajuste sem proposta enviada.', 'Comunicação', 'Tiago Rocha', 'Alta', 24, '2026-09-06', 'Em andamento', 'Gerar e enviar proposta comercial.', '2026-09-03'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd7', '00000000-0000-0000-0000-000000000001', 'c7', 'Cliente', 'Retornar contato do cliente — Colégio Horizonte', 'Cliente aguarda retorno há mais de 3 dias.', 'Documento', 'Maria Souza', 'Crítica', 48, '2026-09-07', 'Em andamento', 'Agendar reunião de relacionamento.', '2026-09-03'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd8', '00000000-0000-0000-0000-000000000001', 'c8', 'Interna', 'Revisar checklist de fechamento — AgroSerra', 'Checklist interno do fechamento mensal incompleto.', 'Manual', 'Lucas Prado', 'Baixa', 72, '2026-09-08', 'Concluída', 'Concluir checklist antes da entrega.', '2026-09-03'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd9', '00000000-0000-0000-0000-000000000001', 'c9', 'Documento', 'Enviar extratos bancários do mês — Loja Nordeste', 'Cliente ainda não enviou os extratos para conciliação.', 'Obrigação', 'Camila Nunes', 'Média', 4, '2026-09-09', 'Concluída', 'Enviar lembrete automático ao cliente.', '2026-09-03'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd10', '00000000-0000-0000-0000-000000000001', 'c10', 'Fiscal', 'Apurar impostos do período — Duo Consultoria', 'Apuração pendente antes do vencimento da guia.', 'Comunicação', 'Eduardo Reis', 'Alta', 8, '2026-09-10', 'Cancelada', 'Priorizar apuração com o responsável do Fiscal.', '2026-09-03'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd11', '00000000-0000-0000-0000-000000000001', 'c11', 'Contábil', 'Conciliar lançamentos do mês — Padaria Estrela', 'Divergência entre extrato bancário e lançamentos contábeis.', 'Documento', 'Patrícia Gomes', 'Crítica', 24, '2026-09-11', 'Aberta', 'Revisar lançamentos com o analista contábil.', '2026-09-03'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd12', '00000000-0000-0000-0000-000000000001', 'c12', 'Folha', 'Confirmar admissões e desligamentos — MedPrime Saúde', 'Folha aguardando confirmação de movimentações de pessoal.', 'Manual', 'Vitor Andrade', 'Baixa', 48, '2026-09-12', 'Aberta', 'Solicitar confirmação ao RH do cliente.', '2026-09-09'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd13', '00000000-0000-0000-0000-000000000001', 'c13', 'Interna', 'Revisar checklist de fechamento — Nortek Metais', 'Checklist interno do fechamento mensal incompleto.', 'Obrigação', 'Ana Beatriz', 'Média', 72, '2026-09-13', 'Em andamento', 'Concluir checklist antes da entrega.', '2026-09-09'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd14', '00000000-0000-0000-0000-000000000001', 'c14', 'Comercial', 'Enviar proposta de reajuste — Casa Bahia Verde', 'Cliente elegível a reajuste sem proposta enviada.', 'Comunicação', 'Carlos Menezes', 'Alta', 4, '2026-09-14', 'Em andamento', 'Gerar e enviar proposta comercial.', '2026-09-09'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd15', '00000000-0000-0000-0000-000000000001', 'c15', 'Cliente', 'Retornar contato do cliente — Studio Arq+', 'Cliente aguarda retorno há mais de 3 dias.', 'Documento', 'Fernanda Dias', 'Crítica', 8, '2026-09-15', 'Aberta', 'Agendar reunião de relacionamento.', '2026-09-09'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd16', '00000000-0000-0000-0000-000000000001', 'c16', 'Interna', 'Revisar checklist de fechamento — Rede Farmalife', 'Checklist interno do fechamento mensal incompleto.', 'Manual', 'João Ferreira', 'Baixa', 24, '2026-09-16', 'Aberta', 'Concluir checklist antes da entrega.', '2026-09-09'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd17', '00000000-0000-0000-0000-000000000001', 'c17', 'Documento', 'Enviar extratos bancários do mês — Vale Digital', 'Cliente ainda não enviou os extratos para conciliação.', 'Obrigação', 'Marina Costa', 'Média', 48, '2026-09-17', 'Em andamento', 'Enviar lembrete automático ao cliente.', '2026-09-09'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd18', '00000000-0000-0000-0000-000000000001', 'c18', 'Fiscal', 'Apurar impostos do período — Ferragens União', 'Apuração pendente antes do vencimento da guia.', 'Comunicação', 'Rodrigo Melo', 'Alta', 72, '2026-09-18', 'Em andamento', 'Priorizar apuração com o responsável do Fiscal.', '2026-09-15'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd19', '00000000-0000-0000-0000-000000000001', 'c19', 'Contábil', 'Conciliar lançamentos do mês — Bistrô Marina', 'Divergência entre extrato bancário e lançamentos contábeis.', 'Documento', 'Pedro Lima', 'Crítica', 4, '2026-09-19', 'Concluída', 'Revisar lançamentos com o analista contábil.', '2026-09-15'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd20', '00000000-0000-0000-0000-000000000001', 'c20', 'Folha', 'Confirmar admissões e desligamentos — Sertão Energia', 'Folha aguardando confirmação de movimentações de pessoal.', 'Manual', 'Bianca Souza', 'Baixa', 8, '2026-09-20', 'Concluída', 'Solicitar confirmação ao RH do cliente.', '2026-09-15'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd21', '00000000-0000-0000-0000-000000000001', 'c1', 'Interna', 'Revisar checklist de fechamento — Vetta Alimentos', 'Checklist interno do fechamento mensal incompleto.', 'Obrigação', 'Tiago Rocha', 'Média', 24, '2026-09-21', 'Aberta', 'Concluir checklist antes da entrega.', '2026-09-15'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd22', '00000000-0000-0000-0000-000000000001', 'c2', 'Comercial', 'Enviar proposta de reajuste — TecnoAlfa Sistemas', 'Cliente elegível a reajuste sem proposta enviada.', 'Comunicação', 'Maria Souza', 'Alta', 48, '2026-09-22', 'Aberta', 'Gerar e enviar proposta comercial.', '2026-09-15'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd23', '00000000-0000-0000-0000-000000000001', 'c3', 'Cliente', 'Retornar contato do cliente — Grupo Prado', 'Cliente aguarda retorno há mais de 3 dias.', 'Documento', 'Lucas Prado', 'Crítica', 72, '2026-09-23', 'Em andamento', 'Agendar reunião de relacionamento.', '2026-09-15'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd24', '00000000-0000-0000-0000-000000000001', 'c4', 'Interna', 'Revisar checklist de fechamento — Clínica Ventura', 'Checklist interno do fechamento mensal incompleto.', 'Manual', 'Camila Nunes', 'Baixa', 4, '2026-09-04', 'Em andamento', 'Concluir checklist antes da entrega.', '2026-09-01'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd25', '00000000-0000-0000-0000-000000000001', 'c5', 'Documento', 'Enviar extratos bancários do mês — Construtora Ipê', 'Cliente ainda não enviou os extratos para conciliação.', 'Obrigação', 'Eduardo Reis', 'Média', 8, '2026-09-05', 'Concluída', 'Enviar lembrete automático ao cliente.', '2026-09-01'::timestamptz)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)
VALUES ('pd26', '00000000-0000-0000-0000-000000000001', 'c6', 'Fiscal', 'Apurar impostos do período — LogMais Transportes', 'Apuração pendente antes do vencimento da guia.', 'Comunicação', 'Patrícia Gomes', 'Alta', 24, '2026-09-06', 'Concluída', 'Priorizar apuração com o responsável do Fiscal.', '2026-09-01'::timestamptz)
ON CONFLICT (id) DO NOTHING;

