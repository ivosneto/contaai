/**
 * Contrato comum para qualquer integração externa do ContaAI.
 *
 * Hoje TODO provedor deste diretório é um MOCK — nenhuma chamada de rede
 * real acontece em lugar nenhum. A separação é proposital:
 *
 *  - Os motores de negócio (`src/lib/*-engine.ts`) nunca importam um
 *    provider. Eles só recebem dados já normalizados (ex.: `NewDocumentInput`,
 *    `clientId`), então não importa se esses dados vieram de um mock ou de
 *    uma API real amanhã.
 *  - Nenhum provider conhece a store ou a UI — cada um só sabe produzir um
 *    payload normalizado (`InboundMessagePayload`, `InboundDocumentPayload`,
 *    etc.) a partir do formato do sistema externo.
 *  - Quando uma integração real existir, ela implementa a mesma interface
 *    definida aqui e é registrada no catálogo (`catalog.ts`) no lugar do
 *    mock — nada no resto do app precisa mudar.
 */

export type IntegrationCategory =
  | "dominio-fiscal" // Domínio e sistemas fiscais/contábeis equivalentes
  | "mensageria" // WhatsApp, e-mail
  | "armazenamento" // Google Drive e afins
  | "planilhas" // Excel / Google Sheets
  | "produtividade" // Trello e afins
  | "crm" // CRM externo
  | "financeiro" // sistemas financeiros / ERP
  | "open-finance" // Open Finance
  | "governo"; // eSocial, SPED, Receita Federal

/** "real" = tem OAuth/API de verdade implementada (ver src/lib/email/ + src/data/server-functions/email-integration.ts para o único caso hoje, e-mail) — o card correspondente na UI (integrations-page.tsx) mostra o status ao vivo em vez do badge "Mock" genérico. */
export type IntegrationStatus = "mock" | "nao_configurado" | "real";

/** O que a integração, quando real, alimentaria no ContaAI — documentação, não comportamento. */
export type IntegrationFeeds =
  "documentos" | "comunicacao" | "obrigacoes" | "financeiro" | "comercial" | "tarefas";

export type IntegrationDefinition = {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
  feeds: IntegrationFeeds[];
  /** Por que hoje é mock, e o que muda quando virar integração real. */
  disclaimer: string;
};

export const CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  "dominio-fiscal": "Domínio / sistemas fiscais",
  mensageria: "Mensageria",
  armazenamento: "Armazenamento de arquivos",
  planilhas: "Planilhas",
  produtividade: "Produtividade",
  crm: "CRM",
  financeiro: "Financeiro",
  "open-finance": "Open Finance",
  governo: "Governo",
};

// ---------- payloads normalizados (o formato que um provider real também devolveria) ----------

export type InboundMessagePayload = {
  externalId: string;
  channel: "WhatsApp" | "E-mail";
  from: string; // telefone ou e-mail de origem, como viria do sistema externo
  text: string;
  receivedAt: string;
};

export type InboundDocumentPayload = {
  externalId: string;
  source: "Google Drive" | "E-mail" | "WhatsApp";
  fileName: string;
  receivedAt: string;
};

/** Provider de mensageria (WhatsApp, e-mail): produz mensagens normalizadas a partir do formato do sistema externo. */
export type MessagingProvider = {
  id: string;
  receiveInbound: (from: string, text: string) => InboundMessagePayload;
};

/** Provider de armazenamento (Drive e afins): produz documentos normalizados a partir de um arquivo externo. */
export type DocumentStorageProvider = {
  id: string;
  receiveInbound: (fileName: string) => InboundDocumentPayload;
};
