export type Department =
  | "Fiscal"
  | "Contábil"
  | "Pessoal"
  | "Societário"
  | "Financeiro"
  | "Comercial";

export type ServiceName =
  | "Contábil"
  | "Fiscal"
  | "Pessoal"
  | "BPO"
  | "Societário"
  | "Consultoria";

export type ClientStatus =
  | "Ativo"
  | "Em onboarding"
  | "Em risco"
  | "Inadimplente"
  | "Sem atividade";

export type Client = {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  regime: "Simples Nacional" | "Lucro Presumido" | "Lucro Real" | "MEI";
  revenue: number; // faturamento anual do cliente
  headcount: number;
  services: ServiceName[];
  fee: number; // honorário mensal
  cost: number; // custo mensal de atendimento
  owner: string;
  department: Department;
  nps: number | null;
  health: number;
  status: ClientStatus;
  since: string;
  overdue: number; // honorários vencidos
  hoursMonth: number;
  complaints30d: number;
  lateTasks: number;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  department: Department;
  manager: string;
  capacity: number; // horas/mês
  allocated: number;
  productivity: number; // %
  sla: number; // %
  rework: number; // %
};

export type Opportunity = {
  id: string;
  company: string;
  contact: string;
  seller: string;
  source: string;
  services: ServiceName[];
  mrr: number;
  setup: number;
  probability: number;
  stage:
    | "Lead"
    | "Diagnóstico"
    | "Proposta"
    | "Negociação"
    | "Fechado"
    | "Perdido"
    | "Onboarding";
  expectedAt: string;
  competitor?: string;
  lossReason?: string;
};

export type Task = {
  id: string;
  title: string;
  clientId: string;
  assignee: string;
  department: Department;
  due: string;
  status: "A fazer" | "Em andamento" | "Em revisão" | "Concluída";
  priority: "Baixa" | "Média" | "Alta" | "Crítica";
  late: boolean;
  hours: number;
};

export type ProcessStep = {
  name: string;
  owner: string;
  slaDays: number;
  avgDays: number;
  status: "Concluída" | "Em andamento" | "Pendente" | "Atrasada";
};

export type Process = {
  id: string;
  name: string;
  clientId: string;
  department: Department;
  progress: number;
  slaOk: boolean;
  rework: number;
  cycleDays: number;
  steps: ProcessStep[];
};

export type TimelineEvent = {
  id: string;
  clientId: string;
  date: string;
  type:
    | "mensagem"
    | "reunião"
    | "tarefa"
    | "documento"
    | "solicitação"
    | "pagamento"
    | "reclamação"
    | "oportunidade"
    | "contrato";
  title: string;
  detail: string;
};

export type Alert = {
  id: string;
  level: "Crítico" | "Atenção" | "Informação" | "Oportunidade";
  title: string;
  detail: string;
  clientId?: string;
  link: string;
  actions: string[];
};

export type Insight = {
  id: string;
  kind: "Problema" | "Oportunidade" | "Previsão";
  title: string;
  impact: string;
  cause: string;
  recommendation: string;
  link: string;
  actions: string[];
};

const segments = [
  "Comércio varejista",
  "Indústria alimentícia",
  "Tecnologia / SaaS",
  "Serviços médicos",
  "Construção civil",
  "Logística",
  "Educação",
  "Agronegócio",
  "E-commerce",
  "Consultoria",
];

const names = [
  "Vetta Alimentos",
  "TecnoAlfa Sistemas",
  "Grupo Prado",
  "Clínica Ventura",
  "Construtora Ipê",
  "LogMais Transportes",
  "Colégio Horizonte",
  "AgroSerra",
  "Loja Nordeste",
  "Duo Consultoria",
  "Padaria Estrela",
  "MedPrime Saúde",
  "Nortek Metais",
  "Casa Bahia Verde",
  "Studio Arq+",
  "Rede Farmalife",
  "Vale Digital",
  "Ferragens União",
  "Bistrô Marina",
  "Sertão Energia",
];

