// Isolamento por workspace do conector fiscal — puro, sem I/O (mesmo
// espírito de src/lib/email/client-matching.ts). A Alterdata (e qualquer
// origem fiscal externa) identifica o cliente por CNPJ, não pelo `Client.id`
// interno do ContaAI, e não tem noção nenhuma de workspace: sem esta
// checagem, nada impediria uma chamada informar o CNPJ de um cliente de
// OUTRO workspace e receber o resultado de apuração dele de volta. Todo
// futuro consumidor de FiscalProvider.listObligationStatuses DEVE chamar
// assertCnpjBelongsToWorkspace(cnpj, await listClients(ctx.client,
// ctx.workspaceId)) antes de chamar o provider — ver o comentário em
// provider.types.ts.
import type { Client } from "@/data/office";

export class FiscalWorkspaceIsolationError extends Error {
  constructor(cnpj: string) {
    super(`CNPJ ${cnpj} não corresponde a nenhum cliente deste workspace.`);
    this.name = "FiscalWorkspaceIsolationError";
  }
}

function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/** Lança FiscalWorkspaceIsolationError se `cnpj` não pertencer a nenhum cliente em `workspaceClients`. Compara dígitos apenas — tolera CNPJ formatado (com pontuação) de qualquer um dos dois lados. */
export function assertCnpjBelongsToWorkspace(cnpj: string, workspaceClients: Client[]): void {
  const normalized = normalizeCnpj(cnpj);
  const belongs = workspaceClients.some((client) => normalizeCnpj(client.cnpj) === normalized);
  if (!belongs) throw new FiscalWorkspaceIsolationError(cnpj);
}
