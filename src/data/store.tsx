import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContaAILogo } from "@/components/brand/logo";
import {
  automations as seedAutomations,
  communications as seedCommunications,
  documents as seedDocuments,
  employees,
  processes,
  projects,
  tasks as seedTasks,
  timeEntries,
  type Client,
  type ClientDocument,
  type Communication,
  type CommunicationClassification,
  type CommunicationStatus,
  type Department,
  type DocumentType,
  type Insight,
  type KnowledgeArticle,
  type Obligation,
  type ObligationPriority,
  type ObligationType,
  type Pendency,
  type PendencyCategory,
  type PendencyPriority,
  type Process,
  type Project,
  type Task,
  type TimelineEvent,
} from "@/data/office";
import { OBLIGATION_DEPARTMENT, buildChecklist } from "@/lib/obligations-engine";
import { runDocumentPipeline } from "@/lib/documents-engine";
import { classifyContent, summarize } from "@/lib/communication-engine";
import { buildDepartmentCapacity, computeCapacityRecommendations, computeEmployeeCapacity } from "@/lib/capacity-engine";
import { buildProcessSteps } from "@/lib/process-engine";
import type { Automation, AutomationMatch, AutomationRun } from "@/lib/automation-engine";
import {
  deleteKnowledgeArticleFn,
  fetchDomainBootstrap,
  persistClient,
  persistKnowledgeArticle,
  persistObligation,
  persistPendency,
  persistProcess,
  persistProject,
  persistTask,
  persistTimelineEvent,
} from "@/data/server-functions/domain";

/**
 * seedTasks (100 tarefas de src/data/office.ts) continua importado só como
 * BASELINE fixa para o delta de capacidade (computeEmployeeCapacity) — não
 * mais como estado inicial de `state.tasks`, que agora vem do Supabase (ver
 * DomainBootstrap abaixo). Trocar a baseline pelas tarefas ao vivo zeraria o
 * delta sempre (baseline === atual), quebrando a reatividade da capacidade
 * — ver a mesma explicação em src/lib/capacity-engine.ts.
 */

/**
 * Estado compartilhado em memória (por sessão do navegador) para as entidades
 * que a Central de Pendências e o Action Engine precisam mutar. O resto do
 * app (clientes, faturas, documentos...) continua vindo direto de office.ts —
 * só o que tem ação de verdade mora aqui.
 */

type EntryStatus = "resolvido" | "ignorado";

export type CapacityLogEntry = {
  id: string;
  date: string;
  kind: string;
  title: string;
  detail: string;
};

type StoreState = {
  pendencies: Pendency[];
  tasks: Task[];
  communications: Communication[];
  documents: ClientDocument[];
  obligations: Obligation[];
  automations: Automation[];
  clients: Client[];
  processes: Process[];
  projects: Project[];
  knowledgeArticles: KnowledgeArticle[];
  insightStatus: Record<string, EntryStatus>;
  alertStatus: Record<string, EntryStatus>;
  churnReviewed: Record<string, string>; // clientId -> data em que foi marcado como analisado
  activityLog: TimelineEvent[];
  capacityLog: CapacityLogEntry[]; // decisões de capacidade sem cliente associado (terceirização, contratação)
  /**
   * Insights gerados em tempo real pelo fluxo operacional (ex.: sobrecarga
   * detectada ao processar um documento) — somados aos insights estáticos de
   * `office.ts` no Dashboard e na Central de Inteligência. Diferente de
   * `insightStatus` (que só marca status sobre insights já calculados),
   * estes nascem e morrem no store: aparecem quando o gatilho acontece e
   * somem quando o gestor resolve.
   */
  liveInsights: Insight[];
};

const departmentToCategory: Record<Department, PendencyCategory> = {
  Fiscal: "Fiscal",
  Contábil: "Contábil",
  Pessoal: "Folha",
  Societário: "Interna",
  Financeiro: "Financeiro",
  Comercial: "Comercial",
};

/** Índice determinístico a partir do id — usado para alimentar a extração de OCR simulada de documentos criados em runtime (não fazem parte do seed indexado). */
function hashIndex(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return h;
}

const categoryToClassification: Record<PendencyCategory, CommunicationClassification> = {
  Documento: "Documento",
  Fiscal: "Solicitação",
  Contábil: "Solicitação",
  Folha: "Solicitação",
  Financeiro: "Cobrança",
  Comercial: "Comercial",
  Cliente: "Dúvida",
  Interna: "Solicitação",
};

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function today() {
  return "2026-09-14";
}

/**
 * clientById do próprio store (não o de office.ts): resolve contra
 * state.clients, que nasce do Supabase e reflete edições (UPDATE_CLIENT)
 * imediatamente. Garante que uma tarefa/pendência criada logo após editar um
 * cliente use o dado atual — o clientById de office.ts continua servindo só
 * como snapshot estático para o resto do app (ver nota no plano desta tarefa).
 */
function findClient(state: StoreState, id: string): Client | undefined {
  return state.clients.find((c) => c.id === id);
}

export type NewPendencyInput = {
  clientId: string;
  category: PendencyCategory;
  title: string;
  description: string;
  assignee: string;
  priority: PendencyPriority;
  dueDate: string;
};

export type NewObligationInput = {
  clientId: string;
  type: ObligationType;
  competence: string;
  dueDate: string;
  assignee: string;
  priority: ObligationPriority;
};

export type NewDocumentInput = {
  clientId: string;
  type: DocumentType;
  category: PendencyCategory;
  competence: string;
  assignee: string;
};

export type NewAutomationInput = Pick<Automation, "name" | "trigger" | "conditions" | "actions">;

export type NewTaskInput = {
  clientId: string;
  title: string;
  assignee: string;
  priority: PendencyPriority;
  dueDate: string;
  hours: number;
};

export type ClientEditableFields = Pick<Client, "name" | "cnpj" | "segment" | "regime" | "owner" | "services" | "fee" | "status">;

export type NewProcessInput = {
  clientId: string;
  name: string;
  department: Department;
  assignee: string;
};

export type NewProjectInput = {
  clientId: string;
  name: string;
  dueDate: string;
};

export type NewKnowledgeArticleInput = Pick<KnowledgeArticle, "category" | "title" | "summary" | "content">;

