// Fábrica de provider de e-mail — único ponto que decide qual provider está
// ativo, lendo EMAIL_PROVIDER (env, sem prefixo VITE_). Mesmo desenho de
// src/lib/ai/provider.server.ts: um só caso hoje (Gmail); trocar de
// provider no futuro é implementar EmailProvider e adicionar um `case` aqui.
import { GmailProvider } from "./gmail-provider.server";
import { EmailProviderError, type EmailProvider } from "./provider.types";

export function getEmailProvider(): EmailProvider {
  const provider = process.env["EMAIL_PROVIDER"] ?? "gmail";
  switch (provider) {
    case "gmail": {
      const clientId = process.env["GOOGLE_OAUTH_CLIENT_ID"];
      const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];
      const redirectUri = process.env["GOOGLE_OAUTH_REDIRECT_URI"];
      if (!clientId || !clientSecret || !redirectUri) {
        throw new EmailProviderError(
          "UNAVAILABLE",
          "Integração de e-mail não configurada (GOOGLE_OAUTH_CLIENT_ID/_SECRET/_REDIRECT_URI ausentes).",
        );
      }
      return new GmailProvider(clientId, clientSecret, redirectUri);
    }
    default:
      throw new EmailProviderError("UNAVAILABLE", `EMAIL_PROVIDER desconhecido: "${provider}".`);
  }
}
