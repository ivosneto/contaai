import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  FolderOpen,
  Inbox,
  Kanban,
  Landmark,
  Mail,
  MessageCircle,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { ContaAILogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitLeadFn } from "@/data/server-functions/marketing";

/**
 * Revela o conteúdo com um fade+slide sutil quando entra na viewport —
 * nunca parte de opacity:0 esperando um observer que pode não disparar
 * (conteúdo já intersectando no mount revela quase imediatamente, já que
 * IntersectionObserver.observe() dispara o callback de imediato nesse
 * caso). Respeita prefers-reduced-motion: nesse caso já nasce visível,
 * sem transição.
 */
function Reveal({
  children,
  delayMs = 0,
  className,
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={reduceMotion ? undefined : { transitionDelay: `${delayMs}ms` }}
      className={cn(
        reduceMotion
          ? "opacity-100"
          : cn(
              "transition-all duration-700 ease-out",
              visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            ),
        className,
      )}
    >
      {children}
    </div>
  );
}

const NAV_LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#integracoes", label: "Integrações" },
  { href: "#precos", label: "Preços" },
  { href: "#faq", label: "FAQ" },
] as const;

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

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Database,
    title: "Seus dados entram",
    description: "Clientes, tarefas, documentos e e-mail — o que já existe no seu escritório.",
  },
  {
    step: "2",
    icon: Sparkles,
    title: "A IA cruza e detecta",
    description:
      "Revenue Intelligence e Rentabilidade Real encontram o que passaria despercebido numa planilha.",
  },
  {
    step: "3",
    icon: ShieldCheck,
    title: "Você aprova",
    description: "Toda recomendação chega explicada — o gestor decide, nunca a IA sozinha.",
  },
  {
    step: "4",
    icon: ClipboardCheck,
    title: "O resultado fica registrado",
    description:
      "Vira oportunidade no CRM, tarefa ou ação — com histórico, não só uma sugestão perdida.",
  },
] as const;

/**
 * Mesmo catálogo e vocabulário de status usado dentro do produto
 * (Configurações → ver src/integrations/providers/catalog.ts) — nunca
 * "disponível" quando ainda não está conectado de verdade. Gestta foi
 * deliberadamente deixado de fora: investigação própria não achou nenhum
 * caminho técnico (nem API, nem parceiro), então "planejado" seria
 * otimista demais pra uma página pública.
 */
const INTEGRATIONS = [
  { icon: Mail, name: "Gmail", status: "Real" as const },
  { icon: Landmark, name: "Alterdata", status: "Em configuração" as const },
  { icon: Landmark, name: "Sittax", status: "Em configuração" as const },
  { icon: MessageCircle, name: "WhatsApp Business", status: "Demo" as const },
  { icon: FolderOpen, name: "Google Drive", status: "Demo" as const },
  { icon: FileSpreadsheet, name: "Excel / Google Sheets", status: "Planejado" as const },
  { icon: Kanban, name: "Trello", status: "Planejado" as const },
  { icon: Users, name: "CRM externo", status: "Planejado" as const },
  { icon: Wallet, name: "ERP financeiro", status: "Planejado" as const },
  { icon: Banknote, name: "Open Finance", status: "Planejado" as const },
  { icon: Building2, name: "eSocial", status: "Planejado" as const },
  { icon: Building2, name: "SPED", status: "Planejado" as const },
];

const INTEGRATION_BADGE: Record<(typeof INTEGRATIONS)[number]["status"], string> = {
  Real: "bg-good/10 text-good",
  "Em configuração": "bg-warn/10 text-warn",
  Demo: "bg-accent/10 text-accent",
  Planejado: "bg-muted-foreground/10 text-muted-foreground",
};

/**
 * Valores FICTÍCIOS — pedido explícito do dono do produto pra fechar o
 * design antes de ter preço final definido. Substituir antes de divulgar
 * a sério (anúncio pago, imprensa, etc.).
 */
