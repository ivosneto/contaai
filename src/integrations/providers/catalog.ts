import type { IntegrationDefinition } from "./types";

/**
 * Catálogo de integrações externas do ContaAI. Todas em status "mock" — é a
 * lista honesta do que a arquitetura já está pronta para receber, não uma
 * lista de conexões reais. Ver `types.ts` para o contrato que uma
 * integração real deve implementar para substituir o mock aqui.
 */
export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "dominio",
    name: "Domínio Sistemas",
    category: "dominio-fiscal",
    status: "mock",
    description: "Sincronização de clientes, movimentos contábeis e apurações com o sistema fiscal/contábil do escritório.",
    feeds: ["obrigacoes", "financeiro"],
    disclaimer: "Sem integração real com a API do Domínio. Obrigações e apurações continuam sendo geradas de forma determinística no protótipo.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "mensageria",
    status: "mock",
    description: "Recebimento e envio de mensagens de clientes direto na Inbox unificada.",
    feeds: ["comunicacao"],
    disclaimer: "Sem integração real com a API do WhatsApp. O provider mock simula o recebimento de uma mensagem para demonstrar o fluxo completo de identificação e classificação.",
  },
  {
    id: "email",
    name: "E-mail (IMAP/SMTP)",
    category: "mensageria",
    status: "mock",
    description: "Recebimento e envio de e-mails de clientes direto na Inbox unificada.",
    feeds: ["comunicacao"],
    disclaimer: "Sem integração real com caixa de e-mail. Mesma simulação de recebimento do WhatsApp, adaptada ao canal.",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "armazenamento",
    status: "mock",
    description: "Leitura de documentos enviados pelo cliente numa pasta compartilhada, alimentando o pipeline de Documentos Inteligentes.",
    feeds: ["documentos"],
    disclaimer: "Sem integração real com a API do Google Drive. O provider mock simula a chegada de um arquivo para demonstrar identificação, classificação e extração.",
  },
  {
    id: "sheets",
    name: "Excel / Google Sheets",
    category: "planilhas",
    status: "mock",
    description: "Importação e exportação de planilhas (clientes, honorários, lançamentos) para os módulos financeiro e de clientes.",
    feeds: ["financeiro", "comercial"],
    disclaimer: "Sem importação/exportação real de arquivos. Preparado para receber um parser de planilha que gere os mesmos formatos de entrada usados pelas ações do store.",
  },
  {
    id: "trello",
    name: "Trello",
    category: "produtividade",
    status: "mock",
    description: "Sincronização de tarefas e quadros de projeto com a Central de Tarefas e Projetos.",
    feeds: ["tarefas"],
    disclaimer: "Sem integração real com a API do Trello. Tarefas continuam sendo criadas pelas ações internas (pendência → tarefa, automação, etc.).",
  },
  {
    id: "crm-externo",
    name: "CRM externo",
    category: "crm",
    status: "mock",
    description: "Sincronização de leads e oportunidades comerciais com o pipeline do módulo Comercial.",
    feeds: ["comercial"],
    disclaimer: "Sem integração real com um CRM externo. O pipeline comercial já existe no ContaAI e pode ser a origem ou o destino da sincronização quando integrado.",
  },
  {
    id: "sistemas-financeiros",
    name: "Sistemas financeiros / ERP",
    category: "financeiro",
    status: "mock",
    description: "Conciliação de faturas, pagamentos e contas com um ERP financeiro externo.",
    feeds: ["financeiro"],
    disclaimer: "Sem integração real com um ERP financeiro. Faturas e pagamentos continuam sendo dados de demonstração — ver módulo Financeiro.",
  },
  {
    id: "open-finance",
    name: "Open Finance",
    category: "open-finance",
    status: "mock",
    description: "Extrato bancário automático dos clientes, alimentando conciliação e contas a pagar/receber.",
    feeds: ["financeiro"],
    disclaimer: "Sem integração real com o ecossistema Open Finance. Nenhum dado bancário real é acessado — preparado para receber um provider de extrato quando disponível.",
  },
  {
    id: "esocial",
    name: "eSocial",
    category: "governo",
    status: "mock",
    description: "Transmissão de eventos de admissão, desligamento e folha para o eSocial.",
    feeds: ["obrigacoes"],
    disclaimer: "Sem integração real com o eSocial, SPED, DCTFWeb ou qualquer sistema da Receita Federal — ver aviso do Motor de Obrigações.",
  },
  {
    id: "sped",
    name: "SPED",
    category: "governo",
    status: "mock",
    description: "Transmissão de SPED Fiscal e SPED Contribuições.",
    feeds: ["obrigacoes"],
    disclaimer: "Sem integração real com o eSocial, SPED, DCTFWeb ou qualquer sistema da Receita Federal — ver aviso do Motor de Obrigações.",
  },
];
