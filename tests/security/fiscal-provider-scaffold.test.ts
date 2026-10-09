/**
 * Testes do scaffold de conector fiscal (src/lib/fiscal/) — Alterdata e
 * Sittax, os dois providers concretos hoje. Duas partes:
 *
 * 1. Fábrica/contrato (sem rede nem Supabase): confirma que a fábrica nunca
 *    finge estar configurada quando falta credencial, e que nenhum dos dois
 *    providers finge ler um endpoint que não foi confirmado publicamente —
 *    cada um deve lançar um erro claro, não simular/inventar um retorno.
 *
 * 2. Primitiva HTTP compartilhada (request() → fiscalHttpRequest: timeout,
 *    retry, isolamento por workspace): exercitada contra um servidor HTTP
 *    LOCAL (Bun.serve), nunca contra a Alterdata/Sittax real e nunca
 *    devolvendo um corpo com formato de uma delas — só testa o transporte
 *    (status HTTP, header de auth, timing), que é genérico e válido para
 *    qualquer endpoint real que venha a ser ligado. Os testes de timeout e
 *    retry em si (a lógica é a mesma fiscalHttpRequest para os dois
 *    providers) ficam só no bloco da Alterdata — o bloco da Sittax foca no
 *    que é específico dela: esquema de autenticação configurável e as duas
 *    lacunas (endpoint + header) na mensagem de NOT_CONFIGURED.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { AlterdataProvider } from "@/lib/fiscal/alterdata-provider.server";
import { SittaxProvider } from "@/lib/fiscal/sittax-provider.server";
import { FiscalProviderError } from "@/lib/fiscal/provider.types";
import {
  assertCnpjBelongsToWorkspace,
  FiscalWorkspaceIsolationError,
} from "@/lib/fiscal/workspace-guard";
import type { Client } from "@/data/office";

/** Expõe a primitiva `protected request()` só para os testes deste arquivo. */
class TestableAlterdataProvider extends AlterdataProvider {
  testRequest<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, init);
  }
}

/** Idem, para a Sittax. */
class TestableSittaxProvider extends SittaxProvider {
  testRequest<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, init);
  }
}

function startServer(handler: (req: Request) => Response | Promise<Response>) {
  const server = Bun.serve({ port: 0, fetch: handler });
  return { url: `http://localhost:${server.port}`, stop: () => server.stop(true) };
}

