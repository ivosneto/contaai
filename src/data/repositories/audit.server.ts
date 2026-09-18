import type { DomainClient } from "./domain-client.server";

export type AuditEventInput = {
  workspaceId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

/**
 * audit_logs (Fase 1) é o log de SEGURANÇA/administrativo — separado de
 * timeline_events (histórico operacional do cliente). Leitura restrita a
 * owner/admin pela policy audit_read_privileged já existente; gravação
 * exige is_staff_member + actor_id = auth.uid() (audit_logs_staff_insert,
 * 20260918090000_identity_rls.sql) — um usuário nunca grava um evento em
 * nome de outro.
 */
export async function logAuditEvent(client: DomainClient, input: AuditEventInput): Promise<void> {
  const { error } = await client.from("audit_logs").insert({
    workspace_id: input.workspaceId,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    metadata: input.metadata ?? {},
  });
  // Falha de auditoria nunca derruba a ação principal — só registra no
  // console do servidor. Bloquear a operação por causa do log seria pior do
  // que perder um evento de auditoria isolado.
  if (error) console.error(`[audit] falha ao registrar ${input.action} em ${input.entityType}/${input.entityId}: ${error.message}`);
}
