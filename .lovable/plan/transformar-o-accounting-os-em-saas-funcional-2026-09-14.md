# Transformar o Accounting OS em SaaS funcional

## Objetivo imediato
Entregar primeiro uma fundação segura e utilizável, sem reconstruir a interface atual: contas reais, escritório isolado, perfis completos, permissões e dados persistentes. Depois, substituir os mocks módulo a módulo, mantendo o produto navegável durante toda a evolução.

## Diagnóstico atual
- A interface existente já cobre dashboard, clientes, Customer 360, CRM, processos, tarefas, pessoas, financeiro, inteligência, automação, portal e demais módulos.
- O visual e os componentes atuais serão preservados e reutilizados.
- Hoje, o conteúdo principal vem de dados estáticos e várias ações apenas exibem feedback visual; as páginas ainda são renderizadas por um único shell.
- A base em nuvem foi conectada e está vazia, portanto não há dados legados a migrar.
- O projeto já possui o suporte necessário para sessão autenticada em chamadas protegidas.

## Etapa 1 — Fundação segura
- Ativar login por e-mail/senha e Google, com cadastro, confirmação de e-mail, recuperação de senha e logout.
- Criar perfis com nome, avatar, cargo, função, departamentos e preferências.
- Criar workspaces, membros e papéis separados (`OWNER`, `ADMIN`, `MANAGER`, `EMPLOYEE`, `CLIENT`).
- Implementar o fluxo atômico de cadastro: criar conta → criar escritório → tornar o usuário owner → abrir onboarding.
- Proteger as páginas internas; manter autenticação, recuperação e callbacks como páginas públicas.
- Aplicar isolamento por workspace e permissões no banco, não apenas na interface.
- Registrar alterações sensíveis em auditoria.

## Etapa 2 — Núcleo operacional persistente
- Implementar clientes, contatos, serviços, tags, notas, eventos e Health Score com histórico.
- Implementar funcionários, departamentos e capacidade.
- Implementar tarefas, checklists, comentários e apontamentos de horas.
- Implementar templates e instâncias de processos com etapas, responsáveis, SLA e dependências.
- Conectar dashboard, busca global e Customer 360 a consultas reais, com paginação, filtros e estados de carregamento/erro/vazio.
- Trocar cada ação visual por formulário validado e operação persistente, com atualização imediata e feedback.

## Etapa 3 — Receita e onboarding
- Implementar leads, pipeline, oportunidades e movimentação persistente no Kanban.
- Implementar propostas e contratos preparados para PDF/assinatura futura.
- Criar onboarding automaticamente ao fechar uma oportunidade, usando template configurável.

## Etapa 4 — Gestão econômica
- Implementar projetos, membros, horas, capacidade e produtividade.
- Implementar contas, faturas e pagamentos.
- Calcular rentabilidade por cliente e alimentar alertas e dashboards com os mesmos dados.
- Implementar Pricing Engine com simulações salvas.

## Etapa 5 — Inteligência e ação
- Gerar alertas e insights por regras determinísticas a partir de tarefas, margem, capacidade, inadimplência e Health Score.
- Tornar KPIs e gráficos totalmente derivados do banco e navegáveis até seus registros.
- Conectar o Copilot somente aos dados autorizados do workspace; responder claramente quando não houver evidência suficiente.
- Persistir conversas, mensagens, insights e ações; exigir confirmação para ações críticas.

## Etapa 6 — Portal, documentos e evolução
- Criar acesso `CLIENT` limitado ao próprio cliente e ao portal simplificado.
- Implementar pastas, solicitações e upload privado de documentos com regras por workspace/cliente.
- Implementar notificações persistentes e atualizações em tempo real onde agregarem valor.
- Adicionar Benchmarking seguro, Digital Twin e Revenue Intelligence.
- Criar adaptadores marcados como “Não conectado” para integrações externas, sem simular conexão.

## Dados demonstrativos
- Criar seed relacional por workspace com 20 clientes, 15 funcionários, 30 oportunidades, 50 processos, 100 tarefas, 30 documentos, 20 alertas, 10 projetos, 20 faturas e 20 pagamentos.
- Manter o seed opcional para novos escritórios; nunca inserir dados demonstrativos em escritórios reais sem escolha explícita.

## Validação de cada entrega
- Validar acesso entre papéis e tentativa de acesso cruzado entre workspaces.
- Confirmar persistência após recarregar a página.
- Testar fluxos completos no navegador em desktop e mobile.
- Rodar verificação de segurança do banco, tipos e testes focados.
- Uma funcionalidade só será marcada como concluída com interface, validação, persistência, relacionamento, feedback e autorização.

## Detalhes técnicos
- Banco relacional com chaves estrangeiras, índices por `workspace_id`, status, responsável e datas consultadas.
- Papéis em tabela separada de perfis e verificações por funções seguras para evitar recursão nas regras de acesso.
- Operações privadas por funções de servidor autenticadas; consultas do usuário respeitam as regras do banco.
- Eventos e auditoria serão gerados junto das mutações importantes para alimentar Customer 360 e memória empresarial.
- Arquivos ficarão em área privada com caminhos contendo workspace e cliente; links serão temporários e autorizados.
