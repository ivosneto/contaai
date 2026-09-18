-- Gerado por scripts/generate-documents-seed.ts a partir de src/data/office.ts — não editar manualmente, regenerar o script.
-- Idempotente (ON CONFLICT DO NOTHING).

INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc1', '00000000-0000-0000-0000-000000000001', 'c1', 'Guia de imposto — Vetta Alimentos', 'Guia de imposto', 'Fiscal', '2026-08', 'João Ferreira', 'Recebido', 'Recebido', '2026-09-01', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc2', '00000000-0000-0000-0000-000000000001', 'c2', 'Extrato bancário — TecnoAlfa Sistemas', 'Extrato bancário', 'Financeiro', '2026-09', 'Marina Costa', 'Aprovado', 'Concluído', '2026-09-02', '{"tipoDetectado":"Extrato bancário","cnpj":"11.307.103/0001-11","competencia":"2026-09","valor":2770,"vencimento":null,"numero":"68598","categoria":"Financeiro","confidence":98}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc3', '00000000-0000-0000-0000-000000000001', 'c3', 'Nota fiscal — Grupo Prado', 'Nota fiscal', 'Fiscal', '2026-08', 'Rodrigo Melo', 'Recebido', 'Recebido', '2026-09-03', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc4', '00000000-0000-0000-0000-000000000001', 'c4', 'Contrato social — Clínica Ventura', 'Contrato social', 'Interna', '2026-09', 'Pedro Lima', 'Aprovado', 'Concluído', '2026-09-04', '{"tipoDetectado":"Contrato social","cnpj":"13.321.109/0001-13","competencia":"2026-09","valor":null,"vencimento":null,"numero":"87200","categoria":"Interna","confidence":80}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc5', '00000000-0000-0000-0000-000000000001', 'c5', 'Guia de imposto — Construtora Ipê', 'Guia de imposto', 'Fiscal', '2026-08', 'Bianca Souza', 'Recebido', 'Recebido', '2026-09-05', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc6', '00000000-0000-0000-0000-000000000001', 'c6', 'Relatório gerencial — LogMais Transportes', 'Relatório gerencial', 'Contábil', '2026-08', 'Tiago Rocha', 'Aprovado', 'Concluído', '2026-09-06', '{"tipoDetectado":"Relatório gerencial","cnpj":"15.335.115/0001-15","competencia":"2026-08","valor":null,"vencimento":null,"numero":"15803","categoria":"Contábil","confidence":82}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc7', '00000000-0000-0000-0000-000000000001', 'c7', 'Nota fiscal — Colégio Horizonte', 'Nota fiscal', 'Fiscal', '2026-09', 'Maria Souza', 'Recebido', 'Recebido', '2026-09-07', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc8', '00000000-0000-0000-0000-000000000001', 'c8', 'Extrato bancário — AgroSerra', 'Extrato bancário', 'Financeiro', '2026-09', 'Lucas Prado', 'Aprovado', 'Concluído', '2026-09-08', '{"tipoDetectado":"Extrato bancário","cnpj":"17.349.121/0001-17","competencia":"2026-09","valor":560,"vencimento":null,"numero":"34405","categoria":"Financeiro","confidence":84}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc9', '00000000-0000-0000-0000-000000000001', 'c9', 'Guia de imposto — Loja Nordeste', 'Guia de imposto', 'Fiscal', '2026-08', 'Camila Nunes', 'Recebido', 'Recebido', '2026-09-09', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc10', '00000000-0000-0000-0000-000000000001', 'c10', 'Contrato social — Duo Consultoria', 'Contrato social', 'Interna', '2026-09', 'Eduardo Reis', 'Aprovado', 'Concluído', '2026-09-10', '{"tipoDetectado":"Contrato social","cnpj":"19.363.127/0001-19","competencia":"2026-09","valor":null,"vencimento":null,"numero":"53007","categoria":"Interna","confidence":86}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc11', '00000000-0000-0000-0000-000000000001', 'c11', 'Nota fiscal — Padaria Estrela', 'Nota fiscal', 'Fiscal', '2026-08', 'Patrícia Gomes', 'Recebido', 'Recebido', '2026-09-11', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc12', '00000000-0000-0000-0000-000000000001', 'c12', 'Relatório gerencial — MedPrime Saúde', 'Relatório gerencial', 'Contábil', '2026-09', 'Vitor Andrade', 'Aprovado', 'Concluído', '2026-09-12', '{"tipoDetectado":"Relatório gerencial","cnpj":"21.377.133/0001-21","competencia":"2026-09","valor":null,"vencimento":null,"numero":"71609","categoria":"Contábil","confidence":88}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc13', '00000000-0000-0000-0000-000000000001', 'c13', 'Guia de imposto — Nortek Metais', 'Guia de imposto', 'Fiscal', '2026-08', 'Ana Beatriz', 'Recebido', 'Recebido', '2026-09-13', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc14', '00000000-0000-0000-0000-000000000001', 'c14', 'Extrato bancário — Casa Bahia Verde', 'Extrato bancário', 'Financeiro', '2026-09', 'Carlos Menezes', 'Aprovado', 'Concluído', '2026-09-14', '{"tipoDetectado":"Extrato bancário","cnpj":"23.391.139/0001-23","competencia":"2026-09","valor":950,"vencimento":null,"numero":"90211","categoria":"Financeiro","confidence":90}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc15', '00000000-0000-0000-0000-000000000001', 'c15', 'Folha de ponto — Studio Arq+', 'Folha de ponto', 'Folha', '2026-09', 'Fernanda Dias', 'Recebido', 'Recebido', '2026-09-15', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc16', '00000000-0000-0000-0000-000000000001', 'c16', 'Contrato social — Rede Farmalife', 'Contrato social', 'Interna', '2026-08', 'João Ferreira', 'Aprovado', 'Concluído', '2026-09-16', '{"tipoDetectado":"Contrato social","cnpj":"25.405.145/0001-25","competencia":"2026-08","valor":null,"vencimento":null,"numero":"18814","categoria":"Interna","confidence":92}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc17', '00000000-0000-0000-0000-000000000001', 'c17', 'Guia de imposto — Vale Digital', 'Guia de imposto', 'Fiscal', '2026-08', 'Marina Costa', 'Recebido', 'Recebido', '2026-09-17', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc18', '00000000-0000-0000-0000-000000000001', 'c18', 'Relatório gerencial — Ferragens União', 'Relatório gerencial', 'Contábil', '2026-09', 'Rodrigo Melo', 'Rejeitado', 'Concluído', '2026-09-18', '{"tipoDetectado":"Relatório gerencial","cnpj":"27.419.151/0001-90","competencia":"2026-09","valor":null,"vencimento":null,"numero":"37416","categoria":"Contábil","confidence":64}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc19', '00000000-0000-0000-0000-000000000001', 'c19', 'Nota fiscal — Bistrô Marina', 'Nota fiscal', 'Fiscal', '2026-08', 'Pedro Lima', 'Recebido', 'Recebido', '2026-09-19', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc20', '00000000-0000-0000-0000-000000000001', 'c20', 'Extrato bancário — Sertão Energia', 'Extrato bancário', 'Financeiro', '2026-09', 'Bianca Souza', 'Aprovado', 'Concluído', '2026-09-20', '{"tipoDetectado":"Extrato bancário","cnpj":"29.433.157/0001-29","competencia":"2026-09","valor":1340,"vencimento":null,"numero":"56018","categoria":"Financeiro","confidence":96}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc21', '00000000-0000-0000-0000-000000000001', 'c1', 'Guia de imposto — Vetta Alimentos', 'Guia de imposto', 'Fiscal', '2026-08', 'Tiago Rocha', 'Recebido', 'Recebido', '2026-09-21', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc22', '00000000-0000-0000-0000-000000000001', 'c2', 'Contrato social — TecnoAlfa Sistemas', 'Contrato social', 'Interna', '2026-09', 'Maria Souza', 'Aprovado', 'Concluído', '2026-09-22', '{"tipoDetectado":"Contrato social","cnpj":"11.307.103/0001-11","competencia":"2026-09","valor":null,"vencimento":null,"numero":"21338","categoria":"Interna","confidence":98}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc23', '00000000-0000-0000-0000-000000000001', 'c3', 'Guia de imposto — Grupo Prado', 'Guia de imposto', 'Fiscal', '2026-09', 'Lucas Prado', 'Recebido', 'Recebido', '2026-09-23', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc24', '00000000-0000-0000-0000-000000000001', 'c4', 'Relatório gerencial — Clínica Ventura', 'Relatório gerencial', 'Contábil', '2026-09', 'Camila Nunes', 'Aprovado', 'Concluído', '2026-09-24', '{"tipoDetectado":"Relatório gerencial","cnpj":"13.321.109/0001-13","competencia":"2026-09","valor":null,"vencimento":null,"numero":"39940","categoria":"Contábil","confidence":80}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc25', '00000000-0000-0000-0000-000000000001', 'c5', 'Guia de imposto — Construtora Ipê', 'Guia de imposto', 'Fiscal', '2026-08', 'Eduardo Reis', 'Recebido', 'Recebido', '2026-09-25', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc26', '00000000-0000-0000-0000-000000000001', 'c6', 'Extrato bancário — LogMais Transportes', 'Extrato bancário', 'Financeiro', '2026-08', 'Patrícia Gomes', 'Aprovado', 'Concluído', '2026-09-26', '{"tipoDetectado":"Extrato bancário","cnpj":"15.335.115/0001-15","competencia":"2026-08","valor":1730,"vencimento":null,"numero":"58542","categoria":"Financeiro","confidence":82}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc27', '00000000-0000-0000-0000-000000000001', 'c7', 'Nota fiscal — Colégio Horizonte', 'Nota fiscal', 'Fiscal', '2026-08', 'Vitor Andrade', 'Recebido', 'Recebido', '2026-09-27', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)
VALUES ('doc28', '00000000-0000-0000-0000-000000000001', 'c8', 'Contrato social — AgroSerra', 'Contrato social', 'Interna', '2026-09', 'Ana Beatriz', 'Aprovado', 'Concluído', '2026-09-28', '{"tipoDetectado":"Contrato social","cnpj":"17.349.121/0001-17","competencia":"2026-09","valor":null,"vencimento":null,"numero":"77144","categoria":"Interna","confidence":84}'::jsonb, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- linked_obligation_id fica NULL na inserção (evita depender de ordem entre documents/obligations); resolvido aqui pra cada documento processado.

-- Evidência anexada de volta na obrigação (mesma mutação que office.ts faz em memória).

