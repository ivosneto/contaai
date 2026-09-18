/**
 * Testes do scaffold de conector fiscal (src/lib/fiscal/) — não fala com
 * rede nem Supabase: só confirma que (1) a fábrica nunca finge estar
 * configurada quando falta credencial, e (2) o provider concreto nunca
 * finge ler um endpoint que não foi confirmado publicamente — ele deve
 * lançar um erro claro, não simular/inventar um retorno.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { AlterdataProvider } from "@/lib/fiscal/alterdata-provider.server";
import { FiscalProviderError } from "@/lib/fiscal/provider.types";

const ENV_KEYS = ["FISCAL_PROVIDER", "ALTERDATA_API_TOKEN", "ALTERDATA_API_BASE_URL"] as const;
const originalEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

describe("getFiscalProvider — nunca finge estar configurado", () => {
  test("sem FISCAL_PROVIDER, lança NOT_CONFIGURED", async () => {
    delete process.env["FISCAL_PROVIDER"];
    const { getFiscalProvider } = await import("@/lib/fiscal/provider.server");
    expect(() => getFiscalProvider()).toThrow(FiscalProviderError);
  });

  test("FISCAL_PROVIDER=alterdata sem token/base URL, lança NOT_CONFIGURED", async () => {
    process.env["FISCAL_PROVIDER"] = "alterdata";
    delete process.env["ALTERDATA_API_TOKEN"];
    delete process.env["ALTERDATA_API_BASE_URL"];
    const { getFiscalProvider } = await import("@/lib/fiscal/provider.server");
    expect(() => getFiscalProvider()).toThrow(FiscalProviderError);
  });

  test("FISCAL_PROVIDER desconhecido lança NOT_CONFIGURED, não um provider silencioso", async () => {
    process.env["FISCAL_PROVIDER"] = "sistema-inexistente";
    const { getFiscalProvider } = await import("@/lib/fiscal/provider.server");
    expect(() => getFiscalProvider()).toThrow(FiscalProviderError);
  });

  test("com credenciais presentes, devolve um AlterdataProvider", async () => {
    process.env["FISCAL_PROVIDER"] = "alterdata";
    process.env["ALTERDATA_API_TOKEN"] = "fake-token";
    process.env["ALTERDATA_API_BASE_URL"] = "https://eplugin.pack.alterdata.com.br";
    const { getFiscalProvider } = await import("@/lib/fiscal/provider.server");
    const provider = getFiscalProvider();
    expect(provider.name).toBe("alterdata");
  });
});

describe("AlterdataProvider — nunca inventa dado de um endpoint não confirmado", () => {
  test("listObligationStatuses lança NOT_CONFIGURED em vez de simular uma resposta", async () => {
    const provider = new AlterdataProvider("fake-token", "https://eplugin.pack.alterdata.com.br");
    await expect(provider.listObligationStatuses("00.000.000/0001-00", "2026-09")).rejects.toThrow(
      FiscalProviderError,
    );
  });
});
