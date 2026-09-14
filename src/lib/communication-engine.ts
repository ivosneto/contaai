import type { Client, Communication, CommunicationClassification, CommunicationPriority, CommunicationSentiment, Insight } from "@/data/office";

/**
 * Inbox unificada — puro, sem UI, sem importar valores de office.ts em
 * runtime (só tipos). Classificação automática por REGRAS de palavras-chave
 * (MVP determinístico) e geração de rascunho de resposta por modelo — nunca
 * um modelo de NLP/LLM treinado, e a resposta NUNCA é enviada sozinha: é
 * sempre um rascunho para o usuário revisar e confirmar.
 */

export const CLASSIFIER_DEMO_DISCLAIMER = "Classificação automática por regras de palavras-chave (MVP) — não é um modelo de NLP treinado.";
export const COMMUNICATION_DEMO_DISCLAIMER = "E-mail e WhatsApp são simulados com dados de demonstração nesta versão — sem integração real com provedores externos.";
export const REPLY_DRAFT_DISCLAIMER = "Rascunho gerado por modelo (MVP) — revise antes de enviar. Nenhuma resposta é enviada automaticamente.";

export type MessageClassification = {
  category: CommunicationClassification;
  sentiment: CommunicationSentiment;
  priority: CommunicationPriority;
  requiresAction: boolean;
  suggestedAction: string;
};

type Rule = {
  test: (text: string) => boolean;
  category: CommunicationClassification;
  sentiment: CommunicationSentiment;
  priority: CommunicationPriority;
  action: string;
};

const RULES: Rule[] = [
  {
    test: (t) => /document/.test(t) && /fechamento/.test(t),
    category: "Solicitação",
    sentiment: "Neutro",
    priority: "Média",
    action: "Solicitação relacionada ao fechamento mensal.",
  },
  {
    test: (t) => /obrigad|excelente atendimento|ótimo trabalho|parab[ée]ns|muito bom/.test(t),
    category: "Outros",
    sentiment: "Positivo",
    priority: "Baixa",
    action: "Feedback positivo do cliente — nenhuma ação necessária.",
  },
  {
    test: (t) => /urgente|imediat|hoje mesmo|com urg[êe]ncia/.test(t),
    category: "Urgente",
    sentiment: "Negativo",
    priority: "Crítica",
    action: "Cliente sinalizou urgência — priorizar atendimento.",
  },
  {
    test: (t) => /reclama|insatisfeit|péssim|demorou|de novo|segunda vez|errad[oa]/.test(t),
    category: "Reclamação",
    sentiment: "Negativo",
    priority: "Alta",
    action: "Reclamação do cliente — analisar e responder com prioridade.",
  },
  {
    test: (t) => /boleto|cobran|fatura|pagamento|vencid|honor[áa]rio/.test(t),
    category: "Cobrança",
    sentiment: "Neutro",
    priority: "Média",
    action: "Assunto financeiro — encaminhar ao time de cobrança.",
  },
  {
    test: (t) => /document|nota fiscal|extrato|guia|anexo|comprovante/.test(t),
    category: "Documento",
    sentiment: "Neutro",
    priority: "Média",
    action: "Solicitação relacionada a documentos — coletar ou enviar o que foi pedido.",
  },
  {
    test: (t) => /proposta|contratar|or[çc]amento|upgrade|bpo|consultoria|novo servi[çc]o/.test(t),
    category: "Comercial",
    sentiment: "Positivo",
    priority: "Média",
    action: "Interesse comercial — encaminhar para o time comercial.",
  },
  {
    test: (t) => /dúvida|duvida|como funciona|poderia explicar|não entendi|nao entendi|\?/.test(t),
    category: "Dúvida",
    sentiment: "Neutro",
    priority: "Baixa",
    action: "Dúvida do cliente — responder com a explicação necessária.",
  },
  {
    test: (t) => /precis|gostaria|solicito|poderia enviar|favor/.test(t),
    category: "Solicitação",
    sentiment: "Neutro",
    priority: "Média",
    action: "Solicitação do cliente — encaminhar para o responsável.",
  },
];

/** Classificação automática por regras — nunca afirma ser um modelo de NLP treinado. */
export function classifyContent(content: string): MessageClassification {
  const text = content.toLowerCase();
  const rule = RULES.find((r) => r.test(text));
  if (!rule) {
    return { category: "Outros", sentiment: "Neutro", priority: "Baixa", requiresAction: false, suggestedAction: "Sem ação clara identificada — revisar manualmente." };
  }
  return {
    category: rule.category,
    sentiment: rule.sentiment,
    priority: rule.priority,
    requiresAction: rule.category !== "Outros",
    suggestedAction: rule.action,
  };
}

