import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [
    { title: "Clientes — ContaAI" },
    { name: "description", content: "Clientes do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Clientes — ContaAI" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
