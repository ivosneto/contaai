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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
