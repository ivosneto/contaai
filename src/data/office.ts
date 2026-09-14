import { computeAlerts, computeInsights, type IntelligenceInput } from "@/lib/intelligence-engine";
import { buildClientProfitability, buildProfitabilityDashboard, computeProfitabilityInsights } from "@/lib/profitability-engine";
import { computeRevenueOpportunities, computeRevenueOpportunityInsights } from "@/lib/revenue-intelligence-engine";
import { computeChurnInsights, computeChurnRisks, computeHealthScores } from "@/lib/health-score-engine";
import {
  buildDepartmentCapacity,
  buildOfficeCapacityOverview,
  computeCapacityForecast,
  computeCapacityInsights,
  computeCapacityRecommendations,
  computeEmployeeCapacity,
} from "@/lib/capacity-engine";
import { buildChecklist, computeObligationInsights, OBLIGATION_DEPARTMENT } from "@/lib/obligations-engine";
import { DOCUMENT_DEFAULT_CATEGORY, runDocumentPipeline } from "@/lib/documents-engine";
import { classifyContent, computeCommunicationInsights, summarize } from "@/lib/communication-engine";

export type Department =
  | "Fiscal"
  | "Contábil"
  | "Pessoal"
  | "Societário"
  | "Financeiro"
  | "Comercial";

export const serviceCatalog = [
  { id: "svc-contabil", name: "Contábil", category: "Recorrente", description: "Escrituração contábil mensal, balancetes e demonstrações.", defaultFee: 900, defaultHours: 6 },
  { id: "svc-fiscal", name: "Fiscal", category: "Recorrente", description: "Apuração de impostos e obrigações acessórias.", defaultFee: 1100, defaultHours: 8 },
  { id: "svc-pessoal", name: "Pessoal", category: "Recorrente", description: "Folha de pagamento e departamento pessoal.", defaultFee: 850, defaultHours: 5 },
  { id: "svc-bpo", name: "BPO", category: "Recorrente", description: "BPO financeiro: contas a pagar, a receber e conciliação.", defaultFee: 1800, defaultHours: 10 },
  { id: "svc-societario", name: "Societário", category: "Pontual", description: "Alterações contratuais, abertura e encerramento de empresas.", defaultFee: 650, defaultHours: 4 },
  { id: "svc-consultoria", name: "Consultoria", category: "Pontual", description: "Consultoria tributária e planejamento financeiro.", defaultFee: 1400, defaultHours: 6 },
] as const;

/** Catálogo de serviços contratáveis — fonte única do nome dos serviços em todo o app. */
export type Service = (typeof serviceCatalog)[number];
export type ServiceName = Service["name"];
export type ServiceCategory = Service["category"];

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
  revenueLastPeriod: number; // faturamento anual há 6 meses — base do motor de inteligência
  headcount: number;
  headcountLastPeriod: number; // funcionários há 6 meses
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
  movements: number; // movimentações/lançamentos mensais
  movementsLastPeriod: number;
  complexity: number; // 1-10
  complexityLastPeriod: number;
  serviceCountLastPeriod: number; // nº de serviços contratados há 6 meses — base do Revenue Intelligence
  feeLastAdjustedAt: string; // última revisão de honorário
  complaints30d: number;
  lateTasks: number;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  department: Department;
  manager: string;
  capacity: number; // horas/mês (carga horária)
  allocated: number;
  monthlyCost: number; // salário/custo mensal
  costPerHour: number; // monthlyCost / capacity
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
    | "fatura"
    | "email"
    | "pendência"
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

export type AppRole = "owner" | "admin" | "manager" | "employee" | "client";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  avatarInitial: string;
  employeeId?: string;
  clientId?: string;
};

export type Office = {
  id: string;
  name: string;
  slug: string;
  plan: "trial" | "starter" | "growth" | "scale";
  timezone: string;
  currency: string;
  departments: Department[];
  since: string;
};

export type DocumentType =
  | "Nota fiscal"
  | "Extrato bancário"
  | "Folha de ponto"
  | "Contrato social"
  | "Guia de imposto"
  | "Relatório gerencial";

/**
 * Pipeline de Documentos Inteligentes: Recebido → Identificação →
 * Classificação → Extração → Validação → Relacionamento com cliente →
 * Verificação da obrigação → Concluído. `pipelineStage` marca em que ponto o
 * documento está; `status` é o estado de negócio resultante.
 */
export type DocumentPipelineStage =
  | "Recebido"
  | "Identificação"
  | "Classificação"
  | "Extração"
  | "Validação"
  | "Relacionamento com cliente"
  | "Verificação da obrigação"
  | "Concluído";

export type DocumentStatus = "Pendente" | "Recebido" | "Processando" | "Aprovado" | "Vencido" | "Rejeitado";