const owners = [
  "Ana Beatriz",
  "Carlos Menezes",
  "Fernanda Dias",
  "Rafael Torres",
  "Juliana Alves",
];

const allServices: ServiceName[] = [
  "Contábil",
  "Fiscal",
  "Pessoal",
  "BPO",
  "Societário",
  "Consultoria",
];

function at<T>(arr: readonly T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length] as T;
}

function seeded(i: number, mod: number) {
  return ((i * 9301 + 49297) % 233280) % mod;
}

export const clients: Client[] = names.map((name, i) => {
  const regimes = [
    "Simples Nacional",
    "Lucro Presumido",
    "Lucro Real",
    "MEI",
  ] as const;
  const services = allServices.filter(
    (_, s) => (seeded(i + s * 3, 10) > 3 && s < 4) || s === 0,
  );
  const fee = 900 + seeded(i, 9) * 420;
  const costRatio = at([0.42, 0.55, 0.68, 0.81, 1.12], seeded(i, 5));
  const cost = Math.round(fee * costRatio);
  const overdue = seeded(i, 7) > 4 ? 1200 + seeded(i, 6) * 900 : 0;
  const complaints30d = seeded(i, 9) > 6 ? seeded(i, 3) + 1 : 0;
  const lateTasks = seeded(i, 11) > 6 ? seeded(i, 5) : 0;
  const nps = seeded(i, 11) > 8 ? null : 4 + seeded(i, 7);
  const health = Math.max(
    28,
    Math.min(
      98,
      92 -
        complaints30d * 9 -
        lateTasks * 3 -
        (overdue > 0 ? 12 : 0) -
        (cost > fee ? 14 : 0) +
        (nps && nps >= 9 ? 6 : 0),
    ),
  );
  const status: ClientStatus =
    i === 3
      ? "Em onboarding"
      : health < 55
        ? "Em risco"
        : overdue > 0
          ? "Inadimplente"
          : seeded(i, 17) === 0
            ? "Sem atividade"
            : "Ativo";

  return {
    id: `c${i + 1}`,
    name,
    cnpj: `${10 + i}.${300 + i * 7}.${100 + i * 3}/0001-${10 + (i % 80)}`,
    segment: at(segments, i),
    regime: at(regimes, seeded(i, 4)),
    revenue: (600 + seeded(i, 60) * 220) * 1000,
    headcount: 3 + seeded(i, 70),
    services,
    fee,
    cost,
    owner: at(owners, i),
    department: at(["Fiscal", "Contábil", "Pessoal", "Societário"] as const, seeded(i, 4)),
    nps,
    health,
    status,
    since: `${2015 + seeded(i, 9)}-0${1 + seeded(i, 8)}-1${seeded(i, 9)}`,
    overdue,
    hoursMonth: 6 + seeded(i, 30),
    complaints30d,
    lateTasks,
  };
});

export const employees: Employee[] = [
  ["João Ferreira", "Analista Fiscal Sênior", "Fiscal", 168, 198],
  ["Marina Costa", "Analista Fiscal", "Fiscal", 168, 172],
  ["Rodrigo Melo", "Assistente Fiscal", "Fiscal", 168, 151],
  ["Pedro Lima", "Contador", "Contábil", 168, 153],
  ["Bianca Souza", "Analista Contábil", "Contábil", 168, 139],
  ["Tiago Rocha", "Assistente Contábil", "Contábil", 168, 118],
  ["Maria Souza", "Analista de DP", "Pessoal", 168, 124],
  ["Lucas Prado", "Assistente de DP", "Pessoal", 168, 101],
  ["Camila Nunes", "Coordenadora de DP", "Pessoal", 168, 147],
  ["Eduardo Reis", "Analista Societário", "Societário", 168, 96],
  ["Patrícia Gomes", "Analista Financeiro", "Financeiro", 168, 133],
  ["Vitor Andrade", "Assistente Financeiro", "Financeiro", 168, 88],
  ["Ana Beatriz", "Executiva Comercial", "Comercial", 168, 142],
  ["Carlos Menezes", "Executivo Comercial", "Comercial", 168, 129],
  ["Fernanda Dias", "Gerente de Contas", "Comercial", 168, 160],
].map(([name, role, department, capacity, allocated], i) => ({
  id: `e${i + 1}`,
  name: name as string,
  role: role as string,
  department: department as Department,
  manager: i < 3 ? "Renata Barros" : i < 6 ? "Pedro Lima" : "Camila Nunes",
  capacity: capacity as number,
  allocated: allocated as number,
  productivity: 72 + seeded(i, 26),
  sla: 82 + seeded(i, 17),
  rework: 2 + seeded(i, 14),
}));