const REPLY_TEMPLATES: Record<CommunicationClassification, (subject: string) => string> = {
  Documento: (s) => `Recebemos sua solicitação sobre "${s}". Você pode enviar os documentos pelo portal do cliente ou responder esta mensagem com os arquivos em anexo. Qualquer dúvida, estamos à disposição.`,
  Dúvida: (s) => `Sobre "${s}": já estamos verificando os detalhes e retornamos com uma explicação completa em breve. Fique à vontade para complementar sua dúvida por aqui.`,
  Cobrança: (s) => `Sobre "${s}": estamos verificando a situação junto ao time financeiro e retornamos com uma posição em até 1 dia útil.`,
  Solicitação: (s) => `Recebemos sua solicitação sobre "${s}" e já encaminhamos para o time responsável. Assim que tivermos uma atualização, avisamos por aqui.`,
  Reclamação: (s) => `Sentimos muito pelo ocorrido em relação a "${s}". Já estamos analisando o caso com prioridade e voltamos com uma solução o quanto antes.`,
  Comercial: (s) => `Que bom o seu interesse em relação a "${s}"! Vamos preparar as informações e entrar em contato para avançarmos.`,
  Urgente: (s) => `Entendemos a urgência sobre "${s}" e já priorizamos o atendimento. Retornamos com uma posição ainda hoje.`,
  Outros: (s) => `Recebemos sua mensagem sobre "${s}" e já estamos avaliando internamente. Qualquer novidade, retornamos por aqui.`,
};

export type ReplyDraftInput = {
  recipientName: string;
  subject: string;
  category: CommunicationClassification;
  officeName: string;
};

/** Gera um RASCUNHO de resposta por modelo — o usuário sempre revisa e confirma antes de enviar. */
export function generateReplyDraft({ recipientName, subject, category, officeName }: ReplyDraftInput): string {
  const firstName = recipientName.split(" ")[0] ?? recipientName;
  const body = REPLY_TEMPLATES[category](subject);
  return `Olá, ${firstName}!\n\n${body}\n\nAtenciosamente,\nEquipe ${officeName}`;
}

/** Prévia curta para listagens/timeline a partir do conteúdo completo. */
export function summarize(content: string, max = 90): string {
  const clean = content.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export type CommunicationInsightClient = Pick<Client, "id" | "name" | "department">;

const TODAY = "2026-09-14";

export function computeCommunicationInsights(communications: Communication[], clients: CommunicationInsightClient[]): Insight[] {
  const insights: Insight[] = [];
  const clientOf = (clientId: string) => clients.find((c) => c.id === clientId);
  const openActionable = communications.filter((m) => m.requiresAction);

  const urgent = openActionable.filter((m) => m.classification === "Urgente" || m.priority === "Crítica");
  for (const m of urgent) {
    const client = clientOf(m.clientId);
    insights.push({
      id: `inbox-urgent-${m.id}`,
      kind: "Problema",
      severity: "Crítica",
      title: `${client?.name ?? m.clientId}: mensagem urgente aguardando resposta — "${m.subject}"`,
      clientId: m.clientId,
      ...(client ? { department: client.department } : {}),
      assignee: m.assignee,
      evidence: [`Recebida via ${m.channel} em ${m.createdAt}, ainda sem resposta.`, m.suggestedAction],
      impact: "Mensagem classificada como urgente ainda sem resposta.",
      recommendation: "Responder ou atribuir esta mensagem agora.",
      link: "/comunicacao",
      actions: ["Ver inbox", "Responder"],
      createdAt: TODAY,
      status: "Aberto",
    });
  }

  const complaints = openActionable.filter((m) => m.classification === "Reclamação");
  for (const m of complaints) {
    const client = clientOf(m.clientId);
    insights.push({
      id: `inbox-complaint-${m.id}`,
      kind: "Problema",
      severity: "Alta",
      title: `${client?.name ?? m.clientId}: reclamação em aberto — "${m.subject}"`,
      clientId: m.clientId,
      ...(client ? { department: client.department } : {}),
      assignee: m.assignee,
      evidence: [`Sentimento ${m.sentiment.toLowerCase()} detectado em mensagem de ${m.createdAt}.`],
      impact: "Reclamação de cliente ainda sem tratativa registrada.",
      recommendation: "Priorizar resposta e considerar abrir pendência de acompanhamento.",
      link: "/comunicacao",
      actions: ["Ver inbox", "Criar pendência"],
      createdAt: TODAY,
      status: "Aberto",
    });
  }

  if (openActionable.length >= 5) {
    insights.push({
      id: "inbox-backlog",
      kind: "Problema",
      severity: "Média",
      title: `${openActionable.length} mensagens exigem ação na Inbox`,
      evidence: [`Volume de mensagens recebidas acima da capacidade de resposta atual (${openActionable.length} em aberto).`],
      impact: "Backlog de comunicação acumulando sem resposta ou atribuição.",
      recommendation: "Distribuir mensagens entre a equipe e responder as mais antigas primeiro.",
      link: "/comunicacao",
      actions: ["Ver inbox", "Atribuir"],
      createdAt: TODAY,
      status: "Aberto",
    });
  }

  return insights;
}