type Action =
  | { type: "CREATE_PENDENCY"; input: NewPendencyInput }
  | { type: "UPDATE_PENDENCY"; id: string; patch: Partial<Pick<Pendency, "status" | "priority" | "dueDate" | "assignee">> }
  | { type: "COMPLETE_PENDENCY"; id: string }
  | { type: "CREATE_TASK_FROM_PENDENCY"; pendencyId: string }
  | { type: "CREATE_COMMUNICATION_FROM_PENDENCY"; pendencyId: string }
  | { type: "CREATE_TASK_FOR_CLIENT"; clientId: string; title: string }
  | { type: "CREATE_COMMERCIAL_RECOMMENDATION"; clientId: string; title: string; description: string }
  | { type: "RESOLVE_INSIGHT"; id: string }
  | { type: "IGNORE_INSIGHT"; id: string }
  | { type: "RESOLVE_ALERT"; id: string }
  | { type: "MARK_CHURN_REVIEWED"; clientId: string }
  | { type: "REASSIGN_TASK"; taskId: string; assignee: string }
  | { type: "REPRIORITIZE_TASK"; taskId: string; priority: PendencyPriority }
  | { type: "COMPLETE_TASK"; taskId: string }
  | { type: "LOG_CAPACITY_DECISION"; kind: string; title: string; detail: string }
  | { type: "CREATE_OBLIGATION"; input: NewObligationInput }
  | { type: "UPDATE_OBLIGATION"; id: string; patch: Partial<Pick<Obligation, "status" | "priority" | "dueDate" | "assignee">> }
  | { type: "TOGGLE_CHECKLIST_ITEM"; obligationId: string; itemId: string }
  | { type: "CREATE_PENDENCY_FROM_OBLIGATION"; obligationId: string }
  | { type: "UPLOAD_DOCUMENT"; input: NewDocumentInput }
  | { type: "PROCESS_DOCUMENT"; documentId: string }
  | { type: "ASSIGN_MESSAGE"; id: string; assignee: string }
  | { type: "UPDATE_MESSAGE_STATUS"; id: string; status: CommunicationStatus }
  | { type: "SEND_REPLY"; messageId: string; content: string }
  | { type: "CREATE_CLIENT_MESSAGE"; clientId: string; content: string }
  | { type: "TOGGLE_AUTOMATION_STATUS"; id: string }
  | { type: "RUN_AUTOMATION"; automationId: string; matches: AutomationMatch[] }
  | { type: "CREATE_AUTOMATION"; input: NewAutomationInput }
  | { type: "REDISTRIBUTE_FROM_INSIGHT"; insightId: string }
  | { type: "DISMISS_LIVE_INSIGHT"; id: string }
  | { type: "CREATE_TASK"; input: NewTaskInput }
  | { type: "UPDATE_CLIENT"; id: string; patch: Partial<ClientEditableFields> }
  | { type: "CREATE_PROCESS"; input: NewProcessInput }
  | { type: "UPDATE_PROCESS"; id: string; patch: Partial<Pick<Process, "progress" | "slaOk">> }
  | { type: "CREATE_PROJECT"; input: NewProjectInput }
  | { type: "UPDATE_PROJECT"; id: string; patch: Partial<Pick<Project, "status" | "progress" | "dueDate">> }
  | { type: "CREATE_KNOWLEDGE_ARTICLE"; input: NewKnowledgeArticleInput }
  | { type: "UPDATE_KNOWLEDGE_ARTICLE"; id: string; patch: Partial<Pick<KnowledgeArticle, "title" | "category" | "summary" | "content">> }
  | { type: "DELETE_KNOWLEDGE_ARTICLE"; id: string };

function logFor(clientId: string, type: TimelineEvent["type"], title: string, detail: string): TimelineEvent {
  return { id: genId("log"), clientId, date: today(), type, title, detail };
}

/**
 * Helpers puros que aplicam uma mutação a um StoreState e devolvem o novo
 * estado. Compartilhados entre as ações "manuais" (botões da UI) e o motor
 * de automação (RUN_AUTOMATION), para que rodar uma automação faça
 * exatamente a mesma coisa que o usuário faria clicando manualmente — sem
 * duplicar regra de negócio em dois lugares.
 */

function applyCreatePendency(state: StoreState, input: NewPendencyInput): StoreState {
  const p: Pendency = {
    id: genId("pd"),
    clientId: input.clientId,
    category: input.category,
    title: input.title,
    description: input.description,
    origin: "Manual",
    assignee: input.assignee,
    priority: input.priority,
    slaHours: 24,
    dueDate: input.dueDate,
    status: "Aberta",
    createdAt: today(),
    recommendedAction: "Acompanhar até a conclusão.",
  };
  return {
    ...state,
    pendencies: [p, ...state.pendencies],
    activityLog: [logFor(p.clientId, "pendência", "Pendência criada", p.title), ...state.activityLog],
  };
}

function applyCreateTaskForClient(state: StoreState, clientId: string, title: string): StoreState {
  const client = findClient(state, clientId);
  const t: Task = {
    id: genId("t"),
    title,
    clientId,
    assignee: client?.owner ?? "Equipe",
    department: client?.department ?? "Contábil",
    due: today(),
    status: "A fazer",
    priority: "Alta",
    late: false,
    hours: 2,
  };
  return {
    ...state,
    tasks: [t, ...state.tasks],
    activityLog: [logFor(clientId, "tarefa", "Tarefa criada", t.title), ...state.activityLog],
  };
}

function applyCreateCommercialRecommendation(state: StoreState, clientId: string, title: string, description: string): StoreState {
  const client = findClient(state, clientId);
  const p: Pendency = {
    id: genId("pd"),
    clientId,
    category: "Comercial",
    title,
    description,
    origin: "Motor de Rentabilidade",
    assignee: client?.owner ?? "Equipe Comercial",
    priority: "Alta",
    slaHours: 48,
    dueDate: today(),
    status: "Aberta",
    createdAt: today(),
    recommendedAction: description,
  };
  return {
    ...state,
    pendencies: [p, ...state.pendencies],
    activityLog: [logFor(clientId, "pendência", "Recomendação comercial gerada", p.title), ...state.activityLog],
  };
}

