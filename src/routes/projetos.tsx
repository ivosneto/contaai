import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projetos")({
  head: () => ({ meta: [
    { title: "Projetos — ContaAI" },
    { name: "description", content: "Projetos do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Projetos — ContaAI" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
