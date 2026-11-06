import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  CheckCircle2,
  Inbox,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { ContaAILogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitLeadFn } from "@/data/server-functions/marketing";

const FEATURES = [
  {
    icon: Target,
    title: "Revenue Intelligence",
    description:
      "Detecta clientes que cresceram, honorários defasados e oportunidades de cross-sell — a partir dos dados reais da sua carteira, nunca de suposição.",
  },
  {
    icon: BarChart3,
    title: "Rentabilidade real por cliente",
    description:
      "Custo operacional de verdade (horas, mão de obra, indiretos) cruzado com o honorário — mostra exatamente quem dá lucro e quem está no prejuízo.",
  },
  {
    icon: Sparkles,
    title: "Copilot que nunca inventa",
    description:
      "Toda resposta cita o dado real que a sustenta. Se não houver dado suficiente, ele diz isso — nunca completa com achismo.",
  },
  {
    icon: CheckCircle2,
    title: "CRM conectado à inteligência",
    description:
      "Uma oportunidade detectada vira proposta real no pipeline comercial, com aprovação do gestor antes de qualquer mudança — nunca automático.",
  },
  {
    icon: Inbox,
    title: "Documentos e e-mail integrados",
    description:
      "OCR real em notas e boletos, Gmail conectado por OAuth — a triagem manual vira exceção, não rotina.",
  },
  {
    icon: ShieldCheck,
    title: "Nenhuma ação sem aprovação",
    description:
      "A IA propõe, explica o porquê e espera um humano decidir. Nada muda no seu CRM, tarefas ou cadastro sozinho.",
  },
] as const;

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  website: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  company: "",
  phone: "",
  message: "",
  website: "",
};

function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    setSending(true);
    try {
      await submitLeadFn({ data: form });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar. Tente de novo.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-brand" />
        <h3 className="mt-3 font-display text-xl font-semibold">Recebemos seu contato.</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Alguém do time vai responder em breve, direto no e-mail que você passou.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">Nome</label>
          <Input
            className="mt-1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">E-mail</label>
          <Input
            className="mt-1"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="voce@escritorio.com"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Escritório
            </label>
            <Input
              className="mt-1"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              WhatsApp
            </label>
            <Input
              className="mt-1"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Opcional"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">Mensagem</label>
          <Textarea
            className="mt-1"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="Conte um pouco sobre o seu escritório"
          />
        </div>
        {/* honeypot — invisível e fora da ordem de tab para quem usa teclado/leitor de tela */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          aria-hidden="true"
        />
      </div>
      <Button className="mt-5 w-full" disabled={sending} onClick={() => void submit()}>
        {sending ? "Enviando…" : "Falar com a gente"}
      </Button>
    </div>
  );
}

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <ContaAILogo variant="horizontal" size={32} />
        <Button variant="outline" onClick={onGetStarted}>
          Entrar
        </Button>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-10 text-center sm:pb-24 sm:pt-16">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
          <Sparkles className="size-3.5" /> Inteligência operacional para escritórios contábeis
        </p>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Sua contabilidade já sabe os números. A ContaAI mostra o que fazer com eles.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Rentabilidade real por cliente, oportunidades de receita que passam despercebidas, e um
          Copilot que responde com os dados do seu próprio escritório — nunca inventa, sempre
          explica, nunca age sem sua aprovação.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={onGetStarted}>
            Criar meu workspace
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#contato">Falar com a gente</a>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-panel rounded-2xl p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-brand-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contato" className="mx-auto max-w-2xl px-6 pb-24">
        <div className="mb-6 text-center">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Quer ver funcionando no seu escritório?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Deixe seu contato — a gente responde e combina uma demonstração com os seus próprios
            dados.
          </p>
        </div>
        <ContactForm />
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquareText className="size-3.5" /> Prefere conversar direto? Responda este
          formulário com seu WhatsApp que a gente chama por lá.
        </div>
      </section>
    </div>
  );
}
