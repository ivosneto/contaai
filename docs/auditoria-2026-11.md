# Auditoria ContaAI — Novembro de 2026

Auditoria multidisciplinar do estado real do repositório, conduzida pelas cinco
especialidades do time virtual do ContaAI (`.claude/skills/contaai-*`):
Software Architect, Product Manager, Creative Director, AI Engineer e QA
Engineer. Escopo: leitura de código, migrations, testes e execução de
`tsc`/`eslint`/`bun test` — nenhuma funcionalidade foi alterada para produzir
este relatório. Toda afirmação abaixo tem evidência em arquivo/linha; onde não
foi possível confirmar algo, isso é dito explicitamente em vez de presumido.

---

## 1. Estado atual do produto

O ContaAI está em estágio avançado de um protótipo funcional, não mais um mockup:

- **Núcleo operacional real**: Clientes, Pendências, Obrigações, Comercial/CRM,
  Processos, Tarefas, Projetos, Documentos (com OCR real), Comunicação,
  Conhecimento, Inteligência e Rentabilidade já leem e escrevem dado real via
  Supabase, com uma camada de acesso a dados consistente
  (`src/data/repositories/*.server.ts` + `src/data/server-functions/*.ts`).
- **Segurança de dados é um ponto forte real**: 43/43 tabelas com Row Level
  Security habilitada, isolamento multi-tenant validado por teste automatizado
  contra sessões reais (não apenas por disciplina manual), e nenhum segredo
  (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, etc.) encontrado alcançável
  pelo bundle do cliente.
- **IA generativa (Copilot, OCR, classificação de e-mail) é bem desenhada**:
  isolamento multi-tenant correto, defesa de prompt injection aplicada
  incondicionalmente (não só documentada), e nunca executa ação sem aprovação
  humana.
- **Mas o produto ainda tem fraturas sérias entre "o que parece real" e "o que
  é real"**: o chip de pergunta sugerida mais visível do Copilot responde com
  dado fictício; o onboarding — primeiro contato de qualquer cliente pagante —
  é puramente decorativo apesar do backend já estar pronto para ele; e módulos
  inteiros (Financeiro, parte de Capacidade, condições de Automação) ainda
  rodam sobre `src/data/office.ts` estático.
- **O site comercial e o dark mode do painel** (trabalho desta mesma sessão)
  estão corretos e validados visualmente; a inconsistência visual real está no
  painel interno mais antigo: zero motion design, responsividade desigual, e
  um arquivo monolítico (`accounting-os.tsx`, 4.517 linhas) concentrando 12
  páginas completas.
- **Cobertura de teste é forte em segurança e integração, nula em lógica de
  negócio**: 94 testes passam (todos em `tests/security/`), mas nenhum dos 12+
  motores determinísticos (rentabilidade, health score, capacidade etc. — os
  diferenciais centrais do produto) tem um único teste unitário.

---

## 2. Pontos fortes

| Ponto forte | Evidência |
|---|---|
| RLS com cobertura total e testada de verdade | 43/43 `CREATE TABLE` com `ENABLE ROW LEVEL SECURITY`; `tests/security/tenant-isolation.test.ts` (20 testes) faz login real com usuários de `scripts/seed-identity.ts` e prova isolamento via Postgres RLS, não via filtro de UI |
| Segredos nunca alcançam o cliente | Nenhum componente em `src/components/**/*.tsx` importa estaticamente um módulo `.server.ts`; todo acesso passa por `createServerFn(...).handler()` com `import()` dinâmico interno |
| IA com isolamento e defesa de prompt injection reais | `wrapUntrustedData()` aplicado incondicionalmente a todo `functionResponse` em `gemini-provider.server.ts:101-104`; `tests/security/ai-context-isolation.test.ts` (16 testes) |
| "Nunca inventa" é sustentado em código, não só em marketing | OCR descarta qualquer campo fora de `fieldsFound` (`document-intelligence.ts:54-95`); Copilot responde sempre com `responseSchema` estruturado, nunca texto livre solto |
| Zero marcadores de dívida informal | Nenhum `TODO`/`FIXME`/`HACK` em todo `src/` |
| Design system de componentes consistente | `Badge`/`Kpi`/`Glass`/`PageHeader` (`accounting-os.tsx:244-362`) reusados sem reinvenção nas 11 páginas já extraídas para arquivos próprios |
| Catálogo de integrações com vocabulário honesto | REAL/EM_CONFIGURAÇÃO/DEMO/PLANEJADO em `src/integrations/providers/catalog.ts`, sem alegar disponibilidade que não existe |
| Site comercial e dark mode do painel (desta sessão) | Validados visualmente em Chrome real, logado, em múltiplas telas |

