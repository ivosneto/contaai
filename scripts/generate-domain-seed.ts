/**
 * Gera o seed SQL do workspace demo do ContaAI a partir da MESMA fonte de
 * dados que o app usa hoje (src/data/office.ts) — garante que o Supabase
 * comece com exatamente o mesmo cenário demonstrativo já testado (incluindo
 * o cenário de sobrecarga do João Ferreira / obrigação ob41, e a coerência
 * documento↔obrigação corrigida nesta sessão), em vez de um dataset paralelo
 * que poderia divergir e quebrar esses fluxos.
 *
 * Não precisa rodar em produção: é executado uma vez, aqui, para produzir
 * supabase/migrations/20260914160100_demo_seed.sql.
 *
 * Uso: bun run scripts/generate-domain-seed.ts > supabase/migrations/20260914160100_demo_seed.sql
 */
import {
  clients,
  employees,
  obligations,
  pendencies,
  serviceCatalog,
  tasks,
} from "../src/data/office";

const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000009";
const DEPARTMENTS = ["Fiscal", "Contábil", "Pessoal", "Societário", "Financeiro", "Comercial"];

function sqlStr(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNum(value: number | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return String(value);
}

function sqlBool(value: boolean): string {
  return value ? "true" : "false";
}

function deptSubquery(name: string): string {
  return `(SELECT id FROM public.departments WHERE workspace_id = ${sqlStr(DEMO_WORKSPACE_ID)} AND name = ${sqlStr(name)})`;
}

const lines: string[] = [];
const push = (s: string) => lines.push(s);

push("-- Gerado por scripts/generate-domain-seed.ts a partir de src/data/office.ts — não editar manualmente, regenerar o script.");
push("-- Idempotente (ON CONFLICT DO NOTHING) para poder rodar mais de uma vez com segurança.");
push("");
push("-- ============================================================");
push("-- Workspace demo fixo (sem login) + departamentos");
push("-- ============================================================");
push(
  `INSERT INTO public.workspaces (id, name, slug, plan, timezone, currency, onboarding_step, onboarding_completed_at, created_by)\nVALUES (${sqlStr(DEMO_WORKSPACE_ID)}, 'ContaAI Demo', 'contaai-demo', 'growth', 'America/Fortaleza', 'BRL', 8, now(), ${sqlStr(DEMO_USER_ID)})\nON CONFLICT (id) DO NOTHING;`,
);
push("");
for (const name of DEPARTMENTS) {
  push(
    `INSERT INTO public.departments (workspace_id, name, active) VALUES (${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(name)}, true) ON CONFLICT (workspace_id, name) DO NOTHING;`,
  );
}
push("");

push("-- ============================================================");
push("-- Serviços (catálogo estático)");
push("-- ============================================================");
for (const s of serviceCatalog) {
  push(
    `INSERT INTO public.services (id, workspace_id, name, category, description, default_fee, default_hours)\nVALUES (${sqlStr(s.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(s.name)}, ${sqlStr(s.category)}, ${sqlStr(s.description)}, ${sqlNum(s.defaultFee)}, ${sqlNum(s.defaultHours)})\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");

push("-- ============================================================");
push("-- Funcionários");
push("-- ============================================================");
for (const e of employees) {
  push(
    `INSERT INTO public.employees (id, workspace_id, name, role, department_id, manager, capacity_hours, allocated_hours, monthly_cost, cost_per_hour, productivity, sla, rework)\nVALUES (${sqlStr(e.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(e.name)}, ${sqlStr(e.role)}, ${deptSubquery(e.department)}, ${sqlStr(e.manager)}, ${sqlNum(e.capacity)}, ${sqlNum(e.allocated)}, ${sqlNum(e.monthlyCost)}, ${sqlNum(e.costPerHour)}, ${sqlNum(e.productivity)}, ${sqlNum(e.sla)}, ${sqlNum(e.rework)})\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");

push("-- ============================================================");
push("-- Clientes");
push("-- ============================================================");
for (const c of clients) {
  push(
    `INSERT INTO public.clients (id, workspace_id, name, cnpj, segment, regime, revenue, revenue_last_period, headcount, headcount_last_period, fee, fee_last_period, cost, owner, department_id, nps, health, status, since, overdue, hours_month, movements, movements_last_period, complexity, complexity_last_period, service_count_last_period, fee_last_adjusted_at, complaints_30d, late_tasks)\nVALUES (${sqlStr(c.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(c.name)}, ${sqlStr(c.cnpj)}, ${sqlStr(c.segment)}, ${sqlStr(c.regime)}, ${sqlNum(c.revenue)}, ${sqlNum(c.revenueLastPeriod)}, ${sqlNum(c.headcount)}, ${sqlNum(c.headcountLastPeriod)}, ${sqlNum(c.fee)}, ${sqlNum(c.feeLastPeriod)}, ${sqlNum(c.cost)}, ${sqlStr(c.owner)}, ${deptSubquery(c.department)}, ${sqlNum(c.nps)}, ${sqlNum(c.health)}, ${sqlStr(c.status)}, ${sqlStr(c.since)}, ${sqlNum(c.overdue)}, ${sqlNum(c.hoursMonth)}, ${sqlNum(c.movements)}, ${sqlNum(c.movementsLastPeriod)}, ${sqlNum(c.complexity)}, ${sqlNum(c.complexityLastPeriod)}, ${sqlNum(c.serviceCountLastPeriod)}, ${sqlStr(c.feeLastAdjustedAt)}, ${sqlNum(c.complaints30d)}, ${sqlNum(c.lateTasks)})\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");

push("-- ============================================================");
push("-- Serviços contratados por cliente");
push("-- ============================================================");
for (const c of clients) {
  for (const serviceName of c.services) {
    const service = serviceCatalog.find((s) => s.name === serviceName);
    if (!service) continue;
    push(
      `INSERT INTO public.client_services (client_id, service_id) VALUES (${sqlStr(c.id)}, ${sqlStr(service.id)}) ON CONFLICT DO NOTHING;`,
    );
  }
}
push("");

push("-- ============================================================");
push("-- Tarefas");
push("-- ============================================================");
for (const t of tasks) {
  push(
    `INSERT INTO public.tasks (id, workspace_id, client_id, title, assignee, department_id, due_date, status, priority, late, hours)\nVALUES (${sqlStr(t.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(t.clientId)}, ${sqlStr(t.title)}, ${sqlStr(t.assignee)}, ${deptSubquery(t.department)}, ${sqlStr(t.due)}, ${sqlStr(t.status)}, ${sqlStr(t.priority)}, ${sqlBool(t.late)}, ${sqlNum(t.hours)})\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");

push("-- ============================================================");
push("-- Obrigações + checklist");
push("-- ============================================================");
for (const o of obligations) {
  push(
    `INSERT INTO public.obligations (id, workspace_id, client_id, type, department_id, competence, due_date, regime, municipality, assignee, status, priority, evidence_document_id)\nVALUES (${sqlStr(o.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(o.clientId)}, ${sqlStr(o.type)}, ${deptSubquery(o.department)}, ${sqlStr(o.competence)}, ${sqlStr(o.dueDate)}, ${sqlStr(o.regime)}, ${sqlStr(o.municipality)}, ${sqlStr(o.assignee)}, ${sqlStr(o.status)}, ${sqlStr(o.priority)}, NULL)\nON CONFLICT (id) DO NOTHING;`,
  );
  o.checklist.forEach((item, position) => {
    push(
      `INSERT INTO public.obligation_checklist_items (id, obligation_id, position, label, done) VALUES (${sqlStr(item.id)}, ${sqlStr(o.id)}, ${position}, ${sqlStr(item.label)}, ${sqlBool(item.done)}) ON CONFLICT (obligation_id, id) DO NOTHING;`,
    );
  });
}
push("");

push("-- ============================================================");
push("-- Pendências");
push("-- ============================================================");
for (const p of pendencies) {
  push(
    `INSERT INTO public.pendencies (id, workspace_id, client_id, category, title, description, origin, assignee, priority, sla_hours, due_date, status, recommended_action, created_at)\nVALUES (${sqlStr(p.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(p.clientId)}, ${sqlStr(p.category)}, ${sqlStr(p.title)}, ${sqlStr(p.description)}, ${sqlStr(p.origin)}, ${sqlStr(p.assignee)}, ${sqlStr(p.priority)}, ${sqlNum(p.slaHours)}, ${sqlStr(p.dueDate)}, ${sqlStr(p.status)}, ${sqlStr(p.recommendedAction)}, ${sqlStr(p.createdAt)}::timestamptz)\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");

console.log(lines.join("\n"));