function applyProcessDocument(state: StoreState, documentId: string): StoreState {
  const doc = state.documents.find((d) => d.id === documentId);
  if (!doc || doc.pipelineStage === "Concluído") return state;
  const client = findClient(state, doc.clientId);
  if (!client) return state;

  const result = runDocumentPipeline({ type: doc.type, category: doc.category, competence: doc.competence }, client, state.obligations, hashIndex(doc.id));

  const events: TimelineEvent[] = [
    logFor(doc.clientId, "documento", "Documento identificado e classificado", `${doc.type} · categoria ${doc.category} · competência ${doc.competence}.`),
    logFor(
      doc.clientId,
      "documento",
      "Dados extraídos (OCR simulado)",
      `CNPJ ${result.extraction.cnpj} · nº ${result.extraction.numero}${result.extraction.valor ? ` · R$ ${result.extraction.valor}` : ""}.`,
    ),
  ];

  let pendencies = state.pendencies;
  let obligations = state.obligations;
  let liveInsights = state.liveInsights;
  let linkedPendencyId: string | null = null;

  if (result.validation.issues.length > 0) {
    events.push(logFor(doc.clientId, "documento", "Validação encontrou problemas", result.validation.issues.join(" ")));
    const pd: Pendency = {
      id: genId("pd"),
      clientId: doc.clientId,
      category: doc.category,
      title: `Revisar documento — ${doc.name}`,
      description: result.validation.issues.join(" "),
      origin: "Documento",
      assignee: doc.assignee,
      priority: "Alta",
      slaHours: 24,
      dueDate: today(),
      status: "Aberta",
      createdAt: today(),
      recommendedAction: "Revisar documento e confirmar dados manualmente.",
    };
    pendencies = [pd, ...pendencies];
    linkedPendencyId = pd.id;
    events.push(logFor(doc.clientId, "pendência", "Pendência gerada a partir de documento", pd.title));
  } else {
    const matched = result.matchedObligation;
    events.push(
      logFor(
        doc.clientId,
        "documento",
        "Documento validado, relacionado ao cliente e à obrigação",
        matched ? `Obrigação correspondente: ${matched.type} (${matched.competence}).` : "Nenhuma obrigação correspondente encontrada para este documento.",
      ),
    );
    if (matched) {
      obligations = obligations.map((o) => (o.id === matched.id ? { ...o, evidenceDocumentId: doc.id } : o));
      events.push(logFor(doc.clientId, "documento", "Processamento concluído", `Evidência anexada à obrigação ${matched.type}.`));

      // "Sistema verifica que ainda existem outros documentos pendentes" — outras
      // obrigações do mesmo cliente/competência (o mesmo fechamento) ainda abertas.
      const stillPending = obligations.filter(
        (o) => o.clientId === doc.clientId && o.competence === matched.competence && o.id !== matched.id && o.status !== "Concluída",
      );

      if (stillPending.length > 0) {
        const earliest = [...stillPending].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        events.push(
          logFor(
            doc.clientId,
            "documento",
            "Fechamento do mês ainda incompleto",
            `Ainda há ${stillPending.length} obrigação(ões) pendente(s) na competência ${matched.competence}: ${stillPending.map((o) => o.type).join(", ")}.`,
          ),
        );

        if (earliest) {
          const closingId = `pd-closing-${doc.clientId}-${matched.competence}`;
          linkedPendencyId = closingId;
          const alreadyTracked = pendencies.some((p) => p.id === closingId && p.status !== "Concluída" && p.status !== "Cancelada");

          if (!alreadyTracked) {
            const closingPendency: Pendency = {
              id: closingId,
              clientId: doc.clientId,
              category: "Documento",
              title: `Fechamento ${matched.competence} — documentos pendentes (${client.name})`,
              description: `Ainda faltam ${stillPending.length} obrigação(ões) para concluir o fechamento: ${stillPending.map((o) => o.type).join(", ")}.`,
              origin: "Documento",
              assignee: earliest.assignee,
              priority: stillPending.length >= 2 ? "Alta" : "Média",
              slaHours: 48,
              dueDate: earliest.dueDate,
              status: "Aberta",
              createdAt: today(),
              recommendedAction: "Cobrar o cliente pelos documentos restantes e acompanhar o checklist das obrigações.",
            };
            pendencies = [closingPendency, ...pendencies];
            // "Responsável é identificado" + "Prazo é calculado"
            events.push(logFor(doc.clientId, "pendência", "Pendência de fechamento criada", `Responsável: ${earliest.assignee}. Prazo: ${earliest.dueDate}.`));
          } else {
            events.push(logFor(doc.clientId, "pendência", "Pendência de fechamento já em acompanhamento", `Responsável: ${earliest.assignee}.`));
          }

          // "Capacidade do responsável é analisada"
          const liveCapacity = computeEmployeeCapacity(employees, state.tasks, timeEntries, projects, seedTasks);
          const responsible = liveCapacity.find((e) => e.name === earliest.assignee);
          if (responsible) {
            events.push(
              logFor(
                doc.clientId,
                "tarefa",
                "Capacidade do responsável analisada",
                `${responsible.name}: ${responsible.occupancy}% de ocupação (${responsible.allocatedHours}h de ${responsible.availableHours}h disponíveis).`,
              ),
            );

            // "Sistema percebe que ele está sobrecarregado" → "Gera insight"
            if (responsible.status === "Sobrecarregado" && !liveInsights.some((i) => i.assignee === responsible.name && i.id.startsWith("live-capacity-"))) {
              const insight: Insight = {
                id: `live-capacity-${responsible.employeeId}-${genId("i")}`,
                kind: "Problema",
                title: `${responsible.name} está sobrecarregado(a) (${responsible.occupancy}%) e agora também responde pelo fechamento de ${client.name}`,
                severity: responsible.occupancy >= 130 ? "Crítica" : "Alta",
                clientId: doc.clientId,
                department: earliest.department,
                assignee: responsible.name,
                evidence: [
                  `${responsible.allocatedHours}h alocadas de ${responsible.availableHours}h disponíveis (${responsible.occupancy}%).`,
                  `Novo item: fechamento de ${client.name} (competência ${matched.competence}), vencimento ${earliest.dueDate}.`,
                ],
                impact: "Sobrecarga pode atrasar este e outros fechamentos sob responsabilidade desta pessoa.",
                recommendation: `Redistribuir tarefas de ${responsible.name} para um colega do ${responsible.department} com capacidade disponível.`,
                actions: ["Redistribuir", "Ver capacidade"],
                link: "/pessoas",
                createdAt: today(),
                status: "Aberto",
              };
              liveInsights = [insight, ...liveInsights];
              events.push(logFor(doc.clientId, "tarefa", "Insight gerado: sobrecarga detectada", insight.title));
            }
          }
        }
      }
    } else {
      events.push(logFor(doc.clientId, "documento", "Processamento concluído", "Documento aprovado sem obrigação vinculada."));
    }
  }

  const finalDoc: ClientDocument = {
    ...doc,
    pipelineStage: "Concluído",
    status: result.validation.status,
    extraction: result.extraction,
    linkedObligationId: result.matchedObligation?.id ?? null,
    linkedPendencyId,
  };

  return {
    ...state,
    documents: state.documents.map((d) => (d.id === doc.id ? finalDoc : d)),
    obligations,
    pendencies,
    liveInsights,
    activityLog: [...events.reverse(), ...state.activityLog],
  };
}

