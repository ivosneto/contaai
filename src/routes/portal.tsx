import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [
    { title: "Portal do Cliente — Accounting OS" },
    { name: "description", content: "Portal do Cliente do sistema operacional inteligente para escritórios contábeis." },
    { property: "og:title", content: "Portal do Cliente — Accounting OS" },
    { property: "og:description", content: "Gestão contábil orientada por dados, processos e inteligência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div />,
});
