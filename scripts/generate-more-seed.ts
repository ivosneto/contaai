/**
 * Extensão de generate-domain-seed.ts: gera o seed de processes/projects/
 * knowledge_articles (tabelas que ficaram vazias na migration de domínio
 * porque ProcessesPage/ProjectsPage/KnowledgePage ainda liam direto de
 * office.ts). Mesma fonte de dados (office.ts), mesma regra de
 * idempotência.
 *
 * Uso: bun run scripts/generate-more-seed.ts > supabase/migrations/20260917120100_more_domain_seed.sql
 */
import { knowledgeArticles, processes, projects } from "../src/data/office";

const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

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

push("-- Gerado por scripts/generate-more-seed.ts a partir de src/data/office.ts — não editar manualmente, regenerar o script.");
push("-- Idempotente (ON CONFLICT DO NOTHING) para poder rodar mais de uma vez com segurança.");
push("");

push("-- ============================================================");
push("-- Processos + etapas");
push("-- ============================================================");
for (const p of processes) {
  push(
    `INSERT INTO public.processes (id, workspace_id, client_id, name, department_id, progress, sla_ok, rework, cycle_days)\nVALUES (${sqlStr(p.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(p.clientId)}, ${sqlStr(p.name)}, ${deptSubquery(p.department)}, ${sqlNum(p.progress)}, ${sqlBool(p.slaOk)}, ${sqlNum(p.rework)}, ${sqlNum(p.cycleDays)})\nON CONFLICT (id) DO NOTHING;`,
  );
  p.steps.forEach((s, position) => {
    // process_steps.id é uuid autogerado (sem chave natural) — guarda de
    // idempotência via NOT EXISTS em vez de ON CONFLICT.
    push(
      `INSERT INTO public.process_steps (process_id, position, name, owner, sla_days, avg_days, status)\nSELECT ${sqlStr(p.id)}, ${position}, ${sqlStr(s.name)}, ${sqlStr(s.owner)}, ${sqlNum(s.slaDays)}, ${sqlNum(s.avgDays)}, ${sqlStr(s.status)}\nWHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE process_id = ${sqlStr(p.id)} AND position = ${position});`,
    );
  });
}
push("");

push("-- ============================================================");
push("-- Projetos");
push("-- ============================================================");
for (const p of projects) {
  push(
    `INSERT INTO public.projects (id, workspace_id, client_id, name, status, progress, due_date)\nVALUES (${sqlStr(p.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(p.clientId)}, ${sqlStr(p.name)}, ${sqlStr(p.status)}, ${sqlNum(p.progress)}, ${sqlStr(p.dueDate)})\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");

push("-- ============================================================");
push("-- Artigos da base de conhecimento");
push("-- ============================================================");
for (const k of knowledgeArticles) {
  push(
    `INSERT INTO public.knowledge_articles (id, workspace_id, title, category, summary, content)\nVALUES (${sqlStr(k.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(k.title)}, ${sqlStr(k.category)}, ${sqlStr(k.summary)}, ${sqlStr(k.content)})\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");

console.log(lines.join("\n"));