const stages = [
  "Lead",
  "Diagnóstico",
  "Proposta",
  "Negociação",
  "Fechado",
  "Perdido",
  "Onboarding",
] as const;

export const opportunities: Opportunity[] = Array.from({ length: 30 }, (_, i) => {
  const stage = at(stages, seeded(i, 7));
  return {
    id: `o${i + 1}`,
    company: `${at(["Alfa", "Beta", "Delta", "Orion", "Prisma", "Vento", "Nobre", "Terra", "Lumen", "Sigma"], i)} ${at(["Comércio", "Indústria", "Serviços", "Tech", "Distribuidora"], i)}`,
    contact: at(["Sr. Almeida", "Dra. Peixoto", "Marcos T.", "Helena R.", "Igor S."], i),
    seller: at(["Ana Beatriz", "Carlos Menezes", "Fernanda Dias"], i),
    source: at(["Indicação", "Site", "Google Ads", "Evento", "Outbound"], i),
    services: allServices.slice(0, 2 + seeded(i, 3)),
    mrr: 800 + seeded(i, 12) * 350,
    setup: 500 + seeded(i, 6) * 400,
    probability: at([10, 25, 45, 70, 100, 0, 100], seeded(i, 7)),
    stage,
    expectedAt: `2026-${String(9 + (i % 3)).padStart(2, "0")}-${String(5 + (i % 20)).padStart(2, "0")}`,
    ...(seeded(i, 3) === 0 ? { competitor: "Contabilizei" } : {}),
    ...(stage === "Perdido" ? { lossReason: "Preço acima do concorrente" } : {}),
  };
});

const taskTitles = [
  "Apuração de impostos",
  "Envio de SPED Fiscal",
  "Conciliação bancária",
  "Folha de pagamento",
  "Fechamento contábil",
  "Emissão de guias",
  "Conferência de notas",
  "Alteração contratual",
  "Solicitação de documentos",
  "Relatório gerencial",
];

export const tasks: Task[] = Array.from({ length: 100 }, (_, i) => {
  const client = at(clients, i);
  const late = seeded(i, 10) > 6;
  return {
    id: `t${i + 1}`,
    title: `${at(taskTitles, i)} — ${client.name}`,
    clientId: client.id,
    assignee: at(employees, i % 12).name,
    department: at(employees, i % 12).department,
    due: `2026-09-${String(1 + (i % 28)).padStart(2, "0")}`,
    status: at(["A fazer", "Em andamento", "Em revisão", "Concluída"] as const, seeded(i, 4)),
    priority: at(["Baixa", "Média", "Alta", "Crítica"] as const, seeded(i, 4)),
    late,
    hours: 1 + seeded(i, 8),
  };
});

const processNames = [
  "Fechamento Mensal",
  "Folha de Pagamento",
  "Abertura de Empresa",
  "Obrigações Acessórias",
  "Onboarding de Cliente",
];

