import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pessoas")({
  head: () => ({ meta: [
    { title: "Pessoas — ContaAI" },
    { name: "description", content: "Pessoas do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Pessoas — ContaAI" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
