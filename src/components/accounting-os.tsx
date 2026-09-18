import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command as CommandIcon,
  FileText,
  FolderOpen,
  Gauge,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { ContaAILogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  accountsPaid,
  accountsReceivable,
  agents,
  alerts,
  brl,
  clientById,
  clientMargin,
  clientProfitability,
  clients,
  contacts,
  contracts,
  churnRisks,
  crossSellTargets,
  emails,
  employees,
  healthScores,
  healthTone,
  insights,
  margin,
  meetings,
  monthlyRevenue,
  mrrMovements,
  mrrWaterfall,
  opportunities,
  processes,
  profitabilityDashboard,
  revenueOpportunities,
  timeline,
  totals,
  type Client,
  type Department,
  type KnowledgeArticle,
  type PendencyPriority,
  type Project,
  type ServiceName,
} from "@/data/office";
import { cn } from "@/lib/utils";
import {
  OfficeStoreProvider,
  useOfficeStore,
  type ClientEditableFields,
  type NewKnowledgeArticleInput,
  type NewTaskInput,
} from "@/data/store";
import { PortalStoreProvider } from "@/data/portal-store";
import { SessionProvider, useSession } from "@/data/session";
import { LoginPage } from "@/components/auth/login-page";
import { PendenciasPage } from "@/components/pendencias-page";
import { CapacityPage } from "@/components/capacity-page";
import { DocumentsPage } from "@/components/documents-page";
import { ObligationsPage } from "@/components/obligations-page";
import { InboxPage } from "@/components/inbox-page";
import { AICopilot } from "@/components/copilot";
import { IntelligencePage } from "@/components/intelligence-page";
import { AutomationPage } from "@/components/automation-page";
import { FinancialPage } from "@/components/financial-page";
import { BenchmarkingPage } from "@/components/benchmarking-page";
import { SimulatorPage } from "@/components/simulator-page";
import { ClientPortalShell } from "@/components/client-portal";
import { IntegrationsPage } from "@/components/integrations-page";
import { EmailOAuthCallbackPage } from "@/components/email-oauth-callback";
import { marginNMonthsAgo, suggestedFee } from "@/lib/profitability-engine";
import { OCR_DEMO_DISCLAIMER } from "@/lib/documents-engine";
import { OBLIGATIONS_DEMO_DISCLAIMER } from "@/lib/obligations-engine";

const navGroups = [
  {
    label: "Operação",
    items: [
      ["/", "Visão Geral", LayoutDashboard],
      ["/clientes", "Clientes", Building2],
      ["/pendencias", "Pendências", Inbox],
      ["/obrigacoes", "Obrigações", CalendarClock],
      ["/comercial", "Comercial", Target],
      ["/processos", "Processos", Network],
      ["/tarefas", "Tarefas", Clock3],
      ["/projetos", "Projetos", BriefcaseBusiness],
      ["/pessoas", "Pessoas", Users],
      ["/comunicacao", "Comunicação", MessageSquare],
      ["/documentos", "Documentos", FolderOpen],
    ],
  },
  {
    label: "Gestão",
    items: [
      ["/financeiro", "Financeiro", CircleDollarSign],
      ["/rentabilidade", "Rentabilidade", BarChart3],
      ["/inteligencia", "Inteligência", Sparkles],
      ["/automacao", "Automação", Zap],
      ["/benchmarking", "Benchmarking", Gauge],
      ["/conhecimento", "Conhecimento", BookOpen],
    ],
  },
] as const;

const routeTitles: Record<string, string> = {
  "/": "Visão Geral",
  "/clientes": "Clientes",
  "/pendencias": "Central de Pendências",
  "/obrigacoes": "Motor de Obrigações",
  "/comercial": "Comercial",
  "/onboarding": "Onboarding",
  "/processos": "Processos",
  "/tarefas": "Tarefas",
  "/projetos": "Projetos",
  "/pessoas": "Pessoas",
  "/comunicacao": "Comunicação",
  "/documentos": "Documentos",
  "/financeiro": "Financeiro",
  "/rentabilidade": "Rentabilidade",
  "/inteligencia": "Central de Inteligência",
  "/automacao": "Automação",
  "/benchmarking": "Benchmarking",
  "/conhecimento": "Conhecimento",
  "/configuracoes": "Configurações",
  "/portal": "Portal do Cliente",
  "/simulador": "Simulador",
  "/relatorios": "Relatórios",
  "/alertas": "Central de Alertas",
};

function metaTitle(path: string) {
  if (path.startsWith("/clientes/")) return "Customer 360";
  return routeTitles[path] ?? "ContaAI";
}

/** Cadastro manual de algumas entidades ainda não existe neste protótipo — em vez de fingir que criou algo, avisa com clareza em vez de falhar em silêncio. */
function comingSoon(entity: string) {
  toast(`Cadastro de ${entity} ainda não está disponível neste protótipo.`);
}

export function Glass({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <section className={cn("glass-panel rounded-2xl", className)} onClick={onClick}>
      {children}
    </section>
  );
}

export function StatusDot({ tone }: { tone: "good" | "warn" | "bad" | "brand" }) {
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full",
        tone === "good" && "bg-good",
        tone === "warn" && "bg-warn",
        tone === "bad" && "bg-bad",
        tone === "brand" && "bg-brand",
      )}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "good" | "warn" | "bad" | "brand" | "accent" | "neutral";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone === "good" && "bg-good/10 text-good",
        tone === "warn" && "bg-warn/10 text-warn",
        tone === "bad" && "bg-bad/10 text-bad",
        tone === "brand" && "bg-brand/10 text-brand",
        tone === "accent" && "bg-accent/10 text-accent",
        tone === "neutral" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="font-serif text-lg italic text-brand">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function Kpi({
  label,
  value,
  change,
  tone = "good",
  icon: Icon,
  onClick,
}: {
  label: string;
  value: string;
  change: string;
  tone?: "good" | "bad" | "warn" | "brand";
  icon?: typeof Activity;
  onClick?: () => void;
}) {
  return (
    <button
      className="glass-panel group rounded-2xl p-4 text-left transition-transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
      <p
        className={cn(
          "mt-1 text-xs font-semibold",
          tone === "good" && "text-good",
          tone === "bad" && "text-bad",
          tone === "warn" && "text-warn",
          tone === "brand" && "text-brand",
        )}
      >
        {change}
      </p>
    </button>
  );
}

