import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/alertas")({
  head: () => ({ meta: [
    { title: "Central de Alertas — Accounting OS" },
    { name: "description", content: "Central de Alertas do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Central de Alertas — Accounting OS" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
