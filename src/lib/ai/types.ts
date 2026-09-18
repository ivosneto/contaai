import type { JsonSchema } from "./provider.types";

export type CopilotConfidence = "alta" | "media" | "baixa";

export type CopilotProposedActionKind = "reassign-tasks" | "create-pendency";

export type CopilotProposedAction = {
  /** id da linha ai_actions já gravada com status "proposed" — a UI aprova/rejeita por este id, nunca reenvia o payload. */
  id: string;
  label: string;
  description: string;
  kind: CopilotProposedActionKind;
};

/** Formato pedido ao LLM via responseSchema — nunca texto livre parseado na unha. */
export type CopilotStructuredAnswer = {
  text: string;
  confidence: CopilotConfidence;
  citations: { label: string; value: string }[];
  insights: string[];
  recommendations: string[];
  proposedActions: {
    label: string;
    description: string;
    kind: CopilotProposedActionKind;
    payload: {
      taskIds?: string[];
      targetAssignee?: string;
      clientId?: string;
      title?: string;
      description?: string;
      assignee?: string;
      priority?: string;
      category?: string;
    };
  }[];
};

export const COPILOT_RESPONSE_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    text: {
      type: "string",
      description: "Resposta em português do Brasil, citando os números usados.",
    },
    confidence: { type: "string", enum: ["alta", "media", "baixa"] },
    citations: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, value: { type: "string" } },
        required: ["label", "value"],
      },
    },
    insights: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
    proposedActions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          description: { type: "string" },
          kind: { type: "string", enum: ["reassign-tasks", "create-pendency"] },
          payload: {
            type: "object",
            properties: {
              taskIds: { type: "array", items: { type: "string" } },
              targetAssignee: { type: "string" },
              clientId: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              assignee: { type: "string" },
              priority: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica"] },
              category: {
                type: "string",
                enum: [
                  "Documento",
                  "Fiscal",
                  "Contábil",
                  "Folha",
                  "Financeiro",
                  "Comercial",
                  "Cliente",
                  "Interna",
                ],
              },
            },
          },
        },
        required: ["label", "description", "kind", "payload"],
      },
    },
  },
  required: ["text", "confidence", "citations", "insights", "recommendations", "proposedActions"],
};

/** O que a UI (copilot.tsx) efetivamente recebe do server function — proposedActions já vêm com o id real da linha ai_actions, nunca o payload cru. */
export type CopilotResponse = {
  text: string;
  confidence: CopilotConfidence;
  citations: { label: string; value: string }[];
  insights: string[];
  recommendations: string[];
  proposedActions: CopilotProposedAction[];
  /** true quando o provider falhou e a resposta veio do motor determinístico de fallback (copilot-engine.ts). */
  degraded: boolean;
};
