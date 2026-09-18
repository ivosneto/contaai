/**
 * Seed de communications + announcements a partir de office.ts.
 * Uso: bun run scripts/generate-comms-seed.ts > supabase/migrations/20260918090300_comms_seed.sql
 */
import { announcements, communications } from "../src/data/office";

const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

function sqlStr(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}
function sqlBool(value: boolean): string {
  return value ? "true" : "false";
}

const lines: string[] = [];
const push = (s: string) => lines.push(s);

push("-- Gerado por scripts/generate-comms-seed.ts a partir de src/data/office.ts.");
push("-- Idempotente (ON CONFLICT DO NOTHING).");
push("");
for (const m of communications) {
  push(
    `INSERT INTO public.communications (id, workspace_id, client_id, thread_id, sender, channel, direction, subject, content, summary, priority, sentiment, classification, assignee, status, requires_action, suggested_action, created_at)\nVALUES (${sqlStr(m.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(m.clientId)}, ${sqlStr(m.threadId)}, ${sqlStr(m.sender)}, ${sqlStr(m.channel)}, ${sqlStr(m.direction)}, ${sqlStr(m.subject)}, ${sqlStr(m.content)}, ${sqlStr(m.summary)}, ${sqlStr(m.priority)}, ${sqlStr(m.sentiment)}, ${sqlStr(m.classification)}, ${sqlStr(m.assignee)}, ${sqlStr(m.status)}, ${sqlBool(m.requiresAction)}, ${sqlStr(m.suggestedAction)}, ${sqlStr(m.createdAt)}::timestamptz)\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");
for (const a of announcements) {
  push(
    `INSERT INTO public.announcements (id, workspace_id, title, body, audience, published_at)\nVALUES (${sqlStr(a.id)}, ${sqlStr(DEMO_WORKSPACE_ID)}, ${sqlStr(a.title)}, ${sqlStr(a.body)}, ${sqlStr(a.audience)}, ${sqlStr(a.publishedAt)}::timestamptz)\nON CONFLICT (id) DO NOTHING;`,
  );
}
push("");
console.log(lines.join("\n"));
