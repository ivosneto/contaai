import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [
    { title: "Relatórios — Accounting OS" },
    { name: "description", content: "Relatórios do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Relatórios — Accounting OS" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