/**
 * "Gestor aprova redistribuição → Tarefa é redistribuída → ContaAI mede
 * resultado": fecha o loop do insight de sobrecarga gerado acima. Reusa o
 * mesmo motor de capacidade/recomendação da página /pessoas (não duplica
 * regra), redistribui de verdade (reassignTask) e registra o resultado
 * medido (ocupação antes → depois) na timeline do cliente do insight.
 */
function applyRedistributeFromInsight(state: StoreState, insightId: string): StoreState {
  const insight = state.liveInsights.find((i) => i.id === insightId);
  if (!insight || !insight.assignee) return state;

  const liveCapacity = computeEmployeeCapacity(employees, state.tasks, timeEntries, projects, seedTasks);
  const departmentCapacity = buildDepartmentCapacity(liveCapacity, processes);
  const recommendation = computeCapacityRecommendations(liveCapacity, departmentCapacity, state.tasks).find(
    (r) => r.employeeName === insight.assignee && r.kind === "redistribuicao" && r.taskId && r.targetEmployeeName,
  );

  const before = liveCapacity.find((e) => e.name === insight.assignee);
  const clientId = insight.clientId ?? state.tasks.find((t) => t.assignee === insight.assignee)?.clientId ?? "";

  if (!recommendation || !recommendation.taskId || !recommendation.targetEmployeeName) {
    return {
      ...state,
      liveInsights: state.liveInsights.filter((i) => i.id !== insightId),
      activityLog: clientId
        ? [logFor(clientId, "tarefa", "Redistribuição não encontrou colega disponível", `Nenhum colaborador com folga suficiente para aliviar ${insight.assignee} agora.`), ...state.activityLog]
        : state.activityLog,
    };
  }

  const nextTasks = state.tasks.map((t) => (t.id === recommendation.taskId ? { ...t, assignee: recommendation.targetEmployeeName! } : t));
  const afterCapacity = computeEmployeeCapacity(employees, nextTasks, timeEntries, projects, seedTasks);
  const after = afterCapacity.find((e) => e.name === insight.assignee);

  const measured =
    before && after
      ? `Ocupação de ${insight.assignee} caiu de ${before.occupancy}% para ${after.occupancy}% após mover "${recommendation.taskTitle ?? "a tarefa"}" para ${recommendation.targetEmployeeName}.`
      : `Tarefa redistribuída de ${insight.assignee} para ${recommendation.targetEmployeeName}.`;

  return {
    ...state,
    tasks: nextTasks,
    liveInsights: state.liveInsights.filter((i) => i.id !== insightId),
    activityLog: clientId ? [logFor(clientId, "tarefa", "Redistribuição aprovada e medida", measured), ...state.activityLog] : state.activityLog,
  };
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "CREATE_PENDENCY":
      return applyCreatePendency(state, action.input);
    case "UPDATE_PENDENCY": {
      return {
        ...state,
        pendencies: state.pendencies.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    }
    case "COMPLETE_PENDENCY": {
      const target = state.pendencies.find((p) => p.id === action.id);
      return {
        ...state,
        pendencies: state.pendencies.map((p) => (p.id === action.id ? { ...p, status: "Concluída" } : p)),
        activityLog: target
          ? [logFor(target.clientId, "pendência", "Pendência concluída", target.title), ...state.activityLog]
          : state.activityLog,
      };
    }
    case "CREATE_TASK_FROM_PENDENCY": {
      const p = state.pendencies.find((x) => x.id === action.pendencyId);
      if (!p) return state;
      const client = findClient(state, p.clientId);
      const t: Task = {
        id: genId("t"),
        title: p.title,
        clientId: p.clientId,
        assignee: p.assignee,
        department: client?.department ?? "Contábil",
        due: p.dueDate,
        status: "A fazer",
        priority: p.priority,
        late: false,
        hours: 2,
      };
      return {
        ...state,
        tasks: [t, ...state.tasks],
        activityLog: [logFor(p.clientId, "tarefa", "Tarefa gerada a partir de pendência", t.title), ...state.activityLog],
      };
    }
    case "CREATE_COMMUNICATION_FROM_PENDENCY": {
      const p = state.pendencies.find((x) => x.id === action.pendencyId);
      if (!p) return state;
      const client = findClient(state, p.clientId);
      const threadId = genId("thread");
      const c: Communication = {
        id: genId("cm"),
        clientId: p.clientId,
        threadId,
        sender: client?.owner ?? "Cliente",
        channel: "Portal",
        direction: "Recebida",
        createdAt: today(),
        subject: p.title,
        content: p.description,
        summary: summarize(p.description),
        priority: p.priority,
        sentiment: "Neutro",
        classification: categoryToClassification[p.category],
        assignee: p.assignee,
        status: "Novo",
        requiresAction: true,
        suggestedAction: p.recommendedAction,
      };
      return {
        ...state,
        communications: [c, ...state.communications],
        activityLog: [logFor(p.clientId, "mensagem", "Comunicação gerada a partir de pendência", p.title), ...state.activityLog],
      };
    }
    case "CREATE_TASK_FOR_CLIENT":
      return applyCreateTaskForClient(state, action.clientId, action.title);
    case "CREATE_COMMERCIAL_RECOMMENDATION":
      return applyCreateCommercialRecommendation(state, action.clientId, action.title, action.description);
    case "RESOLVE_INSIGHT":
      return { ...state, insightStatus: { ...state.insightStatus, [action.id]: "resolvido" } };
    case "IGNORE_INSIGHT":
      return { ...state, insightStatus: { ...state.insightStatus, [action.id]: "ignorado" } };
    case "RESOLVE_ALERT":
      return { ...state, alertStatus: { ...state.alertStatus, [action.id]: "resolvido" } };
    case "MARK_CHURN_REVIEWED":
      return {
        ...state,
        churnReviewed: { ...state.churnReviewed, [action.clientId]: today() },
        activityLog: [logFor(action.clientId, "pendência", "Risco de churn analisado", "Cliente marcado como analisado pelo gestor."), ...state.activityLog],
      };
    case "REASSIGN_TASK": {
      const target = state.tasks.find((t) => t.id === action.taskId);
      if (!target) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.taskId ? { ...t, assignee: action.assignee } : t)),
        activityLog: [logFor(target.clientId, "tarefa", "Tarefa redistribuída", `"${target.title}" reatribuída para ${action.assignee}.`), ...state.activityLog],
      };
    }
    case "REPRIORITIZE_TASK": {
      const target = state.tasks.find((t) => t.id === action.taskId);
      if (!target) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.taskId ? { ...t, priority: action.priority } : t)),
        activityLog: [logFor(target.clientId, "tarefa", "Prioridade da tarefa alterada", `"${target.title}" agora é prioridade ${action.priority}.`), ...state.activityLog],
      };
    }
    case "COMPLETE_TASK": {
      const target = state.tasks.find((t) => t.id === action.taskId);
      if (!target || target.status === "Concluída") return state;
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.taskId ? { ...t, status: "Concluída" as const, late: false } : t)),
        activityLog: [logFor(target.clientId, "tarefa", "Tarefa concluída", `"${target.title}" marcada como concluída.`), ...state.activityLog],
      };
    }
    case "LOG_CAPACITY_DECISION": {
      const entry: CapacityLogEntry = { id: genId("cap"), date: today(), kind: action.kind, title: action.title, detail: action.detail };
      return { ...state, capacityLog: [entry, ...state.capacityLog] };
    }
    case "CREATE_OBLIGATION": {
      const client = findClient(state, action.input.clientId);
      const municipality = state.obligations.find((o) => o.clientId === action.input.clientId)?.municipality ?? "Não informado";
      const ob: Obligation = {
        id: genId("ob"),
        clientId: action.input.clientId,
        type: action.input.type,
        department: OBLIGATION_DEPARTMENT[action.input.type],
        competence: action.input.competence,
        dueDate: action.input.dueDate,
        regime: client?.regime ?? "Simples Nacional",
        municipality,
        assignee: action.input.assignee,
        status: "Pendente",
        priority: action.input.priority,
        evidenceDocumentId: null,
        checklist: buildChecklist(action.input.type, 0),
      };
      return {
        ...state,
        obligations: [ob, ...state.obligations],
        activityLog: [logFor(ob.clientId, "solicitação", "Obrigação criada", `${ob.type} — competência ${ob.competence}, vence ${ob.dueDate}.`), ...state.activityLog],
      };
    }
    case "UPDATE_OBLIGATION": {
      return {
        ...state,
        obligations: state.obligations.map((o) => (o.id === action.id ? { ...o, ...action.patch } : o)),
      };
    }
    case "TOGGLE_CHECKLIST_ITEM": {
      return {
        ...state,
        obligations: state.obligations.map((o) =>
          o.id === action.obligationId
            ? { ...o, checklist: o.checklist.map((item) => (item.id === action.itemId ? { ...item, done: !item.done } : item)) }
            : o,
        ),
      };
    }
    case "CREATE_PENDENCY_FROM_OBLIGATION": {
      const ob = state.obligations.find((o) => o.id === action.obligationId);
      if (!ob) return state;
      const pd: Pendency = {
        id: genId("pd"),
        clientId: ob.clientId,
        category: departmentToCategory[ob.department],
        title: `Regularizar obrigação — ${ob.type} (${ob.competence})`,
        description: `Obrigação ${ob.type} do cliente vence em ${ob.dueDate} e está ${ob.status.toLowerCase()}.`,
        origin: "Obrigação",
        assignee: ob.assignee,
        priority: ob.priority,
        slaHours: 24,
        dueDate: ob.dueDate,
        status: "Aberta",
        createdAt: today(),
        recommendedAction: "Concluir os itens do checklist da obrigação antes do vencimento.",
      };
      return {
        ...state,
        pendencies: [pd, ...state.pendencies],
        activityLog: [logFor(ob.clientId, "pendência", "Pendência gerada a partir de obrigação", pd.title), ...state.activityLog],
      };
    }
    case "UPLOAD_DOCUMENT": {
      const client = findClient(state, action.input.clientId);
      const doc: ClientDocument = {
        id: genId("doc"),
        clientId: action.input.clientId,
        name: `${action.input.type} — ${client?.name ?? action.input.clientId}`,
        type: action.input.type,
        category: action.input.category,
        competence: action.input.competence,
        assignee: action.input.assignee,
        status: "Recebido",
        pipelineStage: "Recebido",
        uploadedAt: today(),
        extraction: null,
        linkedObligationId: null,
        linkedPendencyId: null,
      };
      return {
        ...state,
        documents: [doc, ...state.documents],
        activityLog: [logFor(doc.clientId, "documento", "Documento recebido", doc.name), ...state.activityLog],
      };
    }
    case "PROCESS_DOCUMENT":
      return applyProcessDocument(state, action.documentId);
    case "ASSIGN_MESSAGE": {
      const target = state.communications.find((m) => m.id === action.id);
      if (!target) return state;
      return {
        ...state,
        communications: state.communications.map((m) => (m.id === action.id ? { ...m, assignee: action.assignee } : m)),
        activityLog: [logFor(target.clientId, "mensagem", "Mensagem atribuída", `"${target.subject}" atribuída para ${action.assignee}.`), ...state.activityLog],
      };
    }
    case "UPDATE_MESSAGE_STATUS": {
      return {
        ...state,
        communications: state.communications.map((m) =>
          m.id === action.id
            ? { ...m, status: action.status, requiresAction: action.status === "Resolvida" || action.status === "Respondida" ? false : m.requiresAction }
            : m,
        ),
      };
    }
    case "SEND_REPLY": {
      const original = state.communications.find((m) => m.id === action.messageId);
      if (!original) return state;
      const reply: Communication = {
        id: genId("cm"),
        clientId: original.clientId,
        threadId: original.threadId,
        sender: original.assignee,
        channel: original.channel,
        direction: "Enviada",
        createdAt: today(),
        subject: `Re: ${original.subject}`,
        content: action.content,
        summary: summarize(action.content),
        priority: original.priority,
        sentiment: "Neutro",
        classification: original.classification,
        assignee: original.assignee,
        status: "Resolvida",
        requiresAction: false,
        suggestedAction: "",
      };
      return {
        ...state,
        communications: [reply, ...state.communications.map((m) => (m.id === original.id ? { ...m, status: "Respondida" as const, requiresAction: false } : m))],
        activityLog: [logFor(original.clientId, "mensagem", "Resposta enviada", `Resposta enviada para "${original.subject}".`), ...state.activityLog],
      };
    }
    case "CREATE_CLIENT_MESSAGE": {
      const client = findClient(state, action.clientId);
      const classification = classifyContent(action.content);
      const subject = action.content.length > 60 ? `${action.content.slice(0, 60)}…` : action.content;
      const m: Communication = {
        id: genId("cm"),
        clientId: action.clientId,
        threadId: genId("thread"),
        sender: client?.name ?? "Cliente",
        channel: "Portal",
        direction: "Recebida",
        createdAt: today(),
        subject,
        content: action.content,
        summary: summarize(action.content),
        priority: classification.priority,
        sentiment: classification.sentiment,
        classification: classification.category,
        assignee: client?.owner ?? "Equipe",
        status: "Novo",
        requiresAction: classification.requiresAction,
        suggestedAction: classification.suggestedAction,
      };
      return {
        ...state,
        communications: [m, ...state.communications],
        activityLog: [logFor(action.clientId, "mensagem", "Mensagem recebida pelo portal do cliente", subject), ...state.activityLog],
      };
    }
    case "TOGGLE_AUTOMATION_STATUS": {
      return {
        ...state,
        automations: state.automations.map((a) => (a.id === action.id ? { ...a, status: a.status === "Ativa" ? ("Pausada" as const) : ("Ativa" as const) } : a)),
      };
    }
    case "RUN_AUTOMATION": {
      const automation = state.automations.find((a) => a.id === action.automationId);
      if (!automation) return state;
      const actionType = automation.actions[0];
      let next = state;
      for (const match of action.matches) {
        if (actionType === "atualizar-obrigacao") {
          next = applyProcessDocument(next, match.id);
        } else if (actionType === "criar-alerta") {
          const task = next.tasks.find((t) => t.id === match.id);
          next = applyCreatePendency(next, {
            clientId: match.clientId,
            category: "Interna",
            title: `Alerta: ${task?.title ?? match.label}`,
            description: match.label,
            assignee: task?.assignee ?? findClient(next, match.clientId)?.owner ?? "Equipe",
            priority: "Alta",
            dueDate: task?.due ?? today(),
          });
        } else if (actionType === "criar-tarefa-responsavel") {
          const client = findClient(next, match.clientId);
          next = applyCreateTaskForClient(next, match.clientId, `Investigar risco de churn — ${client?.name ?? match.clientId}`);
        } else if (actionType === "criar-oportunidade-comercial") {
          const client = findClient(next, match.clientId);
          next = applyCreateCommercialRecommendation(next, match.clientId, `Propor reajuste — ${client?.name ?? match.clientId}`, match.label);
        }
      }
      const run: AutomationRun = {
        id: genId("run"),
        at: today(),
        matchedCount: action.matches.length,
        executedCount: action.matches.length,
        summary: action.matches.length > 0 ? `${action.matches.length} correspondência(s) processada(s).` : "Nenhuma correspondência no momento da execução.",
      };
      return {
        ...next,
        automations: next.automations.map((a) => (a.id === automation.id ? { ...a, lastRunAt: today(), history: [run, ...a.history] } : a)),
      };
    }
    case "CREATE_AUTOMATION": {
      const automation: Automation = {
        id: genId("auto"),
        name: action.input.name,
        trigger: action.input.trigger,
        conditions: action.input.conditions,
        actions: action.input.actions,
        status: "Ativa",
        lastRunAt: null,
        history: [],
      };
      return { ...state, automations: [automation, ...state.automations] };
    }
    case "REDISTRIBUTE_FROM_INSIGHT":
      return applyRedistributeFromInsight(state, action.insightId);
    case "DISMISS_LIVE_INSIGHT":
      return { ...state, liveInsights: state.liveInsights.filter((i) => i.id !== action.id) };
    case "CREATE_TASK": {
      const client = findClient(state, action.input.clientId);
      const t: Task = {
        id: genId("t"),
        title: action.input.title,
        clientId: action.input.clientId,
        assignee: action.input.assignee,
        department: client?.department ?? "Contábil",
        due: action.input.dueDate,
        status: "A fazer",
        priority: action.input.priority,
        late: false,
        hours: action.input.hours,
      };
      return {
        ...state,
        tasks: [t, ...state.tasks],
        activityLog: [logFor(t.clientId, "tarefa", "Tarefa criada", t.title), ...state.activityLog],
      };
    }
    case "UPDATE_CLIENT": {
      const target = state.clients.find((c) => c.id === action.id);
      if (!target) return state;
      return {
        ...state,
        clients: state.clients.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
        activityLog: [logFor(action.id, "solicitação", "Cadastro do cliente atualizado", `Campos alterados: ${Object.keys(action.patch).join(", ")}.`), ...state.activityLog],
      };
    }
    case "CREATE_PROCESS": {
      const steps = buildProcessSteps(action.input.department, action.input.assignee);
      const p: Process = {
        id: genId("proc"),
        name: action.input.name,
        clientId: action.input.clientId,
        department: action.input.department,
        progress: 0,
        slaOk: true,
        rework: 0,
        cycleDays: 0,
        steps,
      };
      return {
        ...state,
        processes: [p, ...state.processes],
        activityLog: [logFor(action.input.clientId, "solicitação", "Processo criado", `${p.name} — ${action.input.department}, ${steps.length} etapa(s).`), ...state.activityLog],
      };
    }
    case "UPDATE_PROCESS": {
      return {
        ...state,
        processes: state.processes.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    }
    case "CREATE_PROJECT": {
      const p: Project = { id: genId("pj"), clientId: action.input.clientId, name: action.input.name, status: "Planejado", progress: 0, dueDate: action.input.dueDate };
      return {
        ...state,
        projects: [p, ...state.projects],
        activityLog: [logFor(action.input.clientId, "solicitação", "Projeto criado", `${p.name} · prazo ${p.dueDate}.`), ...state.activityLog],
      };
    }
    case "UPDATE_PROJECT": {
      const target = state.projects.find((p) => p.id === action.id);
      if (!target) return state;
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
        activityLog: action.patch.status
          ? [logFor(target.clientId, "solicitação", "Status do projeto alterado", `"${target.name}" agora é "${action.patch.status}".`), ...state.activityLog]
          : state.activityLog,
      };
    }
    case "CREATE_KNOWLEDGE_ARTICLE": {
      const k: KnowledgeArticle = { id: genId("k"), category: action.input.category, title: action.input.title, summary: action.input.summary, content: action.input.content };
      return { ...state, knowledgeArticles: [k, ...state.knowledgeArticles] };
    }
    case "UPDATE_KNOWLEDGE_ARTICLE": {
      return {
        ...state,
        knowledgeArticles: state.knowledgeArticles.map((k) => (k.id === action.id ? { ...k, ...action.patch } : k)),
      };
    }
    case "DELETE_KNOWLEDGE_ARTICLE":
      return { ...state, knowledgeArticles: state.knowledgeArticles.filter((k) => k.id !== action.id) };
    default:
      return state;
  }
}

