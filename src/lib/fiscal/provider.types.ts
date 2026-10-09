/**
 * Contrato para um conector de sistema fiscal/produção externo (Alterdata,
 * Sittax, Domínio...) — camada de "Integração" do posicionamento de produto:
 * o ContaAI nunca calcula imposto, só lê o resultado de quem já apura.
 *
 * O shape de retorno é DELIBERADAMENTE cru (rótulos como vêm da origem, não
 * o enum ObligationType/ObligationStatus do ContaAI) — normalizar pro
 * vocabulário interno é responsabilidade de quem consome (mesmo padrão de
 * InboundMessagePayload em integrations/providers/types.ts), porque cada
 * origem usa um vocabulário próprio e ainda não sabemos o do Alterdata/Sittax
 * de verdade (nenhum dos dois tem catálogo de endpoint público confirmado).
 */
export type FiscalObligationStatus = {
  externalId: string;
  clientCnpj: string;
  obligationTypeLabel: string;
  competence: string;
  dueDate: string | null;
  statusLabel: string;
  value: number | null;
};

export type FiscalProviderErrorCode =
  "NOT_CONFIGURED" | "AUTH_FAILED" | "RATE_LIMITED" | "INVALID_RESPONSE" | "UNAVAILABLE";

export class FiscalProviderError extends Error {
  constructor(
    readonly code: FiscalProviderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "FiscalProviderError";
  }
}

/**
 * `clientCnpj` identifica o cliente pelo vocabulário da origem externa
 * (Alterdata etc.), não pelo `Client.id` interno do ContaAI — a API externa
 * não tem noção de workspace do ContaAI. Isso significa que QUALQUER
 * consumidor de `listObligationStatuses` (hoje nenhum — ver
 * alterdata-provider.server.ts) é responsável por validar, ANTES de
 * chamar, que o CNPJ pedido pertence a um cliente do workspace de quem
 * está pedindo — do contrário nada impede um workspace de consultar o
 * CNPJ de um cliente de outro. Use `assertCnpjBelongsToWorkspace`
 * (workspace-guard.ts) para essa checagem; mesmo padrão de revalidação de
 * posse usado em executeApprovedAiAction (copilot.ts) e
 * proposeCreateOpportunityFn (opportunities.ts).
 */
export type FiscalProvider = {
  readonly name: string;
  listObligationStatuses(clientCnpj: string, competence: string): Promise<FiscalObligationStatus[]>;
};
