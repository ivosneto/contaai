// Conector para a Sittax — a pesquisa de integrações (ver catalog.ts)
// encontrou uma "API de Integração" documentada publicamente, autenticada
// por chave de API, mas a documentação pública cobre principalmente
// IMPORTAÇÃO de NF-e para dentro da Sittax: um fluxo de ENTRADA (ContaAI →
// Sittax). O que listObligationStatuses precisa é o fluxo INVERSO —
// LEITURA do resultado de apuração de volta (Sittax → ContaAI) — e isso
// NÃO está confirmado como existente na mesma API, nem em nenhuma outra.
//
// Diferente da Alterdata (onde o esquema de autenticação — Bearer JWT — é
// confirmado publicamente), aqui só a EXISTÊNCIA de uma chave de API é
// confirmada; o transporte exato (nome do header, formato) não está
// documentado no que foi encontrado. Por isso o nome do header de
// autenticação é CONFIGURAÇÃO (`SITTAX_API_KEY_HEADER`), nunca um valor
// chutado no código — inventar um nome de header e tratá-lo como real
// seria exatamente o tipo de integração falsa que esta tarefa proíbe.
//
// listObligationStatuses lança FiscalProviderError("NOT_CONFIGURED")
// listando as DUAS lacunas (endpoint de leitura + esquema de autenticação)
// — nunca chama uma URL inventada nem devolve um retorno simulado.
// `request()` reaproveita a mesma primitiva HTTP da Alterdata
// (http-client.server.ts: timeout, retry, log, mapeamento de erro) e está
// coberta por teste contra um servidor HTTP local, nunca contra a Sittax
// real.
import type { FiscalObligationStatus, FiscalProvider } from "./provider.types";
import { FiscalProviderError } from "./provider.types";
import { fiscalHttpRequest } from "./http-client.server";

export class SittaxProvider implements FiscalProvider {
  readonly name = "sittax";

  constructor(
    private readonly apiKey: string,
    /** Nome do header HTTP que carrega a chave de API — não confirmado publicamente; deve vir de `SITTAX_API_KEY_HEADER` assim que o suporte da Sittax confirmar. */
    private readonly apiKeyHeader: string,
    private readonly baseUrl: string,
  ) {}

  /** `path` é relativo a `baseUrl`. Ver fiscalHttpRequest para timeout/retry/log/erro — mesma primitiva da Alterdata. */
  protected request<T>(path: string, init?: RequestInit): Promise<T> {
    return fiscalHttpRequest<T>({
      providerName: this.name,
      baseUrl: this.baseUrl,
      path,
      authHeaders: { [this.apiKeyHeader]: this.apiKey },
      ...(init ? { init } : {}),
    });
  }

  async listObligationStatuses(
    _clientCnpj: string,
    _competence: string,
  ): Promise<FiscalObligationStatus[]> {
    throw new FiscalProviderError(
      "NOT_CONFIGURED",
      `Leitura de apuração da Sittax ainda não confirmada — duas lacunas, nenhuma resolvida: (1) a documentação pública encontrada (${this.baseUrl}) cobre importação de NF-e, não leitura de resultado de apuração de volta; (2) mesmo o nome do header de autenticação da chave de API não está confirmado (hoje configurado só como SITTAX_API_KEY_HEADER, sem valor-padrão chutado). Timeout e retry (this.request) já estão implementados e testados; falta uma conta de teste real + confirmação do suporte da Sittax para os dois pontos antes de ligar esta chamada.`,
    );
  }
}
