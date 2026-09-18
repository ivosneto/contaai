/**
 * Tipos mínimos do Supabase para as tabelas de domínio criadas em
 * supabase/migrations/20260914160000_domain_core.sql. Não é o types.ts
 * "automaticamente gerado" de src/integrations/supabase/ (esse só conhece a
 * Fase 1 — workspaces/profiles/departments/etc.) — como não há CLI do
 * Supabase disponível neste ambiente para regenerar aquele arquivo contra o
 * schema novo, este arquivo cobre só as colunas que os repositories desta
 * fatia (tasks/pendencies/obligations) realmente leem e escrevem. Shape
 * (Row/Insert/Update/Relationships, Views/Functions/CompositeTypes vazios)
 * espelha exatamente o types.ts gerado para o supabase-js reconhecer as
 * tabelas — sem isso o client tipado colapsa tudo para `never`.
 */

export type DepartmentRow = {
  id: string;
  workspace_id: string;
  name: string;
};

export type TaskRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  title: string;
  assignee: string;
  department_id: string | null;
  due_date: string;
  status: string;
  priority: string;
  late: boolean;
  hours: number;
};

export type ObligationRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  type: string;
  department_id: string | null;
  competence: string;
  due_date: string;
  regime: string;
  municipality: string;
  assignee: string;
  status: string;
  priority: string;
  evidence_document_id: string | null;
};

export type ObligationChecklistItemRow = {
  id: string;
  obligation_id: string;
  position: number;
  label: string;
  done: boolean;
};

export type PendencyRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  category: string;
  title: string;
  description: string;
  origin: string;
  assignee: string;
  priority: string;
  sla_hours: number;
  due_date: string;
  status: string;
  recommended_action: string;
  created_at: string;
};

export type ClientRow = {
  id: string;
  workspace_id: string;
  name: string;
  cnpj: string;
  segment: string;
  regime: string;
  revenue: number;
  revenue_last_period: number;
  headcount: number;
  headcount_last_period: number;
  fee: number;
  fee_last_period: number;
  cost: number;
  owner: string;
  department_id: string | null;
  nps: number | null;
  health: number;
  status: string;
  since: string;
  overdue: number;
  hours_month: number;
  movements: number;
  movements_last_period: number;
  complexity: number;
  complexity_last_period: number;
  service_count_last_period: number;
  fee_last_adjusted_at: string | null;
  complaints_30d: number;
  late_tasks: number;
};

export type ClientServiceRow = {
  client_id: string;
  service_id: string;
};

export type ServiceRow = {
  id: string;
  workspace_id: string;
  name: string;
  category: string;
  description: string;
  default_fee: number;
  default_hours: number;
};

export type ProcessRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  department_id: string | null;
  progress: number;
  sla_ok: boolean;
  rework: number;
  cycle_days: number;
};

export type ProcessStepRow = {
  id: string;
  process_id: string;
  position: number;
  name: string;
  owner: string;
  sla_days: number;
  avg_days: number;
  status: string;
};

export type ProjectRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  status: string;
  progress: number;
  due_date: string;
};

export type KnowledgeArticleRow = {
  id: string;
  workspace_id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  updated_at: string;
};

export type TimelineEventRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  event_type: string;
  title: string;
  detail: string;
  occurred_at: string;
};

export type DocumentRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  type: string;
  category: string;
  competence: string;
  assignee: string;
  status: string;
  pipeline_stage: string;
  uploaded_at: string;
  extraction: Record<string, unknown> | null;
  linked_obligation_id: string | null;
  linked_pendency_id: string | null;
  storage_path: string | null;
};

export type CommunicationRow = {
  id: string;
  workspace_id: string;
  client_id: string | null;
  thread_id: string;
  sender: string;
  channel: string;
  direction: string;
  subject: string;
  content: string;
  summary: string;
  priority: string;
  sentiment: string;
  classification: string;
  assignee: string;
  status: string;
  requires_action: boolean;
  suggested_action: string;
  created_at: string;
};