type DomainBootstrap = {
  tasks: Task[];
  pendencies: Pendency[];
  obligations: Obligation[];
  clients: Client[];
  processes: Process[];
  projects: Project[];
  knowledgeArticles: KnowledgeArticle[];
  timelineEvents: TimelineEvent[];
};

function initialState(bootstrap: DomainBootstrap): StoreState {
  return {
    pendencies: bootstrap.pendencies,
    tasks: bootstrap.tasks,
    communications: seedCommunications,
    documents: seedDocuments,
    obligations: bootstrap.obligations,
    automations: seedAutomations,
    clients: bootstrap.clients,
    processes: bootstrap.processes,
    projects: bootstrap.projects,
    knowledgeArticles: bootstrap.knowledgeArticles,
    insightStatus: {},
    alertStatus: {},
    churnReviewed: {},
    activityLog: bootstrap.timelineEvents,
    capacityLog: [],
    liveInsights: [],
  };
}

/**
 * Write-through: sincroniza cada linha de `rows` com o Supabase assim que ela
 * muda (criada ou editada por qualquer ação do reducer — manual, automação
 * ou processamento de documento). O reducer continua síncrono e em memória
 * (Action Engine intacto); isso só espelha o resultado no banco, por id, sem
 * duplicar regra de negócio. Falha de rede vira toast — não falha silenciosa.
 */
