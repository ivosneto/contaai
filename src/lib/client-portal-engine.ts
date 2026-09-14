import type { Communication, CommunicationChannel, InvoiceStatus, Obligation, Pendency, PendencyCategory } from "@/data/office";

/**
 * Motor do Portal do Cliente — puro, sem UI. A parte mais importante deste
 * arquivo é a FRONTEIRA DE PERMISSÃO: define exatamente o que de dado
 * interno pode ou não ser mostrado ao cliente final, num único lugar
 * documentado, em vez de espalhado em condicionais dentro da UI.
 *
 * Regra: o cliente só vê o que é sobre ele mesmo e o que depende dele.
 * Nunca vê: outros clientes, custo/margem/health score internos, canais ou
 * categorias de uso exclusivamente interno (ex.: "Mensagem interna",
 * pendências de execução ou de estratégia comercial que ainda não foram
 * comunicadas a ele).
 */

export const PORTAL_DEMO_DISCLAIMER =
  "Portal de demonstração — login simulado para um único cliente fixo (sem autenticação real). O que está aqui é exatamente o que um cliente real veria: nenhum custo, margem, health score ou dado de outro cliente é exposto nesta experiência.";

/** Categorias de pendência que dependem do cliente para avançar — as únicas visíveis no portal. */
export const CLIENT_VISIBLE_PENDENCY_CATEGORIES: PendencyCategory[] = ["Documento", "Folha", "Financeiro", "Cliente"];

/** Canais onde o cliente é participante direto da conversa — "Mensagem interna" (nota entre a equipe) nunca aparece aqui. */
export const CLIENT_VISIBLE_CHANNELS: CommunicationChannel[] = ["E-mail", "WhatsApp", "Portal"];

export function isPendencyVisibleToClient(p: Pendency): boolean {
  return CLIENT_VISIBLE_PENDENCY_CATEGORIES.includes(p.category);
}

/** Pendências abertas que o escritório está esperando do cliente — a base da área "O que precisamos de você". */
export function computeClientPendingItems(pendencies: Pendency[], clientId: string): Pendency[] {
  return pendencies
    .filter((p) => p.clientId === clientId && isPendencyVisibleToClient(p) && p.status !== "Concluída" && p.status !== "Cancelada")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** Obrigações travadas esperando alguma ação do cliente. */
export function computeClientWaitingObligations(obligations: Obligation[], clientId: string): Obligation[] {
  return obligations
    .filter((o) => o.clientId === clientId && o.status === "Aguardando cliente")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function isCommunicationVisibleToClient(m: Communication): boolean {
  return CLIENT_VISIBLE_CHANNELS.includes(m.channel);
}

/** Histórico de conversa visível ao cliente (exclui "Mensagem interna"). */
export function computeClientMessages(communications: Communication[], clientId: string): Communication[] {
  return communications
    .filter((m) => m.clientId === clientId && isCommunicationVisibleToClient(m))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Solicitações que o próprio cliente abriu pelo portal, com o status de atendimento. */
export function computeClientRequests(communications: Communication[], clientId: string): Communication[] {
  return communications
    .filter((m) => m.clientId === clientId && m.channel === "Portal")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type PaymentStatus = "Em dia" | "Pendente" | "Vencido";

export function computePaymentStatus(receivable: { status: InvoiceStatus }[]): PaymentStatus {
  if (receivable.some((r) => r.status === "Vencida")) return "Vencido";
  if (receivable.some((r) => r.status === "Pendente")) return "Pendente";
  return "Em dia";
}
