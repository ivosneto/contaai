import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pendencias")({
  head: () => ({ meta: [
    { title: "Central de Pendências — ContaAI" },
    { name: "description", content: "Tudo que precisa de uma decisão ou ação humana, com origem, SLA e responsável." },
    { property: "og:title", content: "Central de Pendências — ContaAI" },
    { property: "og:description", content: "Categoria, prioridade, prazo e responsável em um só lugar." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