function useSyncEntities<T extends { id: string }>(rows: T[], upsert: (row: T) => Promise<unknown>) {
  const [lastSynced] = useState(() => new Map(rows.map((r) => [r.id, JSON.stringify(r)])));
  const syncing = useRef(new Set<string>());
  useEffect(() => {
    for (const row of rows) {
      const serialized = JSON.stringify(row);
      if (lastSynced.get(row.id) === serialized || syncing.current.has(row.id)) continue;
      syncing.current.add(row.id);
      upsert(row)
        .then(() => lastSynced.set(row.id, serialized))
        .catch(() => toast.error("Falha ao salvar no banco — a alteração pode não persistir depois de atualizar a página."))
        .finally(() => syncing.current.delete(row.id));
    }
  }, [rows, upsert, lastSynced]);
}

type ConfirmOptions = {
  title: string;
  description: string;
  impact: "operacional" | "informativo";
  confirmLabel?: string;
  successMessage?: string;
  onConfirm: () => void;
};

type OfficeStoreValue = StoreState & {
  createPendency: (input: NewPendencyInput) => void;
  updatePendency: (id: string, patch: Partial<Pick<Pendency, "status" | "priority" | "dueDate" | "assignee">>) => void;
  completePendency: (id: string) => void;
  createTaskFromPendency: (pendencyId: string) => void;
  createCommunicationFromPendency: (pendencyId: string) => void;
  createTaskForClient: (clientId: string, title: string) => void;
  createCommercialRecommendation: (clientId: string, title: string, description: string) => void;
  resolveInsight: (id: string) => void;
  ignoreInsight: (id: string) => void;
  resolveAlert: (id: string) => void;
  markChurnReviewed: (clientId: string) => void;
  reassignTask: (taskId: string, assignee: string) => void;
  reprioritizeTask: (taskId: string, priority: PendencyPriority) => void;
  completeTask: (taskId: string) => void;
  logCapacityDecision: (kind: string, title: string, detail: string) => void;
  createObligation: (input: NewObligationInput) => void;
  updateObligation: (id: string, patch: Partial<Pick<Obligation, "status" | "priority" | "dueDate" | "assignee">>) => void;
  toggleChecklistItem: (obligationId: string, itemId: string) => void;
  createPendencyFromObligation: (obligationId: string) => void;
  uploadDocument: (input: NewDocumentInput) => void;
  processDocument: (documentId: string) => void;
  assignMessage: (id: string, assignee: string) => void;
  updateMessageStatus: (id: string, status: CommunicationStatus) => void;
  sendReply: (messageId: string, content: string) => void;
  createClientMessage: (clientId: string, content: string) => void;
  toggleAutomationStatus: (id: string) => void;
  runAutomation: (automationId: string, matches: AutomationMatch[]) => void;
  createAutomation: (input: NewAutomationInput) => void;
  redistributeFromInsight: (insightId: string) => void;
  dismissLiveInsight: (id: string) => void;
  createTask: (input: NewTaskInput) => void;
  updateClient: (id: string, patch: Partial<ClientEditableFields>) => void;
  createProcess: (input: NewProcessInput) => void;
  updateProcess: (id: string, patch: Partial<Pick<Process, "progress" | "slaOk">>) => void;
  createProject: (input: NewProjectInput) => void;
  updateProject: (id: string, patch: Partial<Pick<Project, "status" | "progress" | "dueDate">>) => void;
  createKnowledgeArticle: (input: NewKnowledgeArticleInput) => void;
  updateKnowledgeArticle: (id: string, patch: Partial<Pick<KnowledgeArticle, "title" | "category" | "summary" | "content">>) => void;
  deleteKnowledgeArticle: (id: string) => void;
  confirmAction: (options: ConfirmOptions) => void;
};

