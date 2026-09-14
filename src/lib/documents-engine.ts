import type { Client, DocumentExtraction, DocumentType, Obligation, ObligationType, PendencyCategory } from "@/data/office";

/**
 * Documentos Inteligentes — puro, sem UI, sem importar valores de office.ts
 * em runtime (só tipos). Simula o pipeline Identificação → Classificação →
 * Extração → Validação → Relacionamento com cliente → Verificação da
 * obrigação, e relaciona automaticamente documento → cliente → obrigação →
 * pendência.
 *
 * IMPORTANTE: não existe OCR real aqui. "Extração" é simulada de forma
 * determinística a partir dos próprios dados do documento, exatamente para
 * deixar claro que é uma estrutura de demonstração — nunca afirmar que lê
 * documentos de verdade.
 */

export const OCR_DEMO_DISCLAIMER = "OCR simulado — dados de demonstração. Nenhum leitor de documentos real é usado.";

export const DOCUMENT_DEFAULT_CATEGORY: Record<DocumentType, PendencyCategory> = {
  "Nota fiscal": "Fiscal",
  "Extrato bancário": "Financeiro",
  "Folha de ponto": "Folha",
  "Contrato social": "Interna",
  "Guia de imposto": "Fiscal",
  "Relatório gerencial": "Contábil",
};

const DOCUMENT_TO_OBLIGATION_TYPES: Record<DocumentType, ObligationType[]> = {
  "Nota fiscal": ["SPED Fiscal", "SPED Contribuições"],
  "Extrato bancário": [],
  "Folha de ponto": ["eSocial", "GFIP"],
  "Contrato social": [],
  "Guia de imposto": ["DAS", "DCTFWeb"],
  "Relatório gerencial": [],
};

const HAS_VALUE: Record<DocumentType, boolean> = {
  "Nota fiscal": true,
  "Extrato bancário": true,
  "Folha de ponto": false,
  "Contrato social": false,
  "Guia de imposto": true,
  "Relatório gerencial": false,
};

function seeded(i: number, mod: number) {
  return ((i * 9301 + 49297) % 233280) % mod;
}

function shiftDate(base: string, days: number): string {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type DocumentForExtraction = { type: DocumentType; category: PendencyCategory; competence: string };
export type ExtractionClient = Pick<Client, "id" | "cnpj">;

/** Gera uma extração de OCR determinística — SIMULADA, nunca lê o arquivo de verdade. */
export function simulateExtraction(doc: DocumentForExtraction, client: ExtractionClient, index: number): DocumentExtraction {
  const cnpjMismatch = seeded(index, 9) === 0;
  const cnpj = cnpjMismatch ? `${client.cnpj.slice(0, -2)}${String(90 + seeded(index, 9)).slice(-2)}` : client.cnpj;
  const confidence = cnpjMismatch ? 55 + seeded(index, 15) : 80 + seeded(index, 20);
  const valor = HAS_VALUE[doc.type] ? 300 + seeded(index, 40) * 65 : null;
  const vencimento = doc.type === "Guia de imposto" ? shiftDate(`${doc.competence}-01`, 20 + seeded(index, 10)) : null;
  const numero = `${10000 + seeded(index, 89999)}`;

  return {
    tipoDetectado: doc.type,
    cnpj,
    competencia: doc.competence,
    valor,
    vencimento,
    numero,
    categoria: doc.category,
    confidence,
  };
}

export type ObligationLookup = Pick<Obligation, "id" | "clientId" | "type" | "competence" | "status">;

/** Verificação da obrigação: procura uma obrigação do cliente, mesma competência e tipo compatível com o documento. */
export function matchObligation(doc: DocumentForExtraction, clientId: string, obligations: ObligationLookup[]): ObligationLookup | null {
  const candidateTypes = DOCUMENT_TO_OBLIGATION_TYPES[doc.type];
  if (candidateTypes.length === 0) return null;
  const matches = obligations.filter((o) => o.clientId === clientId && o.competence === doc.competence && candidateTypes.includes(o.type));
  if (matches.length === 0) return null;
  return matches.find((o) => o.status !== "Concluída") ?? matches[0] ?? null;
}

export type DocumentValidation = {
  issues: string[];
  status: "Aprovado" | "Pendente" | "Vencido" | "Rejeitado";
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");

/** Validação: cruza o que foi "extraído" com o cadastro do cliente e o prazo, e decide o status de negócio do documento. */
export function validateExtraction(extraction: DocumentExtraction, client: ExtractionClient, now?: Date): DocumentValidation {
  const reference = now ?? DEFAULT_NOW;
  const issues: string[] = [];

  if (extraction.cnpj !== client.cnpj) issues.push("CNPJ extraído não confere com o cadastro do cliente.");
  if (extraction.confidence < 70) issues.push("Confiança do OCR simulado abaixo de 70% — revisão manual recomendada.");
  if (extraction.vencimento && new Date(`${extraction.vencimento}T23:59:59`) < reference) issues.push("Vencimento identificado no documento já passou.");

  let status: DocumentValidation["status"] = "Aprovado";
  if (issues.some((i) => i.startsWith("CNPJ"))) status = "Rejeitado";
  else if (issues.some((i) => i.startsWith("Confiança"))) status = "Pendente";
  else if (issues.some((i) => i.startsWith("Vencimento"))) status = "Vencido";

  return { issues, status };
}

export type DocumentPipelineResult = {
  extraction: DocumentExtraction;
  validation: DocumentValidation;
  matchedObligation: ObligationLookup | null;
  outcome: "concluido-com-obrigacao" | "concluido-sem-obrigacao" | "pendencia-gerada";
};

/** Roda o pipeline completo (Identificação → Classificação → Extração → Validação → Relacionamento → Verificação da obrigação) de forma pura e determinística. */
export function runDocumentPipeline(
  doc: DocumentForExtraction,
  client: ExtractionClient,
  obligations: ObligationLookup[],
  index: number,
  now?: Date,
): DocumentPipelineResult {
  const extraction = simulateExtraction(doc, client, index);
  const validation = validateExtraction(extraction, client, now);
  const matchedObligation = validation.status === "Rejeitado" ? null : matchObligation(doc, client.id, obligations);

  const outcome: DocumentPipelineResult["outcome"] =
    validation.issues.length > 0 ? "pendencia-gerada" : matchedObligation ? "concluido-com-obrigacao" : "concluido-sem-obrigacao";

  return { extraction, validation, matchedObligation, outcome };
}
