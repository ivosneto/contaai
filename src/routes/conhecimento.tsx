import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/conhecimento")({
  head: () => ({ meta: [
    { title: "Conhecimento — Accounting OS" },
    { name: "description", content: "Conhecimento do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Conhecimento — Accounting OS" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
