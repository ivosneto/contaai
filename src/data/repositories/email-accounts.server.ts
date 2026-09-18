import type { DomainClient } from "./domain-client.server";
import type { EmailAccountRow } from "./domain-types";
import type { EmailTokens } from "@/lib/email/provider.types";
import { decryptToken, encryptToken } from "@/lib/email/token-crypto.server";

export type EmailAccountStatus = EmailAccountRow["status"];

/** Forma exposta pra UI/status — NUNCA carrega tokens, mesmo que o caller esqueça de filtrar (o tipo em si não tem o campo). */
export type EmailAccountSummary = {
  id: string;
  provider: string;
  emailAddress: string;
  status: EmailAccountStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
  createdAt: string;
};

/** Só usado internamente pelo núcleo de sincronização — nunca retornado por um server function. */
export type EmailAccountForSync = EmailAccountSummary & {
  tokens: EmailTokens;
  syncCursor: string | null;
};

function toSummary(row: EmailAccountRow): EmailAccountSummary {
  return {
    id: row.id,
    provider: row.provider,
    emailAddress: row.email_address,
    status: row.status,
    lastSyncedAt: row.last_synced_at,
    lastError: row.last_error,
    createdAt: row.created_at,
  };
}

/** Uma conta por workspace hoje (UNIQUE(workspace_id, email_address) na migration, mas a UI só liga uma por vez). */
export async function getEmailAccountSummary(
  client: DomainClient,
  workspaceId: string,
): Promise<EmailAccountSummary | null> {
  const { data, error } = await client
    .from("email_accounts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar conta de e-mail: ${error.message}`);
  return data ? toSummary(data) : null;
}

/** Só para o núcleo de sincronização (syncEmailAccountCore) — decripta os tokens aqui, nunca antes. */
export async function getEmailAccountForSync(
  client: DomainClient,
  workspaceId: string,
): Promise<EmailAccountForSync | null> {
  const { data, error } = await client
    .from("email_accounts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar conta de e-mail: ${error.message}`);
  if (
    !data ||
    !data.access_token_encrypted ||
    !data.refresh_token_encrypted ||
    !data.token_expires_at
  )
    return null;
  return {
    ...toSummary(data),
    syncCursor: data.sync_cursor,
    tokens: {
      accessToken: decryptToken(data.access_token_encrypted),
      refreshToken: decryptToken(data.refresh_token_encrypted),
      expiresAt: data.token_expires_at,
    },
  };
}

export async function upsertEmailAccountConnection(
  client: DomainClient,
  workspaceId: string,
  input: { emailAddress: string; tokens: EmailTokens; connectedByUserId: string },
): Promise<void> {
  const { error } = await client.from("email_accounts").upsert(
    {
      workspace_id: workspaceId,
      provider: "gmail",
      email_address: input.emailAddress,
      status: "connected",
      access_token_encrypted: encryptToken(input.tokens.accessToken),
      refresh_token_encrypted: encryptToken(input.tokens.refreshToken),
      token_expires_at: input.tokens.expiresAt,
      last_error: null,
      connected_by_user_id: input.connectedByUserId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,email_address" },
  );
  if (error) throw new Error(`Falha ao conectar conta de e-mail: ${error.message}`);
}

/**
 * Lock de sincronização: transição condicional para "syncing" — só grava se
 * o status atual NÃO for "syncing". Evita que dois disparos concorrentes de
 * "Sincronizar agora" (duplo clique, duas abas) processem a mesma mensagem
 * em paralelo e criem propostas/anexos/timeline duplicados apesar do dedupe
 * por id, que só protege entre execuções sequenciais.
 */
export async function tryStartEmailSync(
  client: DomainClient,
  accountId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("email_accounts")
    .update({ status: "syncing", updated_at: new Date().toISOString() })
    .eq("id", accountId)
    .neq("status", "syncing")
    .select("id");
  if (error) throw new Error(`Falha ao iniciar sincronização: ${error.message}`);
  return (data ?? []).length > 0;
}

export async function updateEmailAccountSyncState(
  client: DomainClient,
  accountId: string,
  input: {
    status: EmailAccountStatus;
    syncCursor?: string;
    lastError?: string | null;
    tokens?: EmailTokens;
  },
): Promise<void> {
  const { error } = await client
    .from("email_accounts")
    .update({
      status: input.status,
      last_synced_at: new Date().toISOString(),
      last_error: input.lastError ?? null,
      updated_at: new Date().toISOString(),
      ...(input.syncCursor !== undefined ? { sync_cursor: input.syncCursor } : {}),
      ...(input.tokens
        ? {
            access_token_encrypted: encryptToken(input.tokens.accessToken),
            refresh_token_encrypted: encryptToken(input.tokens.refreshToken),
            token_expires_at: input.tokens.expiresAt,
          }
        : {}),
    })
    .eq("id", accountId);
  if (error) throw new Error(`Falha ao atualizar estado de sincronização: ${error.message}`);
}

export async function disconnectEmailAccount(
  client: DomainClient,
  workspaceId: string,
): Promise<void> {
  const { error } = await client.from("email_accounts").delete().eq("workspace_id", workspaceId);
  if (error) throw new Error(`Falha ao desconectar conta de e-mail: ${error.message}`);
}
