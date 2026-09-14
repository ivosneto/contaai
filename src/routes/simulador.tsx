import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/simulador")({
  head: () => ({ meta: [
    { title: "Simulador — ContaAI" },
    { name: "description", content: "Simulador do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Simulador — ContaAI" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
