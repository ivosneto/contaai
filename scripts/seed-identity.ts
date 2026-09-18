/**
 * Cria usuários REAIS (Supabase Auth) e os liga a workspace_members/
 * user_roles — só aqui é legítimo usar service_role/Admin API (script
 * administrativo offline, nunca no caminho de uma requisição). Gera:
 *
 * Workspace A (o já existente, "ContaAI Demo", 00000000-0000-0000-0000-000000000001):
 *   - owner.a@contaai.test    → owner
 *   - manager.a@contaai.test  → manager
 *   - employee.a@contaai.test → employee
 *   - cliente.a@contaai.test  → client, ligado a c1 (Vetta Alimentos)
 *
 * Workspace B (novo, mínimo, só pra provar isolamento entre tenants):
 *   - owner.b@contaai.test   → owner
 *   - cliente.b@contaai.test → client, ligado ao único cliente de B
 *
 * Todas as credenciais em SEED_PASSWORD (variável de ambiente ou o valor
 * default abaixo) — nunca reaproveitar em nada além deste projeto de teste.
 * Idempotente: se o e-mail já existir, reaproveita o usuário.
 *
 * Uso: bun run scripts/seed-identity.ts
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabaseDomain } from "@/data/repositories/domain-client.server";
import { DEMO_WORKSPACE_ID } from "@/data/demo-workspace";

const PASSWORD = process.env["SEED_PASSWORD"] ?? "ContaAI!Demo2026";
const WORKSPACE_B_ID = "00000000-0000-0000-0000-000000000002";

async function getOrCreateUser(email: string): Promise<string> {
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw new Error(`Falha ao listar usuários: ${listError.message}`);
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`Falha ao criar usuário ${email}: ${error?.message}`);
  return data.user.id;
}

async function ensureMember(workspaceId: string, userId: string, role: "owner" | "manager" | "employee" | "client", clientId: string | null) {
  const { error: memberError } = await supabaseDomain
    .from("workspace_members")
    .upsert({ workspace_id: workspaceId, user_id: userId, client_id: clientId, status: "active" }, { onConflict: "workspace_id,user_id" });
  if (memberError) throw new Error(`Falha ao vincular membro: ${memberError.message}`);

  const { error: roleError } = await supabaseDomain
    .from("user_roles")
    .upsert({ workspace_id: workspaceId, user_id: userId, role }, { onConflict: "workspace_id,user_id,role" });
  if (roleError) throw new Error(`Falha ao definir papel: ${roleError.message}`);
}

async function main() {
  console.log("== Workspace A (existente) ==");
  const ownerAId = await getOrCreateUser("owner.a@contaai.test");
  await ensureMember(DEMO_WORKSPACE_ID, ownerAId, "owner", null);
  console.log("owner.a@contaai.test →", ownerAId);

  const managerAId = await getOrCreateUser("manager.a@contaai.test");
  await ensureMember(DEMO_WORKSPACE_ID, managerAId, "manager", null);
  console.log("manager.a@contaai.test →", managerAId);

  const employeeAId = await getOrCreateUser("employee.a@contaai.test");
  await ensureMember(DEMO_WORKSPACE_ID, employeeAId, "employee", null);
  console.log("employee.a@contaai.test →", employeeAId);

  const clientAId = await getOrCreateUser("cliente.a@contaai.test");
  await ensureMember(DEMO_WORKSPACE_ID, clientAId, "client", "c1");
  console.log("cliente.a@contaai.test → c1 (Vetta Alimentos)");

  console.log("\n== Workspace B (novo, mínimo) ==");
  // workspaces é tabela da Fase 1 — não está no DomainDatabase (repositories
  // do domínio nunca escrevem nela) — usa supabaseAdmin, que já conhece o
  // schema real gerado.
  const { error: wsError } = await supabaseAdmin
    .from("workspaces")
    .upsert({ id: WORKSPACE_B_ID, name: "Workspace B — Teste de Isolamento", slug: "workspace-b-teste", created_by: "00000000-0000-0000-0000-000000000009" }, { onConflict: "id" });
  if (wsError) throw new Error(`Falha ao criar workspace B: ${wsError.message}`);

  const { error: deptError } = await supabaseDomain
    .from("departments")
    .upsert({ workspace_id: WORKSPACE_B_ID, name: "Fiscal" }, { onConflict: "workspace_id,name" });
  if (deptError) throw new Error(`Falha ao criar departamento de B: ${deptError.message}`);
  const { data: deptRow } = await supabaseDomain.from("departments").select("id").eq("workspace_id", WORKSPACE_B_ID).eq("name", "Fiscal").single();
  const deptId = deptRow!.id;

  await supabaseDomain.from("employees").upsert({
    id: "b-e1", workspace_id: WORKSPACE_B_ID, name: "Funcionário B", role: "Analista", department_id: deptId,
    capacity_hours: 168, allocated_hours: 100, monthly_cost: 4000, cost_per_hour: 24, productivity: 80, sla: 90, rework: 5,
  });

  await supabaseDomain.from("clients").upsert({
    id: "b-c1", workspace_id: WORKSPACE_B_ID, name: "Empresa Confidencial B", cnpj: "99.999.999/0001-99", segment: "Segredo Industrial B",
    regime: "Simples Nacional", revenue: 500000, revenue_last_period: 450000, headcount: 5, headcount_last_period: 4,
    fee: 1500, fee_last_period: 1500, cost: 900, owner: "Funcionário B", department_id: deptId, nps: 9, health: 88,
    status: "Ativo", since: "2024-01-01", overdue: 0, hours_month: 10, movements: 20, movements_last_period: 18,
    complexity: 3, complexity_last_period: 3, service_count_last_period: 1, fee_last_adjusted_at: "2026-01-01",
    complaints_30d: 0, late_tasks: 0,
  });
  await supabaseDomain.from("clients").upsert({
    id: "b-c2", workspace_id: WORKSPACE_B_ID, name: "Outra Empresa B", cnpj: "88.888.888/0001-88", segment: "Outro Segredo B",
    regime: "MEI", revenue: 200000, revenue_last_period: 180000, headcount: 2, headcount_last_period: 2,
    fee: 900, fee_last_period: 900, cost: 400, owner: "Funcionário B", department_id: deptId, nps: 8, health: 75,
    status: "Ativo", since: "2025-01-01", overdue: 0, hours_month: 6, movements: 10, movements_last_period: 9,
    complexity: 2, complexity_last_period: 2, service_count_last_period: 1, fee_last_adjusted_at: "2026-01-01",
    complaints_30d: 0, late_tasks: 0,
  });

  await supabaseDomain.from("tasks").upsert({
    id: "b-t1", workspace_id: WORKSPACE_B_ID, client_id: "b-c1", title: "Tarefa confidencial do Workspace B",
    assignee: "Funcionário B", department_id: deptId, due_date: "2026-10-01", status: "A fazer", priority: "Alta", late: false, hours: 4,
  });
  await supabaseDomain.from("pendencies").upsert({
    id: "b-pd1", workspace_id: WORKSPACE_B_ID, client_id: "b-c1", category: "Documento",
    title: "Pendência confidencial do Workspace B", description: "Não deve ser visível para o workspace A.",
    origin: "Manual", assignee: "Funcionário B", priority: "Média", sla_hours: 24, due_date: "2026-10-01",
    status: "Aberta", recommended_action: "—",
  });

  const ownerBId = await getOrCreateUser("owner.b@contaai.test");
  await ensureMember(WORKSPACE_B_ID, ownerBId, "owner", null);
  console.log("owner.b@contaai.test →", ownerBId);

  const clientBId = await getOrCreateUser("cliente.b@contaai.test");
  await ensureMember(WORKSPACE_B_ID, clientBId, "client", "b-c1");
  console.log("cliente.b@contaai.test → b-c1 (Empresa Confidencial B)");

  console.log("\nSenha de todos os usuários de teste:", PASSWORD);
  console.log("\nGrave em .env.test:");
  console.log(`SEED_OWNER_A_EMAIL=owner.a@contaai.test`);
  console.log(`SEED_MANAGER_A_EMAIL=manager.a@contaai.test`);
  console.log(`SEED_EMPLOYEE_A_EMAIL=employee.a@contaai.test`);
  console.log(`SEED_CLIENT_A_EMAIL=cliente.a@contaai.test`);
  console.log(`SEED_OWNER_B_EMAIL=owner.b@contaai.test`);
  console.log(`SEED_CLIENT_B_EMAIL=cliente.b@contaai.test`);
  console.log(`SEED_PASSWORD=${PASSWORD}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
