// Formulário de contato do site de divulgação (página pública, antes do
// login) — nunca fala com o Supabase direto do navegador; grava sempre via
// supabaseAdmin (service_role) aqui no servidor, a tabela marketing_leads
// não tem nenhuma policy de RLS para anon/authenticated. "website" é um
// honeypot: um campo escondido no formulário que humanos nunca preenchem,
// mas bots que preenchem todo campo acabam preenchendo — se vier com
// valor, a submissão é descartada silenciosamente (sem erro, pra não
// ensinar o bot a evitar o campo).
import { createServerFn } from "@tanstack/react-start";

type SubmitLeadInput = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message?: string;
  website?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitLeadFn = createServerFn({ method: "POST" })
  .validator((data: SubmitLeadInput) => data)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    if (data.website) return { ok: true };

    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    if (!name || !EMAIL_RE.test(email)) {
      throw new Error("Preencha nome e e-mail válidos.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("marketing_leads").insert({
      name,
      email,
      ...(data.company?.trim() ? { company: data.company.trim() } : {}),
      ...(data.phone?.trim() ? { phone: data.phone.trim() } : {}),
      ...(data.message?.trim() ? { message: data.message.trim() } : {}),
    });
    if (error) throw new Error("Falha ao registrar seu contato. Tente novamente em instantes.");
    return { ok: true };
  });