const OfficeStoreContext = createContext<OfficeStoreValue | null>(null);

/**
 * Ponto de entrada público: carrega tasks/pendencies/obligations do Supabase
 * (workspace demo, ver src/data/demo-workspace.ts) antes de montar o
 * reducer. Clientes/funcionários/documentos/comunicações/automações
 * continuam vindo de src/data/office.ts nesta fatia — ver o diagnóstico da
 * tarefa para o que falta religar.
 */
export function OfficeStoreProvider({ children }: { children: ReactNode }) {
  const bootstrap = useQuery({
    queryKey: ["domain-bootstrap"],
    queryFn: () => fetchDomainBootstrap(),
    staleTime: Infinity,
    retry: 1,
  });

  if (bootstrap.isPending) return <StoreBootstrapState />;
  if (bootstrap.isError) {
    return <StoreBootstrapState error={bootstrap.error instanceof Error ? bootstrap.error.message : "Erro desconhecido."} onRetry={() => void bootstrap.refetch()} />;
  }

  return <OfficeStoreProviderInner initial={bootstrap.data}>{children}</OfficeStoreProviderInner>;
}

function StoreBootstrapState({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <ContaAILogo variant="horizontal" size={36} />
        {error ? (
          <>
            <p className="max-w-sm text-sm text-muted-foreground">Não foi possível carregar os dados do escritório no Supabase.<br />{error}</p>
            {onRetry && (
              <button onClick={onRetry} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Tentar novamente
              </button>
            )}
          </>
        ) : (
          <p className="animate-pulse text-sm text-muted-foreground">Carregando dados do escritório…</p>
        )}
      </div>
    </div>
  );
}

