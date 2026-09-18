// Fábrica de provider fiscal — mesmo desenho de src/lib/email/provider.server.ts:
// um só caso hoje (Alterdata, a única das três fontes pedidas com API REST/
// JSON pública confirmada — ver alterdata-provider.server.ts e catalog.ts
// para Sittax/Gestta, ainda sem caminho de API confirmado). FISCAL_PROVIDER
// e as credenciais são sempre server-only (sem prefixo VITE_).
import { AlterdataProvider } from "./alterdata-provider.server";
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
    default:
      throw new FiscalProviderError("NOT_CONFIGURED", `FISCAL_PROVIDER desconhecido: "${provider}".`);
  }
}
