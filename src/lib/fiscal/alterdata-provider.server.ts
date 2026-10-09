// Conector para o ePlugin da Alterdata — a única das três fontes pedidas
// (Alterdata/Sittax/Gestta, ver catalog.ts) com uma API REST/JSON pública e
// documentada: https://ajuda.alterdata.com.br/alterdatapackup/eplugin
// Exige plano eContador Master do escritório-cliente e um token JWT gerado
// em eContador → Configurações → ePlugin/Chave de Acesso.
//
// O que está CONFIRMADO publicamente e por isso já implementado aqui: a
// autenticação (Bearer JWT no header). A primitiva HTTP genérica (timeout,
// retry com backoff, log, mapeamento de erro) vive em http-client.server.ts
// — compartilhada com qualquer outro provider fiscal (ver
// sittax-provider.server.ts), não duplicada aqui. O que NÃO está
// confirmado: o endpoint/payload real de leitura de status de
// obrigação/apuração — a documentação pública lista só o módulo de
// pré-admissão (Departamento Pessoal), não achamos o catálogo completo de
// endpoints sem uma conta eContador Master de verdade. Por isso
// listObligationStatuses lança FiscalProviderError em vez de chamar uma URL
// inventada — nunca fingir uma integração que não foi verificada (mesmo
// princípio de "demo nunca aparece como conectado" do restante do
// catálogo). `request()` fica pronta e coberta por teste (contra um
// servidor HTTP local, nunca a Alterdata real) para o dia em que o suporte
// da Alterdata confirmar o path — nesse dia, listObligationStatuses passa a
// chamar `this.request<...>(path)` e normalizar o corpo confirmado para
// FiscalObligationStatus[], sem precisar tocar em mais nada.
import type { FiscalObligationStatus, FiscalProvider } from "./provider.types";
import { FiscalProviderError } from "./provider.types";
import { fiscalHttpRequest } from "./http-client.server";

export class AlterdataProvider implements FiscalProvider {
  readonly name = "alterdata";

  constructor(
    private readonly apiToken: string,
    private readonly baseUrl: string,
  ) {}

  /** `path` é relativo a `baseUrl` (ex.: "/v1/obrigacoes"). Ver fiscalHttpRequest para timeout/retry/log/erro. */
  protected request<T>(path: string, init?: RequestInit): Promise<T> {
    return fiscalHttpRequest<T>({
      providerName: this.name,
      baseUrl: this.baseUrl,
      path,
      authHeaders: { Authorization: `Bearer ${this.apiToken}` },
      ...(init ? { init } : {}),
    });
  }

  async listObligationStatuses(
    _clientCnpj: string,
    _competence: string,
  ): Promise<FiscalObligationStatus[]> {
    throw new FiscalProviderError(
      "NOT_CONFIGURED",
      `Endpoint de leitura de obrigações/apuração do ePlugin (Alterdata) ainda não confirmado — a documentação pública (${this.baseUrl}) não lista o catálogo completo sem uma conta eContador Master real. Autenticação, timeout e retry (this.request) já estão implementados e testados; falta mapear a URL/payload reais com o suporte da Alterdata antes de ligar esta chamada.`,
    );
  }
}
