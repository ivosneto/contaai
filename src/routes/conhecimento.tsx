import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/conhecimento")({
  head: () => ({ meta: [
    { title: "Conhecimento — ContaAI" },
    { name: "description", content: "Conhecimento do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Conhecimento — ContaAI" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
