import type { Department, ProcessStep } from "@/data/office";

/**
 * Motor de Processos — puro, sem UI. Gera o checklist de etapas padrão de um
 * processo novo a partir do departamento, mesmo padrão de
 * buildChecklist()/CHECKLIST_TEMPLATES em obligations-engine.ts.
 */

const PROCESS_STEP_TEMPLATES: Record<Department, string[]> = {
  Fiscal: ["Solicitar documentos", "Receber", "Apurar", "Conferir", "Transmitir", "Entregar"],
  Contábil: ["Solicitar documentos", "Receber", "Lançar", "Conciliar", "Revisar", "Entregar"],
  Pessoal: ["Solicitar documentos", "Receber", "Processar folha", "Conferir", "Aprovar", "Entregar"],
  Societário: ["Solicitar documentos", "Receber", "Elaborar", "Revisar", "Protocolar", "Entregar"],
  Financeiro: ["Solicitar documentos", "Receber", "Conciliar", "Conferir", "Aprovar", "Entregar"],
  Comercial: ["Diagnosticar", "Elaborar proposta", "Revisar", "Aprovar", "Enviar", "Acompanhar"],
};

/** Etapas padrão de um processo novo — todas "Pendente", responsável = quem criou o processo. */
export function buildProcessSteps(department: Department, owner: string): ProcessStep[] {
  return PROCESS_STEP_TEMPLATES[department].map((name) => ({
    name,
    owner,
    slaDays: 2,
    avgDays: 0,
    status: "Pendente" as const,
  }));
}
