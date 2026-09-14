import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rentabilidade")({
  head: () => ({ meta: [
    { title: "Rentabilidade — ContaAI" },
    { name: "description", content: "Rentabilidade do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Rentabilidade — ContaAI" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
