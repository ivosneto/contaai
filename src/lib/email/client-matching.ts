import type { Communication, Contact } from "@/data/office";

/**
 * Identificação de cliente a partir do remetente — puro, testável, sem I/O.
 * Usa exatamente os "identificadores disponíveis" que a tarefa pede:
 * remetente exato, domínio, histórico. Ambiguidade (domínio compartilhado
 * por contatos de clientes diferentes) ou nenhum sinal = null — nunca
 * vincula automaticamente com baixa confiança, mesmo que pareça um "quase
 * match".
 */

export type ClientMatchConfidence = "alta" | "média";
export type ClientMatch = { clientId: string; confidence: ClientMatchConfidence };

type MatchContact = Pick<Contact, "clientId" | "email">;
type MatchCommunication = Pick<Communication, "clientId" | "sender">;

function domainOf(email: string): string | undefined {
  return email.trim().toLowerCase().split("@")[1];
}

export function identifyClientForSender(
  senderEmail: string,
  contacts: MatchContact[],
  pastCommunications: MatchCommunication[] = [],
): ClientMatch | null {
  const normalizedSender = senderEmail.trim().toLowerCase();

  // 1) E-mail exato de um contato cadastrado — alta confiança.
  const exactContact = contacts.find((c) => c.email.trim().toLowerCase() === normalizedSender);
  if (exactContact) return { clientId: exactContact.clientId, confidence: "alta" };

  // 2) Já vinculamos esse remetente exato a um cliente antes — histórico, alta confiança.
  const pastMatch = pastCommunications.find(
    (m) => m.clientId && m.sender.trim().toLowerCase() === normalizedSender,
  );
  if (pastMatch?.clientId) return { clientId: pastMatch.clientId, confidence: "alta" };

  const senderDomain = domainOf(normalizedSender);
  if (!senderDomain) return null;

  // 3) Domínio batendo com contato(s) — só conta se apontar pra um ÚNICO cliente; domínio
  // compartilhado por contatos de clientes diferentes é ambíguo, nunca vincula sozinho.
  const domainClientIds = new Set(
    contacts.filter((c) => domainOf(c.email) === senderDomain).map((c) => c.clientId),
  );
  if (domainClientIds.size === 1) {
    const [clientId] = domainClientIds;
    return { clientId: clientId!, confidence: "média" };
  }

  return null;
}
