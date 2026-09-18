import { ALL_DOCUMENT_TYPES, ALL_PENDENCY_CATEGORIES } from "@/lib/documents-engine";
import type { JsonSchema } from "./provider.types";

/**
 * Formato pedido ao Gemini para extração de documento. `fieldsFound` é a
 * defesa central contra invenção: o código (document-intelligence.ts) só
 * aceita o valor de um campo se o nome dele estiver em `fieldsFound` —
 * mesmo que o modelo tenha preenchido um valor para um campo ausente
 * (comportamento conhecido de LLMs), o código ignora esse valor porque a
 * ausência em `fieldsFound` é a fonte de verdade sobre "isso foi lido de
 * verdade no documento".
 */
export const EXTRACTABLE_FIELDS = [
  "cnpj",
  "razaoSocial",
  "tipoDetectado",
  "numero",
  "valor",
  "vencimento",
  "competencia",
  "fornecedor",
  "categoria",
] as const;
export type ExtractableField = (typeof EXTRACTABLE_FIELDS)[number];

export type RawDocumentExtraction = {
  fieldsFound: string[];
  fieldConfidence: Partial<Record<ExtractableField, number>>;
  cnpj?: string;
  razaoSocial?: string;
  tipoDetectado?: string;
  numero?: string;
  valor?: number;
  vencimento?: string;
  competencia?: string;
  fornecedor?: string;
  categoria?: string;
};

export const DOCUMENT_EXTRACTION_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    fieldsFound: {
      type: "array",
      items: { type: "string", enum: [...EXTRACTABLE_FIELDS] },
      description:
        "Nomes exatos dos campos que você de fato leu no documento — únicos que o sistema vai considerar preenchidos.",
    },
    fieldConfidence: {
      type: "object",
      properties: Object.fromEntries(
        EXTRACTABLE_FIELDS.map((f) => [f, { type: "number", description: "0-100" }]),
      ),
      description: "Confiança por campo, só para os campos listados em fieldsFound.",
    },
    cnpj: { type: "string" },
    razaoSocial: { type: "string" },
    tipoDetectado: { type: "string", enum: ALL_DOCUMENT_TYPES },
    numero: { type: "string" },
    valor: { type: "number" },
    vencimento: { type: "string", description: "AAAA-MM-DD" },
    competencia: { type: "string", description: "AAAA-MM" },
    fornecedor: { type: "string" },
    categoria: { type: "string", enum: ALL_PENDENCY_CATEGORIES },
  },
  required: ["fieldsFound", "fieldConfidence"],
};
