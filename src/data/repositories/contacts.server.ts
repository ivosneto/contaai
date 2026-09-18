import type { DomainClient } from "./domain-client.server";
import type { Contact } from "@/data/office";
import type { ContactRow } from "./domain-types";

function fromRow(row: ContactRow): Contact {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    primary: row.is_primary,
  };
}

/**
 * A tabela `contacts` já existia no schema (Fase 1) mas nunca tinha
 * repository — ativada pela integração de e-mail: é o "identificador
 * disponível" (e-mail/telefone por cliente) usado por
 * identifyClientForSender (src/lib/email/client-matching.ts) para ligar uma
 * mensagem recebida ao cliente certo.
 */
export async function listContacts(client: DomainClient, workspaceId: string): Promise<Contact[]> {
  const { data, error } = await client
    .from("contacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) throw new Error(`Falha ao listar contatos: ${error.message}`);
  return (data ?? []).map(fromRow);
}