const PLANS = [
  {
    name: "Essencial",
    price: "R$ 297",
    period: "/mês",
    description: "Pra escritórios que querem organizar a operação num só lugar.",
    features: [
      "Até 20 clientes ativos",
      "Equipe ilimitada",
      "Clientes, tarefas e obrigações",
      "Documentos com OCR",
      "CRM básico",
    ],
    highlighted: false,
  },
  {
    name: "Inteligência",
    price: "R$ 697",
    period: "/mês",
    description: "Tudo do Essencial, mais a camada de inteligência comercial.",
    features: [
      "Clientes ilimitados",
      "Revenue Intelligence",
      "Rentabilidade real por cliente",
      "Copilot com dados reais",
      "CRM conectado à inteligência",
      "E-mail integrado (Gmail)",
    ],
    highlighted: true,
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

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="text-center text-xs font-semibold uppercase tracking-wide text-brand">
      {children}
    </p>
  );
}

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background"
      style={{
        backgroundImage: "radial-gradient(var(--glass-line) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <header className="sticky top-0 z-20 border-b border-glass-line/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <ContaAILogo variant="horizontal" size={30} />
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Button variant="outline" onClick={onGetStarted}>
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div
          aria-hidden
          className="glow-orb pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-linear-to-br from-brand/15 via-accent/10 to-transparent blur-3xl motion-reduce:animate-none"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
            <Sparkles className="size-3.5" /> Inteligência operacional para escritórios contábeis
          </p>
          <h1 className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Sua contabilidade já sabe os números.{" "}
            <span className="bg-linear-to-r from-brand to-accent bg-clip-text text-transparent">
              A ContaAI mostra o que fazer com eles.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Rentabilidade real por cliente, oportunidades de receita que passam despercebidas, e um
            Copilot que responde com os dados do seu próprio escritório — nunca inventa, sempre
            explica, nunca age sem sua aprovação.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="transition-transform hover:scale-[1.03]"
              onClick={onGetStarted}
            >
              Criar meu workspace <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#contato">Falar com a gente</a>
            </Button>
          </div>
        </div>

        <Reveal delayMs={150} className="relative mx-auto mt-16 max-w-5xl">
          <div className="animate-[floaty_7s_ease-in-out_infinite] overflow-hidden rounded-2xl border border-glass-line bg-glass shadow-2xl shadow-brand/10 motion-reduce:animate-none">
            <div className="flex items-center gap-1.5 border-b border-glass-line/60 bg-muted/40 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-bad/60" />
              <span className="size-2.5 rounded-full bg-warn/60" />
              <span className="size-2.5 rounded-full bg-good/60" />
            </div>
            <img
              src="/marketing/dashboard-preview.jpg"
              alt="Visão Geral do ContaAI: receita, margem, clientes ativos e ações prioritárias do dia"
              className="w-full"
            />
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section id="recursos" className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <SectionEyebrow>Recursos</SectionEyebrow>
          <h2 className="mt-2 text-balance text-center font-display text-3xl font-semibold">
            O que já funciona de verdade
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Sem promessa de "em breve" — cada item abaixo é código rodando, não protótipo.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delayMs={i * 80}>
              <div className="glass-panel h-full rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-brand-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionEyebrow>Como funciona</SectionEyebrow>
            <h2 className="mt-2 text-balance text-center font-display text-3xl font-semibold">
              Do dado bruto à decisão aprovada
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s, i) => (
              <Reveal key={s.step} delayMs={i * 100} className="relative">
                <div className="glass-panel h-full rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-brand-foreground">
                      <s.icon className="size-5" />
                    </span>
                    <span className="font-display text-sm font-semibold text-muted-foreground">
                      Passo {s.step}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ArrowRight className="absolute -right-6 top-1/2 hidden size-5 -translate-y-1/2 text-brand/40 lg:block" />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Integrações */}
      <section id="integracoes" className="mx-auto max-w-6xl px-6 py-16 text-center">
        <Reveal>
          <SectionEyebrow>Integrações</SectionEyebrow>
          <h2 className="mt-2 text-balance font-display text-3xl font-semibold">
            Conectado com o que você já usa
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Status real de cada uma — Real é código testado contra o sistema de verdade; Demo é uma
            simulação interativa; Planejado é catálogo, não promessa de prazo.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {INTEGRATIONS.map((i, idx) => (
            <Reveal key={i.name} delayMs={(idx % 4) * 90}>
              <div className="glass-panel flex h-full flex-col items-center gap-2 rounded-2xl px-4 py-5 text-center transition-transform duration-300 hover:-translate-y-1">
                <span className="grid size-10 place-items-center rounded-xl bg-muted">
                  <i.icon className="size-5 text-foreground" />
                </span>
                <p className="text-sm font-semibold">{i.name}</p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${INTEGRATION_BADGE[i.status]}`}
                >
                  {i.status}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <SectionEyebrow>Preços</SectionEyebrow>
            <h2 className="mt-2 text-balance text-center font-display text-3xl font-semibold">
              Um plano pra cada fase do escritório
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delayMs={i * 120}>
                <div
                  className={`relative rounded-2xl border p-7 transition-transform duration-300 hover:-translate-y-1 ${
                    plan.highlighted
                      ? "border-brand bg-glass shadow-xl shadow-brand/10"
                      : "glass-panel"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-7 rounded-full bg-linear-to-r from-brand to-accent px-3 py-1 text-xs font-semibold text-brand-foreground">
                      Mais popular
                    </span>
                  )}
                  <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-4">
                    <span className="font-display text-3xl font-semibold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={onGetStarted}
                  >
                    Começar com {plan.name}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delayMs={240}>
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-dashed border-glass-line p-5 text-center">
              <p className="font-display text-base font-semibold">Personalizado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mais de um workspace, onboarding assistido ou um volume de clientes fora dos planos
                acima? Fala com a gente.
              </p>
              <Button variant="outline" className="mt-3" asChild>
                <a href="#contato">Falar com a gente</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-16">
        <Reveal>
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-2 text-balance text-center font-display text-3xl font-semibold">
            Perguntas frequentes
          </h2>
        </Reveal>
        <div className="mt-10 space-y-5">
          {[
            {
              q: "Preciso trocar de sistema contábil pra usar a ContaAI?",
              a: "Não. A ContaAI organiza clientes, tarefas, documentos e a camada de inteligência comercial — não substitui o sistema de escrituração fiscal/contábil que você já usa.",
            },
            {
              q: "A IA toma decisão sozinha no meu CRM ou cadastro?",
              a: "Nunca. Toda recomendação da IA fica pendente de aprovação de um gestor antes de virar uma mudança real — isso vale pra oportunidade comercial, tarefa ou qualquer outra ação.",
            },
            {
              q: "Funciona pra Simples Nacional, Lucro Presumido e Lucro Real?",
              a: "Sim, o cadastro de clientes cobre os três regimes — a rentabilidade e as recomendações são calculadas a partir do que está registrado em cada cliente.",
            },
            {
              q: "Meus dados ficam seguros?",
              a: "Sim — cada escritório (workspace) só enxerga os próprios dados, com isolamento reforçado a nível de banco (Row Level Security), não só na tela.",
            },
          ].map((item, i) => (
            <Reveal key={item.q} delayMs={i * 80}>
              <div className="glass-panel rounded-2xl p-5">
                <p className="font-semibold">{item.q}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA escura */}
      <section className="relative overflow-hidden bg-foreground px-6 py-16 text-background">
        <div
          aria-hidden
          className="glow-orb pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-brand/30 blur-3xl motion-reduce:animate-none"
        />
        <div
          aria-hidden
          style={{ animationDelay: "2.5s" }}
          className="glow-orb pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-accent/30 blur-3xl motion-reduce:animate-none"
        />
        <Reveal className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl">
            Pronto pra ver funcionando no seu escritório?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-background/70">
            Crie um workspace agora ou fale com a gente pra ver uma demonstração com os dados reais
            da sua carteira.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="transition-transform hover:scale-[1.03]"
              onClick={onGetStarted}
            >
              Criar meu workspace <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-background/30 bg-transparent text-background hover:bg-background/10"
              asChild
            >
              <a href="#contato">Falar com a gente</a>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Contato */}
      <section id="contato" className="mx-auto max-w-2xl px-6 py-16">
        <Reveal>
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
        </Reveal>
      </section>

      <footer className="border-t border-glass-line/60 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <ContaAILogo variant="horizontal" size={24} />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ContaAI. Inteligência operacional para escritórios
            contábeis.
          </p>
        </div>
      </footer>
    </div>
  );
}