/**
 * Dados "extraídos" por OCR — SIMULADO. Não há integração real com um motor
 * de OCR: os valores são gerados deterministicamente a partir do próprio
 * documento para demonstrar o fluxo Identificação → Classificação →
 * Extração → Validação. Ver DEMO_DISCLAIMER em documents-engine.ts.
 */
export type DocumentExtraction = {
  tipoDetectado: DocumentType;
  cnpj: string;
  competencia: string; // "AAAA-MM"
  valor: number | null;
  vencimento: string | null;
  numero: string;
  categoria: PendencyCategory;
  confidence: number; // 0-100, simulado
};

export type ClientDocument = {
  id: string;
  clientId: string;
  name: string;
  type: DocumentType;
  category: PendencyCategory;
  competence: string; // "AAAA-MM"
  assignee: string;
  status: DocumentStatus;
  pipelineStage: DocumentPipelineStage;
  uploadedAt: string;
  extraction: DocumentExtraction | null;
  linkedObligationId: string | null;
  linkedPendencyId: string | null;
};

export type ObligationType = "DAS" | "SPED Fiscal" | "SPED Contribuições" | "eSocial" | "DCTFWeb" | "GFIP" | "DIRF" | "ECF";
export type ObligationStatus = "Pendente" | "Em andamento" | "Aguardando cliente" | "Concluída" | "Atrasada";
export type ObligationPriority = "Baixa" | "Média" | "Alta" | "Crítica";

export type ChecklistItem = { id: string; label: string; done: boolean };

export type Obligation = {
  id: string;
  clientId: string;
  type: ObligationType;
  department: Department;
  competence: string; // "AAAA-MM"
  dueDate: string;
  regime: Client["regime"];
  municipality: string;
  assignee: string;
  status: ObligationStatus;
  priority: ObligationPriority;
  evidenceDocumentId: string | null;
  checklist: ChecklistItem[];
};

export type PendencyCategory =
  | "Documento"
  | "Fiscal"
  | "Contábil"
  | "Folha"
  | "Financeiro"
  | "Comercial"
  | "Cliente"
  | "Interna";

export type PendencyPriority = "Baixa" | "Média" | "Alta" | "Crítica";
export type PendencyStatus = "Aberta" | "Em andamento" | "Concluída" | "Cancelada";

export type Pendency = {
  id: string;
  clientId: string;
  category: PendencyCategory;
  title: string;
  description: string;
  origin: string;
  assignee: string;
  priority: PendencyPriority;
  slaHours: number;
  dueDate: string;
  status: PendencyStatus;
  createdAt: string;
  recommendedAction: string;
};

export type Contact = {
  id: string;
  clientId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  primary: boolean;
};

export type ContractStatus = "Ativo" | "Em revisão" | "Encerrado";

export type Contract = {
  id: string;
  clientId: string;
  services: ServiceName[];
  value: number;
  startDate: string;
  renewalDate: string;
  status: ContractStatus;
};

export type ProposalStatus = "Rascunho" | "Enviada" | "Aceita" | "Recusada";

export type Proposal = {
  id: string;
  opportunityId: string;
  company: string;
  services: ServiceName[];
  value: number;
  status: ProposalStatus;
  sentAt: string;
};

export type Email = {
  id: string;
  clientId: string;
  direction: "Recebido" | "Enviado";
  subject: string;
  snippet: string;
  at: string;
  read: boolean;
};

export type MeetingType = "Relacionamento" | "Onboarding" | "Cobrança" | "Consultoria";

export type Meeting = {
  id: string;
  clientId: string;
  title: string;
  type: MeetingType;
  at: string;
  attendees: string[];
  notes: string;
};

export type Indicator = {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: number;
  tone: "good" | "warn" | "bad";
  module: string;
};

export type ProjectStatus = "Planejado" | "Em andamento" | "Em aprovação" | "Concluído";

export type Project = {
  id: string;
  clientId: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
};

/**
 * Inbox unificada: e-mail, WhatsApp, mensagens internas e solicitações de
 * clientes (via portal) convivem no mesmo tipo `Communication`. No MVP os
 * canais externos (e-mail, WhatsApp) são simulados com dados mockados — ver
 * COMMUNICATION_DEMO_DISCLAIMER em communication-engine.ts — mas cada
 * mensagem já carrega canal, remetente e conteúdo separadamente, o que
 * permite plugar APIs reais (Gmail/Graph, WhatsApp Business etc.) depois
 * sem mudar o restante da arquitetura.
 */
export type CommunicationChannel = "E-mail" | "WhatsApp" | "Mensagem interna" | "Portal";
export type CommunicationDirection = "Recebida" | "Enviada";
export type CommunicationClassification =
  | "Documento"
  | "Dúvida"
  | "Cobrança"
  | "Solicitação"
  | "Reclamação"
  | "Comercial"
  | "Urgente"
  | "Outros";
