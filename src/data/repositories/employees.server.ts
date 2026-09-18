import type { DomainClient } from "./domain-client.server";
import { departmentNameFor } from "./departments.server";
import type { Employee } from "@/data/office";
import type { EmployeeRow } from "./domain-types";

async function fromRow(
  client: DomainClient,
  workspaceId: string,
  row: EmployeeRow,
): Promise<Employee> {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    department: (await departmentNameFor(client, workspaceId, row.department_id)) ?? "Contábil",
    manager: row.manager ?? "",
    capacity: Number(row.capacity_hours),
    allocated: Number(row.allocated_hours),
    monthlyCost: Number(row.monthly_cost),
    costPerHour: Number(row.cost_per_hour),
    productivity: Number(row.productivity),
    sla: Number(row.sla),
    rework: Number(row.rework),
  };
}

/**
 * Só leitura — não existia nenhum repository para `employees` antes desta
 * fatia (a tabela já existia, RLS-protegida via employees_staff_read, mas
 * nada no app a consultava; capacity/health-score/profitability rodavam só
 * sobre o array mock de src/data/office.ts). Cadastro/edição de colaborador
 * continua fora de escopo — só a camada de IA/relatórios precisa ler.
 */
export async function listEmployees(
  client: DomainClient,
  workspaceId: string,
): Promise<Employee[]> {
  const { data, error } = await client
    .from("employees")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) throw new Error(`Falha ao listar colaboradores: ${error.message}`);
  return Promise.all((data ?? []).map((row) => fromRow(client, workspaceId, row)));
}