function OfficeStoreProviderInner({ initial, children }: { initial: DomainBootstrap; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial, initialState);
  const [pending, setPending] = useState<ConfirmOptions | null>(null);

  const persistTaskFn = useCallback((row: Task) => persistTask({ data: row }), []);
  const persistPendencyFn = useCallback((row: Pendency) => persistPendency({ data: row }), []);
  const persistObligationFn = useCallback((row: Obligation) => persistObligation({ data: row }), []);
  const persistClientFn = useCallback((row: Client) => persistClient({ data: row }), []);
  const persistProcessFn = useCallback((row: Process) => persistProcess({ data: row }), []);
  const persistProjectFn = useCallback((row: Project) => persistProject({ data: row }), []);
  const persistKnowledgeArticleFn = useCallback((row: KnowledgeArticle) => persistKnowledgeArticle({ data: row }), []);
  const persistTimelineEventFn = useCallback((row: TimelineEvent) => persistTimelineEvent({ data: row }), []);
  useSyncEntities(state.tasks, persistTaskFn);
  useSyncEntities(state.pendencies, persistPendencyFn);
  useSyncEntities(state.obligations, persistObligationFn);
  useSyncEntities(state.clients, persistClientFn);
  useSyncEntities(state.processes, persistProcessFn);
  useSyncEntities(state.projects, persistProjectFn);
  useSyncEntities(state.knowledgeArticles, persistKnowledgeArticleFn);
  useSyncEntities(state.activityLog, persistTimelineEventFn);

  const confirmAction = useCallback((options: ConfirmOptions) => {
    if (options.impact === "informativo") {
      options.onConfirm();
      if (options.successMessage) toast.success(options.successMessage);
      return;
    }
    setPending(options);
  }, []);

  const runPending = useCallback(() => {
    if (!pending) return;
    pending.onConfirm();
    toast.success(pending.successMessage ?? "Ação executada.");
    setPending(null);
  }, [pending]);

  const value = useMemo<OfficeStoreValue>(
    () => ({
      ...state,
      createPendency: (input) => dispatch({ type: "CREATE_PENDENCY", input }),
      updatePendency: (id, patch) => dispatch({ type: "UPDATE_PENDENCY", id, patch }),
      completePendency: (id) => dispatch({ type: "COMPLETE_PENDENCY", id }),
      createTaskFromPendency: (pendencyId) => dispatch({ type: "CREATE_TASK_FROM_PENDENCY", pendencyId }),
      createCommunicationFromPendency: (pendencyId) => dispatch({ type: "CREATE_COMMUNICATION_FROM_PENDENCY", pendencyId }),
      createTaskForClient: (clientId, title) => dispatch({ type: "CREATE_TASK_FOR_CLIENT", clientId, title }),
      createCommercialRecommendation: (clientId, title, description) => dispatch({ type: "CREATE_COMMERCIAL_RECOMMENDATION", clientId, title, description }),
      resolveInsight: (id) => dispatch({ type: "RESOLVE_INSIGHT", id }),
      ignoreInsight: (id) => dispatch({ type: "IGNORE_INSIGHT", id }),
      resolveAlert: (id) => dispatch({ type: "RESOLVE_ALERT", id }),
      markChurnReviewed: (clientId) => dispatch({ type: "MARK_CHURN_REVIEWED", clientId }),
      reassignTask: (taskId, assignee) => dispatch({ type: "REASSIGN_TASK", taskId, assignee }),
      reprioritizeTask: (taskId, priority) => dispatch({ type: "REPRIORITIZE_TASK", taskId, priority }),
      completeTask: (taskId) => dispatch({ type: "COMPLETE_TASK", taskId }),
      logCapacityDecision: (kind, title, detail) => dispatch({ type: "LOG_CAPACITY_DECISION", kind, title, detail }),
      createObligation: (input) => dispatch({ type: "CREATE_OBLIGATION", input }),
      updateObligation: (id, patch) => dispatch({ type: "UPDATE_OBLIGATION", id, patch }),
      toggleChecklistItem: (obligationId, itemId) => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", obligationId, itemId }),
      createPendencyFromObligation: (obligationId) => dispatch({ type: "CREATE_PENDENCY_FROM_OBLIGATION", obligationId }),
      uploadDocument: (input) => dispatch({ type: "UPLOAD_DOCUMENT", input }),
      processDocument: (documentId) => dispatch({ type: "PROCESS_DOCUMENT", documentId }),
      assignMessage: (id, assignee) => dispatch({ type: "ASSIGN_MESSAGE", id, assignee }),
      updateMessageStatus: (id, status) => dispatch({ type: "UPDATE_MESSAGE_STATUS", id, status }),
      sendReply: (messageId, content) => dispatch({ type: "SEND_REPLY", messageId, content }),
      createClientMessage: (clientId, content) => dispatch({ type: "CREATE_CLIENT_MESSAGE", clientId, content }),
      toggleAutomationStatus: (id) => dispatch({ type: "TOGGLE_AUTOMATION_STATUS", id }),
      runAutomation: (automationId, matches) => dispatch({ type: "RUN_AUTOMATION", automationId, matches }),
      createAutomation: (input) => dispatch({ type: "CREATE_AUTOMATION", input }),
      redistributeFromInsight: (insightId) => dispatch({ type: "REDISTRIBUTE_FROM_INSIGHT", insightId }),
      dismissLiveInsight: (id) => dispatch({ type: "DISMISS_LIVE_INSIGHT", id }),
      createTask: (input) => dispatch({ type: "CREATE_TASK", input }),
      updateClient: (id, patch) => dispatch({ type: "UPDATE_CLIENT", id, patch }),
      createProcess: (input) => dispatch({ type: "CREATE_PROCESS", input }),
      updateProcess: (id, patch) => dispatch({ type: "UPDATE_PROCESS", id, patch }),
      createProject: (input) => dispatch({ type: "CREATE_PROJECT", input }),
      updateProject: (id, patch) => dispatch({ type: "UPDATE_PROJECT", id, patch }),
      createKnowledgeArticle: (input) => dispatch({ type: "CREATE_KNOWLEDGE_ARTICLE", input }),
      updateKnowledgeArticle: (id, patch) => dispatch({ type: "UPDATE_KNOWLEDGE_ARTICLE", id, patch }),
      deleteKnowledgeArticle: (id) => {
        dispatch({ type: "DELETE_KNOWLEDGE_ARTICLE", id });
        void deleteKnowledgeArticleFn({ data: { id } }).catch(() => toast.error("Falha ao excluir artigo no banco — pode reaparecer depois de atualizar a página."));
      },
      confirmAction,
    }),
    [state, confirmAction],
  );

  return (
    <OfficeStoreContext.Provider value={value}>
      {children}
      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pending?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={runPending}>{pending?.confirmLabel ?? "Confirmar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OfficeStoreContext.Provider>
  );
}

export function useOfficeStore() {
  const ctx = useContext(OfficeStoreContext);
  if (!ctx) throw new Error("useOfficeStore precisa estar dentro de <OfficeStoreProvider>");
  return ctx;
}
