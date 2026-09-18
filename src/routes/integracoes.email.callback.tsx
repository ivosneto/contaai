import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/integracoes/email/callback")({
  head: () => ({
    meta: [
      { title: "Conectando e-mail — ContaAI" },
      { name: "description", content: "Concluindo a conexão da caixa de e-mail." },
    ],
  }),
  component: () => <div />,
});