function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col p-4",
        !mobile && "glass-panel sticky top-5 hidden h-[calc(100vh-2.5rem)] rounded-3xl lg:flex",
      )}
    >
      <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
        <ContaAILogo variant="horizontal" size={36} />
      </Link>
      <CreateMenu />
      <nav className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(([to, label, Icon]) => {
                const active = to === "/" ? path === "/" : path.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-glass text-brand shadow-sm"
                        : "text-muted-foreground hover:bg-glass hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" /> {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-3 space-y-1 border-t border-glass-line pt-3">
        <Link
          to="/configuracoes"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-glass"
        >
          <Settings className="size-4" /> Configurações
        </Link>
        <UserMenu />
      </div>
    </aside>
  );
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Sócio(a)",
  admin: "Administrador(a)",
  manager: "Gerente",
  employee: "Colaborador(a)",
  client: "Cliente",
};

function UserMenu() {
  const session = useSession();
  const label = session.email ?? "Sua conta";
  return (
    <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-glass p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand/20 to-accent/20 text-sm font-semibold text-brand">
        {label.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {session.role ? ROLE_LABEL[session.role] : "—"}
        </p>
      </div>
      <button
        className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
        onClick={() => void session.signOut()}
      >
        Sair
      </button>
    </div>
  );
}

function CreateMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const options: [string, string][] = [
    ["Pendência", "/pendencias"],
    ["Documento", "/documentos"],
    ["Obrigação", "/obrigacoes"],
    ["Automação", "/automacao"],
    ["Tarefa", "/tarefas"],
    ["Cliente", "/clientes"],
  ];
  return (
    <div className="relative mt-4">
      <Button
        className="h-10 w-full rounded-xl bg-primary text-primary-foreground"
        onClick={() => setOpen(!open)}
      >
        <Plus /> Criar
      </Button>
      {open && (
        <div className="absolute left-0 top-12 z-50 grid w-full grid-cols-2 gap-1 rounded-xl border border-glass-line bg-popover p-2 shadow-xl">
          {options.map(([label, to]) => (
            <button
              key={label}
              className="rounded-lg px-2 py-2 text-left text-xs hover:bg-muted"
              onClick={() => {
                setOpen(false);
                void navigate({ to: to as "/pendencias" });
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Ponto de entrada real de identidade: sem sessão → login; sessão sem
 * workspace → tela de espera; papel 'client' → Portal do Cliente (nunca o
 * painel interno, mesmo que a pessoa edite a URL — a decisão é pelo papel
 * da sessão, não pelo caminho); demais papéis → painel interno de sempre.
 * Substitui o antigo gate por pathname ("/portal") — ver
 * src/data/session.tsx para o que garante isso no servidor.
 */
export function AccountingShell() {
  return (
    <SessionProvider>
      <AccountingShellGate />
    </SessionProvider>
  );
}

function AccountingShellGate() {
  const session = useSession();

  if (session.status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="flex flex-col items-center gap-3">
          <ContaAILogo variant="horizontal" size={36} />
          <p className="animate-pulse text-sm text-muted-foreground">Carregando…</p>
        </div>
      </div>
    );
  }
  if (session.status === "signed-out") return <LoginPage />;
  if (session.status === "no-workspace") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="max-w-sm text-center">
          <ContaAILogo variant="horizontal" size={36} />
          <p className="mt-4 text-sm text-muted-foreground">
            Sua conta está autenticada, mas ainda não pertence a nenhum workspace. Peça para o
            responsável pelo seu escritório te convidar, ou entre com uma conta diferente.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void session.signOut()}>
            Sair
          </Button>
        </div>
      </div>
    );
  }
  if (session.role === "client") {
    return (
      <PortalStoreProvider>
        <ClientPortalShell />
      </PortalStoreProvider>
    );
  }
  return (
    <OfficeStoreProvider>
      <AccountingShellInternal />
    </OfficeStoreProvider>
  );
}

function AccountingShellInternal() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 mx-auto flex max-w-[1500px] gap-0 px-3 py-3 sm:px-5 sm:py-5 lg:px-8">
        <Sidebar />
        <div className="min-w-0 flex-1 lg:pl-5">
          <Topbar
            title={metaTitle(pathname)}
            onSearch={() => setCommandOpen(true)}
            onAI={() => setAiOpen(true)}
            onMenu={() => setMobileOpen(true)}
          />
          <main className="pb-10">
            <PageRouter pathname={pathname} openAI={() => setAiOpen(true)} />
          </main>
        </div>
      </div>
      <CommandPalette open={commandOpen} setOpen={setCommandOpen} openAI={() => setAiOpen(true)} />
      <AICopilot open={aiOpen} setOpen={setAiOpen} />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <Sidebar mobile />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Topbar({
  title,
  onSearch,
  onAI,
  onMenu,
}: {
  title: string;
  onSearch: () => void;
  onAI: () => void;
  onMenu: () => void;
}) {
  return (
    <header className="mb-5 flex items-center gap-2 sm:gap-3">
      <Button
        variant="outline"
        size="icon"
        className="glass-soft rounded-xl lg:hidden"
        onClick={onMenu}
        aria-label="Abrir menu"
      >
        <Menu />
      </Button>
      <button
        onClick={onSearch}
        className="glass-soft flex h-10 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-left text-sm text-muted-foreground shadow-sm lg:max-w-xl"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Pesquisar em {title.toLowerCase()}…</span>
        <kbd className="ml-auto hidden rounded-md border border-input bg-background/60 px-2 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>
      <Button variant="outline" className="glass-soft rounded-xl" onClick={onAI}>
        <Sparkles className="text-brand" />
        <span className="hidden sm:inline">Copilot</span>
      </Button>
      <Button variant="outline" size="icon" className="glass-soft relative rounded-xl" asChild>
        <Link to="/alertas" aria-label="Notificações">
          <Bell />
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-bad text-[9px] text-primary-foreground">
            3
          </span>
        </Link>
      </Button>
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-sm font-semibold text-brand-foreground">
        M
      </div>
    </header>
  );
}

function CommandPalette({
  open,
  setOpen,
  openAI,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  openAI: () => void;
}) {
  const navigate = useNavigate();
  const go = (to: string, search?: Record<string, string>) => {
    setOpen(false);
    void navigate({ to, ...(search ? { search: search as never } : {}) });
  };
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="O que você quer fazer?" />
      <CommandList>
        <CommandEmpty>Nenhuma ação encontrada.</CommandEmpty>
        <CommandGroup heading="Ir para">
          <CommandItem onSelect={() => go("/clientes")}>
            <Building2 /> Encontrar cliente<CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/tarefas", { filtro: "atrasadas" })}>
            <Clock3 /> Ver tarefas atrasadas
          </CommandItem>
          <CommandItem onSelect={() => go("/clientes", { filtro: "risco" })}>
            <Sparkles /> Ver clientes em risco
          </CommandItem>
          <CommandItem onSelect={() => go("/pessoas")}>
            <Users /> Ver minha capacidade
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              openAI();
            }}
          >
            <Bot /> Perguntar para IA<CommandShortcut>AI</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Criar">
          {(
            [
              ["Pendência", "/pendencias"],
              ["Documento", "/documentos"],
              ["Obrigação", "/obrigacoes"],
              ["Automação", "/automacao"],
            ] as const
          ).map(([label, to]) => (
            <CommandItem key={label} onSelect={() => go(to)}>
              <Plus /> Criar {label.toLowerCase()}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function PageRouter({ pathname, openAI }: { pathname: string; openAI: () => void }) {
  if (pathname.startsWith("/clientes/"))
    return <Customer360 clientId={pathname.split("/")[2] ?? "c1"} />;
  switch (pathname) {
    case "/":
      return <Dashboard openAI={openAI} />;
    case "/clientes":
      return <ClientsPage />;
    case "/pendencias":
      return <PendenciasPage />;
    case "/obrigacoes":
      return <ObligationsPage />;
    case "/comercial":
      return <CommercialPage />;
    case "/processos":
      return <ProcessesPage />;
    case "/tarefas":
      return <TasksPage />;
    case "/pessoas":
      return <CapacityPage />;
    case "/financeiro":
      return <FinancialPage />;
    case "/rentabilidade":
      return <ProfitabilityPage />;
    case "/inteligencia":
      return <IntelligencePage />;
    case "/automacao":
      return <AutomationPage />;
    case "/benchmarking":
      return <BenchmarkingPage />;
    case "/conhecimento":
      return <KnowledgePage />;
    case "/simulador":
      return <SimulatorPage />;
    case "/alertas":
      return <AlertsPage />;
    case "/onboarding":
      return <OnboardingPage />;
    case "/documentos":
      return <DocumentsPage />;
    case "/comunicacao":
      return <InboxPage />;
    case "/projetos":
      return <ProjectsPage />;
    case "/configuracoes":
      return <IntegrationsPage />;
    case "/integracoes/email/callback":
      return <EmailOAuthCallbackPage />;
    case "/relatorios":
      return <ReportsPage />;
    default:
      return <Dashboard openAI={openAI} />;
  }
}

const TODAY_ISO = "2026-09-14";

function Dashboard({ openAI }: { openAI: () => void }) {
  const navigate = useNavigate();
  const {
    tasks,
    obligations,
    insightStatus,
    resolveInsight,
    ignoreInsight,
    confirmAction,
    createTaskForClient,
    createCommercialRecommendation,
    markChurnReviewed,
    churnReviewed,
    liveInsights,
    redistributeFromInsight,
    dismissLiveInsight,
  } = useOfficeStore();
  const topChurnRisks = [...churnRisks]
    .filter((c) => churnReviewed[c.clientId] === undefined)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const critical = alerts.filter((a) => a.level === "Crítico").slice(0, 3);
  const priorities = insights.slice(0, 3);
  const latestRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.receita ?? totals.mrr;
  const prevRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.receita ?? latestRevenue;
  const revenueChangePct =
    prevRevenue > 0 ? Math.round(((latestRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0;
  const marginEvolution = profitabilityDashboard.monthlyEvolution;
  const lastMonthEv = marginEvolution[marginEvolution.length - 1];
  const prevMonthEv = marginEvolution[marginEvolution.length - 2];
  const lastMargin =
    lastMonthEv && lastMonthEv.revenue > 0
      ? (lastMonthEv.profit / lastMonthEv.revenue) * 100
      : margin;
  const prevMargin =
    prevMonthEv && prevMonthEv.revenue > 0
      ? (prevMonthEv.profit / prevMonthEv.revenue) * 100
      : margin;
  const marginChangePp = Math.round((lastMargin - prevMargin) * 10) / 10;
  const newClientsThisMonth = clients.filter((c) => c.since.startsWith("2026-09")).length;
  const avgRework = Math.round(processes.reduce((s, p) => s + p.rework, 0) / processes.length);
  const mostLoaded = [...employees]
    .sort((a, b) => b.allocated / b.capacity - a.allocated / a.capacity)
    .slice(0, 3);
  const dueToday = {
    obligations: obligations.filter((o) => o.dueDate === TODAY_ISO && o.status !== "Concluída")
      .length,
    tasks: tasks.filter((t) => t.due === TODAY_ISO && t.status !== "Concluída").length,
  };
  const topOpportunity = [...revenueOpportunities].sort((a, b) => b.score - a.score)[0];
  return (
    <>
      <PageHeader
        eyebrow="Bom dia, Matheus."
        title="Aqui está o que precisa da sua atenção hoje."
        description="Sua operação está sob controle, com decisões que podem melhorar margem, capacidade e experiência do cliente."
        action={
          <Button
            className="rounded-xl bg-linear-to-r from-brand to-accent text-brand-foreground"
            onClick={openAI}
          >
            <Sparkles /> O que devo fazer agora?
          </Button>
        }
      />
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          label="Receita mensal"
          value={brl(latestRevenue)}
          change={`${revenueChangePct >= 0 ? "▲" : "▼"} ${Math.abs(revenueChangePct)}% vs. mês anterior`}
          tone={revenueChangePct >= 0 ? "good" : "bad"}
          icon={TrendingUp}
          onClick={() => void navigate({ to: "/financeiro" })}
        />
        <Kpi
          label="MRR"
          value={brl(totals.mrr)}
          change={`${mrrWaterfall.netChange >= 0 ? "▲" : "▼"} ${brl(Math.abs(mrrWaterfall.netChange))} no mês`}
          tone={mrrWaterfall.netChange >= 0 ? "good" : "bad"}
          icon={CircleDollarSign}
          onClick={() => void navigate({ to: "/financeiro" })}
        />
        <Kpi
          label="Margem operacional"
          value={`${margin}%`}
          change={`${marginChangePp >= 0 ? "▲" : "▼"} ${Math.abs(marginChangePp)} p.p. no mês`}
          tone={marginChangePp >= 0 ? "good" : "bad"}
          icon={BarChart3}
          onClick={() => void navigate({ to: "/rentabilidade" })}
        />
        <Kpi
          label="Clientes ativos"
          value={String(totals.activeClients)}
          change={
            newClientsThisMonth > 0
              ? `▲ ${newClientsThisMonth} novo(s) este mês`
              : "nenhum novo este mês"
          }
          icon={Users}
          onClick={() => void navigate({ to: "/clientes" })}
        />
        <Kpi
          label="Churn 90d"
          value={String(totals.atRisk)}
          change="clientes em risco"
          tone="warn"
          icon={TrendingDown}
          onClick={() => void navigate({ to: "/clientes", search: { filtro: "risco" } as never })}
        />
        <Kpi
          label="NPS"
          value={String(totals.nps)}
          change="média da carteira"
          tone="warn"
          icon={HeartPulse}
        />
        <Kpi
          label="Tarefas atrasadas"
          value={String(totals.lateTasks)}
          change="exigem atenção"
          tone={totals.lateTasks > 0 ? "warn" : "good"}
          icon={Clock3}
          onClick={() =>
            void navigate({ to: "/tarefas", search: { filtro: "atrasadas" } as never })
          }
        />
        <Kpi
          label="Inadimplência"
          value={brl(totals.overdue)}
          change={`${totals.overdueClients} contas vencidas`}
          tone="bad"
          icon={AlertTriangle}
          onClick={() => void navigate({ to: "/financeiro" })}
        />
        <Kpi
          label="Vence hoje"
          value={String(dueToday.obligations + dueToday.tasks)}
          change={`${dueToday.obligations} obrigação(ões) · ${dueToday.tasks} tarefa(s)`}
          tone={dueToday.obligations + dueToday.tasks > 0 ? "warn" : "good"}
          icon={CalendarClock}
          onClick={() => void navigate({ to: "/obrigacoes" })}
        />
      </section>
      {liveInsights.length > 0 && (
        <section className="mt-4">
          <Glass className="border border-brand/30 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-brand to-accent text-brand-foreground">
                <Zap className="size-4" />
              </span>
              <h2 className="font-display text-lg font-semibold">
                Gerado agora pelo fluxo operacional
              </h2>
              <Badge tone="brand">{liveInsights.length}</Badge>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Detectado ao processar um documento — cruzando obrigação, pendência e capacidade em
              tempo real.
            </p>
            <div className="space-y-2">
              {liveInsights.map((ins) => (
                <div key={ins.id} className="glass-soft rounded-xl p-3">
                  <p className="text-sm font-medium">{ins.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{ins.evidence.join(" ")}</p>
                  <p className="mt-1 text-xs text-brand">{ins.recommendation}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 bg-brand text-brand-foreground"
                      onClick={() =>
                        confirmAction({
                          title: "Redistribuir e medir resultado",
                          description: ins.title,
                          impact: "operacional",
                          successMessage:
                            "Redistribuição aplicada — resultado registrado na timeline do cliente.",
                          onConfirm: () => redistributeFromInsight(ins.id),
                        })
                      }
                    >
                      Redistribuir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7"
                      onClick={() => void navigate({ to: ins.link as "/pessoas" })}
                    >
                      Ver capacidade
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => dismissLiveInsight(ins.id)}
                    >
                      Ignorar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Glass>
        </section>
      )}
      <section className="mt-4 grid gap-4 xl:grid-cols-5">
        <Glass className="p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">3 problemas críticos</h2>
            <Badge tone="bad">Crítico</Badge>
          </div>
          <div className="space-y-2.5">
            {critical.map((a) => (
              <button
                key={a.id}
                onClick={() => void navigate({ to: a.link as "/pessoas" })}
                className="glass-soft flex w-full items-start gap-3 rounded-xl p-3 text-left hover:border-bad/40"
              >
                <StatusDot tone="bad" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Glass>
        <Glass className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-brand to-accent text-brand-foreground">
              <Sparkles className="size-4" />
            </span>
            <h2 className="font-display text-lg font-semibold">O que fazer hoje</h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Priorizado pelo motor de inteligência com base nos dados da operação.
          </p>
          <div className="space-y-2">
            {priorities.map((ins, i) => {
              const status = insightStatus[ins.id];
              return (
                <div key={ins.id} className="glass-soft rounded-xl p-3">
                  <p className="text-sm font-medium">
                    {i + 1} · {ins.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{ins.recommendation}</p>
                  {status ? (
                    <Badge tone={status === "resolvido" ? "good" : "neutral"} className="mt-2">
                      {status === "resolvido" ? "Resolvido" : "Ignorado"}
                    </Badge>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        className="h-7 bg-brand text-brand-foreground"
                        onClick={() =>
                          confirmAction({
                            title: ins.actions[0] ?? "Executar ação",
                            description: ins.title,
                            impact: "operacional",
                            successMessage: "Ação executada.",
                            onConfirm: () => resolveInsight(ins.id),
                          })
                        }
                      >
                        {ins.actions[0] ?? "Resolver"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7"
                        onClick={() => void navigate({ to: ins.link as "/pessoas" })}
                      >
                        Ver detalhes
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => ignoreInsight(ins.id)}
                      >
                        Ignorar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Glass>
      </section>
      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Glass className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Quem está sobrecarregado?</h2>
            <Link to="/pessoas" className="text-xs font-semibold text-brand">
              Ver equipe →
            </Link>
          </div>
          <div className="space-y-4">
            {mostLoaded.map((e) => (
              <div key={e.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>
                    {e.name} · {e.department}
                  </span>
                  <span
                    className={cn(
                      "font-semibold",
                      e.allocated / e.capacity > 1
                        ? "text-bad"
                        : e.allocated / e.capacity < 0.8
                          ? "text-warn"
                          : "text-foreground",
                    )}
                  >
                    {Math.round((e.allocated / e.capacity) * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      e.allocated / e.capacity > 1
                        ? "bg-bad"
                        : e.allocated / e.capacity < 0.8
                          ? "bg-warn"
                          : "bg-brand",
                    )}
                    style={{ width: `${Math.min(100, (e.allocated / e.capacity) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 border-t border-glass-line pt-4 text-center">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Demanda</p>
              <p className="font-display text-lg font-semibold">{totals.allocated}h</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Capacidade</p>
              <p className="font-display text-lg font-semibold">{totals.capacity}h</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Déficit</p>
              <p className="font-display text-lg font-semibold text-bad">
                {Math.max(0, totals.allocated - totals.capacity)}h
              </p>
            </div>
          </div>
        </Glass>
        <Glass className="p-5">
          <h2 className="font-display text-lg font-semibold">Receita · 6 meses</h2>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <Tooltip formatter={(v) => brl(Number(v))} />
                <Bar dataKey="receita" fill="var(--color-brand)" radius={[5, 5, 0, 0]} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone={avgRework > 10 ? "bad" : "good"}>Retrabalho médio: {avgRework}%</Badge>
            <Badge tone="neutral">
              {processes.filter((p) => !p.slaOk).length} processo(s) em risco
            </Badge>
          </div>
        </Glass>
      </section>
      <Glass className="mt-4 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            Rentabilidade da carteira — custo operacional real
          </h2>
          <Link to="/rentabilidade" className="text-xs font-semibold text-brand">
            Ver motor de rentabilidade →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass-soft rounded-xl p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Margem média</p>
            <p className="font-display text-xl font-semibold">
              {profitabilityDashboard.avgMargin}%
            </p>
          </div>
          <div className="glass-soft rounded-xl p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Receita</p>
            <p className="font-display text-xl font-semibold">
              {brl(profitabilityDashboard.totalRevenue)}
            </p>
          </div>
          <div className="glass-soft rounded-xl p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Custo real</p>
            <p className="font-display text-xl font-semibold">
              {brl(profitabilityDashboard.totalCost)}
            </p>
          </div>
          <div className="glass-soft rounded-xl p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Lucro</p>
            <p
              className={cn(
                "font-display text-xl font-semibold",
                profitabilityDashboard.totalProfit < 0 && "text-bad",
              )}
            >
              {brl(profitabilityDashboard.totalProfit)}
            </p>
          </div>
        </div>
        {profitabilityDashboard.deficitClients.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {profitabilityDashboard.deficitClients.length} cliente(s) operando com prejuízo:{" "}
            {profitabilityDashboard.deficitClients
              .slice(0, 4)
              .map((d) => clientById(d.clientId)?.name)
              .filter(Boolean)
              .join(", ")}
            .
          </p>
        )}
      </Glass>
      {topChurnRisks.length > 0 && (
        <Glass className="mt-4 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">
              Churn Risk — clientes em maior risco
            </h2>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Pontuação por regras (MVP), não é modelo de ML treinado
            </span>
          </div>
          <div className="space-y-2">
            {topChurnRisks.map((risk) => {
              const client = clientById(risk.clientId);
              if (!client) return null;
              return (
                <div
                  key={risk.clientId}
                  className="glass-soft flex flex-wrap items-start justify-between gap-3 rounded-xl p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{client.name}</p>
                      <Badge
                        tone={risk.level === "Crítico" || risk.level === "Alto" ? "bad" : "warn"}
                      >
                        {risk.level} · {risk.score}/100
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{risk.explanation}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={() =>
                        void navigate({
                          to: "/clientes/$clientId",
                          params: { clientId: client.id },
                        })
                      }
                    >
                      Ver cliente
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={() =>
                        confirmAction({
                          title: "Criar tarefa",
                          description: `Investigar risco de churn de ${client.name}.`,
                          impact: "operacional",
                          successMessage: "Tarefa criada em /tarefas.",
                          onConfirm: () =>
                            createTaskForClient(
                              client.id,
                              `Investigar risco de churn — ${client.name}`,
                            ),
                        })
                      }
                    >
                      Criar tarefa
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() =>
                        confirmAction({
                          title: "Marcar como analisado",
                          description: `Confirma que o risco de churn de ${client.name} foi analisado?`,
                          impact: "operacional",
                          successMessage: "Cliente marcado como analisado.",
                          onConfirm: () => markChurnReviewed(client.id),
                        })
                      }
                    >
                      Marcar como analisado
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Glass>
      )}
      {topOpportunity && <OpportunityPreview opportunity={topOpportunity} />}
      <Glass className="relative mt-4 overflow-hidden p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-brand-foreground">
              <Sparkles />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">ContaAI Copilot</h2>
              <p className="text-xs text-muted-foreground">
                Responde com os dados reais do sistema e cita o que sustenta cada resposta.
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {[
              "Como está o escritório?",
              "Quais clientes estão em risco?",
              "Quem está sobrecarregado?",
              "Por que nossa margem caiu?",
            ].map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                className="glass-soft rounded-full"
                onClick={openAI}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
      </Glass>
    </>
  );
}

function OpportunityPreview({
  opportunity,
}: {
  opportunity: (typeof revenueOpportunities)[number];
}) {
  const navigate = useNavigate();
  const { confirmAction, createCommercialRecommendation } = useOfficeStore();
  const c = clientById(opportunity.clientId);
  if (!c) return null;
  const cp = clientProfitability.find((x) => x.clientId === c.id);
  const m = cp?.current.margin ?? clientMargin(c);
  const approve = () =>
    confirmAction({
      title: "Enviar para aprovação do gestor",
      description: `Reajuste de ${c.name} para a faixa ${brl(opportunity.recommendedRange.min)}–${brl(opportunity.recommendedRange.max)}/mês exige aprovação — nada é executado automaticamente.`,
      impact: "operacional",
      confirmLabel: "Enviar para aprovação",
      successMessage: "Recomendação enviada à Central de Pendências para aprovação do gestor.",
      onConfirm: () =>
        createCommercialRecommendation(
          c.id,
          `Aprovar reajuste — ${c.name}`,
          `${opportunity.situation} Faixa recomendada: ${brl(opportunity.recommendedRange.min)}–${brl(opportunity.recommendedRange.max)}/mês.`,
        ),
    });
  return (
    <Glass className="mt-4 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-brand/10 font-display font-bold text-brand">
            {c.name[0]}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Onde podemos ganhar dinheiro?</h2>
            <p className="text-xs text-muted-foreground">
              {c.name} · CNPJ {c.cnpj} · {c.regime}
            </p>
          </div>
        </div>
        <Badge tone={healthTone(c.health)}>
          {c.health}/100 · {c.health >= 75 ? "Saudável" : c.health >= 55 ? "Atenção" : "Risco"}
        </Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="glass-soft rounded-xl p-4">
          <p className="text-xs uppercase text-muted-foreground">Hoje</p>
          <p className="mt-1 font-display text-xl font-semibold">
            {brl(opportunity.currentFee)}/mês
          </p>
          <p className={cn("text-xs font-semibold", m > 35 ? "text-good" : "text-bad")}>
            Margem {m}%
          </p>
        </div>
        <div className="glass-soft rounded-xl p-4">
          <p className="text-xs uppercase text-muted-foreground">Faixa recomendada</p>
          <p className="mt-1 font-display text-xl font-semibold">
            {brl(opportunity.recommendedRange.min)}–{brl(opportunity.recommendedRange.max)}
          </p>
          <p className="text-xs text-muted-foreground">+{brl(opportunity.potentialIncrease)}/mês</p>
        </div>
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="text-xs font-semibold uppercase text-accent">Revenue Intelligence</p>
          <p className="mt-1 text-sm">{opportunity.situation}</p>
          <div className="mt-2 flex gap-1.5">
            <Button size="sm" className="h-7 bg-accent text-accent-foreground" onClick={approve}>
              Enviar para aprovação
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => void navigate({ to: "/comercial" })}
            >
              Ver todas
            </Button>
          </div>
        </div>
      </div>
    </Glass>
  );
}

function ClientsPage() {
  const navigate = useNavigate();
  const { clients: liveClients } = useOfficeStore();
  const search = useRouterState({ select: (s) => s.location.search }) as { filtro?: string };
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(search.filtro === "risco" ? "Em risco" : "Todos");
  const list = liveClients.filter(
    (c) =>
      (filter === "Todos" ||
        (filter === "Em risco" && c.health < 55) ||
        filter === c.status ||
        (filter === "Alta rentabilidade" && clientMargin(c) >= 50) ||
        (filter === "Baixa rentabilidade" && clientMargin(c) < 35)) &&
      c.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Clientes"
        description="CRM contábil com saúde, rentabilidade, serviços e relacionamento em uma única visão."
        action={
          <Button className="rounded-xl" onClick={() => comingSoon("clientes")}>
            <Plus /> Novo cliente
          </Button>
        }
      />
      <Glass className="p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
              placeholder="Buscar por empresa, CNPJ ou responsável…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "Todos",
              "Ativo",
              "Em onboarding",
              "Em risco",
              "Inadimplente",
              "Alta rentabilidade",
              "Baixa rentabilidade",
            ].map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
        {list.length === 0 && (
          <p className="mt-6 py-8 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado com esses filtros. Ajuste a busca ou limpe os filtros.
          </p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-glass-line text-[11px] uppercase text-muted-foreground">
                <th className="px-3 py-3">Cliente</th>
                <th>Regime</th>
                <th>Serviços</th>
                <th>Honorário</th>
                <th>Margem</th>
                <th>NPS</th>
                <th>Health Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr
                  key={c.id}
                  onClick={() =>
                    void navigate({ to: "/clientes/$clientId", params: { clientId: c.id } })
                  }
                  className="cursor-pointer border-b border-glass-line/60 hover:bg-glass"
                >
                  <td className="px-3 py-3">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.cnpj} · {c.owner}
                    </p>
                  </td>
                  <td>{c.regime}</td>
                  <td>
                    <div className="flex gap-1">
                      {c.services.slice(0, 3).map((s) => (
                        <Badge key={s} tone="brand">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="font-medium">{brl(c.fee)}</td>
                  <td
                    className={
                      clientMargin(c) < 0
                        ? "font-semibold text-bad"
                        : clientMargin(c) < 35
                          ? "font-semibold text-warn"
                          : "font-semibold text-good"
                    }
                  >
                    {clientMargin(c)}%
                  </td>
                  <td>{c.nps ?? "—"}</td>
                  <td>
                    <Badge tone={healthTone(c.health)}>{c.health}/100</Badge>
                  </td>
                  <td>
                    <Badge
                      tone={
                        c.status === "Em risco"
                          ? "bad"
                          : c.status === "Inadimplente"
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {list.length} de {liveClients.length} clientes
        </p>
      </Glass>
    </>
  );
}

const CLIENT_SERVICE_OPTIONS = [
  "Contábil",
  "Fiscal",
  "Pessoal",
  "BPO",
  "Societário",
  "Consultoria",
] as const;
const CLIENT_REGIMES = ["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"] as const;
const CLIENT_STATUSES = [
  "Ativo",
  "Em onboarding",
  "Em risco",
  "Inadimplente",
  "Sem atividade",
] as const;
const EMPTY_CLIENT_EDIT: ClientEditableFields = {
  name: "",
  cnpj: "",
  segment: "",
  regime: "Simples Nacional",
  owner: "",
  services: [],
  fee: 0,
  status: "Ativo",
};

function Customer360({ clientId }: { clientId: string }) {
  const {
    tasks,
    pendencies,
    communications,
    documents,
    obligations,
    activityLog,
    clients: liveClients,
    updateClient,
    processes: liveProcesses,
    completePendency,
    createTaskFromPendency,
    createCommunicationFromPendency,
    createPendency,
    createTaskForClient,
    createCommercialRecommendation,
    markChurnReviewed,
    churnReviewed,
    confirmAction,
    processDocument,
    createPendencyFromObligation,
  } = useOfficeStore();
  const [tab, setTab] = useState("resumo");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ClientEditableFields>(EMPTY_CLIENT_EDIT);
  const c = liveClients.find((x) => x.id === clientId) ?? liveClients[0];
  if (!c) return null;
  const openEdit = () => {
    setEditForm({
      name: c.name,
      cnpj: c.cnpj,
      segment: c.segment,
      regime: c.regime,
      owner: c.owner,
      services: c.services,
      fee: c.fee,
      status: c.status,
    });
    setEditOpen(true);
  };
  const toggleEditService = (s: ServiceName) =>
    setEditForm((f) => ({
      ...f,
      services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s],
    }));
  const saveEdit = () => {
    updateClient(c.id, editForm);
    setEditOpen(false);
    toast.success("Cadastro do cliente atualizado.");
  };
  const cHealth = healthScores.find((h) => h.clientId === c.id);
  const cChurn = churnRisks.find((x) => x.clientId === c.id);
  const cTasks = tasks.filter((t) => t.clientId === c.id).slice(0, 6);
  const cProcesses = liveProcesses.filter((p) => p.clientId === c.id).slice(0, 4);
  const cDocuments = documents.filter((d) => d.clientId === c.id);
  const cObligations = obligations.filter((o) => o.clientId === c.id);
  const cPendencies = pendencies.filter((p) => p.clientId === c.id);
  const cOpportunities = opportunities.filter((o) => o.company === c.name);
  const cContact = contacts.find((ct) => ct.clientId === c.id && ct.primary);
  const cContract = contracts.find((ctr) => ctr.clientId === c.id);
  const cProfitability = clientProfitability.find((cp) => cp.clientId === c.id);
  const cEmployees = cProfitability
    ? cProfitability.employeeIds
        .map((id) => employees.find((e) => e.id === id)?.name)
        .filter((n): n is string => Boolean(n))
    : [];
  const cMargin3mAgo = cProfitability ? marginNMonthsAgo(cProfitability, 3).margin : null;
  const cReceivable = accountsReceivable.filter((r) => r.clientId === c.id);
  const cPaid = accountsPaid.filter((p) => p.clientId === c.id);
  const cMovement = mrrMovements.find((m) => m.clientId === c.id);
  const events = [
    ...timeline.filter((e) => e.clientId === c.id),
    ...activityLog.filter((e) => e.clientId === c.id),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const feed = [
    ...communications
      .filter((m) => m.clientId === c.id)
      .map((m) => ({
        id: m.id,
        date: m.createdAt,
        label: `${m.channel} · ${m.classification}`,
        text: m.summary,
        canEscalate: m.classification === "Reclamação" || m.classification === "Urgente",
      })),
    ...emails
      .filter((e) => e.clientId === c.id)
      .map((e) => ({
        id: e.id,
        date: e.at,
        label: `E-mail · ${e.direction}`,
        text: e.subject,
        canEscalate: false,
      })),
    ...meetings
      .filter((m) => m.clientId === c.id)
      .map((m) => ({
        id: m.id,
        date: m.at,
        label: `Reunião · ${m.type}`,
        text: m.title,
        canEscalate: false,
      })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const contactMessage = `Olá! Notamos que a saúde da conta de ${c.name} pode se beneficiar de um contato próximo — podemos alinhar as próximas entregas?`;
  const escalate = (text: string) =>
    confirmAction({
      title: "Criar pendência a partir da comunicação",
      description: `Isso cria uma pendência para ${c.name} com base em "${text}".`,
      impact: "operacional",
      successMessage: "Pendência criada.",
      onConfirm: () =>
        createPendency({
          clientId: c.id,
          category: "Cliente",
          title: text,
          description: text,
          assignee: c.owner,
          priority: "Alta",
          dueDate: "2026-09-20",
        }),
    });
  return (
    <>
      <PageHeader
        eyebrow="Customer 360"
        title={c.name}
        description={`${c.cnpj} · ${c.segment} · ${c.regime}`}
        action={
          <div className="flex gap-2">
            <Badge tone={healthTone(c.health)}>Health Score {c.health}/100</Badge>
            <Button size="sm" variant="outline" onClick={openEdit}>
              <MoreHorizontal /> Editar cliente
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 xl:grid-cols-4">
        <Kpi label="Honorário" value={brl(c.fee)} change="receita mensal" tone="brand" />
        <Kpi
          label="Custo operacional real"
          value={brl(cProfitability?.current.totalCost ?? c.cost)}
          change={`${cProfitability?.current.hours ?? c.hoursMonth}h/mês`}
          tone="warn"
        />
        <Kpi
          label="Margem"
          value={`${cProfitability?.current.margin ?? clientMargin(c)}%`}
          change={
            (cProfitability?.current.margin ?? clientMargin(c)) > 35
              ? "acima da meta"
              : "reajuste recomendado"
          }
          tone={(cProfitability?.current.margin ?? clientMargin(c)) > 35 ? "good" : "bad"}
        />
        <Kpi
          label="NPS"
          value={c.nps ? String(c.nps) : "—"}
          change={`cliente desde ${c.since.slice(0, 4)}`}
          tone="brand"
        />
      </div>
      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList className="glass-soft h-auto flex-wrap justify-start p-1">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="processos">Processos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="obrigacoes">Obrigações</TabsTrigger>
          <TabsTrigger value="pendencias">
            Pendências
            <Badge tone="brand" className="ml-1.5">
              {
                cPendencies.filter((p) => p.status !== "Concluída" && p.status !== "Cancelada")
                  .length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
          <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
          <TabsTrigger value="notas">Notas internas</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo">
          <div className="grid gap-4 xl:grid-cols-3">
            <Glass className="p-5 xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">Customer Health Score</h2>
                {cHealth && (
                  <Badge
                    tone={
                      cHealth.classification === "Saudável"
                        ? "good"
                        : cHealth.classification === "Atenção"
                          ? "warn"
                          : "bad"
                    }
                  >
                    {cHealth.score}/100 · {cHealth.classification}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Metodologia transparente: soma de 11 fatores com peso fixo (NPS, inadimplência,
                reclamações, solicitações, atrasos, utilização, interação, frequência,
                rentabilidade, pendências e evolução do relacionamento).
              </p>
              {cHealth && (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase text-good">
                        Fatores positivos
                      </p>
                      <div className="space-y-1.5">
                        {cHealth.positiveFactors.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Nenhum fator de destaque no momento.
                          </p>
                        )}
                        {cHealth.positiveFactors.map((f) => (
                          <div
                            key={f.key}
                            className="glass-soft flex items-center gap-2 rounded-lg p-2 text-xs"
                          >
                            <StatusDot tone="good" />
                            <span>{f.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase text-bad">
                        Fatores negativos
                      </p>
                      <div className="space-y-1.5">
                        {cHealth.negativeFactors.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Nenhum fator crítico no momento.
                          </p>
                        )}
                        {cHealth.negativeFactors.map((f) => (
                          <div
                            key={f.key}
                            className="glass-soft flex items-center gap-2 rounded-lg p-2 text-xs"
                          >
                            <StatusDot tone="bad" />
                            <span>{f.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cHealth.history}>
                        <XAxis dataKey="month" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Health Score"
                          stroke="var(--color-brand)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-brand)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 rounded-xl bg-brand/10 p-4">
                    <p className="text-sm font-semibold text-brand">Recomendação</p>
                    <p className="mt-1 text-sm">{cHealth.recommendation}</p>
                    <Button
                      className="mt-3"
                      size="sm"
                      onClick={() =>
                        confirmAction({
                          title: "Criar tarefa de reunião",
                          description: `Agendar reunião de relacionamento com ${c.name}.`,
                          impact: "operacional",
                          successMessage: "Tarefa criada em /tarefas.",
                          onConfirm: () => createTaskForClient(c.id, `Agendar reunião — ${c.name}`),
                        })
                      }
                    >
                      Agendar reunião
                    </Button>
                  </div>
                </>
              )}
            </Glass>
            <div className="space-y-4">
              <Glass className="p-5">
                <h2 className="font-display text-lg font-semibold">Contato principal</h2>
                {cContact ? (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="font-semibold">{cContact.name}</p>
                    <p className="text-muted-foreground">{cContact.role}</p>
                    <p className="text-muted-foreground">{cContact.email}</p>
                    <p className="text-muted-foreground">{cContact.phone}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Sem contato cadastrado.</p>
                )}
              </Glass>
              <Glass className="p-5">
                <h2 className="font-display text-lg font-semibold">Contrato</h2>
                {cContract ? (
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        tone={
                          cContract.status === "Ativo"
                            ? "good"
                            : cContract.status === "Encerrado"
                              ? "bad"
                              : "warn"
                        }
                      >
                        {cContract.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Valor</span>
                      <span className="font-semibold">{brl(cContract.value)}/mês</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Renovação</span>
                      <span>{cContract.renewalDate}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Sem contrato cadastrado.</p>
                )}
              </Glass>
            </div>
          </div>
          {cChurn && (
            <Glass className="mt-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">Churn Risk</h2>
                <Badge
                  tone={
                    cChurn.level === "Crítico" || cChurn.level === "Alto"
                      ? "bad"
                      : cChurn.level === "Médio"
                        ? "warn"
                        : "good"
                  }
                >
                  {cChurn.level} · {cChurn.score}/100
                </Badge>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Pontuação determinística baseada em regras (MVP) — não é um modelo de machine
                learning treinado.
              </p>
              <p className="mt-3 text-sm">{cChurn.explanation}</p>
              {churnReviewed[c.id] && (
                <p className="mt-2 text-xs text-good">
                  Analisado pelo gestor em {churnReviewed[c.id]}.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    confirmAction({
                      title: "Criar tarefa",
                      description: `Investigar risco de churn de ${c.name}.`,
                      impact: "operacional",
                      successMessage: "Tarefa criada em /tarefas.",
                      onConfirm: () =>
                        createTaskForClient(c.id, `Investigar risco de churn — ${c.name}`),
                    })
                  }
                >
                  Criar tarefa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast(`Mensagem preparada: "${contactMessage}"`)}
                >
                  Preparar contato
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab("timeline")}>
                  Ver histórico
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    confirmAction({
                      title: "Marcar como analisado",
                      description: `Confirma que o risco de churn de ${c.name} foi analisado?`,
                      impact: "operacional",
                      successMessage: "Cliente marcado como analisado.",
                      onConfirm: () => markChurnReviewed(c.id),
                    })
                  }
                >
                  Marcar como analisado
                </Button>
              </div>
            </Glass>
          )}
          <Glass className="mt-4 p-5">
            <h2 className="font-display text-lg font-semibold">Serviços contratados</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {["Contábil", "Fiscal", "Pessoal", "BPO", "Societário", "Consultoria"].map((s) => (
                <div
                  key={s}
                  className="flex items-center justify-between rounded-lg bg-glass p-2.5 text-sm"
                >
                  <span>{s}</span>
                  {c.services.includes(s as never) ? (
                    <Badge tone="good">Ativo</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-accent"
                      onClick={() =>
                        confirmAction({
                          title: "Gerar recomendação comercial",
                          description: `Propor o serviço de ${s} para ${c.name}, que ainda não o contrata.`,
                          impact: "operacional",
                          successMessage: "Recomendação registrada na Central de Pendências.",
                          onConfirm: () =>
                            createCommercialRecommendation(
                              c.id,
                              `Propor ${s} — ${c.name}`,
                              `Cliente ainda não contrata ${s}. Oportunidade de cross-sell identificada no Cliente 360.`,
                            ),
                        })
                      }
                    >
                      Oportunidade
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Glass>
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineList events={events} />
        </TabsContent>
        <TabsContent value="processos">
          <Glass className="p-5">
            <DataList
              items={cProcesses.map((p) => ({
                title: p.name,
                sub: `${p.progress}% concluído · ${p.rework}% retrabalho`,
                badge: p.slaOk ? "Dentro do SLA" : "Risco de atraso",
                tone: p.slaOk ? "good" : "bad",
              }))}
            />
          </Glass>
        </TabsContent>
        <TabsContent value="financeiro">
          <Glass className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Financeiro do cliente</h2>
              <Link to="/financeiro" className="text-xs font-semibold text-brand">
                Ver módulo financeiro →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Receita" value={brl(c.fee)} />
              <MiniStat
                label="Custo total"
                value={brl(cProfitability?.current.totalCost ?? c.cost)}
              />
              <MiniStat label="Em aberto" value={brl(c.overdue)} />
            </div>
            {cMovement && (
              <div className="mt-3">
                <Badge
                  tone={
                    cMovement.type === "Churn"
                      ? "bad"
                      : cMovement.type === "Contração"
                        ? "warn"
                        : "good"
                  }
                >
                  {cMovement.type} · {brl(cMovement.amount)}/mês{" "}
                  {cMovement.type === "Churn" || cMovement.type === "Contração"
                    ? "a menos"
                    : "a mais"}{" "}
                  vs. período anterior
                </Badge>
              </div>
            )}
          </Glass>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Glass className="p-5">
              <h2 className="font-display text-lg font-semibold">Contas a receber</h2>
              {cReceivable.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nenhuma conta em aberto.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {cReceivable.map((item) => (
                    <div key={item.invoiceId} className="glass-soft rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{brl(item.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence {item.dueDate}
                            {item.daysOverdue > 0 ? ` · ${item.daysOverdue} dia(s) em atraso` : ""}
                          </p>
                        </div>
                        <Badge tone={item.status === "Vencida" ? "bad" : "warn"}>
                          {item.status}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7"
                        onClick={() =>
                          confirmAction({
                            title: "Gerar cobrança",
                            description: `Cria uma pendência financeira para ${c.name} referente à fatura de ${brl(item.amount)} vencida em ${item.dueDate}.`,
                            impact: "operacional",
                            successMessage:
                              "Pendência de cobrança criada na Central de Pendências.",
                            onConfirm: () =>
                              createPendency({
                                clientId: c.id,
                                category: "Financeiro",
                                title: `Cobrança — ${c.name}`,
                                description: `Fatura de ${brl(item.amount)} vencida em ${item.dueDate}.`,
                                assignee: c.owner,
                                priority: item.daysOverdue >= 15 ? "Alta" : "Média",
                                dueDate: "2026-09-20",
                              }),
                          })
                        }
                      >
                        Gerar cobrança
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Glass>
            <Glass className="p-5">
              <h2 className="font-display text-lg font-semibold">Contas pagas</h2>
              {cPaid.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {cPaid.map((p) => (
                    <div
                      key={p.paymentId}
                      className="flex items-center justify-between rounded-xl bg-glass p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-good">{brl(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          Pago em {p.paidAt} · {p.method}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Glass>
          </div>
          {cProfitability && (
            <Glass className="mt-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    Motor de Rentabilidade Real
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Custo operacional calculado a partir das horas consumidas e do custo/hora dos
                    colaboradores envolvidos.
                  </p>
                </div>
                <Badge
                  tone={
                    cProfitability.current.margin < 0
                      ? "bad"
                      : cProfitability.current.margin < 35
                        ? "warn"
                        : "good"
                  }
                >
                  Margem {cProfitability.current.margin}%
                  {cMargin3mAgo !== null && cMargin3mAgo !== cProfitability.current.margin
                    ? ` (${cMargin3mAgo}% há 3 meses)`
                    : ""}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <MiniStat label="Mão de obra" value={brl(cProfitability.current.laborCost)} />
                <MiniStat label="Indiretos" value={brl(cProfitability.current.indirectCost)} />
                <MiniStat
                  label="Terceirizados"
                  value={
                    cProfitability.current.outsourcedCost
                      ? brl(cProfitability.current.outsourcedCost)
                      : "—"
                  }
                />
                <MiniStat label="Lucro" value={brl(cProfitability.current.profit)} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Colaboradores envolvidos: {cEmployees.length ? cEmployees.join(", ") : "—"} ·{" "}
                {cProfitability.current.hours}h consumidas este mês.
              </p>
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cProfitability.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Line
                      type="monotone"
                      dataKey="margin"
                      name="Margem"
                      stroke="var(--color-brand)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-brand)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast(
                      `Preço recomendado: ${brl(suggestedFee(cProfitability.current))}/mês (margem alvo 35%).`,
                    )
                  }
                >
                  Simular reajuste
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    confirmAction({
                      title: "Criar tarefa de revisão",
                      description: `Analisar rentabilidade de ${c.name}.`,
                      impact: "operacional",
                      successMessage: "Tarefa criada em /tarefas.",
                      onConfirm: () =>
                        createTaskForClient(c.id, `Revisar rentabilidade — ${c.name}`),
                    })
                  }
                >
                  Criar tarefa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    confirmAction({
                      title: "Gerar recomendação comercial",
                      description: `Reajuste sugerido: ${brl(suggestedFee(cProfitability.current))}/mês.`,
                      impact: "operacional",
                      successMessage: "Recomendação registrada na Central de Pendências.",
                      onConfirm: () =>
                        createCommercialRecommendation(
                          c.id,
                          `Propor reajuste — ${c.name}`,
                          `Margem atual ${cProfitability.current.margin}%. Preço sugerido: ${brl(suggestedFee(cProfitability.current))}/mês.`,
                        ),
                    })
                  }
                >
                  Gerar recomendação comercial
                </Button>
              </div>
            </Glass>
          )}
        </TabsContent>
        <TabsContent value="documentos">
          <Glass className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Documentos</h2>
              <Link to="/documentos" className="text-xs font-semibold text-brand">
                Enviar novo documento →
              </Link>
            </div>
            <p className="mb-3 text-[10px] uppercase tracking-wide text-muted-foreground">
              {OCR_DEMO_DISCLAIMER}
            </p>
            <div className="space-y-2">
              {cDocuments.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum documento para este cliente.</p>
              )}
              {cDocuments.map((d) => (
                <div key={d.id} className="glass-soft rounded-xl p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.category} · competência {d.competence} · {d.assignee}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        tone={
                          d.status === "Vencido" || d.status === "Rejeitado"
                            ? "bad"
                            : d.status === "Aprovado"
                              ? "good"
                              : d.status === "Pendente"
                                ? "warn"
                                : "neutral"
                        }
                      >
                        {d.status}
                      </Badge>
                      <Badge tone="neutral">{d.pipelineStage}</Badge>
                    </div>
                  </div>
                  {d.extraction && (
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-glass p-2.5 text-[11px] text-muted-foreground sm:grid-cols-3">
                      <span>CNPJ: {d.extraction.cnpj}</span>
                      <span>Nº: {d.extraction.numero}</span>
                      <span>Confiança OCR: {d.extraction.confidence}%</span>
                      {d.extraction.valor !== null && <span>Valor: {brl(d.extraction.valor)}</span>}
                      {d.extraction.vencimento && (
                        <span>Vencimento: {d.extraction.vencimento}</span>
                      )}
                    </div>
                  )}
                  {d.linkedObligationId && (
                    <p className="mt-2 text-xs text-brand">
                      Evidência vinculada à obrigação{" "}
                      {obligations.find((o) => o.id === d.linkedObligationId)?.type ??
                        d.linkedObligationId}
                      .
                    </p>
                  )}
                  {d.pipelineStage === "Recebido" && (
                    <div className="mt-2.5">
                      <Button
                        size="sm"
                        className="h-7"
                        onClick={() =>
                          confirmAction({
                            title: "Processar documento",
                            description: `Identificar, classificar, extrair (OCR simulado), validar e relacionar "${d.name}" ao cliente e à obrigação correspondente.`,
                            impact: "operacional",
                            successMessage: "Documento processado.",
                            onConfirm: () => processDocument(d.id),
                          })
                        }
                      >
                        Processar documento
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Glass>
        </TabsContent>
        <TabsContent value="obrigacoes">
          <Glass className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Obrigações</h2>
              <Link to="/obrigacoes" className="text-xs font-semibold text-brand">
                Ver calendário completo →
              </Link>
            </div>
            <p className="mb-3 text-[10px] uppercase tracking-wide text-muted-foreground">
              {OBLIGATIONS_DEMO_DISCLAIMER}
            </p>
            <div className="space-y-2">
              {cObligations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma obrigação para este cliente.
                </p>
              )}
              {cObligations.map((o) => {
                const done = o.checklist.filter((i) => i.done).length;
                return (
                  <div key={o.id} className="glass-soft rounded-xl p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {o.type} · {o.competence}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          vence {o.dueDate} · {o.municipality} · {o.regime} · {o.assignee}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge
                          tone={
                            o.status === "Atrasada"
                              ? "bad"
                              : o.status === "Concluída"
                                ? "good"
                                : o.status === "Aguardando cliente"
                                  ? "warn"
                                  : "neutral"
                          }
                        >
                          {o.status}
                        </Badge>
                        <Badge
                          tone={
                            o.priority === "Crítica" || o.priority === "Alta" ? "bad" : "neutral"
                          }
                        >
                          {o.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Checklist: {done}/{o.checklist.length} concluído
                      {o.evidenceDocumentId ? " · evidência anexada" : ""}
                    </p>
                    {o.status !== "Concluída" && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() =>
                            confirmAction({
                              title: "Gerar pendência",
                              description: `Criar pendência para regularizar ${o.type} (${o.competence}).`,
                              impact: "operacional",
                              successMessage: "Pendência criada.",
                              onConfirm: () => createPendencyFromObligation(o.id),
                            })
                          }
                        >
                          Gerar pendência
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Glass>
        </TabsContent>
        <TabsContent value="pendencias">
          <Glass className="p-5">
            <div className="space-y-2">
              {cPendencies.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma pendência para este cliente.
                </p>
              )}
              {cPendencies.map((p) => (
                <div key={p.id} className="glass-soft rounded-xl p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.category} · {p.assignee} · prazo {p.dueDate}
                      </p>
                    </div>
                    <Badge
                      tone={
                        p.status === "Concluída"
                          ? "good"
                          : p.priority === "Crítica" || p.priority === "Alta"
                            ? "bad"
                            : "warn"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                  {p.status !== "Concluída" && p.status !== "Cancelada" && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        className="h-7"
                        onClick={() =>
                          confirmAction({
                            title: "Concluir pendência",
                            description: p.title,
                            impact: "operacional",
                            successMessage: "Pendência concluída.",
                            onConfirm: () => completePendency(p.id),
                          })
                        }
                      >
                        Concluir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() =>
                          confirmAction({
                            title: "Gerar tarefa",
                            description: p.title,
                            impact: "operacional",
                            successMessage: "Tarefa criada.",
                            onConfirm: () => createTaskFromPendency(p.id),
                          })
                        }
                      >
                        Gerar tarefa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() =>
                          confirmAction({
                            title: "Gerar comunicação",
                            description: p.title,
                            impact: "operacional",
                            successMessage: "Comunicação criada.",
                            onConfirm: () => createCommunicationFromPendency(p.id),
                          })
                        }
                      >
                        Gerar comunicação
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Glass>
        </TabsContent>
        <TabsContent value="comunicacao">
          <Glass className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Comunicação</h2>
              <Link to="/comunicacao" className="text-xs font-semibold text-brand">
                Abrir inbox unificada →
              </Link>
            </div>
            <div className="space-y-2">
              {feed.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem comunicação registrada.</p>
              )}
              {feed.map((f) => (
                <div
                  key={f.id}
                  className="glass-soft flex items-start justify-between gap-3 rounded-xl p-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {f.label} · {f.date}
                    </p>
                    <p className="text-sm">{f.text}</p>
                  </div>
                  {f.canEscalate && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0"
                      onClick={() => escalate(f.text)}
                    >
                      Criar pendência
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Glass>
        </TabsContent>
        <TabsContent value="oportunidades">
          <Glass className="p-5">
            <DataList
              items={cOpportunities.map((o) => ({
                title: `${o.services.slice(0, 2).join(" + ")}`,
                sub: `${brl(o.mrr)}/mês · ${o.probability}%`,
                badge: o.stage,
                tone: o.stage === "Perdido" ? "bad" : o.stage === "Fechado" ? "good" : "brand",
              }))}
            />
            {cOpportunities.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma oportunidade em aberto para este cliente.
              </p>
            )}
          </Glass>
        </TabsContent>
        <TabsContent value="notas">
          <Glass className="p-5">
            <Textarea placeholder="Registre uma nota interna sobre este cliente…" />
            <Button className="mt-3" onClick={() => comingSoon("notas internas")}>
              Salvar nota
            </Button>
          </Glass>
        </TabsContent>
      </Tabs>
      <Glass className="mt-4 p-5">
        <h2 className="font-display text-lg font-semibold">Próximas tarefas</h2>
        <div className="mt-3">
          <DataList
            items={cTasks.map((t) => ({
              title: t.title,
              sub: `${t.assignee} · ${t.due}`,
              badge: t.priority,
              tone: t.late ? "bad" : "neutral",
            }))}
          />
        </div>
      </Glass>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Nome
                </label>
                <Input
                  className="mt-1"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  CNPJ
                </label>
                <Input
                  className="mt-1"
                  value={editForm.cnpj}
                  onChange={(e) => setEditForm((f) => ({ ...f, cnpj: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Segmento
                </label>
                <Input
                  className="mt-1"
                  value={editForm.segment}
                  onChange={(e) => setEditForm((f) => ({ ...f, segment: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Responsável
                </label>
                <Input
                  className="mt-1"
                  value={editForm.owner}
                  onChange={(e) => setEditForm((f) => ({ ...f, owner: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Regime
                </label>
                <Select
                  value={editForm.regime}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, regime: v as ClientEditableFields["regime"] }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_REGIMES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Status
                </label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, status: v as ClientEditableFields["status"] }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Honorário (R$/mês)
                </label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  value={editForm.fee}
                  onChange={(e) => setEditForm((f) => ({ ...f, fee: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Serviços contratados
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CLIENT_SERVICE_OPTIONS.map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 rounded-lg bg-glass px-2.5 py-2 text-sm"
                  >
                    <Checkbox
                      checked={editForm.services.includes(s)}
                      onCheckedChange={() => toggleEditService(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={saveEdit}
              disabled={!editForm.name.trim() || !editForm.cnpj.trim() || !editForm.owner.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TimelineList({ events }: { events: typeof timeline }) {
  return (
    <Glass className="p-5">
      <div className="relative ml-3 border-l border-brand/20 pl-6">
        {events.map((e) => (
          <div key={e.id} className="relative pb-6 last:pb-0">
            <span className="absolute -left-[29px] top-1 size-2 rounded-full bg-brand ring-4 ring-background" />
            <p className="text-xs text-muted-foreground">
              {new Date(`${e.date}T12:00:00`).toLocaleDateString("pt-BR")}
            </p>
            <p className="mt-1 text-sm font-semibold">{e.title}</p>
            <p className="text-sm text-muted-foreground">{e.detail}</p>
          </div>
        ))}
      </div>
    </Glass>
  );
}

function CommercialPage() {
  const stages = [
    "Lead",
    "Diagnóstico",
    "Proposta",
    "Negociação",
    "Fechado",
    "Perdido",
    "Onboarding",
  ] as const;
  const active = opportunities.filter(
    (o) => !["Fechado", "Perdido", "Onboarding"].includes(o.stage),
  );
  const pipe = active.reduce((s, o) => s + o.mrr, 0);
  const won = opportunities.filter((o) => o.stage === "Fechado").length;
  const lost = opportunities.filter((o) => o.stage === "Perdido").length;
  const conversionPct = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;
  const avgTicket = active.length > 0 ? Math.round(pipe / active.length) : 0;
  return (
    <>
      <PageHeader
        title="CRM Contábil"
        description="Do primeiro contato ao onboarding, com pipeline ponderado e próximas ações."
        action={
          <Button onClick={() => comingSoon("oportunidades")}>
            <Plus /> Nova oportunidade
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          label="Pipeline total"
          value={brl(pipe)}
          change={`${active.length} oportunidades ativas`}
          tone="brand"
        />
        <Kpi
          label="Pipeline ponderado"
          value={brl(
            Math.round(opportunities.reduce((s, o) => s + (o.mrr * o.probability) / 100, 0)),
          )}
          change="probabilidade aplicada"
        />
        <Kpi
          label="Conversão"
          value={`${conversionPct}%`}
          change={`${won} ganhas de ${won + lost} fechadas`}
          tone={conversionPct >= 50 ? "good" : "warn"}
        />
        <Kpi
          label="Ticket médio do pipeline"
          value={brl(avgTicket)}
          change="por oportunidade ativa"
        />
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-3">
        {stages.map((stage) => (
          <div key={stage} className="glass-panel w-64 shrink-0 rounded-2xl p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{stage}</h3>
              <Badge>{opportunities.filter((o) => o.stage === stage).length}</Badge>
            </div>
            <div className="space-y-2">
              {opportunities
                .filter((o) => o.stage === stage)
                .slice(0, 5)
                .map((o) => (
                  <div key={o.id} className="glass-soft rounded-xl p-3">
                    <p className="text-sm font-semibold">{o.company}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {o.services.slice(0, 2).join(" + ")}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand">{brl(o.mrr)}/mês</span>
                      <span className="text-[10px] text-muted-foreground">{o.probability}%</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <RevenueIntelligenceSection />
    </>
  );
}

function RevenueIntelligenceSection() {
  const navigate = useNavigate();
  const { confirmAction, createCommercialRecommendation } = useOfficeStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const totalPotential = revenueOpportunities.reduce((s, o) => s + o.potentialIncrease, 0);

  const simulate = (o: (typeof revenueOpportunities)[number], name: string) =>
    toast(
      `${name}: faixa recomendada ${brl(o.recommendedRange.min)} – ${brl(o.recommendedRange.max)}/mês (hoje ${brl(o.currentFee)}). Margem ${o.marginBefore}% → ${o.marginAfter}%.`,
    );
  const approve = (o: (typeof revenueOpportunities)[number], name: string) =>
    confirmAction({
      title: "Enviar para aprovação do gestor",
      description: `Reajuste de ${name} para a faixa ${brl(o.recommendedRange.min)}–${brl(o.recommendedRange.max)}/mês exige aprovação — nada é executado automaticamente.`,
      impact: "operacional",
      confirmLabel: "Enviar para aprovação",
      successMessage: "Recomendação enviada à Central de Pendências para aprovação do gestor.",
      onConfirm: () =>
        createCommercialRecommendation(
          o.clientId,
          `Aprovar reajuste — ${name}`,
          `${o.situation} Faixa recomendada: ${brl(o.recommendedRange.min)}–${brl(o.recommendedRange.max)}/mês.`,
        ),
    });

  return (
    <Glass className="mt-4 p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Revenue Intelligence</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Oportunidades de receita que normalmente passam despercebidas — nunca executadas
            automaticamente, sempre aprovadas pelo gestor.
          </p>
        </div>
        <Badge tone="accent">{brl(totalPotential)}/mês de potencial identificado</Badge>
      </div>
      <div className="mt-4 space-y-2">
        {revenueOpportunities.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma oportunidade de receita identificada no momento.
          </p>
        )}
        {revenueOpportunities.map((o) => {
          const client = clientById(o.clientId);
          const name = client?.name ?? o.clientId;
          const open = expanded === o.clientId;
          return (
            <div key={o.clientId} className="glass-soft rounded-xl p-4">
              <button
                className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                onClick={() => setExpanded(open ? null : o.clientId)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{o.situation}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={o.score >= 60 ? "bad" : o.score >= 30 ? "warn" : "brand"}>
                    Score {o.score}
                  </Badge>
                  <ChevronRight
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      open && "rotate-90",
                    )}
                  />
                </div>
              </button>
              {open && (
                <div className="mt-4 space-y-4 border-t border-glass-line pt-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Evidências
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {o.evidence.map((e, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <StatusDot tone="brand" />
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <MiniStat label="Honorário atual" value={brl(o.currentFee)} />
                    <MiniStat
                      label="Faixa recomendada"
                      value={`${brl(o.recommendedRange.min)} – ${brl(o.recommendedRange.max)}`}
                    />
                    <MiniStat label="Aumento potencial" value={`${brl(o.potentialIncrease)}/mês`} />
                    <MiniStat
                      label="Margem antes → depois"
                      value={`${o.marginBefore}% → ${o.marginAfter}%`}
                    />
                  </div>
                  <div className="rounded-xl bg-brand/10 p-3 text-sm">
                    <span className="font-semibold text-brand">Impacto estimado: </span>
                    {o.estimatedImpact}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => simulate(o, name)}>
                      Simular reajuste
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => approve(o, name)}>
                      Enviar para aprovação
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        client &&
                        void navigate({
                          to: "/clientes/$clientId",
                          params: { clientId: client.id },
                        })
                      }
                    >
                      Abrir Cliente 360
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Glass>
  );
}

const DEPARTMENTS = [
  "Fiscal",
  "Contábil",
  "Pessoal",
  "Societário",
  "Financeiro",
  "Comercial",
] as const;
const emptyProcessForm = {
  clientId: "",
  name: "",
  department: "Fiscal" as Department,
  assignee: "",
};

function ProcessesPage() {
  const {
    processes: liveProcesses,
    clients: liveClients,
    createProcess,
    updateProcess,
  } = useOfficeStore();
  const [filter, setFilter] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyProcessForm);
  const list = liveProcesses.filter(
    (p) => filter === "Todos" || (filter === "Em risco" && !p.slaOk) || filter === p.department,
  );
  const atRisk = liveProcesses.filter((p) => !p.slaOk).length;
  const slaPct = liveProcesses.length
    ? Math.round((liveProcesses.filter((p) => p.slaOk).length / liveProcesses.length) * 100)
    : 0;
  const avgRework = liveProcesses.length
    ? Math.round(liveProcesses.reduce((s, p) => s + p.rework, 0) / liveProcesses.length)
    : 0;
  const submit = () => {
    if (!form.clientId || !form.name.trim() || !form.assignee) return;
    createProcess(form);
    setForm(emptyProcessForm);
    setOpen(false);
  };
  return (
    <>
      <PageHeader
        title="Processos"
        description="Execução recorrente, SLA e inteligência sobre gargalos e retrabalho."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Novo processo
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          label="Processos ativos"
          value={String(liveProcesses.length)}
          change="cadastrados no escritório"
          tone="brand"
        />
        <Kpi
          label="Dentro do SLA"
          value={`${slaPct}%`}
          change="dos processos"
          tone={slaPct >= 90 ? "good" : "warn"}
        />
        <Kpi
          label="Em risco"
          value={String(atRisk)}
          change="exigem atenção"
          tone={atRisk > 0 ? "warn" : "good"}
        />
        <Kpi
          label="Retrabalho médio"
          value={`${avgRework}%`}
          change="da carteira"
          tone={avgRework > 10 ? "bad" : "good"}
        />
      </div>
      <Glass className="mt-4 p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {["Todos", "Em risco", ...DEPARTMENTS].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum processo encontrado com esses filtros.
          </p>
        )}
        <div className="space-y-3">
          {list.slice(0, 20).map((p) => (
            <details key={p.id} className="glass-soft rounded-xl p-4">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.department} · ciclo médio {p.cycleDays} dias · retrabalho {p.rework}%
                  </p>
                </div>
                <div className="w-24">
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px]">{p.progress}%</p>
                </div>
                <Badge tone={p.slaOk ? "good" : "bad"}>{p.slaOk ? "No SLA" : "Em risco"}</Badge>
              </summary>
              <div className="mt-4 grid gap-2 border-t border-glass-line pt-4 md:grid-cols-4">
                {p.steps.map((s, i) => (
                  <div key={s.name} className="rounded-lg bg-glass p-3">
                    <p className="text-xs font-semibold">
                      {i + 1}. {s.name}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{s.owner}</p>
                    <Badge
                      tone={
                        s.status === "Atrasada"
                          ? "bad"
                          : s.status === "Concluída"
                            ? "good"
                            : "neutral"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
              {p.progress < 100 && (
                <div className="mt-3 border-t border-glass-line pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateProcess(p.id, { progress: Math.min(100, p.progress + 20) })
                    }
                  >
                    +20% concluído
                  </Button>
                </div>
              )}
            </details>
          ))}
        </div>
      </Glass>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo processo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Cliente
              </label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {liveClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Nome do processo
              </label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Fechamento mensal"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Departamento
                </label>
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm((f) => ({ ...f, department: v as Department }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Responsável
                </label>
                <Select
                  value={form.assignee}
                  onValueChange={(v) => setForm((f) => ({ ...f, assignee: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.name}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              As etapas padrão do departamento são geradas automaticamente ao criar o processo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={!form.clientId || !form.name.trim() || !form.assignee}
            >
              Criar processo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const TASK_PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;
const emptyTaskForm: NewTaskInput = {
  clientId: "",
  title: "",
  assignee: "",
  priority: "Média",
  dueDate: "2026-09-20",
  hours: 2,
};

function TasksPage() {
  const { tasks, clients: liveClients, completeTask, createTask } = useOfficeStore();
  const search = useRouterState({ select: (s) => s.location.search }) as { filtro?: string };
  const [filter, setFilter] = useState(search.filtro === "atrasadas" ? "Atrasadas" : "Todas");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewTaskInput>(emptyTaskForm);
  const list = tasks.filter(
    (t) =>
      filter === "Todas" ||
      (filter === "Atrasadas" && t.late) ||
      filter === t.status ||
      filter === t.department,
  );
  const submit = () => {
    if (!form.clientId || !form.title.trim() || !form.assignee) return;
    createTask(form);
    setForm(emptyTaskForm);
    setOpen(false);
  };
  return (
    <>
      <PageHeader
        title="Tarefas"
        description="Prioridades, responsáveis e contexto do cliente sem depender de planilhas."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Nova tarefa
          </Button>
        }
      />
      <Glass className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            "Todas",
            "Atrasadas",
            "A fazer",
            "Em andamento",
            "Em revisão",
            "Fiscal",
            "Contábil",
            "Pessoal",
          ].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma tarefa encontrada com esses filtros.
          </p>
        )}
        <div className="space-y-2">
          {list.slice(0, 30).map((t) => {
            const done = t.status === "Concluída";
            return (
              <div
                key={t.id}
                className="glass-soft flex flex-wrap items-center gap-3 rounded-xl p-3"
              >
                <button
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border",
                    done
                      ? "border-good bg-good/10 text-good"
                      : "border-input text-muted-foreground hover:border-brand hover:text-brand",
                  )}
                  disabled={done}
                  onClick={() => completeTask(t.id)}
                  aria-label="Concluir tarefa"
                >
                  <CheckCircle2 className="size-4" />
                </button>
                <div className="min-w-[240px] flex-1">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      done && "text-muted-foreground line-through",
                    )}
                  >
                    {t.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.assignee} · vence {new Date(`${t.due}T12:00`).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Badge
                  tone={done ? "good" : t.late ? "bad" : t.priority === "Alta" ? "warn" : "neutral"}
                >
                  {done ? "Concluída" : t.late ? "Atrasada" : t.priority}
                </Badge>
                <Badge tone="brand">{t.department}</Badge>
                <span className="text-xs text-muted-foreground">{t.hours}h</span>
              </div>
            );
          })}
        </div>
      </Glass>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Cliente
              </label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {liveClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Título
              </label>
              <Input
                className="mt-1"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="O que precisa ser feito?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Responsável
                </label>
                <Select
                  value={form.assignee}
                  onValueChange={(v) => setForm((f) => ({ ...f, assignee: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.name}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Prioridade
                </label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as PendencyPriority }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Prazo
                </label>
                <Input
                  type="date"
                  className="mt-1"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Horas estimadas
                </label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1"
                  value={form.hours}
                  onChange={(e) => setForm((f) => ({ ...f, hours: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={!form.clientId || !form.title.trim() || !form.assignee}
            >
              Criar tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProfitabilityPage() {
  const navigate = useNavigate();
  const { confirmAction, createTaskForClient, createCommercialRecommendation } = useOfficeStore();
  const [rankTab, setRankTab] = useState<"top" | "bottom" | "deficit">("top");
  const rows = clientProfitability
    .map((cp) => ({ cp, client: clientById(cp.clientId) }))
    .filter((r): r is { cp: (typeof clientProfitability)[number]; client: Client } =>
      Boolean(r.client),
    );
  const ranked = [...rows].sort((a, b) => b.cp.current.margin - a.cp.current.margin);
  const rankList =
    rankTab === "top"
      ? ranked.slice(0, 5)
      : rankTab === "bottom"
        ? [...ranked].reverse().slice(0, 5)
        : rows.filter((r) => r.cp.current.profit < 0);

  const openClient = (clientId: string) =>
    void navigate({ to: "/clientes/$clientId", params: { clientId } });
  const simulate = (client: Client, cp: (typeof clientProfitability)[number]) =>
    toast(
      `Preço recomendado para ${client.name}: ${brl(suggestedFee(cp.current))}/mês (margem alvo 35%).`,
    );
  const createTask = (client: Client) =>
    confirmAction({
      title: "Criar tarefa de revisão",
      description: `Analisar rentabilidade de ${client.name}.`,
      impact: "operacional",
      successMessage: "Tarefa criada em /tarefas.",
      onConfirm: () => createTaskForClient(client.id, `Revisar rentabilidade — ${client.name}`),
    });
  const recommend = (client: Client, cp: (typeof clientProfitability)[number]) =>
    confirmAction({
      title: "Gerar recomendação comercial",
      description: `Reajuste sugerido: ${brl(suggestedFee(cp.current))}/mês.`,
      impact: "operacional",
      successMessage: "Recomendação registrada na Central de Pendências.",
      onConfirm: () =>
        createCommercialRecommendation(
          client.id,
          `Propor reajuste — ${client.name}`,
          `Margem atual ${cp.current.margin}%. Preço sugerido: ${brl(suggestedFee(cp.current))}/mês.`,
        ),
    });

  return (
    <>
      <PageHeader
        eyebrow="Motor de Rentabilidade Real"
        title="Rentabilidade por Cliente"
        description="Custo operacional real (mão de obra por hora + indiretos + terceirizados), não só faturamento."
        action={
          <Button asChild>
            <Link to="/simulador">
              <Calculator /> Simulador
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          label="Receita da carteira"
          value={brl(profitabilityDashboard.totalRevenue)}
          change="honorários do mês"
          tone="brand"
        />
        <Kpi
          label="Custo operacional real"
          value={brl(profitabilityDashboard.totalCost)}
          change="mão de obra + indiretos + terceirizados"
          tone="warn"
        />
        <Kpi
          label="Lucro"
          value={brl(profitabilityDashboard.totalProfit)}
          change={`margem média ${profitabilityDashboard.avgMargin}%`}
          tone={profitabilityDashboard.totalProfit >= 0 ? "good" : "bad"}
        />
        <Kpi
          label="Clientes deficitários"
          value={String(profitabilityDashboard.deficitClients.length)}
          change="exigem reajuste"
          tone="bad"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Glass className="p-5 xl:col-span-3">
          <h2 className="font-display text-lg font-semibold">Evolução mensal</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitabilityDashboard.monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => brl(Number(v))} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Receita"
                  stroke="var(--color-brand)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="Custo"
                  stroke="var(--color-bad,#e5484d)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Lucro"
                  stroke="var(--color-good,#30a46c)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Glass>
        <Glass className="p-5 xl:col-span-2">
          <h2 className="font-display text-lg font-semibold">Distribuição de margem</h2>
          <div className="mt-4 space-y-3">
            {profitabilityDashboard.marginDistribution.map((b) => (
              <div key={b.bucket}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{b.bucket}</span>
                  <span className="font-semibold">{b.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${clients.length ? Math.round((b.count / clients.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </div>

      <Glass className="mt-4 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Ranking de clientes</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={rankTab === "top" ? "default" : "outline"}
              onClick={() => setRankTab("top")}
            >
              Mais rentáveis
            </Button>
            <Button
              size="sm"
              variant={rankTab === "bottom" ? "default" : "outline"}
              onClick={() => setRankTab("bottom")}
            >
              Menos rentáveis
            </Button>
            <Button
              size="sm"
              variant={rankTab === "deficit" ? "default" : "outline"}
              onClick={() => setRankTab("deficit")}
            >
              Deficitários
              <Badge tone="bad" className="ml-1.5">
                {profitabilityDashboard.deficitClients.length}
              </Badge>
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {rankList.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum cliente nesta categoria.</p>
          )}
          {rankList.map(({ cp, client }) => (
            <button
              key={client.id}
              onClick={() => openClient(client.id)}
              className="glass-soft flex w-full flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  {brl(cp.current.profit)}/mês · {cp.current.hours}h consumidas
                </p>
              </div>
              <Badge
                tone={cp.current.margin < 0 ? "bad" : cp.current.margin < 35 ? "warn" : "good"}
              >
                {cp.current.margin}%
              </Badge>
            </button>
          ))}
        </div>
      </Glass>

      <Glass className="mt-4 p-4">
        <h2 className="mb-3 px-1 font-display text-lg font-semibold">
          Custo operacional real por cliente
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-glass-line text-[11px] uppercase text-muted-foreground">
                <th className="p-3">Cliente</th>
                <th>Colaboradores</th>
                <th>Horas</th>
                <th>Mão de obra</th>
                <th>Indiretos</th>
                <th>Terceirizados</th>
                <th>Custo total</th>
                <th>Receita</th>
                <th>Lucro</th>
                <th>Margem</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ cp, client }) => {
                const emps = cp.employeeIds
                  .map((id) => employees.find((e) => e.id === id)?.name)
                  .filter((n): n is string => Boolean(n));
                return (
                  <tr key={client.id} className="border-b border-glass-line/60 align-top">
                    <td className="p-3 font-semibold">
                      <Link to="/clientes/$clientId" params={{ clientId: client.id }}>
                        {client.name}
                      </Link>
                    </td>
                    <td className="max-w-[160px] text-xs text-muted-foreground">
                      {emps.join(", ")}
                    </td>
                    <td>{cp.current.hours}h</td>
                    <td>{brl(cp.current.laborCost)}</td>
                    <td>{brl(cp.current.indirectCost)}</td>
                    <td>{cp.current.outsourcedCost ? brl(cp.current.outsourcedCost) : "—"}</td>
                    <td className="font-medium">{brl(cp.current.totalCost)}</td>
                    <td>{brl(cp.current.revenue)}</td>
                    <td
                      className={
                        cp.current.profit < 0 ? "font-semibold text-bad" : "font-semibold text-good"
                      }
                    >
                      {brl(cp.current.profit)}
                    </td>
                    <td>
                      <Badge
                        tone={
                          cp.current.margin < 0 ? "bad" : cp.current.margin < 35 ? "warn" : "good"
                        }
                      >
                        {cp.current.margin}%
                      </Badge>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => openClient(client.id)}
                        >
                          Abrir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => openClient(client.id)}
                        >
                          Horas
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => simulate(client, cp)}
                        >
                          Simular
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => createTask(client)}
                        >
                          Tarefa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => recommend(client, cp)}
                        >
                          Recomendar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Glass>
    </>
  );
}

const emptyArticleForm: NewKnowledgeArticleInput = {
  category: "",
  title: "",
  summary: "",
  content: "",
};

function KnowledgePage() {
  const {
    knowledgeArticles: liveArticles,
    createKnowledgeArticle,
    updateKnowledgeArticle,
    deleteKnowledgeArticle,
    confirmAction,
  } = useOfficeStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewKnowledgeArticleInput>(emptyArticleForm);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const list = liveArticles.filter((x) =>
    (x.title + x.category).toLowerCase().includes(q.toLowerCase()),
  );
  const viewing = liveArticles.find((k) => k.id === viewingId) ?? null;
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyArticleForm);
    setOpen(true);
  };
  const openEdit = (k: KnowledgeArticle) => {
    setEditingId(k.id);
    setForm({ category: k.category, title: k.title, summary: k.summary, content: k.content });
    setViewingId(null);
    setOpen(true);
  };
  const submit = () => {
    if (!form.title.trim() || !form.category.trim()) return;
    if (editingId) updateKnowledgeArticle(editingId, form);
    else createKnowledgeArticle(form);
    setOpen(false);
  };
  return (
    <>
      <PageHeader
        title="Conhecimento"
        description="Processos, procedimentos, decisões e memória empresarial com controle de acesso."
        action={
          <Button onClick={openCreate}>
            <Plus /> Novo artigo
          </Button>
        }
      />
      <Glass className="p-5">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="h-11 pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pergunte: como fazemos o fechamento fiscal?"
          />
        </div>
        {list.length === 0 && (
          <p className="mt-5 py-8 text-center text-sm text-muted-foreground">
            Nenhum artigo encontrado para "{q}".
          </p>
        )}
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((k) => (
            <article key={k.id} className="glass-soft rounded-xl p-4">
              <Badge tone="brand">{k.category}</Badge>
              <h2 className="mt-3 font-semibold">{k.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{k.summary}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 px-0 text-brand"
                onClick={() => setViewingId(k.id)}
              >
                Abrir <ArrowRight />
              </Button>
            </article>
          ))}
        </div>
      </Glass>
      <Dialog open={viewingId !== null} onOpenChange={(o) => !o && setViewingId(null)}>
        <DialogContent className="max-w-xl">
          {viewing && (
            <>
              <DialogHeader>
                <Badge tone="brand">{viewing.category}</Badge>
                <DialogTitle className="mt-2">{viewing.title}</DialogTitle>
              </DialogHeader>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {viewing.content || viewing.summary}
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => confirmDeleteArticle(viewing.id)}>
                  Excluir
                </Button>
                <Button onClick={() => openEdit(viewing)}>Editar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar artigo" : "Novo artigo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Categoria
                </label>
                <Input
                  className="mt-1"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Ex.: Processos"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Título
                </label>
                <Input
                  className="mt-1"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Resumo
              </label>
              <Textarea
                className="mt-1"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="Uma frase que resume o artigo"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Conteúdo
              </label>
              <Textarea
                className="mt-1 min-h-32"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Corpo completo do artigo…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!form.title.trim() || !form.category.trim()}>
              {editingId ? "Salvar" : "Criar artigo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  function confirmDeleteArticle(id: string) {
    const article = liveArticles.find((k) => k.id === id);
    if (!article) return;
    confirmAction({
      title: "Excluir artigo",
      description: `Excluir "${article.title}"? Essa ação não pode ser desfeita.`,
      impact: "operacional",
      confirmLabel: "Excluir",
      successMessage: "Artigo excluído.",
      onConfirm: () => {
        deleteKnowledgeArticle(id);
        setViewingId(null);
      },
    });
  }
}

function OnboardingPage() {
  const steps = [
    "Nome do escritório",
    "Número de funcionários",
    "Departamentos",
    "Número de clientes",
    "Sistemas utilizados",
    "Importação",
    "Configuração de processos",
    "Convidar equipe",
  ];
  const [current, setCurrent] = useState(3);
  return (
    <>
      <PageHeader
        title="Onboarding do escritório"
        description="Configure a operação uma vez. O sistema reutiliza os dados em todos os módulos."
      />
      <Glass className="mx-auto max-w-3xl p-6">
        <div className="flex justify-between gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={cn("h-1.5 rounded-full", i <= current ? "bg-brand" : "bg-muted")} />
              <p className="mt-2 hidden text-[10px] text-muted-foreground md:block">
                {i + 1}. {s}
              </p>
            </div>
          ))}
        </div>
        <div className="py-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Building2 />
          </div>
          <p className="mt-5 font-serif text-lg italic text-brand">Etapa {current + 1} de 8</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{steps[current]}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {current === 3
              ? "Quantos clientes ativos o escritório atende hoje?"
              : "Configure esta etapa para personalizar seu ContaAI."}
          </p>
          {current === 3 && (
            <Input
              type="number"
              defaultValue="128"
              className="mx-auto mt-5 max-w-xs text-center text-lg"
            />
          )}
        </div>
        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={current === 0}
            onClick={() => setCurrent((v) => Math.max(0, v - 1))}
          >
            Voltar
          </Button>
          <Button
            onClick={() => {
              if (current === 7) {
                toast.success("Seu escritório está pronto.");
                setCurrent(0);
              } else setCurrent((v) => v + 1);
            }}
          >
            {current === 7 ? "Finalizar" : "Continuar"}
            <ArrowRight />
          </Button>
        </div>
      </Glass>
    </>
  );
}

function AlertsPage() {
  const navigate = useNavigate();
  const { alertStatus, resolveAlert, confirmAction } = useOfficeStore();
  const [filter, setFilter] = useState("Todos");
  const list = alerts.filter((a) => filter === "Todos" || a.level === filter);
  return (
    <>
      <PageHeader
        title="Central de Alertas"
        description="Tudo que exige atenção, decisão ou representa oportunidade."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {["Todos", "Crítico", "Atenção", "Informação", "Oportunidade"].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>
      <Glass className="p-4">
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum alerta {filter !== "Todos" ? `do tipo "${filter}"` : ""} no momento.
          </p>
        )}
        <div className="space-y-2">
          {list.map((a) => {
            const status = alertStatus[a.id];
            return (
              <div key={a.id} className="glass-soft rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <StatusDot
                    tone={
                      a.level === "Crítico"
                        ? "bad"
                        : a.level === "Atenção"
                          ? "warn"
                          : a.level === "Oportunidade"
                            ? "good"
                            : "brand"
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{a.title}</p>
                      <Badge
                        tone={
                          a.level === "Crítico"
                            ? "bad"
                            : a.level === "Atenção"
                              ? "warn"
                              : a.level === "Oportunidade"
                                ? "good"
                                : "brand"
                        }
                      >
                        {a.level}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {status ? (
                        <Badge tone="good">Resolvido</Badge>
                      ) : (
                        <>
                          {a.actions.map((x, i) => (
                            <Button
                              key={x}
                              size="sm"
                              variant={i === 0 ? "default" : "outline"}
                              onClick={() =>
                                i === 0
                                  ? confirmAction({
                                      title: x,
                                      description: a.title,
                                      impact: "operacional",
                                      successMessage: `${x}: ação executada.`,
                                      onConfirm: () => resolveAlert(a.id),
                                    })
                                  : void navigate({ to: a.link as "/pessoas" })
                              }
                            >
                              {x}
                            </Button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Glass>
    </>
  );
}

const PROJECT_STATUSES = ["Planejado", "Em andamento", "Em aprovação", "Concluído"] as const;
const emptyProjectForm = { clientId: "", name: "", dueDate: "2026-10-15" };

function ProjectsPage() {
  const navigate = useNavigate();
  const {
    projects: liveProjects,
    clients: liveClients,
    createProject,
    updateProject,
  } = useOfficeStore();
  const [filter, setFilter] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyProjectForm);
  const list = liveProjects.filter((p) => filter === "Todos" || filter === p.status);
  const submit = () => {
    if (!form.clientId || !form.name.trim()) return;
    createProject(form);
    setForm(emptyProjectForm);
    setOpen(false);
  };
  return (
    <>
      <PageHeader
        title="Projetos"
        description="Entregas não recorrentes, escopo, responsáveis e marcos em um único lugar."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Novo projeto
          </Button>
        }
      />
      <Glass className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {["Todos", ...PROJECT_STATUSES].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum projeto encontrado com esse filtro.
          </p>
        )}
        <div className="space-y-2">
          {list.map((p) => {
            const client = liveClients.find((c) => c.id === p.clientId);
            return (
              <div
                key={p.id}
                className="glass-soft flex flex-wrap items-center gap-3 rounded-xl p-3"
              >
                <button
                  onClick={() =>
                    client &&
                    void navigate({ to: "/clientes/$clientId", params: { clientId: client.id } })
                  }
                  className="min-w-[220px] flex-1 text-left"
                >
                  <p className="text-sm font-semibold hover:text-brand">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client?.name ?? "—"} · vence {p.dueDate}
                  </p>
                </button>
                <div className="w-28">
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px]">{p.progress}%</p>
                </div>
                <Select
                  value={p.status}
                  onValueChange={(v) =>
                    updateProject(p.id, {
                      status: v as Project["status"],
                      progress: v === "Concluído" ? 100 : p.progress,
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </Glass>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Cliente
              </label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {liveClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Nome do projeto
              </label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Migração de sistema fiscal"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Prazo</label>
              <Input
                type="date"
                className="mt-1"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!form.clientId || !form.name.trim()}>
              Criar projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportsPage() {
  const navigate = useNavigate();
  const items: {
    title: string;
    desc: string;
    to: "/rentabilidade" | "/financeiro" | "/pessoas";
  }[] = [
    {
      title: "Relatório de Rentabilidade",
      desc: "Margem, custo operacional real e clientes deficitários.",
      to: "/rentabilidade",
    },
    {
      title: "Relatório Financeiro",
      desc: "MRR, contas a receber/pagas e evolução mensal.",
      to: "/financeiro",
    },
    {
      title: "Relatório de Capacidade",
      desc: "Ocupação por colaborador e por departamento.",
      to: "/pessoas",
    },
  ];
  return (
    <>
      <PageHeader
        title="Relatórios"
        description="A exportação de relatórios executivos ainda não está disponível neste protótipo — mas os mesmos dados já podem ser consultados, em tempo real, nos módulos abaixo."
        action={<Badge tone="warn">Em construção</Badge>}
      />
      <Glass className="p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((it) => (
            <button
              key={it.title}
              onClick={() => void navigate({ to: it.to })}
              className="glass-soft rounded-xl p-5 text-left transition-colors hover:border-brand/40"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
                <FileText />
              </div>
              <p className="mt-3 font-semibold">{it.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{it.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                Ver dados <ArrowRight className="size-3" />
              </span>
            </button>
          ))}
        </div>
      </Glass>
    </>
  );
}

function DataList({
  items,
}: {
  items: { title: string; sub: string; badge: string; tone: string }[];
}) {
  return (
    <div className="space-y-2">
      {items.map((x, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-glass p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{x.title}</p>
            <p className="text-xs text-muted-foreground">{x.sub}</p>
          </div>
          <Badge tone={x.tone as "good" | "warn" | "bad" | "brand" | "neutral"}>{x.badge}</Badge>
        </div>
      ))}
    </div>
  );
}
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}
