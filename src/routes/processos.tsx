import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/processos")({
  head: () => ({ meta: [
    { title: "Processos — Accounting OS" },
    { name: "description", content: "Processos do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Processos — Accounting OS" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
