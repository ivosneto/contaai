import type { JsonSchema } from "./provider.types";

/**
 * Formato pedido ao LlmProvider para classificar um e-mail recebido — mesmo
 * padrão de document-extraction-schema.ts. Mapeia DIRETO para
 * CommunicationClassification (src/data/office.ts) — nenhuma taxonomia nova,
 * reaproveita a união já usada por classifyContent()/inbox-page.tsx.
 */
export const EMAIL_CLASSIFICATION_CATEGORIES = [
  "Documento",
  "Dúvida",
  "Cobrança",
  "Solicitação",
  "Reclamação",
  "Comercial",
  "Urgente",
  "Outros",
] as const;
export const EMAIL_SENTIMENTS = ["Positivo", "Neutro", "Negativo"] as const;
export const EMAIL_PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;

export type RawEmailClassification = {
  category: (typeof EMAIL_CLASSIFICATION_CATEGORIES)[number];
  sentiment: (typeof EMAIL_SENTIMENTS)[number];
  priority: (typeof EMAIL_PRIORITIES)[number];
  requiresAction: boolean;
  suggestedAction: string;
  summary: string;
};

export const EMAIL_CLASSIFICATION_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    category: { type: "string", enum: [...EMAIL_CLASSIFICATION_CATEGORIES] },
    sentiment: { type: "string", enum: [...EMAIL_SENTIMENTS] },
    priority: { type: "string", enum: [...EMAIL_PRIORITIES] },
    requiresAction: {
      type: "boolean",
      description:
        "true se o e-mail pede alguma ação do escritório (responder, gerar documento, resolver cobrança etc.).",
    },
    suggestedAction: {
      type: "string",
      description:
        "Frase curta com a próxima ação recomendada — vazia se requiresAction for false.",
    },
    summary: {
      type: "string",
      description: "Resumo em até 2 frases, em português, do que o e-mail pede/informa.",
    },
  },
  required: ["category", "sentiment", "priority", "requiresAction", "suggestedAction", "summary"],
};