export type AnnouncementRow = {
  id: string;
  workspace_id: string;
  title: string;
  body: string;
  audience: string;
  published_at: string;
};

/** Fase 1 (workspaces/profiles/etc.) — só as colunas que a camada de sessão lê. */
export type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  client_id: string | null;
  status: string;
};

export type UserRoleRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "manager" | "employee" | "client";
};

export type AuditLogRow = {
  id: number;
  workspace_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type EmployeeRow = {
  id: string;
  workspace_id: string;
  name: string;
  role: string;
  department_id: string | null;
  manager: string | null;
  capacity_hours: number;
  allocated_hours: number;
  monthly_cost: number;
  cost_per_hour: number;
  productivity: number;
  sla: number;
  rework: number;
};

/** JSON simples (sem `unknown`) — necessário para que o retorno de um server function (ex.: listPendingAiActionsFn) passe pela validação de serialização do TanStack Start, que rejeita `Record<string, unknown>`. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Infraestrutura de IA (Copilot com LLM real) — ver supabase/migrations/20260919100000_ai_infrastructure.sql. */
export type AiActionRow = {
  id: string;
  workspace_id: string;
  proposed_by_user_id: string | null;
  kind: string;
  payload: Record<string, JsonValue>;
  status: "proposed" | "approved" | "rejected" | "executed";
  decided_by: string | null;
  decided_at: string | null;
  executed_at: string | null;
  result: Record<string, JsonValue> | null;
  created_at: string;
};

/** Log de auditoria/custo de cada interação com o LLM — separado de audit_logs (esse é específico de IA: modelo, tokens, custo). */
export type AiInteractionRow = {
  id: number;
  workspace_id: string;
  user_id: string;
  question: string;
  model: string;
  tool_calls: { name: string; args: Record<string, unknown> }[];
  response: string | null;
  proposed_action_ids: string[];
  tokens_in: number | null;
  tokens_out: number | null;
  estimated_cost_usd: number | null;
  latency_ms: number;
  error: string | null;
  created_at: string;
};

/** Tabela `contacts` já existia no schema (20260914160000_domain_core.sql) mas nunca era usada pela aplicação — ativada pela integração de e-mail (identificação de cliente por remetente). */
export type ContactRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  is_primary: boolean;
  created_at: string;
};

/** Infraestrutura de integração de e-mail — ver supabase/migrations/20260920100000_email_integration.sql. Tokens sempre criptografados (src/lib/email/token-crypto.server.ts) antes de chegar aqui. */
export type EmailAccountRow = {
  id: string;
  workspace_id: string;
  provider: string;
  email_address: string;
  status: "connected" | "syncing" | "error" | "disconnected";
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  sync_cursor: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  connected_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type TableDef<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type DomainDatabase = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      departments: TableDef<DepartmentRow>;
      tasks: TableDef<TaskRow>;
      obligations: TableDef<ObligationRow>;
      obligation_checklist_items: TableDef<ObligationChecklistItemRow>;
      pendencies: TableDef<PendencyRow>;
      clients: TableDef<ClientRow>;
      client_services: TableDef<ClientServiceRow>;
      services: TableDef<ServiceRow>;
      processes: TableDef<ProcessRow>;
      process_steps: TableDef<ProcessStepRow>;
      projects: TableDef<ProjectRow>;
      knowledge_articles: TableDef<KnowledgeArticleRow>;
      timeline_events: TableDef<TimelineEventRow>;
      documents: TableDef<DocumentRow>;
      communications: TableDef<CommunicationRow>;
      announcements: TableDef<AnnouncementRow>;
      workspace_members: TableDef<WorkspaceMemberRow>;
      user_roles: TableDef<UserRoleRow>;
      audit_logs: TableDef<AuditLogRow>;
      employees: TableDef<EmployeeRow>;
      ai_actions: TableDef<AiActionRow>;
      ai_interactions: TableDef<AiInteractionRow>;
      contacts: TableDef<ContactRow>;
      email_accounts: TableDef<EmailAccountRow>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
