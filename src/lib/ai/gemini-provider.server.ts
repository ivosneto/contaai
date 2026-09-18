// Único provider concreto hoje — Google Gemini (free tier via AI Studio).
// GEMINI_API_KEY nunca é lido aqui: chega pelo construtor, já resolvido por
// provider.server.ts (mesmo espírito de domain-client.server.ts, que também
// só lê a env var num único lugar). Este arquivo é .server.ts: nunca
// importado por um componente, só por provider.server.ts.
import { GoogleGenAI, Type } from "@google/genai";
import type {
  Content,
  GenerateContentParameters,
  GenerateContentResponse,
  Schema,
} from "@google/genai";
import {
  LlmProviderError,
  type JsonSchema,
  type LlmCompleteRequest,
  type LlmExtractDocumentRequest,
  type LlmMessage,
  type LlmProvider,
  type LlmResult,
  type LlmStructuredResult,
  type LlmUsage,
} from "./provider.types";
import { wrapUntrustedData } from "./system-prompt";

const DEFAULT_TIMEOUT_MS = 25_000;

/** Timeout compartilhado por complete()/extractDocument() — um provider "pendurado" (rede lenta, Gemini fora do ar sem responder erro) precisa degradar como qualquer outra indisponibilidade, não travar a requisição indefinidamente. */
function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new LlmProviderError(
            "UNAVAILABLE",
            `Tempo limite (${ms}ms) excedido ao contatar o provider.`,
          ),
        ),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function toGeminiType(type: JsonSchema["type"]): Type {
  switch (type) {
    case "object":
      return Type.OBJECT;
    case "string":
      return Type.STRING;
    case "number":
      return Type.NUMBER;
    case "integer":
      return Type.INTEGER;
    case "boolean":
      return Type.BOOLEAN;
    case "array":
      return Type.ARRAY;
  }
}

function toGeminiSchema(schema: JsonSchema): Schema {
  return {
    type: toGeminiType(schema.type),
    ...(schema.description ? { description: schema.description } : {}),
    ...(schema.enum ? { enum: schema.enum } : {}),
    ...(schema.properties
      ? {
          properties: Object.fromEntries(
            Object.entries(schema.properties).map(([key, value]) => [key, toGeminiSchema(value)]),
          ),
        }
      : {}),
    ...(schema.items ? { items: toGeminiSchema(schema.items) } : {}),
    ...(schema.required ? { required: schema.required } : {}),
  };
}

/** Mapeia o histórico neutro de mensagens para o formato de `contents` do Gemini — a resposta de uma tool volta como um turno "user" com uma parte functionResponse, convenção da própria API de function calling do Gemini. */
function toContents(messages: LlmMessage[]): Content[] {
  return messages.map((message): Content => {
    if ("text" in message) return { role: message.role, parts: [{ text: message.text }] };
    if ("toolCall" in message)
      return {
        role: "model",
        parts: [{ functionCall: { name: message.toolCall.name, args: message.toolCall.args } }],
      };
    return {
      role: "user",
      parts: [
        {
          functionResponse: {
            name: message.toolName,
            response: { result: wrapUntrustedData(message.toolName, message.result) },
          },
        },
      ],
    };
  });
}

function usageOf(response: GenerateContentResponse): LlmUsage {
  return {
    tokensIn: response.usageMetadata?.promptTokenCount ?? 0,
    tokensOut: response.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

/** JSON.parse com o mesmo tratamento de erro nos dois métodos públicos — nunca deixa um JSON inválido do provider virar uma exceção genérica. */
function parseStructured<T>(text: string | undefined): T {
  if (!text)
    throw new LlmProviderError("INVALID_OUTPUT", "O provider não retornou saída estruturada.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new LlmProviderError(
      "INVALID_OUTPUT",
      "A saída estruturada do provider não é um JSON válido.",
    );
  }
}

export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  private async generate(
    params: Omit<GenerateContentParameters, "model">,
  ): Promise<GenerateContentResponse> {
    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const timeoutMs = Number(process.env["AI_TIMEOUT_MS"]) || DEFAULT_TIMEOUT_MS;
    try {
      return await withTimeout(
        ai.models.generateContent({ model: this.model, ...params }),
        timeoutMs,
      );
    } catch (err) {
      if (err instanceof LlmProviderError) throw err;
      throw new LlmProviderError(
        "UNAVAILABLE",
        err instanceof Error ? err.message : "Falha ao contatar o provider Gemini.",
      );
    }
  }

  async complete<T>(req: LlmCompleteRequest): Promise<{ result: LlmResult<T>; usage: LlmUsage }> {
    const response = await this.generate({
      contents: toContents(req.messages),
      config: {
        systemInstruction: req.systemPrompt,
        ...(req.tools && req.tools.length > 0
          ? {
              tools: [
                {
                  functionDeclarations: req.tools.map((tool) => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: toGeminiSchema(tool.parameters),
                  })),
                },
              ],
            }
          : {}),
        ...(req.responseSchema
          ? {
              responseMimeType: "application/json",
              responseSchema: toGeminiSchema(req.responseSchema),
            }
          : {}),
      },
    });

    const usage = usageOf(response);
    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      return {
        result: {
          kind: "tool_call",
          calls: calls.map((call) => ({ name: call.name ?? "", args: call.args ?? {} })),
        },
        usage,
      };
    }
    if (req.responseSchema)
      return { result: { kind: "structured", data: parseStructured<T>(response.text) }, usage };
    return { result: { kind: "text", text: response.text ?? "" }, usage };
  }

  async extractDocument<T>(
    req: LlmExtractDocumentRequest,
  ): Promise<{ result: LlmStructuredResult<T>; usage: LlmUsage }> {
    const response = await this.generate({
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: req.file.mimeType, data: req.file.base64 } },
            { text: req.instructions },
          ],
        },
      ],
      config: {
        systemInstruction: req.systemPrompt,
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(req.responseSchema),
      },
    });
    return {
      result: { kind: "structured", data: parseStructured<T>(response.text) },
      usage: usageOf(response),
    };
  }
}