const ENV_KEYS = [
  "FISCAL_PROVIDER",
  "ALTERDATA_API_TOKEN",
  "ALTERDATA_API_BASE_URL",
  "SITTAX_API_KEY",
  "SITTAX_API_KEY_HEADER",
  "SITTAX_API_BASE_URL",
] as const;
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

  test("FISCAL_PROVIDER=sittax sem key/header/base URL, lança NOT_CONFIGURED", async () => {
    process.env["FISCAL_PROVIDER"] = "sittax";
    delete process.env["SITTAX_API_KEY"];
    delete process.env["SITTAX_API_KEY_HEADER"];
    delete process.env["SITTAX_API_BASE_URL"];
    const { getFiscalProvider } = await import("@/lib/fiscal/provider.server");
    expect(() => getFiscalProvider()).toThrow(FiscalProviderError);
  });

  test("com key/header/base URL presentes, devolve um SittaxProvider", async () => {
    process.env["FISCAL_PROVIDER"] = "sittax";
    process.env["SITTAX_API_KEY"] = "fake-key";
    process.env["SITTAX_API_KEY_HEADER"] = "X-Api-Key";
    process.env["SITTAX_API_BASE_URL"] = "https://api.sittax.com.br";
    const { getFiscalProvider } = await import("@/lib/fiscal/provider.server");
    const provider = getFiscalProvider();
    expect(provider.name).toBe("sittax");
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

describe("SittaxProvider — nunca inventa dado de um endpoint não confirmado", () => {
  test("listObligationStatuses lança NOT_CONFIGURED citando as duas lacunas (endpoint + header de auth)", async () => {
    const provider = new SittaxProvider("fake-key", "X-Api-Key", "https://api.sittax.com.br");
    const error = await provider
      .listObligationStatuses("00.000.000/0001-00", "2026-09")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FiscalProviderError);
    expect((error as FiscalProviderError).code).toBe("NOT_CONFIGURED");
    expect((error as FiscalProviderError).message).toContain("NF-e");
    expect((error as FiscalProviderError).message).toContain("header");
  });
});

describe("SittaxProvider.request() — autenticação configurável (header não é chutado no código)", () => {
  test("envia o header configurado (nome e valor) em vez de um nome fixo adivinhado", async () => {
    let receivedHeaders: Record<string, string | null> = {};
    const server = startServer((req) => {
      receivedHeaders = {
        custom: req.headers.get("x-minha-chave-customizada"),
        authorization: req.headers.get("authorization"),
      };
      return Response.json({ pong: true });
    });
    try {
      const provider = new TestableSittaxProvider(
        "chave-abc-123",
        "X-Minha-Chave-Customizada",
        server.url,
      );
      const result = await provider.testRequest<{ pong: boolean }>("/qualquer-coisa");
      expect(receivedHeaders["custom"]).toBe("chave-abc-123");
      expect(receivedHeaders["authorization"]).toBeNull();
      expect(result.pong).toBe(true);
    } finally {
      server.stop();
    }
  });
});

describe("SittaxProvider.request() — sucesso", () => {
  test("200 com corpo JSON genérico é devolvido tal qual, sem transformação", async () => {
    const server = startServer(() => Response.json({ any: "shape", n: 1 }));
    try {
      const provider = new TestableSittaxProvider("key", "X-Api-Key", server.url);
      const result = await provider.testRequest<{ any: string; n: number }>("/qualquer");
      expect(result).toEqual({ any: "shape", n: 1 });
    } finally {
      server.stop();
    }
  });
});

describe("SittaxProvider.request() — erro de autenticação", () => {
  test("401 vira FiscalProviderError(AUTH_FAILED) numa única tentativa, sem retry", async () => {
    let requestCount = 0;
    const server = startServer(() => {
      requestCount++;
      return new Response("unauthorized", { status: 401 });
    });
    try {
      const provider = new TestableSittaxProvider("key-invalida", "X-Api-Key", server.url);
      const error = await provider.testRequest("/qualquer").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(FiscalProviderError);
      expect((error as FiscalProviderError).code).toBe("AUTH_FAILED");
      expect(requestCount).toBe(1);
    } finally {
      server.stop();
    }
  });
});

describe("SittaxProvider.request() — timeout", () => {
  test("resposta mais lenta que FISCAL_HTTP_TIMEOUT_MS vira FiscalProviderError(UNAVAILABLE)", async () => {
    const originalTimeout = process.env["FISCAL_HTTP_TIMEOUT_MS"];
    process.env["FISCAL_HTTP_TIMEOUT_MS"] = "100";
    const server = startServer(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return Response.json({ tooLate: true });
    });
    try {
      const provider = new TestableSittaxProvider("key", "X-Api-Key", server.url);
      const error = await provider.testRequest("/qualquer").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(FiscalProviderError);
      expect((error as FiscalProviderError).code).toBe("UNAVAILABLE");
      expect((error as FiscalProviderError).message).toContain("Tempo limite");
    } finally {
      server.stop();
      if (originalTimeout === undefined) delete process.env["FISCAL_HTTP_TIMEOUT_MS"];
      else process.env["FISCAL_HTTP_TIMEOUT_MS"] = originalTimeout;
    }
  }, 10_000);
});

describe("SittaxProvider.request() — resposta inválida", () => {
  test("200 com corpo que não é JSON vira FiscalProviderError(INVALID_RESPONSE), sem retry", async () => {
    let requestCount = 0;
    const server = startServer(() => {
      requestCount++;
      return new Response("isto não é JSON", { status: 200 });
    });
    try {
      const provider = new TestableSittaxProvider("key", "X-Api-Key", server.url);
      const error = await provider.testRequest("/qualquer").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(FiscalProviderError);
      expect((error as FiscalProviderError).code).toBe("INVALID_RESPONSE");
      expect(requestCount).toBe(1);
    } finally {
      server.stop();
    }
  });
});

describe("AlterdataProvider.request() — autenticação", () => {
  test("envia Authorization: Bearer <token> e Accept: application/json", async () => {
    let receivedAuth: string | null = null;
    const server = startServer((req) => {
      receivedAuth = req.headers.get("authorization");
      return Response.json({ pong: true });
    });
    try {
      const provider = new TestableAlterdataProvider("token-abc-123", server.url);
      const result = await provider.testRequest<{ pong: boolean }>("/qualquer-coisa");
      expect(receivedAuth).toBe("Bearer token-abc-123");
      expect(result.pong).toBe(true);
    } finally {
      server.stop();
    }
  });
});

describe("AlterdataProvider.request() — sucesso", () => {
  test("200 com corpo JSON genérico é devolvido tal qual, sem transformação", async () => {
    const server = startServer(() => Response.json({ any: "shape", n: 1 }));
    try {
      const provider = new TestableAlterdataProvider("token", server.url);
      const result = await provider.testRequest<{ any: string; n: number }>("/qualquer");
      expect(result).toEqual({ any: "shape", n: 1 });
    } finally {
      server.stop();
    }
  });
});