export const processes: Process[] = Array.from({ length: 50 }, (_, i) => {
  const client = at(clients, i);
  const stepNames = [
    "Solicitar documentos",
    "Receber",
    "Validar",
    "Processar",
    "Conferir",
    "Revisar",
    "Aprovar",
    "Entregar",
  ];
  const done = 1 + seeded(i, 8);
  return {
    id: `p${i + 1}`,
    name: `${at(processNames, i)} — ${client.name}`,
    clientId: client.id,
    department: client.department,
    progress: Math.round((done / stepNames.length) * 100),
    slaOk: seeded(i, 9) > 2,
    rework: seeded(i, 22),
    cycleDays: 4 + seeded(i, 12),
    steps: stepNames.map((name, s) => ({
      name,
      owner: at(employees, i + s).name,
      slaDays: 1 + (s % 3),
      avgDays: 1 + ((s + i) % 4),
      status:
        s < done
          ? "Concluída"
          : s === done
            ? seeded(i, 5) === 0
              ? "Atrasada"
              : "Em andamento"
            : "Pendente",
    })),
  };
});

export const timeline: TimelineEvent[] = clients.flatMap((client, ci) =>
  (
    [
      ["mensagem", "Mensagem no WhatsApp", "Cliente pediu a guia do DAS de setembro."],
      ["documento", "Documentos enviados", "12 notas fiscais de entrada recebidas."],
      ["tarefa", "Tarefa concluída", "Apuração de impostos finalizada."],
      ["reunião", "Reunião de relacionamento", "Alinhamento sobre crescimento da folha."],
      ["pagamento", "Honorário recebido", "Pagamento do mês anterior compensado."],
      ["reclamação", "Reclamação registrada", "Atraso na entrega do relatório gerencial."],
      ["oportunidade", "Oportunidade identificada", "Potencial de BPO financeiro."],
      ["contrato", "Contrato reajustado", "Aumento de funcionários e nova filial."],
    ] as const
  )
    .slice(0, 5 + (ci % 4))
    .map((ev, i) => ({
      id: `${client.id}-tl${i}`,
      clientId: client.id,
      date: `2026-09-${String(28 - i * 3).padStart(2, "0")}`,
      type: ev[0],
      title: ev[1],
      detail: ev[2],
    })),
);

export const alerts: Alert[] = [
  {
    id: "a1",
    level: "Crítico",
    title: "Departamento Fiscal está a 108% de ocupação",
    detail: "Risco elevado de atraso no fechamento de setembro.",
    link: "/pessoas",
    actions: ["Redistribuir tarefas", "Ver capacidade"],
  },
  {
    id: "a2",
    level: "Crítico",
    title: "4 clientes apresentam alto risco de churn",
    detail: "Health Score médio caiu 17 pontos em 30 dias.",
    link: "/clientes?filtro=risco",
    actions: ["Ver clientes", "Gerar plano"],
  },
  {
    id: "a3",
    level: "Crítico",
    title: "Honorários atrasados acumulam R$ 18.700",
    detail: "6 contas vencidas, 2 há mais de 15 dias.",
    link: "/financeiro",
    actions: ["Ver contas", "Automatizar cobrança"],
  },
  {
    id: "a4",
    level: "Atenção",
    title: "Retrabalho subiu 12% no processo de conferência",
    detail: "A etapa representa 34% do tempo total do processo.",
    link: "/processos",
    actions: ["Ver processo", "Criar validação"],
  },
  {
    id: "a5",
    level: "Atenção",
    title: "3 clientes estão há mais de 8 dias sem responder",
    detail: "Documentos do fechamento ainda não enviados.",
    link: "/clientes",
    actions: ["Enviar lembrete"],
  },
  {
    id: "a6",
    level: "Oportunidade",
    title: "R$ 14.400/mês em potencial de BPO na carteira",
    detail: "9 clientes usam Contábil/Fiscal/Pessoal, mas não BPO.",
    link: "/inteligencia",
    actions: ["Criar oportunidades"],
  },
  {
    id: "a7",
    level: "Oportunidade",
    title: "5 clientes estão abaixo da margem mínima",
    detail: "Reajuste recomendado gera R$ 3.210/mês adicionais.",
    link: "/rentabilidade",
    actions: ["Calcular preço", "Gerar proposta"],
  },
  {
    id: "a8",
    level: "Informação",
    title: "NPS do mês fechou em 58",
    detail: "12 novas respostas, 2 detratores.",
    link: "/inteligencia",
    actions: ["Ver respostas"],
  },
  {
    id: "a9",
    level: "Atenção",
    title: "Maria Souza está com 26% de capacidade ociosa",
    detail: "Pode absorver 8 tarefas do departamento fiscal.",
    link: "/pessoas",
    actions: ["Redistribuir"],
  },
  {
    id: "a10",
    level: "Informação",
    title: "Fechamento de setembro: 71% concluído",
    detail: "38 processos abertos, 6 com risco de atraso.",
    link: "/processos",
    actions: ["Ver processos"],
  },
  {
    id: "a11",
    level: "Crítico",
    title: "2 clientes operam com margem negativa",
    detail: "Prejuízo combinado de R$ 1.140/mês.",
    link: "/rentabilidade",
    actions: ["Ver rentabilidade"],
  },
  {
    id: "a12",
    level: "Oportunidade",
    title: "8 oportunidades quentes sem contato há 5 dias",
    detail: "Pipeline ponderado parado: R$ 21.300 de MRR.",
    link: "/comercial",
    actions: ["Ver pipeline"],
  },
  {
    id: "a13",
    level: "Atenção",
    title: "Déficit previsto de 70h na próxima semana",
    detail: "Demanda 720h × capacidade 650h.",
    link: "/pessoas",
    actions: ["Simular cenário"],
  },
  {
    id: "a14",
    level: "Informação",
    title: "Base de conhecimento atualizada",
    detail: "Procedimento de fechamento fiscal revisado.",
    link: "/conhecimento",
    actions: ["Ler"],
  },
  {
    id: "a15",
    level: "Oportunidade",
    title: "Capacidade ociosa no Societário",
    detail: "72h disponíveis podem suportar 6 novos clientes.",
    link: "/pessoas",
    actions: ["Planejar"],
  },
];

