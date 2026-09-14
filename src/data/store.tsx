import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
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
import {
  clientById,
  communications as seedCommunications,
  documents as seedDocuments,
  obligations as seedObligations,
  pendencies as seedPendencies,
  tasks as seedTasks,
  type ClientDocument,
  type Communication,
  type CommunicationClassification,
  type CommunicationStatus,
  type Department,
  type DocumentType,
  type Obligation,
  type ObligationPriority,
  type ObligationType,
  type Pendency,
  type PendencyCategory,
  type PendencyPriority,
  type Task,
  type TimelineEvent,
} from "@/data/office";
import { OBLIGATION_DEPARTMENT, buildChecklist } from "@/lib/obligations-engine";
import { runDocumentPipeline } from "@/lib/documents-engine";
import { classifyContent, summarize } from "@/lib/communication-engine";

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
  insightStatus: Record<string, EntryStatus>;
  alertStatus: Record<string, EntryStatus>;
  churnReviewed: Record<string, string>; // clientId -> data em que foi marcado como analisado
  activityLog: TimelineEvent[];
  capacityLog: CapacityLogEntry[]; // decisões de capacidade sem cliente associado (terceirização, contratação)
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
  | { type: "CREATE_CLIENT_MESSAGE"; clientId: string; content: string };

function logFor(clientId: string, type: TimelineEvent["type"], title: string, detail: string): TimelineEvent {
  return { id: genId("log"), clientId, date: today(), type, title, detail };
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "CREATE_PENDENCY": {
      const p: Pendency = {
        id: genId("pd"),
        clientId: action.input.clientId,
        category: action.input.category,
        title: action.input.title,
        description: action.input.description,
        origin: "Manual",
        assignee: action.input.assignee,
        priority: action.input.priority,
        slaHours: 24,
        dueDate: action.input.dueDate,
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
      const client = clientById(p.clientId);
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
      const client = clientById(p.clientId);
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
    case "CREATE_TASK_FOR_CLIENT": {
      const client = clientById(action.clientId);
      const t: Task = {
        id: genId("t"),
        title: action.title,
        clientId: action.clientId,
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
        activityLog: [logFor(action.clientId, "tarefa", "Tarefa criada", t.title), ...state.activityLog],
      };
    }
    case "CREATE_COMMERCIAL_RECOMMENDATION": {
      const client = clientById(action.clientId);
      const p: Pendency = {
        id: genId("pd"),
        clientId: action.clientId,
        category: "Comercial",
        title: action.title,
        description: action.description,
        origin: "Motor de Rentabilidade",
        assignee: client?.owner ?? "Equipe Comercial",
        priority: "Alta",
        slaHours: 48,
        dueDate: today(),
        status: "Aberta",
        createdAt: today(),
        recommendedAction: action.description,
      };
      return {
        ...state,
        pendencies: [p, ...state.pendencies],
        activityLog: [logFor(action.clientId, "pendência", "Recomendação comercial gerada", p.title), ...state.activityLog],
      };
    }
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
    case "LOG_CAPACITY_DECISION": {
      const entry: CapacityLogEntry = { id: genId("cap"), date: today(), kind: action.kind, title: action.title, detail: action.detail };
      return { ...state, capacityLog: [entry, ...state.capacityLog] };
    }
    case "CREATE_OBLIGATION": {
      const client = clientById(action.input.clientId);
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
      const client = clientById(action.input.clientId);
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
    case "PROCESS_DOCUMENT": {
      const doc = state.documents.find((d) => d.id === action.documentId);
      if (!doc || doc.pipelineStage === "Concluído") return state;
      const client = clientById(doc.clientId);
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
        activityLog: [...events.reverse(), ...state.activityLog],
      };
    }
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
      const client = clientById(action.clientId);
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
    default:
      return state;
  }
}

function initialState(): StoreState {
  return {
    pendencies: seedPendencies,
    tasks: seedTasks,
    communications: seedCommunications,
    documents: seedDocuments,
    obligations: seedObligations,
    insightStatus: {},
    alertStatus: {},
    churnReviewed: {},
    activityLog: [],
    capacityLog: [],
  };
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
  confirmAction: (options: ConfirmOptions) => void;
};

const OfficeStoreContext = createContext<OfficeStoreValue | null>(null);

export function OfficeStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [pending, setPending] = useState<ConfirmOptions | null>(null);

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
