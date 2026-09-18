// Conector para o ePlugin da Alterdata — a única das três fontes pedidas
// (Alterdata/Sittax/Gestta, ver catalog.ts) com uma API REST/JSON pública e
// documentada: https://ajuda.alterdata.com.br/alterdatapackup/eplugin
// Exige plano eContador Master do escritório-cliente e um token JWT gerado
// em eContador → Configurações → ePlugin/Chave de Acesso.
//
// O que está CONFIRMADO publicamente e por isso já implementado aqui: a
// autenticação (Bearer JWT no header). O que NÃO está confirmado: o
// endpoint/payload real de leitura de status de obrigação/apuração — a
// documentação pública lista só o módulo de pré-admissão (Departamento
// Pessoal), não achamos o catálogo completo de endpoints sem uma conta
// eContador Master de verdade. Por isso listObligationStatuses lança
// FiscalProviderError em vez de chamar uma URL inventada — nunca fingir uma
// integração que não foi verificada (mesmo princípio de "demo nunca aparece
// como conectado" do restante do catálogo).
import type { FiscalObligationStatus, FiscalProvider } from "./provider.types";
import { FiscalProviderError } from "./provider.types";

export class AlterdataProvider implements FiscalProvider {
  readonly name = "alterdata";

  constructor(
    private readonly apiToken: string,
    private readonly baseUrl: string,
  ) {}

  /** Monta o header de autenticação real do ePlugin — a única parte confirmada pela documentação pública. Não usada ainda (ver listObligationStatuses), mas fica pronta para quando o endpoint real for mapeado. */
  protected authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiToken}`, Accept: "application/json" };
  }

  async listObligationStatuses(
    _clientCnpj: string,
    _competence: string,
  ): Promise<FiscalObligationStatus[]> {
    throw new FiscalProviderError(
      "NOT_CONFIGURED",
      `Endpoint de leitura de obrigações/apuração do ePlugin (Alterdata) ainda não confirmado — a documentação pública (${this.baseUrl}) não lista o catálogo completo sem uma conta eContador Master real. A autenticação (Bearer JWT) já está implementada; falta mapear a URL/payload reais com o suporte da Alterdata antes de ligar esta chamada.`,
    );
  }
}