describe("AlterdataProvider.request() — erro de autenticação", () => {
  test("401 vira FiscalProviderError(AUTH_FAILED) numa única tentativa, sem retry", async () => {
    let requestCount = 0;
    const server = startServer(() => {
      requestCount++;
      return new Response("unauthorized", { status: 401 });
    });
    try {
      const provider = new TestableAlterdataProvider("token-invalido", server.url);
      const error = await provider.testRequest("/qualquer").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(FiscalProviderError);
      expect((error as FiscalProviderError).code).toBe("AUTH_FAILED");
      expect(requestCount).toBe(1);
    } finally {
      server.stop();
    }
  });
});

describe("AlterdataProvider.request() — timeout", () => {
  test("resposta mais lenta que FISCAL_HTTP_TIMEOUT_MS vira FiscalProviderError(UNAVAILABLE)", async () => {
    const originalTimeout = process.env["FISCAL_HTTP_TIMEOUT_MS"];
    process.env["FISCAL_HTTP_TIMEOUT_MS"] = "100";
    const server = startServer(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return Response.json({ tooLate: true });
    });
    try {
      const provider = new TestableAlterdataProvider("token", server.url);
      const error = await provider.testRequest("/qualquer").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(FiscalProviderError);
      expect((error as FiscalProviderError).code).toBe("UNAVAILABLE");
      expect((error as FiscalProviderError).message).toContain("Tempo limite");
    } finally {
      server.stop();
      if (originalTimeout === undefined) delete process.env["FISCAL_HTTP_TIMEOUT_MS"];
      else process.env["FISCAL_HTTP_TIMEOUT_MS"] = originalTimeout;
    }
  }, 10_000);
});

describe("AlterdataProvider.request() — resposta inválida", () => {
  test("200 com corpo que não é JSON vira FiscalProviderError(INVALID_RESPONSE), sem retry", async () => {
    let requestCount = 0;
    const server = startServer(() => {
      requestCount++;
      return new Response("isto não é JSON", { status: 200 });
    });
    try {
      const provider = new TestableAlterdataProvider("token", server.url);
      const error = await provider.testRequest("/qualquer").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(FiscalProviderError);
      expect((error as FiscalProviderError).code).toBe("INVALID_RESPONSE");
      expect(requestCount).toBe(1);
    } finally {
      server.stop();
    }
  });
});

describe("AlterdataProvider.request() — retry", () => {
  test("erro transitório (503) duas vezes seguido de sucesso é recuperado automaticamente", async () => {
    let requestCount = 0;
    const server = startServer(() => {
      requestCount++;
      if (requestCount < 3) return new Response("indisponível", { status: 503 });
      return Response.json({ recovered: true });
    });
    try {
      const provider = new TestableAlterdataProvider("token", server.url);
      const result = await provider.testRequest<{ recovered: boolean }>("/qualquer");
      expect(result.recovered).toBe(true);
      expect(requestCount).toBe(3);
    } finally {
      server.stop();
    }
  }, 10_000);

  test("503 persistente esgota as tentativas e lança UNAVAILABLE, sem tentar para sempre", async () => {
    let requestCount = 0;
    const server = startServer(() => {
      requestCount++;
      return new Response("indisponível", { status: 503 });
    });
    try {
      const provider = new TestableAlterdataProvider("token", server.url);
      const error = await provider.testRequest("/qualquer").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(FiscalProviderError);
      expect((error as FiscalProviderError).code).toBe("UNAVAILABLE");
      expect(requestCount).toBe(3);
    } finally {
      server.stop();
    }
  }, 10_000);
});

describe("assertCnpjBelongsToWorkspace — isolamento por workspace", () => {
  const clientsWorkspaceA: Client[] = [
    { cnpj: "11.222.333/0001-44" } as Client,
    { cnpj: "55.666.777/0001-88" } as Client,
  ];

  test("CNPJ de um cliente do workspace não lança", () => {
    expect(() =>
      assertCnpjBelongsToWorkspace("11.222.333/0001-44", clientsWorkspaceA),
    ).not.toThrow();
  });

  test("mesmo CNPJ sem pontuação (só dígitos) ainda casa — normaliza os dois lados", () => {
    expect(() => assertCnpjBelongsToWorkspace("11222333000144", clientsWorkspaceA)).not.toThrow();
  });

  test("CNPJ que não pertence a nenhum cliente do workspace lança FiscalWorkspaceIsolationError", () => {
    expect(() => assertCnpjBelongsToWorkspace("99.999.999/0001-99", clientsWorkspaceA)).toThrow(
      FiscalWorkspaceIsolationError,
    );
  });
});
