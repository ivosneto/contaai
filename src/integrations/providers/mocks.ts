import type { Contact } from "@/data/office";
import type { DocumentStorageProvider, InboundDocumentPayload, InboundMessagePayload, MessagingProvider } from "./types";

/**
 * Implementações mock dos providers de mensageria/armazenamento — só para
 * demonstrar, de ponta a ponta, como uma integração real se encaixaria:
 * `receiveInbound` produz o payload normalizado que um webhook real também
 * produziria; `resolveClientFromContact` é o passo de identificação
 * ("ContaAI identifica → cliente") que precisa rodar antes de qualquer
 * documento/mensagem poder ser processado.
 */

let mockSeq = 0;
function nextExternalId(prefix: string) {
  mockSeq += 1;
  return `${prefix}-mock-${mockSeq}`;
}

export const mockWhatsAppProvider: MessagingProvider = {
  id: "whatsapp",
  receiveInbound: (from, text) => ({
    externalId: nextExternalId("wa"),
    channel: "WhatsApp",
    from,
    text,
    receivedAt: new Date().toISOString().slice(0, 10),
  }),
};

export const mockEmailProvider: MessagingProvider = {
  id: "email",
  receiveInbound: (from, text) => ({
    externalId: nextExternalId("em"),
    channel: "E-mail",
    from,
    text,
    receivedAt: new Date().toISOString().slice(0, 10),
  }),
};

export const mockGoogleDriveProvider: DocumentStorageProvider = {
  id: "google-drive",
  receiveInbound: (fileName) => ({
    externalId: nextExternalId("gd"),
    source: "Google Drive",
    fileName,
    receivedAt: new Date().toISOString().slice(0, 10),
  }),
};

/**
 * "ContaAI identifica → cliente": resolve de quem é um contato externo
 * (telefone ou e-mail) comparando com os contatos cadastrados. Retorna
 * `null` quando não identifica — caso real que qualquer integração precisa
 * tratar (remetente desconhecido), não escondido atrás de um match sempre
 * bem-sucedido.
 */
export function resolveClientFromContact(value: string, contacts: Pick<Contact, "clientId" | "email" | "phone">[]): string | null {
  const normalized = value.trim().toLowerCase();
  const match = contacts.find((c) => c.email.toLowerCase() === normalized || c.phone.replace(/\D/g, "") === normalized.replace(/\D/g, ""));
  return match?.clientId ?? null;
}

export type ResolvedInboundMessage = {
  payload: InboundMessagePayload;
  clientId: string | null;
};

export function simulateInboundMessage(provider: MessagingProvider, from: string, text: string, contacts: Pick<Contact, "clientId" | "email" | "phone">[]): ResolvedInboundMessage {
  const payload = provider.receiveInbound(from, text);
  return { payload, clientId: resolveClientFromContact(from, contacts) };
}

export type ResolvedInboundDocument = {
  payload: InboundDocumentPayload;
  clientId: string | null;
};

export function simulateInboundDocument(provider: DocumentStorageProvider, fileName: string, from: string, contacts: Pick<Contact, "clientId" | "email" | "phone">[]): ResolvedInboundDocument {
  const payload = provider.receiveInbound(fileName);
  return { payload, clientId: resolveClientFromContact(from, contacts) };
}
