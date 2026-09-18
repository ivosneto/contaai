import type {
  Client,
  DocumentExtraction,
  DocumentType,
  Obligation,
  ObligationType,
  PendencyCategory,
} from "@/data/office";

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

/** Taxonomia canônica (única fonte — UI e o schema de extração de IA importam daqui, em vez de cada um manter sua própria lista). */
export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  "Nota fiscal",
  "Extrato bancário",
  "Folha de ponto",
  "Contrato social",
  "Guia de imposto",
  "Relatório gerencial",
];
export const ALL_PENDENCY_CATEGORIES: PendencyCategory[] = [
  "Documento",
  "Fiscal",
  "Contábil",
  "Folha",
  "Financeiro",
  "Comercial",
  "Cliente",
  "Interna",
];

export const OCR_DEMO_DISCLAIMER =
  "OCR simulado (modo DEMO) — provider de IA não configurado ou indisponível no momento; os dados abaixo são gerados deterministicamente, não lidos do arquivo.";

/**
 * Validação de upload — "arquivo real": tamanho, tipo declarado E a
 * assinatura de bytes do próprio arquivo (não confia só no `file.type` que o
 * navegador manda, que é trivialmente falsificável). Puro, sem I/O — chamado
 * tanto pelos dois server functions de upload (defesa real) quanto,
 * opcionalmente, pela UI (feedback imediato, não é a fronteira de segurança).
 */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const SIGNATURES: {
  mime: (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];
  matches: (bytes: Uint8Array) => boolean;
}[] = [
  {
    mime: "application/pdf",
    matches: (b) =>
      b.length >= 5 &&
      b[0] === 0x25 &&
      b[1] === 0x50 &&
      b[2] === 0x44 &&
      b[3] === 0x46 &&
      b[4] === 0x2d,
  }, // %PDF-
  {
    mime: "image/jpeg",
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    matches: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    mime: "image/webp",
    matches: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

/** Detecta o tipo real pelos primeiros bytes (magic numbers) — null se não bater com nenhum formato aceito. */
export function detectFileSignature(
  bytes: Uint8Array,
): (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number] | null {
  return SIGNATURES.find((s) => s.matches(bytes))?.mime ?? null;
}

export type FileValidationResult = { ok: true } | { ok: false; reason: string };

/** `bytes` é opcional para permitir uma checagem rápida client-side (só tamanho/mime declarado); o server SEMPRE passa os bytes reais — essa é a fronteira de segurança de verdade. */
export function validateDocumentFile(
  file: { type: string; size: number },
  bytes?: Uint8Array,
): FileValidationResult {
  if (file.size <= 0) return { ok: false, reason: "Arquivo vazio." };
  if (file.size > MAX_DOCUMENT_BYTES)
    return {
      ok: false,
      reason: `Arquivo maior que ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))}MB.`,
    };
  if (
    !ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])
  ) {
    return { ok: false, reason: "Tipo de arquivo não permitido — envie PDF, JPEG, PNG ou WEBP." };
  }
  if (bytes) {
    const detected = detectFileSignature(bytes);
    if (!detected)
      return {
        ok: false,
        reason:
          "O conteúdo do arquivo não corresponde a nenhum formato aceito (PDF/JPEG/PNG/WEBP).",
      };
    if (detected !== file.type)
      return { ok: false, reason: "O conteúdo do arquivo não corresponde ao tipo declarado." };
  }
  return { ok: true };
}

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

export type DocumentForExtraction = {
  type: DocumentType;
  category: PendencyCategory;
  competence: string;
};
export type ExtractionClient = Pick<Client, "id" | "cnpj">;

