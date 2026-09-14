import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/clientes/$clientId")({
 head: () => ({ meta: [{ title: "Customer 360 — ContaAI" }, { name: "description", content: "Visão completa e histórico do cliente." }, { property: "og:title", content: "Customer 360 — ContaAI" }, { property: "og:description", content: "Saúde, rentabilidade, serviços e memória do cliente." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: () => <div />,
});
