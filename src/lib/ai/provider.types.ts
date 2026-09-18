/**
 * Abstração de provider de LLM — nenhum segredo aqui, só tipos. Um único
 * provider concreto existe hoje (GeminiProvider, em gemini-provider.server.ts),
 * mas o resto do sistema (context builder, tools, o server function do
 * Copilot) só conhece esta interface, nunca o SDK do Gemini diretamente —
 * trocar de provider no futuro é implementar LlmProvider de novo e adicionar
 * um caso em provider.server.ts, sem tocar em mais nada.
 */

export type JsonSchema = {
  type: "object" | "string" | "number" | "integer" | "boolean" | "array";
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: string[];
};

export type LlmToolDef = { name: string; description: string; parameters: JsonSchema };

/** Histórico de conversa + rodadas de tool calling, num formato neutro de provider. */
export type LlmMessage =
  | { role: "user" | "model"; text: string }
  | { role: "model"; toolCall: { name: string; args: Record<string, unknown> } }
  | { role: "tool"; toolName: string; result: unknown };

export type LlmToolCallRequest = {
  kind: "tool_call";
  calls: { name: string; args: Record<string, unknown> }[];
};
export type LlmStructuredResult<T> = { kind: "structured"; data: T };
export type LlmTextResult = { kind: "text"; text: string };
export type LlmResult<T = unknown> = LlmToolCallRequest | LlmStructuredResult<T> | LlmTextResult;

export type LlmCompleteRequest = {
  systemPrompt: string;
  messages: LlmMessage[];
  /** Quando presente, o modelo pode escolher chamar uma delas em vez de responder — resultado vem como LlmToolCallRequest. */
  tools?: LlmToolDef[];
  /** Quando presente, a resposta final deve ser JSON estruturado nesse formato — nunca texto livre. */
  responseSchema?: JsonSchema;
};

export type LlmUsage = { tokensIn: number; tokensOut: number };

/** Um arquivo (PDF/imagem) inline em base64 — usado só por extractDocument, nunca por complete(). */
export type LlmFileInput = { mimeType: string; base64: string };

export type LlmExtractDocumentRequest = {
  systemPrompt: string;
  instructions: string;
  file: LlmFileInput;
  responseSchema: JsonSchema;
};

export interface LlmProvider {
  readonly name: string;
  complete<T = unknown>(
    req: LlmCompleteRequest,
  ): Promise<{ result: LlmResult<T>; usage: LlmUsage }>;
  /** Extração de documento (OCR/document intelligence) — mesmo mecanismo de structured output de complete(), mas o input é um arquivo, não uma conversa. Sempre retorna "structured" ou lança LlmProviderError. */
  extractDocument<T = unknown>(
    req: LlmExtractDocumentRequest,
  ): Promise<{ result: LlmStructuredResult<T>; usage: LlmUsage }>;
}

export class LlmProviderError extends Error {
  constructor(
    public code: "UNAVAILABLE" | "INVALID_OUTPUT" | "RATE_LIMITED",
    message: string,
  ) {
    super(message);
  }
}
