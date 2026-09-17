-- Gerado por scripts/generate-more-seed.ts a partir de src/data/office.ts — não editar manualmente, regenerar o script.
-- Idempotente (ON CONFLICT DO NOTHING) para poder rodar mais de uma vez com segurança.

-- ============================================================
-- Processos + etapas
-- ============================================================
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p1', '00000000-0000-0000-0000-000000000001', 'c1', 'Fechamento Mensal — Vetta Alimentos', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 25, true, 17, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p1', 0, 'Solicitar documentos', 'João Ferreira', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p1' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p1', 1, 'Receber', 'Marina Costa', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p1' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p1', 2, 'Validar', 'Rodrigo Melo', 3, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p1' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p1', 3, 'Processar', 'Pedro Lima', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p1' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p1', 4, 'Conferir', 'Bianca Souza', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p1' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p1', 5, 'Revisar', 'Tiago Rocha', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p1' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p1', 6, 'Aprovar', 'Maria Souza', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p1' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p1', 7, 'Entregar', 'Lucas Prado', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p1' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p2', '00000000-0000-0000-0000-000000000001', 'c2', 'Folha de Pagamento — TecnoAlfa Sistemas', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 88, true, 12, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p2', 0, 'Solicitar documentos', 'Marina Costa', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p2' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p2', 1, 'Receber', 'Rodrigo Melo', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p2' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p2', 2, 'Validar', 'Pedro Lima', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p2' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p2', 3, 'Processar', 'Bianca Souza', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p2' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p2', 4, 'Conferir', 'Tiago Rocha', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p2' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p2', 5, 'Revisar', 'Maria Souza', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p2' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p2', 6, 'Aprovar', 'Lucas Prado', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p2' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p2', 7, 'Entregar', 'Camila Nunes', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p2' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p3', '00000000-0000-0000-0000-000000000001', 'c3', 'Abertura de Empresa — Grupo Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 50, true, 7, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p3', 0, 'Solicitar documentos', 'Rodrigo Melo', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p3' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p3', 1, 'Receber', 'Pedro Lima', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p3' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p3', 2, 'Validar', 'Bianca Souza', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p3' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p3', 3, 'Processar', 'Tiago Rocha', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p3' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p3', 4, 'Conferir', 'Maria Souza', 2, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p3' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p3', 5, 'Revisar', 'Lucas Prado', 3, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p3' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p3', 6, 'Aprovar', 'Camila Nunes', 1, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p3' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p3', 7, 'Entregar', 'Eduardo Reis', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p3' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p4', '00000000-0000-0000-0000-000000000001', 'c4', 'Obrigações Acessórias — Clínica Ventura', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 13, true, 2, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p4', 0, 'Solicitar documentos', 'Pedro Lima', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p4' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p4', 1, 'Receber', 'Bianca Souza', 2, 1, 'Atrasada'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p4' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p4', 2, 'Validar', 'Tiago Rocha', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p4' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p4', 3, 'Processar', 'Maria Souza', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p4' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p4', 4, 'Conferir', 'Lucas Prado', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p4' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p4', 5, 'Revisar', 'Camila Nunes', 3, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p4' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p4', 6, 'Aprovar', 'Eduardo Reis', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p4' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p4', 7, 'Entregar', 'Patrícia Gomes', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p4' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p5', '00000000-0000-0000-0000-000000000001', 'c5', 'Onboarding de Cliente — Construtora Ipê', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 75, false, 19, 9)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p5', 0, 'Solicitar documentos', 'Bianca Souza', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p5' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p5', 1, 'Receber', 'Tiago Rocha', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p5' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p5', 2, 'Validar', 'Maria Souza', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p5' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p5', 3, 'Processar', 'Lucas Prado', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p5' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p5', 4, 'Conferir', 'Camila Nunes', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p5' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p5', 5, 'Revisar', 'Eduardo Reis', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p5' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p5', 6, 'Aprovar', 'Patrícia Gomes', 1, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p5' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p5', 7, 'Entregar', 'Vitor Andrade', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p5' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p6', '00000000-0000-0000-0000-000000000001', 'c6', 'Fechamento Mensal — LogMais Transportes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 38, true, 14, 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p6', 0, 'Solicitar documentos', 'Tiago Rocha', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p6' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p6', 1, 'Receber', 'Maria Souza', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p6' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p6', 2, 'Validar', 'Lucas Prado', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p6' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p6', 3, 'Processar', 'Camila Nunes', 1, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p6' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p6', 4, 'Conferir', 'Eduardo Reis', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p6' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p6', 5, 'Revisar', 'Patrícia Gomes', 3, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p6' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p6', 6, 'Aprovar', 'Vitor Andrade', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p6' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p6', 7, 'Entregar', 'Ana Beatriz', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p6' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p7', '00000000-0000-0000-0000-000000000001', 'c7', 'Folha de Pagamento — Colégio Horizonte', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 100, false, 9, 11)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p7', 0, 'Solicitar documentos', 'Maria Souza', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p7' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p7', 1, 'Receber', 'Lucas Prado', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p7' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p7', 2, 'Validar', 'Camila Nunes', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p7' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p7', 3, 'Processar', 'Eduardo Reis', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p7' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p7', 4, 'Conferir', 'Patrícia Gomes', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p7' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p7', 5, 'Revisar', 'Vitor Andrade', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p7' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p7', 6, 'Aprovar', 'Ana Beatriz', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p7' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p7', 7, 'Entregar', 'Carlos Menezes', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p7' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p8', '00000000-0000-0000-0000-000000000001', 'c8', 'Abertura de Empresa — AgroSerra', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 63, true, 4, 12)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p8', 0, 'Solicitar documentos', 'Lucas Prado', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p8' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p8', 1, 'Receber', 'Camila Nunes', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p8' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p8', 2, 'Validar', 'Eduardo Reis', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p8' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p8', 3, 'Processar', 'Patrícia Gomes', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p8' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p8', 4, 'Conferir', 'Vitor Andrade', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p8' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p8', 5, 'Revisar', 'Ana Beatriz', 3, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p8' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p8', 6, 'Aprovar', 'Carlos Menezes', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p8' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p8', 7, 'Entregar', 'Fernanda Dias', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p8' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p9', '00000000-0000-0000-0000-000000000001', 'c9', 'Obrigações Acessórias — Loja Nordeste', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 25, false, 21, 13)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p9', 0, 'Solicitar documentos', 'Camila Nunes', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p9' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p9', 1, 'Receber', 'Eduardo Reis', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p9' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p9', 2, 'Validar', 'Patrícia Gomes', 3, 3, 'Atrasada'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p9' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p9', 3, 'Processar', 'Vitor Andrade', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p9' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p9', 4, 'Conferir', 'Ana Beatriz', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p9' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p9', 5, 'Revisar', 'Carlos Menezes', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p9' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p9', 6, 'Aprovar', 'Fernanda Dias', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p9' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p9', 7, 'Entregar', 'João Ferreira', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p9' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p10', '00000000-0000-0000-0000-000000000001', 'c10', 'Onboarding de Cliente — Duo Consultoria', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 88, true, 16, 14)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p10', 0, 'Solicitar documentos', 'Eduardo Reis', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p10' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p10', 1, 'Receber', 'Patrícia Gomes', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p10' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p10', 2, 'Validar', 'Vitor Andrade', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p10' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p10', 3, 'Processar', 'Ana Beatriz', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p10' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p10', 4, 'Conferir', 'Carlos Menezes', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p10' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p10', 5, 'Revisar', 'Fernanda Dias', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p10' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p10', 6, 'Aprovar', 'João Ferreira', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p10' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p10', 7, 'Entregar', 'Marina Costa', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p10' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p11', '00000000-0000-0000-0000-000000000001', 'c11', 'Fechamento Mensal — Padaria Estrela', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 50, true, 11, 15)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p11', 0, 'Solicitar documentos', 'Patrícia Gomes', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p11' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p11', 1, 'Receber', 'Vitor Andrade', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p11' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p11', 2, 'Validar', 'Ana Beatriz', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p11' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p11', 3, 'Processar', 'Carlos Menezes', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p11' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p11', 4, 'Conferir', 'Fernanda Dias', 2, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p11' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p11', 5, 'Revisar', 'João Ferreira', 3, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p11' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p11', 6, 'Aprovar', 'Marina Costa', 1, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p11' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p11', 7, 'Entregar', 'Rodrigo Melo', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p11' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p12', '00000000-0000-0000-0000-000000000001', 'c12', 'Folha de Pagamento — MedPrime Saúde', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 13, true, 6, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p12', 0, 'Solicitar documentos', 'Vitor Andrade', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p12' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p12', 1, 'Receber', 'Ana Beatriz', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p12' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p12', 2, 'Validar', 'Carlos Menezes', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p12' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p12', 3, 'Processar', 'Fernanda Dias', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p12' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p12', 4, 'Conferir', 'João Ferreira', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p12' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p12', 5, 'Revisar', 'Marina Costa', 3, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p12' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p12', 6, 'Aprovar', 'Rodrigo Melo', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p12' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p12', 7, 'Entregar', 'Pedro Lima', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p12' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p13', '00000000-0000-0000-0000-000000000001', 'c13', 'Abertura de Empresa — Nortek Metais', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 75, true, 1, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p13', 0, 'Solicitar documentos', 'Ana Beatriz', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p13' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p13', 1, 'Receber', 'Carlos Menezes', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p13' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p13', 2, 'Validar', 'Fernanda Dias', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p13' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p13', 3, 'Processar', 'João Ferreira', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p13' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p13', 4, 'Conferir', 'Marina Costa', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p13' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p13', 5, 'Revisar', 'Rodrigo Melo', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p13' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p13', 6, 'Aprovar', 'Pedro Lima', 1, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p13' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p13', 7, 'Entregar', 'Bianca Souza', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p13' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p14', '00000000-0000-0000-0000-000000000001', 'c14', 'Obrigações Acessórias — Casa Bahia Verde', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 38, false, 18, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p14', 0, 'Solicitar documentos', 'Carlos Menezes', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p14' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p14', 1, 'Receber', 'Fernanda Dias', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p14' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p14', 2, 'Validar', 'João Ferreira', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p14' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p14', 3, 'Processar', 'Marina Costa', 1, 1, 'Atrasada'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p14' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p14', 4, 'Conferir', 'Rodrigo Melo', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p14' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p14', 5, 'Revisar', 'Pedro Lima', 3, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p14' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p14', 6, 'Aprovar', 'Bianca Souza', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p14' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p14', 7, 'Entregar', 'Tiago Rocha', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p14' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p15', '00000000-0000-0000-0000-000000000001', 'c15', 'Onboarding de Cliente — Studio Arq+', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 100, true, 13, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p15', 0, 'Solicitar documentos', 'Fernanda Dias', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p15' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p15', 1, 'Receber', 'João Ferreira', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p15' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p15', 2, 'Validar', 'Marina Costa', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p15' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p15', 3, 'Processar', 'Rodrigo Melo', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p15' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p15', 4, 'Conferir', 'Pedro Lima', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p15' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p15', 5, 'Revisar', 'Bianca Souza', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p15' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p15', 6, 'Aprovar', 'Tiago Rocha', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p15' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p15', 7, 'Entregar', 'Maria Souza', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p15' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p16', '00000000-0000-0000-0000-000000000001', 'c16', 'Fechamento Mensal — Rede Farmalife', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 63, false, 8, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p16', 0, 'Solicitar documentos', 'João Ferreira', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p16' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p16', 1, 'Receber', 'Marina Costa', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p16' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p16', 2, 'Validar', 'Rodrigo Melo', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p16' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p16', 3, 'Processar', 'Pedro Lima', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p16' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p16', 4, 'Conferir', 'Bianca Souza', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p16' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p16', 5, 'Revisar', 'Tiago Rocha', 3, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p16' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p16', 6, 'Aprovar', 'Maria Souza', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p16' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p16', 7, 'Entregar', 'Lucas Prado', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p16' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p17', '00000000-0000-0000-0000-000000000001', 'c17', 'Folha de Pagamento — Vale Digital', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 25, true, 3, 9)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p17', 0, 'Solicitar documentos', 'Marina Costa', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p17' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p17', 1, 'Receber', 'Rodrigo Melo', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p17' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p17', 2, 'Validar', 'Pedro Lima', 3, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p17' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p17', 3, 'Processar', 'Bianca Souza', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p17' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p17', 4, 'Conferir', 'Tiago Rocha', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p17' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p17', 5, 'Revisar', 'Maria Souza', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p17' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p17', 6, 'Aprovar', 'Lucas Prado', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p17' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p17', 7, 'Entregar', 'Camila Nunes', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p17' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p18', '00000000-0000-0000-0000-000000000001', 'c18', 'Abertura de Empresa — Ferragens União', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 88, false, 20, 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p18', 0, 'Solicitar documentos', 'Rodrigo Melo', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p18' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p18', 1, 'Receber', 'Pedro Lima', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p18' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p18', 2, 'Validar', 'Bianca Souza', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p18' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p18', 3, 'Processar', 'Tiago Rocha', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p18' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p18', 4, 'Conferir', 'Maria Souza', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p18' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p18', 5, 'Revisar', 'Lucas Prado', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p18' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p18', 6, 'Aprovar', 'Camila Nunes', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p18' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p18', 7, 'Entregar', 'Eduardo Reis', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p18' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p19', '00000000-0000-0000-0000-000000000001', 'c19', 'Obrigações Acessórias — Bistrô Marina', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 50, true, 15, 11)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p19', 0, 'Solicitar documentos', 'Pedro Lima', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p19' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p19', 1, 'Receber', 'Bianca Souza', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p19' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p19', 2, 'Validar', 'Tiago Rocha', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p19' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p19', 3, 'Processar', 'Maria Souza', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p19' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p19', 4, 'Conferir', 'Lucas Prado', 2, 3, 'Atrasada'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p19' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p19', 5, 'Revisar', 'Camila Nunes', 3, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p19' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p19', 6, 'Aprovar', 'Eduardo Reis', 1, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p19' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p19', 7, 'Entregar', 'Patrícia Gomes', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p19' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p20', '00000000-0000-0000-0000-000000000001', 'c20', 'Onboarding de Cliente — Sertão Energia', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 13, true, 10, 12)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p20', 0, 'Solicitar documentos', 'Bianca Souza', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p20' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p20', 1, 'Receber', 'Tiago Rocha', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p20' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p20', 2, 'Validar', 'Maria Souza', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p20' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p20', 3, 'Processar', 'Lucas Prado', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p20' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p20', 4, 'Conferir', 'Camila Nunes', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p20' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p20', 5, 'Revisar', 'Eduardo Reis', 3, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p20' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p20', 6, 'Aprovar', 'Patrícia Gomes', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p20' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p20', 7, 'Entregar', 'Vitor Andrade', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p20' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p21', '00000000-0000-0000-0000-000000000001', 'c1', 'Fechamento Mensal — Vetta Alimentos', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 75, true, 13, 13)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p21', 0, 'Solicitar documentos', 'Tiago Rocha', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p21' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p21', 1, 'Receber', 'Maria Souza', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p21' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p21', 2, 'Validar', 'Lucas Prado', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p21' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p21', 3, 'Processar', 'Camila Nunes', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p21' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p21', 4, 'Conferir', 'Eduardo Reis', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p21' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p21', 5, 'Revisar', 'Patrícia Gomes', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p21' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p21', 6, 'Aprovar', 'Vitor Andrade', 1, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p21' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p21', 7, 'Entregar', 'Ana Beatriz', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p21' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p22', '00000000-0000-0000-0000-000000000001', 'c2', 'Folha de Pagamento — TecnoAlfa Sistemas', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 38, true, 8, 14)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p22', 0, 'Solicitar documentos', 'Maria Souza', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p22' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p22', 1, 'Receber', 'Lucas Prado', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p22' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p22', 2, 'Validar', 'Camila Nunes', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p22' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p22', 3, 'Processar', 'Eduardo Reis', 1, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p22' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p22', 4, 'Conferir', 'Patrícia Gomes', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p22' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p22', 5, 'Revisar', 'Vitor Andrade', 3, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p22' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p22', 6, 'Aprovar', 'Ana Beatriz', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p22' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p22', 7, 'Entregar', 'Carlos Menezes', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p22' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p23', '00000000-0000-0000-0000-000000000001', 'c3', 'Abertura de Empresa — Grupo Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 100, false, 3, 15)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p23', 0, 'Solicitar documentos', 'Lucas Prado', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p23' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p23', 1, 'Receber', 'Camila Nunes', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p23' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p23', 2, 'Validar', 'Eduardo Reis', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p23' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p23', 3, 'Processar', 'Patrícia Gomes', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p23' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p23', 4, 'Conferir', 'Vitor Andrade', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p23' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p23', 5, 'Revisar', 'Ana Beatriz', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p23' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p23', 6, 'Aprovar', 'Carlos Menezes', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p23' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p23', 7, 'Entregar', 'Fernanda Dias', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p23' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p24', '00000000-0000-0000-0000-000000000001', 'c4', 'Obrigações Acessórias — Clínica Ventura', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 63, true, 20, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p24', 0, 'Solicitar documentos', 'Camila Nunes', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p24' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p24', 1, 'Receber', 'Eduardo Reis', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p24' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p24', 2, 'Validar', 'Patrícia Gomes', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p24' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p24', 3, 'Processar', 'Vitor Andrade', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p24' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p24', 4, 'Conferir', 'Ana Beatriz', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p24' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p24', 5, 'Revisar', 'Carlos Menezes', 3, 1, 'Atrasada'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p24' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p24', 6, 'Aprovar', 'Fernanda Dias', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p24' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p24', 7, 'Entregar', 'João Ferreira', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p24' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p25', '00000000-0000-0000-0000-000000000001', 'c5', 'Onboarding de Cliente — Construtora Ipê', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 25, false, 15, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p25', 0, 'Solicitar documentos', 'Eduardo Reis', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p25' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p25', 1, 'Receber', 'Patrícia Gomes', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p25' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p25', 2, 'Validar', 'Vitor Andrade', 3, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p25' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p25', 3, 'Processar', 'Ana Beatriz', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p25' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p25', 4, 'Conferir', 'Carlos Menezes', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p25' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p25', 5, 'Revisar', 'Fernanda Dias', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p25' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p25', 6, 'Aprovar', 'João Ferreira', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p25' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p25', 7, 'Entregar', 'Marina Costa', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p25' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p26', '00000000-0000-0000-0000-000000000001', 'c6', 'Fechamento Mensal — LogMais Transportes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 88, true, 10, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p26', 0, 'Solicitar documentos', 'Patrícia Gomes', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p26' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p26', 1, 'Receber', 'Vitor Andrade', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p26' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p26', 2, 'Validar', 'Ana Beatriz', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p26' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p26', 3, 'Processar', 'Carlos Menezes', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p26' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p26', 4, 'Conferir', 'Fernanda Dias', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p26' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p26', 5, 'Revisar', 'João Ferreira', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p26' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p26', 6, 'Aprovar', 'Marina Costa', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p26' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p26', 7, 'Entregar', 'Rodrigo Melo', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p26' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p27', '00000000-0000-0000-0000-000000000001', 'c7', 'Folha de Pagamento — Colégio Horizonte', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 50, false, 5, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p27', 0, 'Solicitar documentos', 'Vitor Andrade', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p27' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p27', 1, 'Receber', 'Ana Beatriz', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p27' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p27', 2, 'Validar', 'Carlos Menezes', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p27' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p27', 3, 'Processar', 'Fernanda Dias', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p27' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p27', 4, 'Conferir', 'João Ferreira', 2, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p27' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p27', 5, 'Revisar', 'Marina Costa', 3, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p27' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p27', 6, 'Aprovar', 'Rodrigo Melo', 1, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p27' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p27', 7, 'Entregar', 'Pedro Lima', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p27' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p28', '00000000-0000-0000-0000-000000000001', 'c8', 'Abertura de Empresa — AgroSerra', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 13, true, 0, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p28', 0, 'Solicitar documentos', 'Ana Beatriz', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p28' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p28', 1, 'Receber', 'Carlos Menezes', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p28' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p28', 2, 'Validar', 'Fernanda Dias', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p28' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p28', 3, 'Processar', 'João Ferreira', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p28' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p28', 4, 'Conferir', 'Marina Costa', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p28' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p28', 5, 'Revisar', 'Rodrigo Melo', 3, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p28' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p28', 6, 'Aprovar', 'Pedro Lima', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p28' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p28', 7, 'Entregar', 'Bianca Souza', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p28' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p29', '00000000-0000-0000-0000-000000000001', 'c9', 'Obrigações Acessórias — Loja Nordeste', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 75, true, 17, 9)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p29', 0, 'Solicitar documentos', 'Carlos Menezes', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p29' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p29', 1, 'Receber', 'Fernanda Dias', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p29' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p29', 2, 'Validar', 'João Ferreira', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p29' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p29', 3, 'Processar', 'Marina Costa', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p29' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p29', 4, 'Conferir', 'Rodrigo Melo', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p29' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p29', 5, 'Revisar', 'Pedro Lima', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p29' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p29', 6, 'Aprovar', 'Bianca Souza', 1, 3, 'Atrasada'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p29' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p29', 7, 'Entregar', 'Tiago Rocha', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p29' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p30', '00000000-0000-0000-0000-000000000001', 'c10', 'Onboarding de Cliente — Duo Consultoria', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 38, true, 12, 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p30', 0, 'Solicitar documentos', 'Fernanda Dias', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p30' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p30', 1, 'Receber', 'João Ferreira', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p30' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p30', 2, 'Validar', 'Marina Costa', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p30' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p30', 3, 'Processar', 'Rodrigo Melo', 1, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p30' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p30', 4, 'Conferir', 'Pedro Lima', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p30' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p30', 5, 'Revisar', 'Bianca Souza', 3, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p30' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p30', 6, 'Aprovar', 'Tiago Rocha', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p30' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p30', 7, 'Entregar', 'Maria Souza', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p30' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p31', '00000000-0000-0000-0000-000000000001', 'c11', 'Fechamento Mensal — Padaria Estrela', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 100, true, 7, 11)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p31', 0, 'Solicitar documentos', 'João Ferreira', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p31' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p31', 1, 'Receber', 'Marina Costa', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p31' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p31', 2, 'Validar', 'Rodrigo Melo', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p31' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p31', 3, 'Processar', 'Pedro Lima', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p31' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p31', 4, 'Conferir', 'Bianca Souza', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p31' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p31', 5, 'Revisar', 'Tiago Rocha', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p31' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p31', 6, 'Aprovar', 'Maria Souza', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p31' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p31', 7, 'Entregar', 'Lucas Prado', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p31' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p32', '00000000-0000-0000-0000-000000000001', 'c12', 'Folha de Pagamento — MedPrime Saúde', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 63, false, 2, 12)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p32', 0, 'Solicitar documentos', 'Marina Costa', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p32' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p32', 1, 'Receber', 'Rodrigo Melo', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p32' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p32', 2, 'Validar', 'Pedro Lima', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p32' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p32', 3, 'Processar', 'Bianca Souza', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p32' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p32', 4, 'Conferir', 'Tiago Rocha', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p32' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p32', 5, 'Revisar', 'Maria Souza', 3, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p32' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p32', 6, 'Aprovar', 'Lucas Prado', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p32' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p32', 7, 'Entregar', 'Camila Nunes', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p32' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p33', '00000000-0000-0000-0000-000000000001', 'c13', 'Abertura de Empresa — Nortek Metais', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 25, true, 19, 13)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p33', 0, 'Solicitar documentos', 'Rodrigo Melo', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p33' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p33', 1, 'Receber', 'Pedro Lima', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p33' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p33', 2, 'Validar', 'Bianca Souza', 3, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p33' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p33', 3, 'Processar', 'Tiago Rocha', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p33' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p33', 4, 'Conferir', 'Maria Souza', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p33' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p33', 5, 'Revisar', 'Lucas Prado', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p33' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p33', 6, 'Aprovar', 'Camila Nunes', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p33' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p33', 7, 'Entregar', 'Eduardo Reis', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p33' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p34', '00000000-0000-0000-0000-000000000001', 'c14', 'Obrigações Acessórias — Casa Bahia Verde', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 88, false, 14, 14)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p34', 0, 'Solicitar documentos', 'Pedro Lima', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p34' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p34', 1, 'Receber', 'Bianca Souza', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p34' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p34', 2, 'Validar', 'Tiago Rocha', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p34' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p34', 3, 'Processar', 'Maria Souza', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p34' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p34', 4, 'Conferir', 'Lucas Prado', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p34' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p34', 5, 'Revisar', 'Camila Nunes', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p34' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p34', 6, 'Aprovar', 'Eduardo Reis', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p34' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p34', 7, 'Entregar', 'Patrícia Gomes', 2, 1, 'Atrasada'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p34' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p35', '00000000-0000-0000-0000-000000000001', 'c15', 'Onboarding de Cliente — Studio Arq+', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 50, true, 9, 15)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p35', 0, 'Solicitar documentos', 'Bianca Souza', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p35' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p35', 1, 'Receber', 'Tiago Rocha', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p35' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p35', 2, 'Validar', 'Maria Souza', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p35' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p35', 3, 'Processar', 'Lucas Prado', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p35' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p35', 4, 'Conferir', 'Camila Nunes', 2, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p35' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p35', 5, 'Revisar', 'Eduardo Reis', 3, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p35' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p35', 6, 'Aprovar', 'Patrícia Gomes', 1, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p35' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p35', 7, 'Entregar', 'Vitor Andrade', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p35' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p36', '00000000-0000-0000-0000-000000000001', 'c16', 'Fechamento Mensal — Rede Farmalife', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 13, false, 4, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p36', 0, 'Solicitar documentos', 'Tiago Rocha', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p36' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p36', 1, 'Receber', 'Maria Souza', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p36' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p36', 2, 'Validar', 'Lucas Prado', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p36' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p36', 3, 'Processar', 'Camila Nunes', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p36' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p36', 4, 'Conferir', 'Eduardo Reis', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p36' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p36', 5, 'Revisar', 'Patrícia Gomes', 3, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p36' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p36', 6, 'Aprovar', 'Vitor Andrade', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p36' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p36', 7, 'Entregar', 'Ana Beatriz', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p36' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p37', '00000000-0000-0000-0000-000000000001', 'c17', 'Folha de Pagamento — Vale Digital', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 75, true, 21, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p37', 0, 'Solicitar documentos', 'Maria Souza', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p37' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p37', 1, 'Receber', 'Lucas Prado', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p37' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p37', 2, 'Validar', 'Camila Nunes', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p37' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p37', 3, 'Processar', 'Eduardo Reis', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p37' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p37', 4, 'Conferir', 'Patrícia Gomes', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p37' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p37', 5, 'Revisar', 'Vitor Andrade', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p37' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p37', 6, 'Aprovar', 'Ana Beatriz', 1, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p37' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p37', 7, 'Entregar', 'Carlos Menezes', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p37' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p38', '00000000-0000-0000-0000-000000000001', 'c18', 'Abertura de Empresa — Ferragens União', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 38, true, 16, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p38', 0, 'Solicitar documentos', 'Lucas Prado', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p38' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p38', 1, 'Receber', 'Camila Nunes', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p38' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p38', 2, 'Validar', 'Eduardo Reis', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p38' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p38', 3, 'Processar', 'Patrícia Gomes', 1, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p38' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p38', 4, 'Conferir', 'Vitor Andrade', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p38' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p38', 5, 'Revisar', 'Ana Beatriz', 3, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p38' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p38', 6, 'Aprovar', 'Carlos Menezes', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p38' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p38', 7, 'Entregar', 'Fernanda Dias', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p38' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p39', '00000000-0000-0000-0000-000000000001', 'c19', 'Obrigações Acessórias — Bistrô Marina', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 100, true, 11, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p39', 0, 'Solicitar documentos', 'Camila Nunes', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p39' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p39', 1, 'Receber', 'Eduardo Reis', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p39' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p39', 2, 'Validar', 'Patrícia Gomes', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p39' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p39', 3, 'Processar', 'Vitor Andrade', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p39' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p39', 4, 'Conferir', 'Ana Beatriz', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p39' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p39', 5, 'Revisar', 'Carlos Menezes', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p39' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p39', 6, 'Aprovar', 'Fernanda Dias', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p39' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p39', 7, 'Entregar', 'João Ferreira', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p39' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p40', '00000000-0000-0000-0000-000000000001', 'c20', 'Onboarding de Cliente — Sertão Energia', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 63, true, 6, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p40', 0, 'Solicitar documentos', 'Eduardo Reis', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p40' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p40', 1, 'Receber', 'Patrícia Gomes', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p40' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p40', 2, 'Validar', 'Vitor Andrade', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p40' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p40', 3, 'Processar', 'Ana Beatriz', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p40' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p40', 4, 'Conferir', 'Carlos Menezes', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p40' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p40', 5, 'Revisar', 'Fernanda Dias', 3, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p40' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p40', 6, 'Aprovar', 'João Ferreira', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p40' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p40', 7, 'Entregar', 'Marina Costa', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p40' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p41', '00000000-0000-0000-0000-000000000001', 'c1', 'Fechamento Mensal — Vetta Alimentos', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 25, false, 1, 9)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p41', 0, 'Solicitar documentos', 'Patrícia Gomes', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p41' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p41', 1, 'Receber', 'Vitor Andrade', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p41' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p41', 2, 'Validar', 'Ana Beatriz', 3, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p41' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p41', 3, 'Processar', 'Carlos Menezes', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p41' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p41', 4, 'Conferir', 'Fernanda Dias', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p41' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p41', 5, 'Revisar', 'João Ferreira', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p41' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p41', 6, 'Aprovar', 'Marina Costa', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p41' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p41', 7, 'Entregar', 'Rodrigo Melo', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p41' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p42', '00000000-0000-0000-0000-000000000001', 'c2', 'Folha de Pagamento — TecnoAlfa Sistemas', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 88, true, 18, 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p42', 0, 'Solicitar documentos', 'Vitor Andrade', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p42' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p42', 1, 'Receber', 'Ana Beatriz', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p42' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p42', 2, 'Validar', 'Carlos Menezes', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p42' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p42', 3, 'Processar', 'Fernanda Dias', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p42' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p42', 4, 'Conferir', 'João Ferreira', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p42' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p42', 5, 'Revisar', 'Marina Costa', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p42' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p42', 6, 'Aprovar', 'Rodrigo Melo', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p42' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p42', 7, 'Entregar', 'Pedro Lima', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p42' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p43', '00000000-0000-0000-0000-000000000001', 'c3', 'Abertura de Empresa — Grupo Prado', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 50, false, 13, 11)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p43', 0, 'Solicitar documentos', 'Ana Beatriz', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p43' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p43', 1, 'Receber', 'Carlos Menezes', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p43' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p43', 2, 'Validar', 'Fernanda Dias', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p43' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p43', 3, 'Processar', 'João Ferreira', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p43' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p43', 4, 'Conferir', 'Marina Costa', 2, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p43' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p43', 5, 'Revisar', 'Rodrigo Melo', 3, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p43' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p43', 6, 'Aprovar', 'Pedro Lima', 1, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p43' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p43', 7, 'Entregar', 'Bianca Souza', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p43' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p44', '00000000-0000-0000-0000-000000000001', 'c4', 'Obrigações Acessórias — Clínica Ventura', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 13, true, 8, 12)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p44', 0, 'Solicitar documentos', 'Carlos Menezes', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p44' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p44', 1, 'Receber', 'Fernanda Dias', 2, 1, 'Atrasada'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p44' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p44', 2, 'Validar', 'João Ferreira', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p44' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p44', 3, 'Processar', 'Marina Costa', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p44' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p44', 4, 'Conferir', 'Rodrigo Melo', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p44' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p44', 5, 'Revisar', 'Pedro Lima', 3, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p44' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p44', 6, 'Aprovar', 'Bianca Souza', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p44' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p44', 7, 'Entregar', 'Tiago Rocha', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p44' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p45', '00000000-0000-0000-0000-000000000001', 'c5', 'Onboarding de Cliente — Construtora Ipê', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 75, false, 3, 13)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p45', 0, 'Solicitar documentos', 'Fernanda Dias', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p45' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p45', 1, 'Receber', 'João Ferreira', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p45' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p45', 2, 'Validar', 'Marina Costa', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p45' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p45', 3, 'Processar', 'Rodrigo Melo', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p45' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p45', 4, 'Conferir', 'Pedro Lima', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p45' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p45', 5, 'Revisar', 'Bianca Souza', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p45' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p45', 6, 'Aprovar', 'Tiago Rocha', 1, 3, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p45' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p45', 7, 'Entregar', 'Maria Souza', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p45' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p46', '00000000-0000-0000-0000-000000000001', 'c6', 'Fechamento Mensal — LogMais Transportes', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 38, true, 6, 14)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p46', 0, 'Solicitar documentos', 'João Ferreira', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p46' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p46', 1, 'Receber', 'Marina Costa', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p46' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p46', 2, 'Validar', 'Rodrigo Melo', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p46' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p46', 3, 'Processar', 'Pedro Lima', 1, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p46' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p46', 4, 'Conferir', 'Bianca Souza', 2, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p46' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p46', 5, 'Revisar', 'Tiago Rocha', 3, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p46' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p46', 6, 'Aprovar', 'Maria Souza', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p46' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p46', 7, 'Entregar', 'Lucas Prado', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p46' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p47', '00000000-0000-0000-0000-000000000001', 'c7', 'Folha de Pagamento — Colégio Horizonte', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Societário'), 100, true, 1, 15)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p47', 0, 'Solicitar documentos', 'Marina Costa', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p47' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p47', 1, 'Receber', 'Rodrigo Melo', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p47' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p47', 2, 'Validar', 'Pedro Lima', 3, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p47' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p47', 3, 'Processar', 'Bianca Souza', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p47' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p47', 4, 'Conferir', 'Tiago Rocha', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p47' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p47', 5, 'Revisar', 'Maria Souza', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p47' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p47', 6, 'Aprovar', 'Lucas Prado', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p47' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p47', 7, 'Entregar', 'Camila Nunes', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p47' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p48', '00000000-0000-0000-0000-000000000001', 'c8', 'Abertura de Empresa — AgroSerra', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Fiscal'), 63, true, 18, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p48', 0, 'Solicitar documentos', 'Rodrigo Melo', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p48' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p48', 1, 'Receber', 'Pedro Lima', 2, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p48' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p48', 2, 'Validar', 'Bianca Souza', 3, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p48' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p48', 3, 'Processar', 'Tiago Rocha', 1, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p48' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p48', 4, 'Conferir', 'Maria Souza', 2, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p48' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p48', 5, 'Revisar', 'Lucas Prado', 3, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p48' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p48', 6, 'Aprovar', 'Camila Nunes', 1, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p48' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p48', 7, 'Entregar', 'Eduardo Reis', 2, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p48' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p49', '00000000-0000-0000-0000-000000000001', 'c9', 'Obrigações Acessórias — Loja Nordeste', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Contábil'), 25, true, 13, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p49', 0, 'Solicitar documentos', 'Pedro Lima', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p49' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p49', 1, 'Receber', 'Bianca Souza', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p49' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p49', 2, 'Validar', 'Tiago Rocha', 3, 3, 'Atrasada'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p49' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p49', 3, 'Processar', 'Maria Souza', 1, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p49' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p49', 4, 'Conferir', 'Lucas Prado', 2, 1, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p49' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p49', 5, 'Revisar', 'Camila Nunes', 3, 2, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p49' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p49', 6, 'Aprovar', 'Eduardo Reis', 1, 3, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p49' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p49', 7, 'Entregar', 'Patrícia Gomes', 2, 4, 'Pendente'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p49' AND position = 7);
INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)
VALUES ('p50', '00000000-0000-0000-0000-000000000001', 'c10', 'Onboarding de Cliente — Duo Consultoria', (SELECT id FROM public.departments WHERE workspace_id = '00000000-0000-0000-0000-000000000001' AND name = 'Pessoal'), 88, false, 8, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p50', 0, 'Solicitar documentos', 'Bianca Souza', 1, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p50' AND position = 0);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p50', 1, 'Receber', 'Tiago Rocha', 2, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p50' AND position = 1);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p50', 2, 'Validar', 'Maria Souza', 3, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p50' AND position = 2);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p50', 3, 'Processar', 'Lucas Prado', 1, 1, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p50' AND position = 3);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p50', 4, 'Conferir', 'Camila Nunes', 2, 2, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p50' AND position = 4);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p50', 5, 'Revisar', 'Eduardo Reis', 3, 3, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p50' AND position = 5);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p50', 6, 'Aprovar', 'Patrícia Gomes', 1, 4, 'Concluída'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p50' AND position = 6);
INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)
SELECT 'p50', 7, 'Entregar', 'Vitor Andrade', 2, 1, 'Em andamento'
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = 'p50' AND position = 7);