export type CommunicationSentiment = "Positivo" | "Neutro" | "Negativo";
export type CommunicationPriority = "Baixa" | "Média" | "Alta" | "Crítica";
export type CommunicationStatus = "Novo" | "Em andamento" | "Aguardando cliente" | "Respondida" | "Resolvida";

export type Communication = {
  id: string;
  clientId: string;
  threadId: string;
  sender: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  createdAt: string;
  subject: string;
  content: string;
  summary: string; // prévia curta derivada do conteúdo, usada em listagens/timeline
  priority: CommunicationPriority;
  sentiment: CommunicationSentiment;
  classification: CommunicationClassification;
  assignee: string;
  status: CommunicationStatus;
  requiresAction: boolean;
  suggestedAction: string;
};

export type FinancialAccount = {
  id: string;
  name: string;
  type: "Corrente" | "Caixa" | "Aplicação";
  balance: number;
};

export type InvoiceStatus = "Paga" | "Pendente" | "Vencida";

export type Invoice = {
  id: string;
  clientId: string;
  competence: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
};

export type Payment = {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  paidAt: string;
  method: "Pix" | "Boleto" | "Cartão";
};

export type Transaction = {
  id: string;
  accountId: string;
  kind: "Receita" | "Despesa";
  category: string;
  amount: number;
  date: string;
  clientId?: string;
};

export type TimeEntry = {
  id: string;
  employeeId: string;
  clientId: string;
  date: string;
  hours: number;
  taskId?: string;
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

const allServices: ServiceName[] = serviceCatalog.map((s) => s.name);

function at<T>(arr: readonly T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length] as T;
}

function seeded(i: number, mod: number) {
  return ((i * 9301 + 49297) % 233280) % mod;
}