export const insights: Insight[] = [
  {
    id: "i1",
    kind: "Problema",
    title: "Sobrecarga no Departamento Fiscal",
    impact: "Risco de atraso em 12 entregas e multa potencial para 3 clientes.",
    cause: "Entrada de 4 clientes novos sem redistribuição de carteira.",
    recommendation: "Realocar 8 tarefas para Pessoal e Contábil (26% ociosos).",
    link: "/pessoas",
    actions: ["Redistribuir", "Ver capacidade", "Automatizar"],
  },
  {
    id: "i2",
    kind: "Problema",
    title: "Clientes deficitários na carteira",
    impact: "Prejuízo de R$ 1.140/mês concentrado em 2 clientes.",
    cause: "Volume de notas e funcionários cresceu sem reajuste de honorário.",
    recommendation: "Aplicar Pricing Engine e propor reajuste médio de 22%.",
    link: "/rentabilidade",
    actions: ["Calcular preço", "Gerar proposta"],
  },
  {
    id: "i3",
    kind: "Problema",
    title: "Retrabalho concentrado na etapa de conferência",
    impact: "34% do tempo total do processo de fechamento mensal.",
    cause: "Documentos chegam incompletos e sem validação prévia.",
    recommendation: "Criar validação automática antes da conferência.",
    link: "/processos",
    actions: ["Criar automação", "Ver processo"],
  },
  {
    id: "i4",
    kind: "Oportunidade",
    title: "Cross-sell de BPO financeiro",
    impact: "R$ 14.400/mês de MRR potencial em 9 clientes.",
    cause: "Clientes usam Contábil, Fiscal e Pessoal, mas não BPO.",
    recommendation: "Criar campanha de oportunidades para a carteira elegível.",
    link: "/comercial",
    actions: ["Criar oportunidades"],
  },
  {
    id: "i5",
    kind: "Oportunidade",
    title: "Clientes subprecificados",
    impact: "R$ 3.210/mês adicionais com reajuste alinhado ao mercado.",
    cause: "5 clientes abaixo da margem mínima de 35%.",
    recommendation: "Revisar preço e comunicar reajuste no próximo ciclo.",
    link: "/rentabilidade",
    actions: ["Ver lista", "Gerar proposta"],
  },
  {
    id: "i6",
    kind: "Previsão",
    title: "Déficit de capacidade na próxima semana",
    impact: "70h de déficit — risco elevado de atraso no Fiscal.",
    cause: "Pico de obrigações acessórias combinado a 2 férias.",
    recommendation: "Redistribuir 40h e terceirizar 30h.",
    link: "/pessoas",
    actions: ["Simular", "Redistribuir"],
  },
  {
    id: "i7",
    kind: "Previsão",
    title: "Risco de churn em 4 clientes",
    impact: "R$ 9.860/mês de MRR sob risco nos próximos 90 dias.",
    cause: "Queda de NPS, reclamações e atrasos recorrentes.",
    recommendation: "Agendar reunião de relacionamento e plano de recuperação.",
    link: "/clientes?filtro=risco",
    actions: ["Ver clientes", "Agendar reunião"],
  },
  {
    id: "i8",
    kind: "Previsão",
    title: "Projeção de receita para o trimestre",
    impact: "R$ 1,52 mi considerando pipeline ponderado e churn previsto.",
    cause: "Crescimento de 8% no MRR e conversão média de 34%.",
    recommendation: "Manter cadência comercial e reduzir ciclo de venda.",
    link: "/comercial",
    actions: ["Ver pipeline"],
  },
];