---

## 3. Problemas críticos

Classificados por **impacto** (sempre crítico nesta seção) e **esforço**.

### 3.1 O Copilot real responde perguntas sugeridas com dado fictício
**Esforço: médio.**
`src/components/copilot.tsx:11-24` — os chips de pergunta sugerida ("Como está
o escritório?", "Quais clientes estão dando prejuízo?") são respondidos com
dados estáticos de `@/data/office`, com apenas um disclaimer textual pequeno.
Perguntas digitadas livremente usam o motor real (`runCopilotQuery`). É
exatamente o caminho de menor fricção — o mais provável de ser clicado por um
usuário novo — que mente sobre os dados do escritório, contradizendo a
promessa central do produto ("Copilot que nunca inventa").
**Recomendação**: rotear os chips pelo mesmo `runCopilotQuery` usado em texto
livre, ou removê-los até isso ser feito.

### 3.2 Onboarding é decorativo apesar do backend já estar pronto
**Esforço: baixo** (a parte difícil — schema, RLS, RPC — já existe).
A migration `20260914124352_...sql` já criou `workspaces.onboarding_step`
(0-8), `onboarding_completed_at`, `departments` e `invitations`, com RLS e
policies completas; a RPC `bootstrap_workspace` já cria workspace + profile +
membership + role "owner" + auditoria no cadastro real (`src/data/session.tsx:69-78`).
Mas `OnboardingPage` (dentro de `accounting-os.tsx`, próximo à linha 4096) é
puro `useState` local — nenhum campo é persistido, nenhuma chamada a
`departments`/`invitations`/`onboarding_step` existe, e a rota nem aparece no
menu principal. Um escritório real que se cadastra cai num workspace
completamente vazio sem nenhum fluxo guiado para popular cliente ou equipe.
**Recomendação**: religar o wizard ao schema existente e adicioná-lo ao menu;
depois, complementar com um caminho real de trazer o primeiro dado (import de
clientes, convite de equipe) — sem isso, mesmo um onboarding "religado" ainda
abriria num vazio.

### 3.3 Diferenciais centrais do produto sem nenhum teste de lógica
**Esforço: baixo-médio por motor.**
Nenhum dos motores determinísticos (`profitability-engine.ts`,
`health-score-engine.ts`, `capacity-engine.ts`, `revenue-intelligence-engine.ts`
e outros 8) tem um teste unitário dedicado — toda a suíte (94 testes) é
integração/segurança contra Supabase real, em `tests/security/`. Rentabilidade
real e Health Score são citados nesta mesma sessão como os diferenciais
centrais da camada de "Excelência" do produto; hoje, um erro de sinal ou de
fórmula num deles não quebraria nenhum teste existente.
**Recomendação**: cobrir pelo menos os 4 motores citados acima com casos de
borda (zero clientes/horas, margem negativa, honorário zero, divisão por
zero).

### 3.4 Aba Financeiro do Portal do Cliente usa dado estático
**Esforço: médio-alto** (depende de mapear repositórios já existentes no
schema, não criar do zero).
`src/components/client-portal.tsx:48-53` (`~linha 65` na leitura mais recente)
importa `accountsPaid`, `accountsReceivable`, `brl`, `meetings` estáticos de
`@/data/office` para a tela que um **cliente externo do escritório** acessa.
O próprio código documenta que os ids nunca colidem entre tenants (não há
vazamento cross-tenant), mas num piloto real isso significa mostrar a um
cliente verdadeiro números financeiros que não são os dele.
**Recomendação**: mapear para os repositórios reais de contas/transações já
existentes no schema (tabelas já têm RLS).

---

## 4. Problemas importantes

| # | Problema | Evidência | Esforço |
|---|---|---|---|
| 1 | `accounting-os.tsx` com 4.517 linhas concentra 12 páginas completas (Dashboard, ClientsPage, Customer360, ProfitabilityPage, CommercialPage, ProcessesPage, TasksPage, KnowledgePage, OnboardingPage, AlertsPage, ProjectsPage, ReportsPage), inconsistente com as 11 páginas já extraídas para arquivo próprio | `accounting-os.tsx:780-4490` | Médio (mecânico, por página) |
| 2 | Reincidência do bug de `clientById` estático em tela não coberta na correção anterior desta sessão | `integrations-page.tsx:17` | Baixo |
| 3 | Financeiro quase 100% estático; Capacidade usa `employees`/`timeEntries` fictícios por trás de tarefas reais; condições de Automação dependem de `clients`/`churnRisks` com ids que nunca existirão num workspace real (gatilho configurado pelo usuário pode nunca disparar, silenciosamente) | `financial-page.tsx`; `capacity-page.tsx:7,38`; `automation-page.tsx:39-48` | Médio-alto |
| 4 | Bootstrap do Portal do Cliente expõe fee/cost/health ao navegador confiando na UI para não renderizar, em vez de filtrar no servidor | `context-builder.server.ts:48-51` (comentário do próprio código confirma) | Médio |
| 5 | Sem rate limiting próprio sobre endpoints de IA; `estimatedCostUsd` nunca calculado (sempre `null`) apesar do schema já suportar | `copilot.ts:200`, `document-intelligence.ts:272`, `email-integration.ts:411` | Baixo-médio |
| 6 | Sidebar de navegação com 17 itens sofre overflow/scroll em alturas de notebook comuns | `accounting-os.tsx:178-206,364-377` | Médio |
| 7 | Responsividade desigual: `copilot.tsx` com zero classes `sm:/md:/lg:`; média geral do painel interno muito abaixo do site comercial | grep de classes responsivas por arquivo | Médio-alto |
| 8 | Zero cobertura de teste (RLS ou unitária) para Processos, Projetos, Departamentos, Comunicados internos, Base de conhecimento, Auditoria | grep em `tests/security/*.test.ts` | Médio |
| 9 | Sem teste negativo de permissão manager-vs-owner (só há teste positivo do que manager pode fazer) | `tenant-isolation.test.ts` | Baixo |
| 10 | Zero infraestrutura de teste de frontend/E2E (sem RTL, Playwright, Cypress ou axe) | `package.json` | Alto (pra introduzir) |
| 11 | Sem retry no provider Gemini (cai direto pro fallback em timeout), inconsistente com o padrão de retry já usado no conector fiscal | `gemini-provider.server.ts` vs. `src/lib/fiscal/http-client.server.ts` | Baixo |

---

## 5. Melhorias recomendadas

- Remover ou documentar como scaffold intencional os dois primitivos shadcn
  não utilizados em lugar nenhum do projeto: `src/components/ui/chart.tsx` e
  `src/components/ui/sidebar.tsx`.
- Remover os dois fallbacks hexadecimais redundantes em
  `accounting-os.tsx:3702,3709` (`var(--color-bad,#e5484d)` etc.) — a variável
  sempre existe, o fallback nunca dispara e é ruído estilístico.
- Promover `AnimatedNumber`/`Reveal` (hoje em `marketing/motion-primitives.tsx`)
  para um local compartilhado e reusá-los nos KPIs do Dashboard/Rentabilidade —
  nenhuma lib nova necessária, só reaproveitamento do que já existe.
- Adicionar cache curto (2-5 min) para perguntas repetidas ao Copilot.
- Semear o Simulador a partir do estado real do escritório em vez de
  `simulatorBaseline` fixo, mantendo o disclaimer de que é hipotético.
- Estender o vocabulário REAL/EM_CONFIGURAÇÃO/DEMO/PLANEJADO (hoje só usado
  para integrações externas) também para os módulos internos ainda
  parcialmente estáticos, para sinalizar isso na própria UI.

---

## 6. Funcionalidades incompletas

| Módulo | Estado | Observação |
|---|---|---|
| Onboarding | Decorativo | Backend pronto, wizard não persiste nada (ver §3.2) |
| Financeiro | ~100% estático | Único hook real usado é `createPendency`/`confirmAction` |
| Pessoas/Capacidade | Híbrido | Tarefas reais, mas equipe/horas fictícias |
| Automação | Híbrido quebrado | Gatilhos sobre cliente/churn nunca casam num workspace real |
| Portal do Cliente — aba Financeiro | Estático | Ver §3.4 |
| Copilot — chips sugeridos | Estático | Ver §3.1 |
| `integrations-page.tsx` | Estático (reincidência) | Ver §4, item 2 |
| Benchmarking, Simulador | Estático, mas **honestamente sinalizado** (disclaimer visível) | Aceitável por natureza — Benchmarking precisaria de massa agregada multi-tenant pra ser real |
| Relatórios | Badge "Em construção" explícito | Sem risco — já é honesto |

---

## 7. Oportunidades de IA

**Já corretas, não mexer:**
- RAG/embeddings deliberadamente ausentes — escolha certa dado o volume de
  dado por workspace (cabe estruturado no prompt via tool calling).
- Tool calling bem desenhado: 9 ferramentas somente leitura, gate de papel em
  código (não só no prompt), `MAX_TOOL_ROUNDS = 4`, `default: throw` contra
  ferramenta desconhecida.
- Defesa de prompt injection e isolamento multi-tenant já corretos por
  construção (ver §2).

**Oportunidades reais:**
1. Calcular `estimatedCostUsd` de verdade (tokens já são capturados — função
   pura de preço × tokens).
2. Rate limiting simples por `userId`/`workspaceId` antes de chamar o
   provider.
3. Cache curto de perguntas repetidas.
4. Retry no provider Gemini, no mesmo padrão já usado pelo conector fiscal.
5. Rotear os chips sugeridos do Copilot pelo motor real (ver §3.1 — é tanto
   uma oportunidade de IA quanto um problema crítico de confiança).

---

## 8. Oportunidades visuais

1. Extrair as 12 páginas ainda dentro de `accounting-os.tsx` para arquivos
   próprios, seguindo o padrão já aplicado às outras 11.
2. Resolver o overflow/scroll da sidebar (17 itens) em alturas de notebook
   comuns — agrupar/colapsar seções ou fixar os itens mais usados no topo.
3. Tratar responsividade de forma sistemática no painel interno (hoje muito
   abaixo do nível já alcançado no site comercial).
4. Trazer motion design pontual (números animados, reveal) para o painel
   interno, hoje 100% estático — usando os primitivos que já existem no
   projeto, sem nova dependência.
5. Limpar o código morto de UI (`ui/chart.tsx`, `ui/sidebar.tsx`) ou
   documentar a intenção de mantê-los como scaffold futuro.

---

## 9. Riscos de segurança

| Risco | Severidade real | Observação |
|---|---|---|
| RLS/isolamento multi-tenant | **Sem risco encontrado** | Cobertura total e testada automaticamente (ver §2) |
| Vazamento de segredo pro bundle do cliente | **Sem risco encontrado** | Arquitetura consistente, zero exceção |
| Bootstrap do Portal do Cliente expõe campos sensíveis (fee/cost/health) confiando só na UI | **Real, mas contido** | Não é vazamento cross-tenant; é uma superfície exposta via DevTools/Network que deveria ser filtrada no servidor, não só escondida na tela |
| Ausência de teste negativo de permissão manager-vs-owner | **Risco não confirmado, mas não descartado** | Se existir alguma ação "só owner" no negócio, hoje não há teste provando que manager não consegue fazê-la |
| Custo de IA sem rate limiting | **Risco de abuso/custo, não de dado** | Usuário autenticado pode chamar endpoints de IA repetidamente sem limite próprio do ContaAI |
| Prompt injection via e-mail/documento ingerido | **Mitigado** | `wrapUntrustedData` aplicado incondicionalmente, validado por teste dedicado |

---

## 10. Roadmap priorizado

| Prioridade | Ação | Impacto | Esforço |
|---|---|---|---|
| 1 | Rotear os chips sugeridos do Copilot pelo motor real | Crítico | Médio |
| 2 | Religar o Onboarding ao schema já existente + adicionar ao menu | Crítico | Baixo |
| 3 | Dar ao primeiro dia um caminho real de popular dado (import de clientes/convite de equipe) | Crítico | Médio |
| 4 | Testes unitários dos 4 motores centrais (rentabilidade, health score, capacidade, revenue intelligence) | Crítico | Baixo-médio |
| 5 | Corrigir aba Financeiro do Portal do Cliente + revisar filtragem server-side do bootstrap | Crítico/Importante | Médio-alto |
| 6 | Corrigir `clientById` estático em `integrations-page.tsx` | Importante | Baixo |
| 7 | Migrar Financeiro e a base de Capacidade para dado real; corrigir/desativar condições de Automação quebradas | Importante | Médio-alto |
| 8 | Extrair as 12 páginas de `accounting-os.tsx` para arquivos próprios | Importante | Médio |
| 9 | Calcular custo real de IA + rate limiting básico | Importante | Baixo-médio |
| 10 | Cobrir com teste os módulos sem nenhuma cobertura (Processos, Projetos, Departamentos, Comunicados, Conhecimento, Auditoria) + teste negativo de permissão | Importante | Médio |

---

## As dez ações mais importantes para evoluir o ContaAI agora

1. **Parar o Copilot de mentir no caminho de menor fricção** — rotear os chips
   sugeridos pelo motor real (`runCopilotQuery`), não pelo array estático.
2. **Religar o Onboarding ao schema que já existe** — a parte cara (RLS, RPC,
   tabelas) já está pronta; falta só o wizard escrever nela.
3. **Dar ao primeiro dia um caminho real de trazer dado** — sem isso, mesmo um
   onboarding corrigido abre num workspace vazio.
4. **Testar os motores que são o diferencial do produto** — rentabilidade e
   health score não têm hoje nenhuma rede de segurança contra um erro de
   fórmula.
5. **Corrigir a aba Financeiro do Portal do Cliente** — é a tela que um
   cliente externo de verdade vê.
6. **Fechar a reincidência do `clientById` estático** em `integrations-page.tsx`
   — mesmo fix já aplicado 3x nesta sessão, só não propagado ali.
7. **Migrar Financeiro e Capacidade para dado real**, e desativar as condições
   de Automação que hoje dependem de ids que nunca existirão num workspace
   real (gatilho configurado pelo usuário, quebrado em silêncio).
8. **Extrair as páginas de `accounting-os.tsx`** para o mesmo padrão já usado
   nas outras 11 — reduz blast radius de qualquer mudança futura.
9. **Dar visibilidade real ao custo de IA** (calcular `estimatedCostUsd`) e
   colocar um limite básico de uso por usuário/workspace.
10. **Fechar os buracos de cobertura de teste** nos módulos e permissões ainda
    sem nenhuma verificação automatizada.