/** Desloca uma data "AAAA-MM-DD" em N dias (pode ser negativo), preservando o formato. */
function shiftDate(base: string, days: number): string {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

  const revenue = (600 + seeded(i, 60) * 220) * 1000;
  const headcount = 3 + seeded(i, 70);
  const revenueGrowth = at([0.06, 0.12, 0.18, 0.28, -0.04, 0.02, 0.22], seeded(i, 7));
  const revenueLastPeriod = Math.round(revenue / (1 + revenueGrowth));
  const headcountLastPeriod = Math.max(1, headcount - at([0, 0, 1, 2, 3], seeded(i, 5)));

  const movements = 40 + seeded(i, 180);
  const movementsGrowth = at([0.05, 0.15, 0.32, -0.05, 0.02, 0.24], seeded(i, 6));
  const movementsLastPeriod = Math.max(10, Math.round(movements / (1 + movementsGrowth)));
  const complexity = 2 + seeded(i, 8);
  const complexityLastPeriod = Math.max(1, complexity - at([0, 0, 1, 2, 3], seeded(i, 9)));
  const feeLastAdjustedAt = shiftDate("2026-09-14", -(30 + seeded(i, 540)));

  return {
    id: `c${i + 1}`,
    name,
    cnpj: `${10 + i}.${300 + i * 7}.${100 + i * 3}/0001-${10 + (i % 80)}`,
    segment: at(segments, i),
    regime: at(regimes, seeded(i, 4)),
    revenue,
    revenueLastPeriod,
    headcount,
    headcountLastPeriod,
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
    movements,
    movementsLastPeriod,
    complexity,
    complexityLastPeriod,
    serviceCountLastPeriod: Math.max(1, services.length - (seeded(i, 13) > 8 ? 1 : 0)),
    feeLastAdjustedAt,
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
].map(([name, role, department, capacity, allocated], i) => {
  const roleText = role as string;
  const seniorityMultiplier = /sênior|coordenador|gerente|executiv|contador/i.test(roleText)
    ? 1.4
    : /assistente/i.test(roleText)
      ? 0.8
      : 1;
  const monthlyCost = Math.round((3200 + seeded(i, 24) * 220) * seniorityMultiplier);
  return {
  id: `e${i + 1}`,
  name: name as string,
  role: roleText,
  department: department as Department,
  manager: i < 3 ? "Renata Barros" : i < 6 ? "Pedro Lima" : "Camila Nunes",
  capacity: capacity as number,
  allocated: allocated as number,
  monthlyCost,
  costPerHour: Math.round(monthlyCost / (capacity as number)),
  productivity: 72 + seeded(i, 26),
  sla: 82 + seeded(i, 17),
  rework: 2 + seeded(i, 14),
  };
});

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

// `alerts` e `insights` são computados mais abaixo pelo motor de inteligência
// (src/lib/intelligence-engine.ts), depois que invoices/pendências/etc. existem.

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

export type Automation = (typeof automations)[number];

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

// ---------- central entities (ContaAI) ----------
// Reaproveitam os mesmos clients/employees/tasks acima para manter os dados
// coerentes entre módulos. Sem UI própria ainda — preparação de arquitetura.

export const office: Office = {
  id: "ws1",
  name: "Lapenda Contabilidade",
  slug: "lapenda-contabilidade",
  plan: "growth",
  timezone: "America/Fortaleza",
  currency: "BRL",
  departments: ["Fiscal", "Contábil", "Pessoal", "Societário", "Financeiro", "Comercial"],
  since: "2015-03-01",
};

function inferRole(roleTitle: string): AppRole {
  return /coordenador|gerente|executiv/i.test(roleTitle) ? "manager" : "employee";
}

export const users: User[] = [
  { id: "u1", fullName: "Matheus Lapenda", email: "matheus@lapenda.cnt.br", role: "owner", avatarInitial: "M" },
  ...employees.map((e, i) => ({
    id: `u${i + 2}`,
    fullName: e.name,
    email: `${e.id}@lapenda.cnt.br`,
    role: inferRole(e.role),
    avatarInitial: e.name.charAt(0),
    employeeId: e.id,
  })),
  ...clients.slice(0, 6).map((c, i) => ({
    id: `u${employees.length + i + 2}`,
    fullName: `${c.owner} · ${c.name}`,
    email: `${c.id}@cliente.contaai.app`,
    role: "client" as const,
    avatarInitial: c.name.charAt(0),
    clientId: c.id,
  })),
];

// ---------- motor de obrigações ----------
// Dados de demonstração: não há integração real com eSocial, SPED, DCTFWeb
// ou qualquer sistema da Receita Federal. Ver src/lib/obligations-engine.ts.

const obligationTypes: ObligationType[] = ["DAS", "SPED Fiscal", "SPED Contribuições", "eSocial", "DCTFWeb", "GFIP", "DIRF", "ECF"];
const municipalities = ["Fortaleza", "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Recife", "Salvador", "Curitiba", "Porto Alegre"];

export const obligations: Obligation[] = Array.from({ length: 40 }, (_, i) => {
  const client = at(clients, i);
  const clientIndex = i % clients.length;
  const type = at(obligationTypes, i);
  const dueOffset = at([-9, -4, -1, 2, 5, 9, 14, 20], seeded(i, 8));
  const dueDate = shiftDate("2026-09-14", dueOffset);
  const competence = dueOffset < 10 ? "2026-08" : "2026-09";
  const status: ObligationStatus =
    dueOffset < 0
      ? seeded(i, 10) > 6
        ? "Atrasada"
        : "Concluída"
      : at(["Pendente", "Em andamento", "Aguardando cliente"] as const, seeded(i, 3));
  const doneCount = status === "Concluída" ? 4 : status === "Em andamento" ? 2 : status === "Aguardando cliente" ? 1 : 0;

  return {
    id: `ob${i + 1}`,
    clientId: client.id,
    type,
    department: OBLIGATION_DEPARTMENT[type],
    competence,
    dueDate,
    regime: client.regime,
    municipality: at(municipalities, seeded(clientIndex, municipalities.length)),
    assignee: at(employees, i % employees.length).name,
    status,
    priority: status === "Atrasada" ? "Crítica" : at(["Baixa", "Média", "Alta"] as const, seeded(i, 3)),
    evidenceDocumentId: null,
    checklist: buildChecklist(type, doneCount),
  };
});

// ---------- documentos inteligentes ----------
// "Extração por OCR" é SIMULADA — ver OCR_DEMO_DISCLAIMER em
// documents-engine.ts. Metade dos documentos do seed já passou pelo
// pipeline (histórico); o restante fica "Recebido" para demonstrar o
// processamento ao vivo pela UI.

const documentTypes: DocumentType[] = [
  "Nota fiscal",
  "Extrato bancário",
  "Folha de ponto",
  "Contrato social",
  "Guia de imposto",
  "Relatório gerencial",
];

export const documents: ClientDocument[] = Array.from({ length: 28 }, (_, i) => {
  const client = at(clients, i);
  const type = at(documentTypes, i);
  const category = DOCUMENT_DEFAULT_CATEGORY[type];
  const competence = i % 5 === 0 ? "2026-08" : "2026-09";
  const uploadedAt = `2026-09-${String(1 + (i % 28)).padStart(2, "0")}`;
  const assignee = at(employees, i % employees.length).name;
  const base = { id: `doc${i + 1}`, clientId: client.id, name: `${type} — ${client.name}`, type, category, competence, assignee, uploadedAt };

  const alreadyProcessed = seeded(i, 2) === 0;
  if (!alreadyProcessed) {
    return { ...base, status: "Recebido" as const, pipelineStage: "Recebido" as const, extraction: null, linkedObligationId: null, linkedPendencyId: null };
  }

  const result = runDocumentPipeline({ type, category, competence }, client, obligations, i);
  return {
    ...base,
    status: result.validation.status,
    pipelineStage: "Concluído" as const,
    extraction: result.extraction,
    linkedObligationId: result.matchedObligation?.id ?? null,
    linkedPendencyId: null,
  };
});

// Anexa a evidência (documento) na obrigação correspondente — mutação em
// lugar, mesmo padrão já usado para client.health.
for (const doc of documents) {
  if (!doc.linkedObligationId) continue;
  const ob = obligations.find((o) => o.id === doc.linkedObligationId);
  if (ob) ob.evidenceDocumentId = doc.id;
}

const pendencyLibrary: {
  category: PendencyCategory;
  title: string;
  description: string;
  recommendedAction: string;
}[] = [
  { category: "Documento", title: "Enviar extratos bancários do mês", description: "Cliente ainda não enviou os extratos para conciliação.", recommendedAction: "Enviar lembrete automático ao cliente." },
  { category: "Fiscal", title: "Apurar impostos do período", description: "Apuração pendente antes do vencimento da guia.", recommendedAction: "Priorizar apuração com o responsável do Fiscal." },
  { category: "Contábil", title: "Conciliar lançamentos do mês", description: "Divergência entre extrato bancário e lançamentos contábeis.", recommendedAction: "Revisar lançamentos com o analista contábil." },
  { category: "Folha", title: "Confirmar admissões e desligamentos", description: "Folha aguardando confirmação de movimentações de pessoal.", recommendedAction: "Solicitar confirmação ao RH do cliente." },
  { category: "Financeiro", title: "Negociar honorário em atraso", description: "Fatura vencida sem retorno do cliente.", recommendedAction: "Acionar régua de cobrança." },
  { category: "Comercial", title: "Enviar proposta de reajuste", description: "Cliente elegível a reajuste sem proposta enviada.", recommendedAction: "Gerar e enviar proposta comercial." },
  { category: "Cliente", title: "Retornar contato do cliente", description: "Cliente aguarda retorno há mais de 3 dias.", recommendedAction: "Agendar reunião de relacionamento." },
  { category: "Interna", title: "Revisar checklist de fechamento", description: "Checklist interno do fechamento mensal incompleto.", recommendedAction: "Concluir checklist antes da entrega." },
];

export const pendencies: Pendency[] = Array.from({ length: 26 }, (_, i) => {
  const client = at(clients, i);
  const lib = at(pendencyLibrary, i);
  const dueDate = shiftDate("2026-09-14", seeded(i, 20) - 10);
  const createdAt = shiftDate(dueDate, -(3 + seeded(i, 6)));
  return {
    id: `pd${i + 1}`,
    clientId: client.id,
    category: lib.category,
    title: `${lib.title} — ${client.name}`,
    description: lib.description,
    origin: at(["Obrigação", "Comunicação", "Documento", "Manual"], i),
    assignee: at(employees, i % employees.length).name,
    priority: at(["Baixa", "Média", "Alta", "Crítica"] as const, seeded(i, 4)),
    slaHours: at([4, 8, 24, 48, 72], seeded(i, 5)),
    dueDate,
    status: at(["Aberta", "Em andamento", "Aberta", "Em andamento", "Concluída", "Cancelada"] as const, seeded(i, 11)),
    createdAt,
    recommendedAction: lib.recommendedAction,
  };
});

const projectNames = [
  "Reestruturação societária",
  "Migração de sistema contábil",
  "Diagnóstico tributário",
  "Abertura de filial",
  "Auditoria interna",
  "Planejamento sucessório",
];

export const projects: Project[] = Array.from({ length: 12 }, (_, i) => {
  const client = at(clients, i * 2);
  return {
    id: `pj${i + 1}`,
    clientId: client.id,
    name: `${at(projectNames, i)} — ${client.name}`,
    status: at(["Planejado", "Em andamento", "Em aprovação", "Concluído"] as const, seeded(i, 4)),
    progress: seeded(i, 100),
    dueDate: `2026-${seeded(i, 2) === 0 ? "10" : "11"}-${String(5 + (i % 20)).padStart(2, "0")}`,
  };
});

// ---------- inbox unificada ----------
// E-mail e WhatsApp são SIMULADOS (dados de demonstração) — ver
// COMMUNICATION_DEMO_DISCLAIMER em communication-engine.ts. A classificação
// de categoria/sentimento/prioridade/ação sugerida é calculada por regras
// determinísticas a partir do próprio conteúdo da mensagem, não hardcoded.

const messageLibrary: { content: string; subject: string; channel: CommunicationChannel }[] = [
  { content: "Preciso enviar os documentos do fechamento.", subject: "Documentos do fechamento", channel: "WhatsApp" },
  { content: "Bom dia! Poderiam confirmar o valor da guia do DAS deste mês?", subject: "Dúvida sobre guia do DAS", channel: "E-mail" },
  { content: "A guia veio com o valor errado, isso já é a segunda vez que acontece.", subject: "Guia com valor errado", channel: "WhatsApp" },
  { content: "O boleto do mês passado ainda não foi baixado, podem verificar?", subject: "Boleto não baixado", channel: "E-mail" },
  { content: "Gostaria de saber mais sobre contratar o serviço de BPO financeiro para minha empresa.", subject: "Interesse em BPO financeiro", channel: "Portal" },
  { content: "Isso é urgente, preciso de retorno hoje mesmo sobre a rescisão do funcionário.", subject: "Urgente: rescisão de funcionário", channel: "WhatsApp" },
  { content: "Segue em anexo o extrato bancário de agosto.", subject: "Extrato bancário — agosto", channel: "E-mail" },
  { content: "Muito obrigado pelo atendimento, ficou tudo certo!", subject: "Agradecimento", channel: "WhatsApp" },
  { content: "Poderiam me explicar como funciona o cálculo do Simples Nacional?", subject: "Dúvida sobre Simples Nacional", channel: "Portal" },
  { content: "Precisamos negociar o boleto vencido do mês passado.", subject: "Negociação de boleto vencido", channel: "E-mail" },
  { content: "Equipe, revisar o checklist do fechamento deste cliente antes de enviar.", subject: "Checklist do fechamento", channel: "Mensagem interna" },
  { content: "Gostaria de solicitar a segunda via do contrato social.", subject: "Segunda via do contrato social", channel: "Portal" },
  { content: "Reclamação: o suporte demorou 3 dias para responder minha última mensagem.", subject: "Demora no suporte", channel: "E-mail" },
  { content: "Podem enviar a guia de FGTS deste mês assim que possível?", subject: "Guia de FGTS", channel: "WhatsApp" },
  { content: "Favor confirmar o recebimento das notas fiscais enviadas ontem.", subject: "Confirmação de recebimento", channel: "E-mail" },
  { content: "Ficamos com uma dúvida sobre o relatório gerencial, poderia explicar a variação de custos?", subject: "Dúvida sobre relatório gerencial", channel: "Portal" },
  { content: "Equipe, cliente sinalizou interesse em consultoria tributária — avaliar oportunidade.", subject: "Oportunidade de consultoria", channel: "Mensagem interna" },
  { content: "Preciso enviar os documentos do fechamento, mas só consigo até sexta-feira.", subject: "Documentos do fechamento — prazo", channel: "Portal" },
];

export const communications: Communication[] = messageLibrary.map((lib, i) => {
  const client = at(clients, i);
  const classification = classifyContent(lib.content);
  const direction: CommunicationDirection = lib.channel === "Mensagem interna" ? "Enviada" : seeded(i, 5) === 0 ? "Enviada" : "Recebida";
  const sender = direction === "Enviada" ? at(employees, i % employees.length).name : client.owner;
  const assignee = at(employees, (i + 3) % employees.length).name;
  const status = at(["Novo", "Em andamento", "Aguardando cliente", "Respondida", "Resolvida"] as const, seeded(i, 5));

  return {
    id: `cm${i + 1}`,
    clientId: client.id,
    threadId: `cm${i + 1}-thread`,
    sender,
    channel: lib.channel,
    direction,
    createdAt: `2026-09-${String(1 + (i % 28)).padStart(2, "0")}`,
    subject: lib.subject,
    content: lib.content,
    summary: summarize(lib.content),
    priority: classification.priority,
    sentiment: classification.sentiment,
    classification: classification.category,
    assignee,
    status,
    requiresAction: classification.requiresAction && status !== "Resolvida" && status !== "Respondida",
    suggestedAction: classification.suggestedAction,
  };
});

export const financialAccounts: FinancialAccount[] = [
  { id: "fa1", name: "Conta corrente principal", type: "Corrente", balance: 186400 },
  { id: "fa2", name: "Caixa", type: "Caixa", balance: 4200 },
  { id: "fa3", name: "Aplicação de reserva", type: "Aplicação", balance: 92000 },
];

export const invoices: Invoice[] = clients.map((client, i) => {
  const status: InvoiceStatus = client.overdue > 0 ? "Vencida" : seeded(i, 8) === 0 ? "Pendente" : "Paga";
  return {
    id: `inv-${client.id}-2026-09`,
    clientId: client.id,
    competence: "2026-09",
    amount: client.overdue > 0 ? client.overdue : client.fee,
    dueDate: "2026-09-10",
    status,
  };
});

export const payments: Payment[] = invoices
  .filter((inv) => inv.status === "Paga")
  .map((inv, i) => ({
    id: `pay${i + 1}`,
    invoiceId: inv.id,
    clientId: inv.clientId,
    amount: inv.amount,
    paidAt: `2026-09-${String(2 + (i % 8)).padStart(2, "0")}`,
    method: at(["Pix", "Boleto", "Cartão"] as const, i),
  }));

export const transactions: Transaction[] = [
  ...payments.map((p, i) => ({
    id: `tx-rec-${i + 1}`,
    accountId: "fa1",
    kind: "Receita" as const,
    category: "Honorário",
    amount: p.amount,
    date: p.paidAt,
    clientId: p.clientId,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `tx-desp-${i + 1}`,
    accountId: at(["fa1", "fa2"], i),
    kind: "Despesa" as const,
    category: at(["Folha de pagamento", "Aluguel", "Software", "Marketing", "Impostos"], i),
    amount: 1200 + seeded(i, 40) * 300,
    date: `2026-09-${String(3 + (i % 25)).padStart(2, "0")}`,
  })),
];

export const timeEntries: TimeEntry[] = tasks.slice(0, 60).map((task, i) => {
  const employee = employees.find((e) => e.name === task.assignee) ?? at(employees, i);
  return {
    id: `te${i + 1}`,
    employeeId: employee.id,
    clientId: task.clientId,
    date: task.due,
    hours: task.hours,
    taskId: task.id,
  };
});

const contactRoles = ["Sócio(a)", "Financeiro", "Contador(a) interno", "RH", "Administrativo"];

export const contacts: Contact[] = clients.flatMap((client, ci) =>
  [0, 1].map((i) => ({
    id: `ct-${client.id}-${i}`,
    clientId: client.id,
    name: i === 0 ? client.owner : at(["Sr. Almeida", "Dra. Peixoto", "Marcos T.", "Helena R.", "Igor S."], ci + i),
    role: i === 0 ? "Sócio(a)" : at(contactRoles, ci + i),
    email: `contato${i + 1}@${client.id}.contaai.app`,
    phone: `(85) 9${8000 + ci * 37 + i}-${1000 + ci * 13}`,
    primary: i === 0,
  })),
);

export const contracts: Contract[] = clients.map((client, i) => ({
  id: `ctr-${client.id}`,
  clientId: client.id,
  services: client.services,
  value: client.fee,
  startDate: client.since,
  renewalDate: shiftDate(client.since.slice(0, 4) + "-01-01", 365 * (2026 - Number(client.since.slice(0, 4)) + 1)),
  status: client.status === "Sem atividade" ? "Em revisão" : seeded(i, 23) === 0 ? "Encerrado" : "Ativo",
}));

export const proposals: Proposal[] = opportunities
  .filter((o) => o.stage === "Proposta" || o.stage === "Negociação" || o.stage === "Fechado" || o.stage === "Perdido")
  .map((o, i) => ({
    id: `pr-${o.id}`,
    opportunityId: o.id,
    company: o.company,
    services: o.services,
    value: o.mrr,
    status: o.stage === "Fechado" ? "Aceita" : o.stage === "Perdido" ? "Recusada" : at(["Rascunho", "Enviada"] as const, seeded(i, 3)),
    sentAt: shiftDate(o.expectedAt, -(10 + seeded(i, 15))),
  }));

const emailSubjects: [string, string][] = [
  ["Guia do DAS de setembro", "Segue em anexo a guia para pagamento até o dia 20."],
  ["Confirmação de recebimento de documentos", "Recebemos as 12 notas fiscais enviadas ontem."],
  ["Relatório gerencial disponível", "O relatório do mês já está disponível no portal."],
  ["Dúvida sobre folha de pagamento", "Poderiam confirmar o valor da rescisão do colaborador?"],
  ["Proposta de BPO financeiro", "Segue proposta para avaliação da diretoria."],
];

export const emails: Email[] = clients.flatMap((client, ci) =>
  [0, 1].map((i) => {
    const [subject, snippet] = at(emailSubjects, ci + i);
    return {
      id: `em-${client.id}-${i}`,
      clientId: client.id,
      direction: i === 0 ? ("Recebido" as const) : ("Enviado" as const),
      subject,
      snippet,
      at: `2026-09-${String(3 + ((ci + i) % 24)).padStart(2, "0")}`,
      read: i === 0 ? seeded(ci, 3) > 0 : true,
    };
  }),
);

const meetingTitles: { type: MeetingType; title: string }[] = [
  { type: "Relacionamento", title: "Reunião de relacionamento trimestral" },
  { type: "Onboarding", title: "Kickoff de onboarding" },
  { type: "Cobrança", title: "Negociação de honorários em atraso" },
  { type: "Consultoria", title: "Consultoria tributária" },
];

export const meetings: Meeting[] = clients.slice(0, 14).map((client, i) => {
  const tpl = at(meetingTitles, i);
  return {
    id: `mt${i + 1}`,
    clientId: client.id,
    title: tpl.title,
    type: tpl.type,
    at: `2026-09-${String(4 + (i % 20)).padStart(2, "0")}`,
    attendees: [client.owner, at(employees, i).name],
    notes: "Alinhamento registrado na timeline do cliente.",
  };
});

export const indicators: Indicator[] = [
  { id: "ind-mrr", label: "MRR", value: totals.mrr, unit: "BRL", change: 8, tone: "good", module: "financeiro" },
  { id: "ind-margin", label: "Margem operacional", value: margin, unit: "%", change: -2, tone: "bad", module: "rentabilidade" },
  { id: "ind-utilization", label: "Ocupação da equipe", value: utilization, unit: "%", change: 3, tone: "warn", module: "pessoas" },
  { id: "ind-overdue", label: "Inadimplência", value: totals.overdue, unit: "BRL", change: 6, tone: "bad", module: "financeiro" },
  { id: "ind-late-tasks", label: "Tarefas atrasadas", value: totals.lateTasks, unit: "un", change: -18, tone: "warn", module: "tarefas" },
  { id: "ind-nps", label: "NPS", value: totals.nps, unit: "pts", change: 0, tone: "warn", module: "clientes" },
];

// ---------- motor de rentabilidade real por cliente ----------
// Custo de mão de obra = horas × custo/hora real do colaborador envolvido;
// custo total = mão de obra + indiretos + terceirizados; lucro = receita -
// custo total; margem = lucro / receita. Nada aqui é hardcoded — os números
// vêm de clients/employees já definidos acima. Ver src/lib/profitability-engine.ts.

export const clientProfitability = buildClientProfitability(clients, employees, 0.1);
export const profitabilityDashboard = buildProfitabilityDashboard(clientProfitability);

// ---------- revenue intelligence ----------
// Oportunidades de receita que passam despercebidas: crescimento sem
// reajuste, aumento de complexidade/serviços/horas, margem abaixo do
// esperado e honorário abaixo de clientes semelhantes. Nunca executa
// reajuste — apenas recomenda; a aprovação é sempre humana.
// Ver src/lib/revenue-intelligence-engine.ts.

export const revenueOpportunities = computeRevenueOpportunities({
  clients,
  clientProfitability,
  documents,
  formatCurrency: brl,
});

// ---------- customer health score & churn risk ----------
// Metodologia transparente (soma de fatores com peso fixo — ver comentário
// em health-score-engine.ts). O Churn Risk é uma pontuação determinística
// baseada em regras, não um modelo de machine learning treinado.

export const healthScores = computeHealthScores({
  clients,
  clientProfitability,
  communications,
  meetings,
  pendencies,
  serviceCatalogSize: serviceCatalog.length,
});

// O health score real substitui o valor semente de `Client.health` para que
// toda a aplicação (badges, filtros, health<55 etc.) use a mesma pontuação.
for (const client of clients) {
  const result = healthScores.find((h) => h.clientId === client.id);
  if (result) client.health = result.score;
}
// `totals.atRisk` foi calculado antes do health score real existir — atualiza aqui.
totals.atRisk = clients.filter((c) => c.health < 55).length;

export const churnRisks = computeChurnRisks(healthScores, clients);

// Calculado aqui (depois do health score real) para refletir o health score
// atualizado, não o valor semente inicial.
export const crossSellTargets = clients
  .filter((c) => !c.services.includes("BPO") && c.health > 50)
  .map((c) => ({ client: c, potential: Math.round(c.fee * 0.62) }));

// ---------- capacity planning ----------
// Ocupação real por colaborador e por departamento (horas alocadas / horas
// disponíveis), previsão de demanda para os próximos 7 dias e recomendações
// de redistribuição/terceirização/contratação. Nada é executado sozinho —
// toda ação exige aprovação humana. Ver src/lib/capacity-engine.ts.

export const employeeCapacity = computeEmployeeCapacity(employees, tasks, timeEntries, projects);
export const departmentCapacity = buildDepartmentCapacity(employeeCapacity, processes);
export const officeCapacityOverview = buildOfficeCapacityOverview(employeeCapacity, departmentCapacity);
export const capacityForecast = computeCapacityForecast(employeeCapacity, departmentCapacity, tasks);
export const capacityRecommendations = computeCapacityRecommendations(employeeCapacity, departmentCapacity, tasks);

// ---------- motor de inteligência ----------
// Substitui os antigos arrays de alertas/insights escritos à mão por dados
// calculados a partir do que já existe acima (clients, invoices, processes,
// pendencies, clientProfitability). Ver src/lib/intelligence-engine.ts.

const intelligenceInput: IntelligenceInput = {
  clients,
  invoices,
  processes,
  pendencies,
  crossSellTargets,
  clientProfitability,
  formatCurrency: brl,
  clientMargin,
};

export const alerts: Alert[] = computeAlerts(intelligenceInput);
export const insights: Insight[] = [
  ...computeInsights(intelligenceInput),
  ...computeProfitabilityInsights({ clients, clientsProfitability: clientProfitability, formatCurrency: brl }),
  ...computeRevenueOpportunityInsights(revenueOpportunities, clients, brl),
  ...computeChurnInsights(churnRisks, healthScores, clients),
  ...computeCapacityInsights(employeeCapacity, departmentCapacity, capacityForecast),
  ...computeObligationInsights({ obligations, clients }),
  ...computeCommunicationInsights(communications, clients),
];
