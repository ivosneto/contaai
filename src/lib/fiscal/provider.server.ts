// Fábrica de provider fiscal — mesmo desenho de src/lib/email/provider.server.ts:
// dois casos hoje (Alterdata e Sittax, ver catalog.ts), nenhum dos dois com
// a leitura de obrigações confirmada ainda (ver alterdata-provider.server.ts
// e sittax-provider.server.ts) — a fábrica só monta o provider com a
// config dada, não valida se o endpoint real existe. FISCAL_PROVIDER e as
// credenciais são sempre server-only (sem prefixo VITE_).
import { AlterdataProvider } from "./alterdata-provider.server";
import { SittaxProvider } from "./sittax-provider.server";
import { FiscalProviderError, type FiscalProvider } from "./provider.types";

export function getFiscalProvider(): FiscalProvider {
  const provider = process.env["FISCAL_PROVIDER"];
  if (!provider)
    throw new FiscalProviderError(
      "NOT_CONFIGURED",
      "Nenhum provider fiscal configurado (FISCAL_PROVIDER ausente).",
    );
  switch (provider) {
    case "alterdata": {
      const apiToken = process.env["ALTERDATA_API_TOKEN"];
      const baseUrl = process.env["ALTERDATA_API_BASE_URL"];
      if (!apiToken || !baseUrl)
        throw new FiscalProviderError(
          "NOT_CONFIGURED",
          "Integração com Alterdata não configurada (ALTERDATA_API_TOKEN/ALTERDATA_API_BASE_URL ausentes).",
        );
      return new AlterdataProvider(apiToken, baseUrl);
    }
    case "sittax": {
      const apiKey = process.env["SITTAX_API_KEY"];
      const apiKeyHeader = process.env["SITTAX_API_KEY_HEADER"];
      const baseUrl = process.env["SITTAX_API_BASE_URL"];
      if (!apiKey || !apiKeyHeader || !baseUrl)
        throw new FiscalProviderError(
          "NOT_CONFIGURED",
          "Integração com Sittax não configurada (SITTAX_API_KEY/SITTAX_API_KEY_HEADER/SITTAX_API_BASE_URL ausentes).",
        );
      return new SittaxProvider(apiKey, apiKeyHeader, baseUrl);
    }
    default:
      throw new FiscalProviderError(
        "NOT_CONFIGURED",
        `FISCAL_PROVIDER desconhecido: "${provider}".`,
      );
  }
}