export const monthlyRevenue = [
  { month: "Abr", receita: 402000, margem: 31 },
  { month: "Mai", receita: 418000, margem: 30 },
  { month: "Jun", receita: 437000, margem: 32 },
  { month: "Jul", receita: 441000, margem: 30 },
  { month: "Ago", receita: 462000, margem: 29 },
  { month: "Set", receita: 482340, margem: 27 },
];

export const knowledgeArticles = [
  {
    id: "k1",
    category: "Processos",
    title: "Como fazemos o fechamento fiscal",
    summary: "Passo a passo do dia 1 ao dia 20, com checklist e responsáveis.",
  },
  {
    id: "k2",
    category: "Procedimentos",
    title: "Procedimento de onboarding de cliente",
    summary: "Coleta de documentos, migração de dados e reunião de kickoff.",
  },
  {
    id: "k3",
    category: "Políticas",
    title: "Política de reajuste de honorários",
    summary: "Gatilhos de reajuste: volume, funcionários, filiais e complexidade.",
  },
  {
    id: "k4",
    category: "Treinamentos",
    title: "Treinamento: conferência sem retrabalho",
    summary: "Erros mais comuns e validações obrigatórias antes da revisão.",
  },
  {
    id: "k5",
    category: "FAQ",
    title: "Perguntas frequentes do cliente",
    summary: "Respostas padrão para dúvidas sobre guias, prazos e documentos.",
  },
  {
    id: "k6",
    category: "Modelos",
    title: "Modelo de proposta comercial",
    summary: "Estrutura de escopo, precificação e condições comerciais.",
  },
];

export const agents = [
  {
    id: "ag1",
    name: "Operations Agent",
    scope: "Monitora tarefas, prazos e processos",
    status: "Ativo" as const,
    lastRun: "há 12 min",
    findings: 6,
  },
  {
    id: "ag2",
    name: "Customer Agent",
    scope: "Monitora clientes, reclamações e Health Score",
    status: "Ativo" as const,
    lastRun: "há 34 min",
    findings: 4,
  },
  {
    id: "ag3",
    name: "Revenue Agent",
    scope: "Identifica oportunidades comerciais",
    status: "Ativo" as const,
    lastRun: "há 1 h",
    findings: 9,
  },
  {
    id: "ag4",
    name: "Finance Agent",
    scope: "Monitora inadimplência e rentabilidade",
    status: "Ativo" as const,
    lastRun: "há 2 h",
    findings: 5,
  },
  {
    id: "ag5",
    name: "Capacity Agent",
    scope: "Monitora capacidade da equipe",
    status: "Ativo" as const,
    lastRun: "há 20 min",
    findings: 3,
  },
  {
    id: "ag6",
    name: "Knowledge Agent",
    scope: "Responde perguntas com o conhecimento interno",
    status: "Aguardando aprovação" as const,
    lastRun: "há 5 h",
    findings: 1,
  },
];