-- ============================================================
-- Projetos
-- ============================================================
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj1', '00000000-0000-0000-0000-000000000001', 'c1', 'Reestruturação societária — Vetta Alimentos', 'Em andamento', 97, '2026-11-05')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj2', '00000000-0000-0000-0000-000000000001', 'c3', 'Migração de sistema contábil — Grupo Prado', 'Em aprovação', 98, '2026-10-06')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj3', '00000000-0000-0000-0000-000000000001', 'c5', 'Diagnóstico tributário — Construtora Ipê', 'Concluído', 99, '2026-11-07')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj4', '00000000-0000-0000-0000-000000000001', 'c7', 'Abertura de filial — Colégio Horizonte', 'Planejado', 0, '2026-10-08')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj5', '00000000-0000-0000-0000-000000000001', 'c9', 'Auditoria interna — Loja Nordeste', 'Em andamento', 1, '2026-11-09')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj6', '00000000-0000-0000-0000-000000000001', 'c11', 'Planejamento sucessório — Padaria Estrela', 'Em aprovação', 2, '2026-10-10')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj7', '00000000-0000-0000-0000-000000000001', 'c13', 'Reestruturação societária — Nortek Metais', 'Concluído', 3, '2026-11-11')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj8', '00000000-0000-0000-0000-000000000001', 'c15', 'Migração de sistema contábil — Studio Arq+', 'Planejado', 4, '2026-10-12')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj9', '00000000-0000-0000-0000-000000000001', 'c17', 'Diagnóstico tributário — Vale Digital', 'Em andamento', 5, '2026-11-13')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj10', '00000000-0000-0000-0000-000000000001', 'c19', 'Abertura de filial — Bistrô Marina', 'Em aprovação', 6, '2026-10-14')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj11', '00000000-0000-0000-0000-000000000001', 'c1', 'Auditoria interna — Vetta Alimentos', 'Concluído', 7, '2026-11-15')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)
VALUES ('pj12', '00000000-0000-0000-0000-000000000001', 'c3', 'Planejamento sucessório — Grupo Prado', 'Planejado', 8, '2026-10-16')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Artigos da base de conhecimento
-- ============================================================
INSERT INTO public.knowledge_articles (id, workspace_id, title, category, summary, content)
VALUES ('k1', '00000000-0000-0000-0000-000000000001', 'Como fazemos o fechamento fiscal', 'Processos', 'Passo a passo do dia 1 ao dia 20, com checklist e responsáveis.', '1. Dias 1–5: coleta de documentos (notas fiscais, extratos, folha).
2. Dias 6–10: conferência e conciliação bancária.
3. Dias 11–15: apuração dos impostos e geração de guias.
4. Dias 16–18: revisão cruzada por um segundo analista.
5. Dias 19–20: envio das guias ao cliente e confirmação de pagamento.

Responsável por etapa fica registrado no checklist da obrigação correspondente.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.knowledge_articles (id, workspace_id, title, category, summary, content)
VALUES ('k2', '00000000-0000-0000-0000-000000000001', 'Procedimento de onboarding de cliente', 'Procedimentos', 'Coleta de documentos, migração de dados e reunião de kickoff.', '1. Enviar checklist de documentos iniciais (contrato social, procurações, certificados digitais).
2. Migrar histórico contábil/fiscal do escritório anterior, quando houver.
3. Cadastrar o cliente nos sistemas internos e definir responsável por departamento.
4. Reunião de kickoff para alinhar expectativas, prazos e canais de comunicação.
5. Primeiro fechamento acompanhado de perto para validar o processo.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.knowledge_articles (id, workspace_id, title, category, summary, content)
VALUES ('k3', '00000000-0000-0000-0000-000000000001', 'Política de reajuste de honorários', 'Políticas', 'Gatilhos de reajuste: volume, funcionários, filiais e complexidade.', 'Reajuste é avaliado quando pelo menos um destes gatilhos ocorre nos últimos 6 meses: crescimento de faturamento acima de 15%, aumento de quadro de funcionários, aumento de complexidade operacional (novas filiais, regimes ou serviços) ou defasagem do honorário frente ao custo real de atendimento. A proposta é sempre revisada pelo responsável comercial do cliente antes do envio.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.knowledge_articles (id, workspace_id, title, category, summary, content)
VALUES ('k4', '00000000-0000-0000-0000-000000000001', 'Treinamento: conferência sem retrabalho', 'Treinamentos', 'Erros mais comuns e validações obrigatórias antes da revisão.', 'Erros mais frequentes: lançamento em competência errada, divergência entre extrato e razão, guia gerada com CNPJ ou período incorretos. Antes de enviar para revisão, confirme: (1) saldo bancário bate com o extrato, (2) todas as notas do período foram lançadas, (3) checklist da obrigação está completo.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.knowledge_articles (id, workspace_id, title, category, summary, content)
VALUES ('k5', '00000000-0000-0000-0000-000000000001', 'Perguntas frequentes do cliente', 'FAQ', 'Respostas padrão para dúvidas sobre guias, prazos e documentos.', '"Quando a guia vence?" — Consulte o prazo em Obrigações, sempre visível no Portal do Cliente.
"Por que o valor mudou?" — Varia com o faturamento e as movimentações do período; detalhamento disponível mediante solicitação.
"Como envio documentos?" — Pelo Portal do Cliente, na área "O que precisamos de você".')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.knowledge_articles (id, workspace_id, title, category, summary, content)
VALUES ('k6', '00000000-0000-0000-0000-000000000001', 'Modelo de proposta comercial', 'Modelos', 'Estrutura de escopo, precificação e condições comerciais.', '1. Escopo dos serviços contratados (referenciar o catálogo de serviços).
2. Honorário mensal e forma de reajuste.
3. Prazo de vigência e condições de renovação.
4. Responsabilidades de cada parte (cliente x escritório).
5. Assinatura e data de início.')
ON CONFLICT (id) DO NOTHING;

