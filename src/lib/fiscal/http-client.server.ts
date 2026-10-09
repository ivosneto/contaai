// Primitiva HTTP compartilhada por qualquer FiscalProvider concreto —
// timeout, retry com backoff só para erro transitório, log operacional sem
// secret, mapeamento de erro pro contrato de FiscalProviderError. Extraída
// de dentro de alterdata-provider.server.ts quando o segundo provider real
// (Sittax, ver sittax-provider.server.ts) precisou exatamente da mesma
// primitiva — nenhuma lógica nova nasceu aqui, só deixou de estar
// duplicada. Cada provider é responsável só por montar seus PRÓPRIOS
// headers de autenticação (esquema diferente em cada origem) e chamar
// `fiscalHttpRequest`.
import { FiscalProviderError } from "./provider.types";

const DEFAULT_TIMEOUT_MS = 15_000;
/** 1ª tentativa + 2 retries — teto curto de propósito: uma leitura de obrigações não deve travar a UI por minutos numa origem fora do ar. */
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = [200, 600];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeForLog(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Só erro de transporte (rede/timeout), 429 e 5xx são transitórios — vale tentar de novo. 401/403 (credencial ruim), 404/resposta inválida (endpoint/contrato errado) nunca são: repetir a mesma chamada não corrige nenhum dos dois. */
function isRetryable(err: unknown): boolean {
  if (err instanceof FiscalProviderError)
    return err.code === "RATE_LIMITED" || err.code === "UNAVAILABLE";
  return true;
}

export type FiscalHttpRequestOptions = {
  /** Nome do provider — só para log e mensagem de erro, nunca para montar URL/auth (isso é responsabilidade de cada provider). */
  providerName: string;
  baseUrl: string;
  /** Relativo a `baseUrl` (ex.: "/v1/obrigacoes"). */
  path: string;
  /** Headers de autenticação já prontos — cada provider monta os seus (esquema varia por origem). */
  authHeaders: Record<string, string>;
  init?: RequestInit;
};

async function attempt<T>(
  url: string,
  authHeaders: Record<string, string>,
  init: RequestInit,
  providerName: string,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { Accept: "application/json", ...authHeaders, ...init.headers },
    });
  } catch (err) {
    if (controller.signal.aborted)
      throw new FiscalProviderError(
        "UNAVAILABLE",
        `Tempo limite (${timeoutMs}ms) excedido ao contatar ${providerName}.`,
      );
    throw new FiscalProviderError(
      "UNAVAILABLE",
      err instanceof Error ? err.message : `Falha de rede ao contatar ${providerName}.`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403)
    throw new FiscalProviderError(
      "AUTH_FAILED",
      `${providerName} rejeitou a autenticação (HTTP ${response.status}).`,
    );
  if (response.status === 429)
    throw new FiscalProviderError(
      "RATE_LIMITED",
      `Limite de requisições do ${providerName} atingido.`,
    );
  if (!response.ok)
    throw new FiscalProviderError(
      "UNAVAILABLE",
      `${providerName} retornou HTTP ${response.status}.`,
    );

  try {
    return (await response.json()) as T;
  } catch {
    throw new FiscalProviderError(
      "INVALID_RESPONSE",
      `${providerName} retornou uma resposta que não é JSON válido.`,
    );
  }
}

/**
 * Chamada HTTP autenticada com timeout (env `FISCAL_HTTP_TIMEOUT_MS`,
 * default 15s, mesmo padrão de `AI_TIMEOUT_MS` em gemini-provider.server.ts)
 * + retry com backoff limitado a erro transitório + log operacional (nunca
 * o secret — só status/mensagem) + mapeamento de erro pro contrato de
 * FiscalProviderError.
 */
export async function fiscalHttpRequest<T>(opts: FiscalHttpRequestOptions): Promise<T> {
  const timeoutMs = Number(process.env["FISCAL_HTTP_TIMEOUT_MS"]) || DEFAULT_TIMEOUT_MS;
  const url = `${opts.baseUrl.replace(/\/$/, "")}${opts.path}`;
  const init = opts.init ?? {};

  let lastError: unknown;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    try {
      return await attempt<T>(url, opts.authHeaders, init, opts.providerName, timeoutMs);
    } catch (err) {
      lastError = err;
      if (i === MAX_ATTEMPTS || !isRetryable(err)) throw err;
      const backoff = RETRY_BACKOFF_MS[i - 1] ?? RETRY_BACKOFF_MS.at(-1)!;
      console.warn(
        `[fiscal:${opts.providerName}] tentativa ${i}/${MAX_ATTEMPTS} falhou (${describeForLog(err)}); tentando de novo em ${backoff}ms.`,
      );
      await sleep(backoff);
    }
  }
  // Inalcançável: o loop sempre retorna ou lança antes de sair — só aqui para o TS ver um retorno em todo caminho.
  throw lastError;
}
