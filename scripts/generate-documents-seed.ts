/**
 * Seed de documents a partir de office.ts (28 documentos, metade derivados
 * de obrigações reais — ver OBLIGATION_TO_DOCUMENT_TYPE) — mesma fonte,
 * mesma regra de idempotência dos outros scripts de seed. storage_path fica
 * NULL pra todos: são documentos históricos de demonstração, sem arquivo
 * real no Storage (só documentos enviados pelo fluxo real, a partir de
 * agora, têm arquivo de verdade).
 *
 * Uso: bun run scripts/generate-documents-seed.ts > supabase/migrations/20260918090200_documents_seed.sql
 */
import { documents } from "../src/data/office";

const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

function sqlStr(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

const lines: string[] = [];
const push = (s: string) => lines.push(s);

push("-- Gerado por scripts/generate-documents-seed.ts a partir de src/data/office.ts — não editar manualmente, regenerar o script.");
push("-- Idempotente (ON CONFLICT DO NOTHING).");
push("");
for (const d of documents) {
  push(
    `INSERT INTO public.documents (id, workspace_id, client_id, name, type, category, competence, assignee, status, pipeline_stage, uploaded_at, extraction, linked_obligation_id, linked_pendency_id, storage_path)\nVALUES (${sqlStr(d.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(d.clientId)}, ${sqlStr(d.name)}, ${sqlStr(d.type)}, ${sqlStr(d.category)}, ${sqlStr(d.competence)}, ${sqlStr(d.assignee)}, ${sqlStr(d.status)}, ${sqlStr(d.pipelineStage)}, ${sqlStr(d.uploadedAt)}, ${sqlJson(d.extraction)}, NULL, NULL, NULL)\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");
push("-- linked_obligation_id fica NULL na inserção (evita depender de ordem entre documents/obligations); resolvido aqui pra cada documento processado.");
for (const d of documents) {
  if (!d.linkedObligationId) continue;
  push(`UPDATE public.documents SET linked_obligation_id = ${sqlStr(d.linkedObligationId)} WHERE id = ${sqlStr(d.id)};`);
}
push("");
push("-- Evidência anexada de volta na obrigação (mesma mutação que office.ts faz em memória).");
for (const d of documents) {
  if (!d.linkedObligationId) continue;
  push(`UPDATE public.obligations SET evidence_document_id = ${sqlStr(d.id)} WHERE id = ${sqlStr(d.linkedObligationId)};`);
}
push("");

console.log(lines.join("\n"));
