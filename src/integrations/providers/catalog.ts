import type { IntegrationDefinition } from "./types";

/**
 * Catálogo de integrações externas do ContaAI — status honesto por item
 * (ver IntegrationStatus em types.ts para o que cada valor exige como
 * evidência). Nenhum item aqui é apresentado como mais pronto do que
 * realmente está.
 */
export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "alterdata",
    name: "Alterdata (eContador)",
    category: "dominio-fiscal",
    status: "em_configuracao",
    description:
      "Leitura de status de apuração e obrigações fiscais direto do eContador do escritório, via a API oficial (ePlugin).",
    feeds: ["obrigacoes", "financeiro"],
    disclaimer:
      "Sem integração real ainda. A Alterdata expõe uma API REST/JSON documentada (ePlugin, autenticação JWT) — mas exige plano eContador Master do escritório-cliente e o catálogo completo de endpoints não está público; falta credencial real e mapeamento de endpoint para conectar. Ver src/lib/fiscal/. Obrigações continuam sendo geradas de forma determinística no protótipo.",
  },
  {
    id: "sittax",
    name: "Sittax",
    category: "dominio-fiscal",
    status: "em_configuracao",
    description:
      "Leitura de resultado de apuração (DIFAL, ICMS-ST) direto do Sittax do escritório.",
    feeds: ["obrigacoes"],
    disclaimer:
      "Sem integração real ainda. O Sittax tem uma 'API de Integração' documentada (chave de API), mas a documentação pública encontrada cobre o fluxo de ENTRADA (importação de NF-e para dentro do Sittax) — o fluxo que o ContaAI precisa é o INVERSO (ler o resultado da apuração de volta), e isso não está confirmado nem nessa API nem em outra. Nem o endpoint de leitura nem o nome do header de autenticação da chave de API estão confirmados. Ver src/lib/fiscal/sittax-provider.server.ts. Precisa de conta de teste + suporte da Sittax para confirmar os dois antes de implementar.",
  },
  {
    id: "gestta",
    name: "Gestta",
    category: "produtividade",
    status: "planejado",
    description:
      "Sincronização de tarefas e prazos de entrega do Gestta (gestão de processos do escritório) com a Central de Tarefas.",
    feeds: ["tarefas"],
    disclaimer:
      "Descartado por ora — sem caminho técnico confirmado, não é um 'em breve'. Nenhuma API pública de desenvolvedor foi encontrada (pesquisa feita, não suposição): o Gestta foi adquirido pela Thomson Reuters e hoje é vendido como módulo do Domínio Contábil; a única API do Domínio confirmada publicamente é de importação de documentos fiscais, sem nenhuma relação com tarefas/prazos. Reavaliar só se o contato direto com Gestta/Thomson Reuters revelar um programa de parceiros não documentado publicamente.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "mensageria",
    status: "demo",
    description: "Recebimento e envio de mensagens de clientes direto na Inbox unificada.",
    feeds: ["comunicacao"],
    disclaimer:
      "Sem integração real com a API do WhatsApp. O provider mock simula o recebimento de uma mensagem para demonstrar o fluxo completo de identificação e classificação.",
  },
  {
    id: "email",
    name: "E-mail (Gmail)",
    category: "mensageria",
    status: "real",
    description:
      "Conecta uma caixa Gmail via OAuth, sincroniza mensagens recebidas, classifica com IA e identifica o cliente — direto na Inbox unificada.",
    feeds: ["comunicacao", "documentos"],
    disclaimer:
      "Integração real (OAuth 2.0 + Gmail API) — ver o card de status/conexão nesta página. Envio de e-mail e outros provedores (Outlook, IMAP genérico) ainda não implementados.",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "armazenamento",
    status: "demo",
    description:
      "Leitura de documentos enviados pelo cliente numa pasta compartilhada, alimentando o pipeline de Documentos Inteligentes.",
    feeds: ["documentos"],
    disclaimer:
      "Sem integração real com a API do Google Drive. O provider mock simula a chegada de um arquivo para demonstrar identificação, classificação e extração.",
  },
  {
    id: "sheets",
    name: "Excel / Google Sheets",
    category: "planilhas",
    status: "planejado",
    description:
      "Importação e exportação de planilhas (clientes, honorários, lançamentos) para os módulos financeiro e de clientes.",
    feeds: ["financeiro", "comercial"],
    disclaimer:
      "Sem importação/exportação real de arquivos. Preparado para receber um parser de planilha que gere os mesmos formatos de entrada usados pelas ações do store.",
  },
  {
    id: "trello",
    name: "Trello",
    category: "produtividade",
    status: "planejado",
    description:
      "Sincronização de tarefas e quadros de projeto com a Central de Tarefas e Projetos.",
    feeds: ["tarefas"],
    disclaimer:
      "Sem integração real com a API do Trello. Tarefas continuam sendo criadas pelas ações internas (pendência → tarefa, automação, etc.).",
  },
  {
    id: "crm-externo",
    name: "CRM externo",
    category: "crm",
    status: "planejado",
    description:
      "Sincronização de leads e oportunidades comerciais com o pipeline do módulo Comercial.",
    feeds: ["comercial"],
    disclaimer:
      "Sem integração real com um CRM externo. O pipeline comercial já existe no ContaAI e pode ser a origem ou o destino da sincronização quando integrado.",
  },
  {
    id: "sistemas-financeiros",
    name: "Sistemas financeiros / ERP",
    category: "financeiro",
    status: "planejado",
    description: "Conciliação de faturas, pagamentos e contas com um ERP financeiro externo.",
    feeds: ["financeiro"],
    disclaimer:
      "Sem integração real com um ERP financeiro. Faturas e pagamentos continuam sendo dados de demonstração — ver módulo Financeiro.",
  },
  {
    id: "open-finance",
    name: "Open Finance",
    category: "open-finance",
    status: "planejado",
    description:
      "Extrato bancário automático dos clientes, alimentando conciliação e contas a pagar/receber.",
    feeds: ["financeiro"],
    disclaimer:
      "Sem integração real com o ecossistema Open Finance. Nenhum dado bancário real é acessado — preparado para receber um provider de extrato quando disponível.",
  },
  {
    id: "esocial",
    name: "eSocial",
    category: "governo",
    status: "planejado",
    description: "Transmissão de eventos de admissão, desligamento e folha para o eSocial.",
    feeds: ["obrigacoes"],
    disclaimer:
      "Sem integração real com o eSocial, SPED, DCTFWeb ou qualquer sistema da Receita Federal — ver aviso do Motor de Obrigações.",
  },
  {
    id: "sped",
    name: "SPED",
    category: "governo",
    status: "planejado",
    description: "Transmissão de SPED Fiscal e SPED Contribuições.",
    feeds: ["obrigacoes"],
    disclaimer:
      "Sem integração real com o eSocial, SPED, DCTFWeb ou qualquer sistema da Receita Federal — ver aviso do Motor de Obrigações.",
  },
];