export const automations = [
  {
    id: "w1",
    name: "Cobrança de documentos",
    when: "Cliente não envia documento",
    rules: [
      { if: "Prazo < 2 dias", then: "Enviar lembrete automático" },
      { if: "Prazo vencido", then: "Criar alerta para o responsável" },
      { if: "3 dias de atraso", then: "Escalar para o gestor" },
    ],
    active: true,
    runs: 148,
  },
  {
    id: "w2",
    name: "Régua de inadimplência",
    when: "Honorário vence sem pagamento",
    rules: [
      { if: "1 dia de atraso", then: "Mensagem amigável ao financeiro" },
      { if: "7 dias", then: "Notificar responsável pela conta" },
      { if: "15 dias", then: "Abrir ocorrência e sugerir negociação" },
    ],
    active: true,
    runs: 63,
  },
  {
    id: "w3",
    name: "Alerta de Health Score",
    when: "Health Score cai mais de 10 pontos",
    rules: [
      { if: "Queda > 10 pts", then: "Criar tarefa de relacionamento" },
      { if: "Queda > 20 pts", then: "Notificar sócio" },
    ],
    active: true,
    runs: 21,
  },
  {
    id: "w4",
    name: "Distribuição por capacidade",
    when: "Departamento ultrapassa 100% de ocupação",
    rules: [
      { if: "Existe capacidade ociosa", then: "Sugerir redistribuição" },
      { if: "Aprovado pelo gestor", then: "Realocar tarefas" },
    ],
    active: false,
    runs: 0,
  },
];

// ---------- derived metrics ----------

export const totals = {
  mrr: clients.reduce((s, c) => s + c.fee, 0),
  cost: clients.reduce((s, c) => s + c.cost, 0),
  activeClients: clients.filter((c) => c.status !== "Em onboarding").length,
  atRisk: clients.filter((c) => c.health < 55).length,
  overdue: clients.reduce((s, c) => s + c.overdue, 0),
  overdueClients: clients.filter((c) => c.overdue > 0).length,
  lateTasks: tasks.filter((t) => t.late && t.status !== "Concluída").length,
  nps: Math.round(
    (clients.filter((c) => c.nps !== null).reduce((s, c) => s + (c.nps ?? 0), 0) /
      clients.filter((c) => c.nps !== null).length) *
      10,
  ),
  capacity: employees.reduce((s, e) => s + e.capacity, 0),
  allocated: employees.reduce((s, e) => s + e.allocated, 0),
};

export const margin = Math.round(((totals.mrr - totals.cost) / totals.mrr) * 1000) / 10;
export const utilization = Math.round((totals.allocated / totals.capacity) * 100);

export const departmentLoad = (
  ["Fiscal", "Contábil", "Pessoal", "Societário", "Financeiro", "Comercial"] as Department[]
).map((dep) => {
  const team = employees.filter((e) => e.department === dep);
  const capacity = team.reduce((s, e) => s + e.capacity, 0);
  const allocated = team.reduce((s, e) => s + e.allocated, 0);
  return {
    department: dep,
    capacity,
    allocated,
    utilization: capacity ? Math.round((allocated / capacity) * 100) : 0,
    people: team.length,
  };
});

export function clientMargin(c: Client) {
  return Math.round(((c.fee - c.cost) / c.fee) * 1000) / 10;
}

export function clientById(id: string) {
  return clients.find((c) => c.id === id);
}

export function healthTone(score: number) {
  return score >= 75 ? "good" : score >= 55 ? "warn" : "bad";
}

export function brl(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export const crossSellTargets = clients
  .filter((c) => !c.services.includes("BPO") && c.health > 50)
  .map((c) => ({ client: c, potential: Math.round(c.fee * 0.62) }));
