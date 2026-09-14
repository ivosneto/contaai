import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/obrigacoes")({
  head: () => ({ meta: [
    { title: "Motor de Obrigações — ContaAI" },
    { name: "description", content: "Obrigações por cliente, calendário de vencimentos e alertas — dados de demonstração." },
    { property: "og:title", content: "Motor de Obrigações — ContaAI" },
    { property: "og:description", content: "Tipo, competência, vencimento, responsável, prioridade e checklist em um só lugar." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
