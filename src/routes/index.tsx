import { createFileRoute } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CEO Dashboard — Accounting OS" },
      { name: "description", content: "Visão executiva do escritório contábil: receita, margem, clientes, capacidade e ações prioritárias." },
      { property: "og:title", content: "CEO Dashboard — Accounting OS" },
      { property: "og:description", content: "Tudo que precisa da sua atenção hoje, em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
