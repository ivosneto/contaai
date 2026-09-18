// Fábrica de provider — único ponto que decide QUAL LLM está ativo, lendo
// AI_PROVIDER (env, sem prefixo VITE_ — nunca chega ao browser). Um só caso
// hoje (Gemini); trocar de provider no futuro é implementar LlmProvider
// (provider.types.ts) e adicionar um `case` aqui, nada mais no produto muda.
import { GeminiProvider } from "./gemini-provider.server";
import { LlmProviderError, type LlmProvider } from "./provider.types";

export function getLlmProvider(): LlmProvider {
  const provider = process.env["AI_PROVIDER"] ?? "gemini";
  switch (provider) {
    case "gemini": {
      const apiKey = process.env["GEMINI_API_KEY"];
      if (!apiKey)
        throw new LlmProviderError(
          "UNAVAILABLE",
          "GEMINI_API_KEY ausente — configure a variável de ambiente para habilitar o Copilot com IA.",
        );
      return new GeminiProvider(apiKey, process.env["GEMINI_MODEL"] ?? "gemini-2.5-flash");
    }
    default:
      throw new LlmProviderError("UNAVAILABLE", `AI_PROVIDER desconhecido: "${provider}".`);
  }
}