/** Gera uma extração de OCR determinística — SIMULADA, nunca lê o arquivo de verdade. */
export function simulateExtraction(
  doc: DocumentForExtraction,
  client: ExtractionClient,
  index: number,
): DocumentExtraction {
  const cnpjMismatch = seeded(index, 9) === 0;
  const cnpj = cnpjMismatch
    ? `${client.cnpj.slice(0, -2)}${String(90 + seeded(index, 9)).slice(-2)}`
    : client.cnpj;
  const confidence = cnpjMismatch ? 55 + seeded(index, 15) : 80 + seeded(index, 20);
  const valor = HAS_VALUE[doc.type] ? 300 + seeded(index, 40) * 65 : null;
  const vencimento =
    doc.type === "Guia de imposto"
      ? shiftDate(`${doc.competence}-01`, 20 + seeded(index, 10))
      : null;
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
    source: "mock",
  };
}

export type ObligationLookup = Pick<
  Obligation,
  "id" | "clientId" | "type" | "competence" | "status"
>;

/** Verificação da obrigação: procura uma obrigação do cliente, mesma competência e tipo compatível com o documento. */
export function matchObligation(
  doc: DocumentForExtraction,
  clientId: string,
  obligations: ObligationLookup[],
): ObligationLookup | null {
  const candidateTypes = DOCUMENT_TO_OBLIGATION_TYPES[doc.type];
  if (candidateTypes.length === 0) return null;
  const matches = obligations.filter(
    (o) =>
      o.clientId === clientId && o.competence === doc.competence && candidateTypes.includes(o.type),
  );
  if (matches.length === 0) return null;
  return matches.find((o) => o.status !== "Concluída") ?? matches[0] ?? null;
}

export type DocumentValidation = {
  issues: string[];
  status: "Aprovado" | "Pendente" | "Vencido" | "Rejeitado";
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");

/** Validação: cruza o que foi "extraído" com o cadastro do cliente e o prazo, e decide o status de negócio do documento. */
export function validateExtraction(
  extraction: DocumentExtraction,
  client: ExtractionClient,
  doc?: DocumentForExtraction,
  now?: Date,
): DocumentValidation {
  const reference = now ?? DEFAULT_NOW;
  const issues: string[] = [];

  if (extraction.cnpj && extraction.cnpj !== client.cnpj)
    issues.push("CNPJ extraído não confere com o cadastro do cliente.");
  if (extraction.confidence < 70)
    issues.push(
      `Confiança do OCR${extraction.source === "gemini" ? "" : " simulado"} abaixo de 70% — revisão manual recomendada.`,
    );
  if (extraction.vencimento && new Date(`${extraction.vencimento}T23:59:59`) < reference)
    issues.push("Vencimento identificado no documento já passou.");
  // Extração parcial: o tipo esperava um campo (valor/vencimento) e o OCR não encontrou — nunca inventamos, mas isso precisa de revisão humana, não passar direto como "Aprovado".
  const expectedType = doc?.type ?? extraction.tipoDetectado;
  if (HAS_VALUE[expectedType] && extraction.valor === null)
    issues.push(
      "Extração incompleta — valor esperado para este tipo de documento não foi identificado.",
    );
  if (expectedType === "Guia de imposto" && !extraction.vencimento)
    issues.push(
      "Extração incompleta — vencimento esperado para este tipo de documento não foi identificado.",
    );
  if (!extraction.cnpj)
    issues.push("Extração incompleta — CNPJ não foi identificado no documento.");

  let status: DocumentValidation["status"] = "Aprovado";
  if (issues.some((i) => i.startsWith("CNPJ"))) status = "Rejeitado";
  else if (issues.some((i) => i.startsWith("Confiança") || i.startsWith("Extração incompleta")))
    status = "Pendente";
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
  const validation = validateExtraction(extraction, client, doc, now);
  const matchedObligation =
    validation.status === "Rejeitado" ? null : matchObligation(doc, client.id, obligations);

  const outcome: DocumentPipelineResult["outcome"] =
    validation.issues.length > 0
      ? "pendencia-gerada"
      : matchedObligation
        ? "concluido-com-obrigacao"
        : "concluido-sem-obrigacao";

  return { extraction, validation, matchedObligation, outcome };
}
