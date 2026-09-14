import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/inteligencia")({
  head: () => ({ meta: [
    { title: "Intelligence Center — Accounting OS" },
    { name: "description", content: "Intelligence Center do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Intelligence Center — Accounting OS" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
