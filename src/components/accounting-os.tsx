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
  Lightbulb,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  agents,
  alerts,
  automations,
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
  knowledgeArticles,
  margin,
  meetings,
  monthlyRevenue,
  opportunities,
  processes,
  profitabilityDashboard,
  projects,
  revenueOpportunities,
  timeline,
  totals,
  type Client,
} from "@/data/office";
import { cn } from "@/lib/utils";
import { OfficeStoreProvider, useOfficeStore } from "@/data/store";
import { PendenciasPage } from "@/components/pendencias-page";
import { CapacityPage } from "@/components/capacity-page";
import { DocumentsPage } from "@/components/documents-page";
import { ObligationsPage } from "@/components/obligations-page";
import { InboxPage } from "@/components/inbox-page";
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
      ["/onboarding", "Onboarding", CheckCircle2],
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
  "/inteligencia": "Intelligence Center",
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

export function Glass({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
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

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "good" | "warn" | "bad" | "brand" | "accent" | "neutral"; className?: string }) {
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

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
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

export function Kpi({ label, value, change, tone = "good", icon: Icon, onClick }: { label: string; value: string; change: string; tone?: "good" | "bad" | "warn" | "brand"; icon?: typeof Activity; onClick?: () => void }) {
  return (
    <button className="glass-panel group rounded-2xl p-4 text-left transition-transform hover:-translate-y-1" onClick={onClick}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
      <p className={cn("mt-1 text-xs font-semibold", tone === "good" && "text-good", tone === "bad" && "text-bad", tone === "warn" && "text-warn", tone === "brand" && "text-brand")}>{change}</p>
    </button>
  );
}

function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className={cn("flex h-full w-64 shrink-0 flex-col p-4", !mobile && "glass-panel sticky top-5 hidden h-[calc(100vh-2.5rem)] rounded-3xl lg:flex")}>
      <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
        <ContaAILogo variant="horizontal" size={36} />
      </Link>
      <CreateMenu />
      <nav className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase text-muted-foreground">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(([to, label, Icon]) => {
                const active = to === "/" ? path === "/" : path.startsWith(to);
                return (
                  <Link key={to} to={to} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-glass text-brand shadow-sm" : "text-muted-foreground hover:bg-glass hover:text-foreground")}>
                    <Icon className="size-4" /> {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-3 space-y-1 border-t border-glass-line pt-3">
        <Link to="/portal" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-glass"><ShieldCheck className="size-4" /> Portal do cliente</Link>
        <Link to="/configuracoes" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-glass"><Settings className="size-4" /> Configurações</Link>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-glass p-3">
          <div className="grid size-9 place-items-center rounded-full bg-linear-to-br from-brand/20 to-accent/20 text-sm font-semibold text-brand">M</div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">Matheus Lapenda</p><p className="truncate text-[11px] text-muted-foreground">Sócio · Premium</p></div>
        </div>
      </div>
    </aside>
  );
}

function CreateMenu() {
  const [open, setOpen] = useState(false);
  const options = ["Cliente", "Lead", "Tarefa", "Projeto", "Processo", "Solicitação", "Documento", "Proposta", "Reunião", "Ocorrência"];
  return (
    <div className="relative mt-4">
      <Button className="h-10 w-full rounded-xl bg-primary text-primary-foreground" onClick={() => setOpen(!open)}><Plus /> Criar</Button>
      {open && (
        <div className="absolute left-0 top-12 z-50 grid w-full grid-cols-2 gap-1 rounded-xl border border-glass-line bg-popover p-2 shadow-xl">
          {options.map((o) => <button key={o} className="rounded-lg px-2 py-2 text-left text-xs hover:bg-muted" onClick={() => { setOpen(false); toast.success(`${o} criado como rascunho.`); }}>{o}</button>)}
        </div>
      )}
    </div>
  );
}

export function AccountingShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <OfficeStoreProvider>
      <div className="relative min-h-screen w-full overflow-x-hidden">
        <div className="relative z-10 mx-auto flex max-w-[1500px] gap-0 px-3 py-3 sm:px-5 sm:py-5 lg:px-8">
          <Sidebar />
          <div className="min-w-0 flex-1 lg:pl-5">
            <Topbar title={metaTitle(pathname)} onSearch={() => setCommandOpen(true)} onAI={() => setAiOpen(true)} onMenu={() => setMobileOpen(true)} />
            <main className="pb-10"><PageRouter pathname={pathname} openAI={() => setAiOpen(true)} /></main>
          </div>
        </div>
        <CommandPalette open={commandOpen} setOpen={setCommandOpen} openAI={() => setAiOpen(true)} />
        <AICopilot open={aiOpen} setOpen={setAiOpen} />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="w-72 p-0"><SheetHeader className="sr-only"><SheetTitle>Menu</SheetTitle></SheetHeader><Sidebar mobile /></SheetContent></Sheet>
      </div>
    </OfficeStoreProvider>
  );
}

function Topbar({ title, onSearch, onAI, onMenu }: { title: string; onSearch: () => void; onAI: () => void; onMenu: () => void }) {
  return (
    <header className="mb-5 flex items-center gap-2 sm:gap-3">
      <Button variant="outline" size="icon" className="glass-soft rounded-xl lg:hidden" onClick={onMenu} aria-label="Abrir menu"><Menu /></Button>
      <button onClick={onSearch} className="glass-soft flex h-10 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-left text-sm text-muted-foreground shadow-sm lg:max-w-xl">
        <Search className="size-4 shrink-0" /><span className="truncate">Pesquisar em {title.toLowerCase()}…</span><kbd className="ml-auto hidden rounded-md border border-input bg-background/60 px-2 py-0.5 text-[10px] sm:inline">⌘K</kbd>
      </button>
      <Button variant="outline" className="glass-soft rounded-xl" onClick={onAI}><Sparkles className="text-brand" /><span className="hidden sm:inline">Ask AI</span></Button>
      <Button variant="outline" size="icon" className="glass-soft relative rounded-xl" asChild><Link to="/alertas" aria-label="Notificações"><Bell /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-bad text-[9px] text-primary-foreground">3</span></Link></Button>
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-sm font-semibold text-brand-foreground">M</div>
    </header>
  );
}

function CommandPalette({ open, setOpen, openAI }: { open: boolean; setOpen: (v: boolean) => void; openAI: () => void }) {
  const navigate = useNavigate();
  const go = (to: string) => { setOpen(false); void navigate({ to }); };
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="O que você quer fazer?" />
      <CommandList><CommandEmpty>Nenhuma ação encontrada.</CommandEmpty>
        <CommandGroup heading="Ir para">
          <CommandItem onSelect={() => go("/clientes")}><Building2 /> Encontrar cliente<CommandShortcut>C</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go("/tarefas")}><Clock3 /> Ver tarefas atrasadas</CommandItem>
          <CommandItem onSelect={() => go("/inteligencia")}><Sparkles /> Ver clientes em risco</CommandItem>
          <CommandItem onSelect={() => go("/pessoas")}><Users /> Ver minha capacidade</CommandItem>
          <CommandItem onSelect={() => { setOpen(false); openAI(); }}><Bot /> Perguntar para IA<CommandShortcut>AI</CommandShortcut></CommandItem>
        </CommandGroup>
        <CommandGroup heading="Criar">
          {['Cliente','Tarefa','Oportunidade','Processo','Relatório'].map((x) => <CommandItem key={x} onSelect={() => {setOpen(false); toast.success(`${x} criado como rascunho.`)}}><Plus /> Criar {x.toLowerCase()}</CommandItem>)}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function PageRouter({ pathname, openAI }: { pathname: string; openAI: () => void }) {
  if (pathname.startsWith("/clientes/")) return <Customer360 clientId={pathname.split("/")[2] ?? "c1"} />;
  switch (pathname) {
    case "/": return <Dashboard openAI={openAI} />;
    case "/clientes": return <ClientsPage />;
    case "/pendencias": return <PendenciasPage />;
    case "/obrigacoes": return <ObligationsPage />;
    case "/comercial": return <CommercialPage />;
    case "/processos": return <ProcessesPage />;
    case "/tarefas": return <TasksPage />;
    case "/pessoas": return <CapacityPage />;
    case "/financeiro": return <FinancePage />;
    case "/rentabilidade": return <ProfitabilityPage />;
    case "/inteligencia": return <IntelligencePage />;
    case "/automacao": return <AutomationPage />;
    case "/benchmarking": return <BenchmarkingPage />;
    case "/conhecimento": return <KnowledgePage />;
    case "/portal": return <ClientPortal />;
    case "/simulador": return <SimulatorPage />;
    case "/alertas": return <AlertsPage />;
    case "/onboarding": return <OnboardingPage />;
    case "/documentos": return <DocumentsPage />;
    case "/comunicacao": return <InboxPage />;
    case "/projetos": return <ProjectsPage />;
    case "/configuracoes": return <SimpleModule title="Configurações" description="Workspace, equipe, permissões, departamentos e integrações." icon={Settings} items={["Workspace Lapenda Contabilidade", "15 usuários ativos", "6 departamentos", "Integrações futuras preparadas"]} />;
    case "/relatorios": return <SimpleModule title="Relatórios" description="Gere relatórios executivos por período, cliente, departamento ou indicador." icon={FileText} items={["Relatório Operacional — Setembro", "Relatório de Rentabilidade", "Relatório de Capacidade", "Exportação PDF preparada"]} />;
    default: return <Dashboard openAI={openAI} />;
  }
}

function Dashboard({ openAI }: { openAI: () => void }) {
  const navigate = useNavigate();
  const { insightStatus, resolveInsight, ignoreInsight, confirmAction, createTaskForClient, markChurnReviewed, churnReviewed } = useOfficeStore();
  const topChurnRisks = [...churnRisks].filter(c=>churnReviewed[c.clientId]===undefined).sort((a,b)=>b.score-a.score).slice(0,3);
  const critical = alerts.filter((a) => a.level === "Crítico").slice(0, 3);
  const priorities = insights.slice(0, 3);
  const latestRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.receita ?? totals.mrr;
  return <>
    <PageHeader eyebrow="Bom dia, Matheus." title="Aqui está o que precisa da sua atenção hoje." description="Sua operação está sob controle, com decisões que podem melhorar margem, capacidade e experiência do cliente." action={<Button className="rounded-xl bg-linear-to-r from-brand to-accent text-brand-foreground" onClick={openAI}><Sparkles /> O que devo fazer agora?</Button>} />
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Kpi label="Receita mensal" value={brl(latestRevenue)} change="▲ 8,2% vs. mês anterior" icon={TrendingUp} onClick={() => void navigate({to:"/financeiro"})}/>
      <Kpi label="MRR" value={brl(totals.mrr)} change="▲ 4,1% expansão" icon={CircleDollarSign} onClick={() => void navigate({to:"/financeiro"})}/>
      <Kpi label="Margem operacional" value={`${margin}%`} change="▼ 2 p.p. atenção" tone="bad" icon={BarChart3} onClick={() => void navigate({to:"/rentabilidade"})}/>
      <Kpi label="Clientes ativos" value={String(totals.activeClients)} change="▲ 4 novos este mês" icon={Users} onClick={() => void navigate({to:"/clientes"})}/>
      <Kpi label="Churn 90d" value={String(totals.atRisk)} change="clientes em risco" tone="warn" icon={TrendingDown} onClick={() => void navigate({to:"/clientes", search:{filtro:"risco"} as never})}/>
      <Kpi label="NPS" value={String(totals.nps)} change="▬ estável" tone="warn" icon={HeartPulse}/>
      <Kpi label="Tarefas atrasadas" value={String(totals.lateTasks)} change="▼ 18% vs. semana" icon={Clock3} onClick={() => void navigate({to:"/tarefas", search:{filtro:"atrasadas"} as never})}/>
      <Kpi label="Inadimplência" value={brl(totals.overdue)} change={`${totals.overdueClients} contas vencidas`} tone="bad" icon={AlertTriangle} onClick={() => void navigate({to:"/financeiro"})}/>
    </section>
    <section className="mt-4 grid gap-4 xl:grid-cols-5">
      <Glass className="p-5 xl:col-span-3"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">3 problemas críticos</h2><Badge tone="bad">Crítico</Badge></div><div className="space-y-2.5">{critical.map((a) => <button key={a.id} onClick={() => void navigate({to:a.link as "/pessoas"})} className="glass-soft flex w-full items-start gap-3 rounded-xl p-3 text-left hover:border-bad/40"><StatusDot tone="bad"/><div className="min-w-0 flex-1"><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.detail}</p></div><ChevronRight className="size-4 shrink-0 text-muted-foreground"/></button>)}</div></Glass>
      <Glass className="p-5 xl:col-span-2"><div className="mb-3 flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-brand to-accent text-brand-foreground"><Sparkles className="size-4"/></span><h2 className="font-display text-lg font-semibold">O que fazer hoje</h2></div><p className="mb-3 text-xs text-muted-foreground">Priorizado pelo motor de inteligência com base nos dados da operação.</p><div className="space-y-2">{priorities.map((ins,i)=>{const status=insightStatus[ins.id]; return <div key={ins.id} className="glass-soft rounded-xl p-3"><p className="text-sm font-medium">{i+1} · {ins.title}</p><p className="mt-1 text-xs text-muted-foreground">{ins.recommendation}</p>{status?<Badge tone={status==="resolvido"?"good":"neutral"} className="mt-2">{status==="resolvido"?"Resolvido":"Ignorado"}</Badge>:<div className="mt-2 flex flex-wrap gap-1.5"><Button size="sm" className="h-7 bg-brand text-brand-foreground" onClick={()=>confirmAction({title:ins.actions[0] ?? "Executar ação",description:ins.title,impact:"operacional",successMessage:"Ação executada.",onConfirm:()=>resolveInsight(ins.id)})}>{ins.actions[0] ?? "Resolver"}</Button><Button size="sm" variant="secondary" className="h-7" onClick={()=>void navigate({to:ins.link as "/pessoas"})}>Ver detalhes</Button><Button size="sm" variant="ghost" className="h-7" onClick={()=>ignoreInsight(ins.id)}>Ignorar</Button></div>}</div>})}</div></Glass>
    </section>
    <section className="mt-4 grid gap-4 xl:grid-cols-3">
      <Glass className="p-5 xl:col-span-2"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Capacidade da equipe</h2><Link to="/pessoas" className="text-xs font-semibold text-brand">Ver equipe →</Link></div><div className="space-y-4">{employees.slice(0,3).map((e)=><div key={e.id}><div className="mb-1.5 flex justify-between text-sm"><span>{e.name} · {e.department}</span><span className={cn("font-semibold",e.allocated/e.capacity>1?"text-bad":e.allocated/e.capacity<.8?"text-warn":"text-foreground")}>{Math.round(e.allocated/e.capacity*100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full",e.allocated/e.capacity>1?"bg-bad":e.allocated/e.capacity<.8?"bg-warn":"bg-brand")} style={{width:`${Math.min(100,e.allocated/e.capacity*100)}%`}}/></div></div>)}</div><div className="mt-5 grid grid-cols-3 border-t border-glass-line pt-4 text-center"><div><p className="text-[10px] uppercase text-muted-foreground">Demanda</p><p className="font-display text-lg font-semibold">{totals.allocated}h</p></div><div><p className="text-[10px] uppercase text-muted-foreground">Capacidade</p><p className="font-display text-lg font-semibold">{totals.capacity}h</p></div><div><p className="text-[10px] uppercase text-muted-foreground">Déficit</p><p className="font-display text-lg font-semibold text-bad">{Math.max(0,totals.allocated-totals.capacity)}h</p></div></div></Glass>
      <Glass className="p-5"><h2 className="font-display text-lg font-semibold">Receita · 6 meses</h2><div className="mt-4 h-40"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyRevenue}><Tooltip formatter={(v)=>brl(Number(v))}/><Bar dataKey="receita" fill="var(--color-brand)" radius={[5,5,0,0]}/><XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11}/></BarChart></ResponsiveContainer></div><div className="mt-3 flex flex-wrap gap-1.5"><Badge tone="good">Receita +8%</Badge><Badge tone="bad">Margem −2 p.p.</Badge><Badge tone="warn">Retrabalho +12%</Badge></div></Glass>
    </section>
    <Glass className="mt-4 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-semibold">Rentabilidade da carteira — custo operacional real</h2><Link to="/rentabilidade" className="text-xs font-semibold text-brand">Ver motor de rentabilidade →</Link></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-soft rounded-xl p-3"><p className="text-[10px] uppercase text-muted-foreground">Margem média</p><p className="font-display text-xl font-semibold">{profitabilityDashboard.avgMargin}%</p></div>
        <div className="glass-soft rounded-xl p-3"><p className="text-[10px] uppercase text-muted-foreground">Receita</p><p className="font-display text-xl font-semibold">{brl(profitabilityDashboard.totalRevenue)}</p></div>
        <div className="glass-soft rounded-xl p-3"><p className="text-[10px] uppercase text-muted-foreground">Custo real</p><p className="font-display text-xl font-semibold">{brl(profitabilityDashboard.totalCost)}</p></div>
        <div className="glass-soft rounded-xl p-3"><p className="text-[10px] uppercase text-muted-foreground">Lucro</p><p className={cn("font-display text-xl font-semibold",profitabilityDashboard.totalProfit<0&&"text-bad")}>{brl(profitabilityDashboard.totalProfit)}</p></div>
      </div>
      {profitabilityDashboard.deficitClients.length>0&&<p className="mt-3 text-xs text-muted-foreground">{profitabilityDashboard.deficitClients.length} cliente(s) operando com prejuízo: {profitabilityDashboard.deficitClients.slice(0,4).map(d=>clientById(d.clientId)?.name).filter(Boolean).join(", ")}.</p>}
    </Glass>
    {topChurnRisks.length>0&&<Glass className="mt-4 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-semibold">Churn Risk — clientes em maior risco</h2><span className="text-[10px] uppercase tracking-wide text-muted-foreground">Pontuação por regras (MVP), não é modelo de ML treinado</span></div>
      <div className="space-y-2">{topChurnRisks.map(risk=>{const client=clientById(risk.clientId); if(!client)return null; return (
        <div key={risk.clientId} className="glass-soft flex flex-wrap items-start justify-between gap-3 rounded-xl p-3">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{client.name}</p><Badge tone={risk.level==="Crítico"||risk.level==="Alto"?"bad":"warn"}>{risk.level} · {risk.score}/100</Badge></div><p className="mt-1 text-xs text-muted-foreground">{risk.explanation}</p></div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-7" onClick={()=>void navigate({to:"/clientes/$clientId",params:{clientId:client.id}})}>Ver cliente</Button>
            <Button size="sm" variant="outline" className="h-7" onClick={()=>confirmAction({title:"Criar tarefa",description:`Investigar risco de churn de ${client.name}.`,impact:"operacional",successMessage:"Tarefa criada em /tarefas.",onConfirm:()=>createTaskForClient(client.id,`Investigar risco de churn — ${client.name}`)})}>Criar tarefa</Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={()=>confirmAction({title:"Marcar como analisado",description:`Confirma que o risco de churn de ${client.name} foi analisado?`,impact:"operacional",successMessage:"Cliente marcado como analisado.",onConfirm:()=>markChurnReviewed(client.id)})}>Marcar como analisado</Button>
          </div>
        </div>
      );})}</div>
    </Glass>}
    <CustomerPreview />
    <Glass className="relative mt-4 overflow-hidden p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-brand-foreground"><Sparkles/></span><div><h2 className="font-display text-lg font-semibold">Ask AI</h2><p className="text-xs text-muted-foreground">Seu copiloto responde somente com os dados disponíveis.</p></div></div><div className="flex flex-1 flex-wrap gap-2">{["Como está meu escritório?","Quais clientes estão em risco?","Quem está sobrecarregado?","Por que minha margem caiu?"].map(q=><Button key={q} variant="outline" size="sm" className="glass-soft rounded-full" onClick={openAI}>{q}</Button>)}</div></div><div className="glass-soft mt-4 rounded-xl p-4 text-sm"><p>Sua margem caiu 2 p.p. porque o retrabalho no Fiscal subiu 12% e 2 clientes estão deficitários. Recomendo redistribuir 8 tarefas e revisar preços.</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={()=>void navigate({to:"/inteligencia"})}>Ver plano</Button><Button size="sm" variant="outline" onClick={()=>toast.success("Plano salvo para aprovação.")}>Salvar recomendação</Button></div></div></Glass>
  </>;
}

function CustomerPreview(){const c=clients[1] ?? clients[0]; if(!c)return null; const cp=clientProfitability.find(x=>x.clientId===c.id); const m=cp?.current.margin??clientMargin(c); return <Glass className="mt-4 p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-brand/10 font-display font-bold text-brand">{c.name[0]}</div><div><h2 className="font-display text-lg font-semibold">{c.name}</h2><p className="text-xs text-muted-foreground">CNPJ {c.cnpj} · {c.regime} · {c.headcount} funcionários</p></div></div><Badge tone={healthTone(c.health)}>{c.health}/100 · {c.health>=75?'Saudável':c.health>=55?'Atenção':'Risco'}</Badge></div><div className="grid gap-3 md:grid-cols-3"><div className="glass-soft rounded-xl p-4"><p className="text-xs uppercase text-muted-foreground">Rentabilidade</p><p className="mt-1 font-display text-xl font-semibold">{brl(c.fee)}/mês</p><p className={cn("text-xs font-semibold",m>35?"text-good":"text-bad")}>Margem {m}%</p></div><div className="glass-soft rounded-xl p-4"><p className="text-xs uppercase text-muted-foreground">Serviços</p><div className="mt-2 flex flex-wrap gap-1">{c.services.map(s=><Badge key={s} tone="brand">{s}</Badge>)}</div></div><div className="rounded-xl border border-accent/20 bg-accent/5 p-4"><p className="text-xs font-semibold uppercase text-accent">Revenue Intelligence</p><p className="mt-1 text-sm">Não utiliza BPO financeiro.</p><p className="text-xs text-muted-foreground">Potencial estimado: R$ 1.800/mês</p><Button size="sm" className="mt-2 h-7 bg-accent text-accent-foreground" onClick={()=>toast.success("Oportunidade criada no CRM.")}>Criar oportunidade</Button></div></div></Glass>}

function ClientsPage(){
 const navigate=useNavigate(); const [q,setQ]=useState(""); const [filter,setFilter]=useState("Todos");
 const list=clients.filter(c=>(filter==="Todos"||filter==="Em risco"&&c.health<55||filter===c.status||filter==="Alta rentabilidade"&&clientMargin(c)>=50||filter==="Baixa rentabilidade"&&clientMargin(c)<35)&&c.name.toLowerCase().includes(q.toLowerCase()));
 return <><PageHeader title="Clientes" description="CRM contábil com saúde, rentabilidade, serviços e relacionamento em uma única visão." action={<Button className="rounded-xl"><Plus/> Novo cliente</Button>}/><Glass className="p-4"><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input value={q} onChange={e=>setQ(e.target.value)} className="pl-9" placeholder="Buscar por empresa, CNPJ ou responsável…"/></div><div className="flex flex-wrap gap-2">{["Todos","Ativo","Em onboarding","Em risco","Inadimplente","Alta rentabilidade","Baixa rentabilidade"].map(f=><Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f}</Button>)}</div></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-glass-line text-[11px] uppercase text-muted-foreground"><th className="px-3 py-3">Cliente</th><th>Regime</th><th>Serviços</th><th>Honorário</th><th>Margem</th><th>NPS</th><th>Health Score</th><th>Status</th></tr></thead><tbody>{list.map(c=><tr key={c.id} onClick={()=>void navigate({to:"/clientes/$clientId",params:{clientId:c.id}})} className="cursor-pointer border-b border-glass-line/60 hover:bg-glass"><td className="px-3 py-3"><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.cnpj} · {c.owner}</p></td><td>{c.regime}</td><td><div className="flex gap-1">{c.services.slice(0,3).map(s=><Badge key={s} tone="brand">{s}</Badge>)}</div></td><td className="font-medium">{brl(c.fee)}</td><td className={clientMargin(c)<0?"font-semibold text-bad":clientMargin(c)<35?"font-semibold text-warn":"font-semibold text-good"}>{clientMargin(c)}%</td><td>{c.nps??"—"}</td><td><Badge tone={healthTone(c.health)}>{c.health}/100</Badge></td><td><Badge tone={c.status==="Em risco"?"bad":c.status==="Inadimplente"?"warn":"neutral"}>{c.status}</Badge></td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-muted-foreground">{list.length} de {clients.length} clientes demonstrativos</p></Glass></>;
}

function Customer360({clientId}:{clientId:string}){
 const {tasks, pendencies, communications, documents, obligations, activityLog, completePendency, createTaskFromPendency, createCommunicationFromPendency, createPendency, createTaskForClient, createCommercialRecommendation, markChurnReviewed, churnReviewed, confirmAction, processDocument, createPendencyFromObligation} = useOfficeStore();
 const [tab,setTab]=useState("resumo");
 const c=clientById(clientId)??clients[0]; if(!c)return null;
 const cHealth=healthScores.find(h=>h.clientId===c.id);
 const cChurn=churnRisks.find(x=>x.clientId===c.id);
 const cTasks=tasks.filter(t=>t.clientId===c.id).slice(0,6);
 const cProcesses=processes.filter(p=>p.clientId===c.id).slice(0,4);
 const cDocuments=documents.filter(d=>d.clientId===c.id);
 const cObligations=obligations.filter(o=>o.clientId===c.id);
 const cPendencies=pendencies.filter(p=>p.clientId===c.id);
 const cOpportunities=opportunities.filter(o=>o.company===c.name);
 const cContact=contacts.find(ct=>ct.clientId===c.id&&ct.primary);
 const cContract=contracts.find(ctr=>ctr.clientId===c.id);
 const cProfitability=clientProfitability.find(cp=>cp.clientId===c.id);
 const cEmployees=cProfitability?cProfitability.employeeIds.map(id=>employees.find(e=>e.id===id)?.name).filter((n):n is string=>Boolean(n)):[];
 const cMargin3mAgo=cProfitability?marginNMonthsAgo(cProfitability,3).margin:null;
 const events=[...timeline.filter(e=>e.clientId===c.id), ...activityLog.filter(e=>e.clientId===c.id)].sort((a,b)=>b.date.localeCompare(a.date));
 const feed=[
   ...communications.filter(m=>m.clientId===c.id).map(m=>({id:m.id,date:m.createdAt,label:`${m.channel} · ${m.classification}`,text:m.summary,canEscalate:m.classification==="Reclamação"||m.classification==="Urgente"})),
   ...emails.filter(e=>e.clientId===c.id).map(e=>({id:e.id,date:e.at,label:`E-mail · ${e.direction}`,text:e.subject,canEscalate:false})),
   ...meetings.filter(m=>m.clientId===c.id).map(m=>({id:m.id,date:m.at,label:`Reunião · ${m.type}`,text:m.title,canEscalate:false})),
 ].sort((a,b)=>b.date.localeCompare(a.date));
 const contactMessage=`Olá! Notamos que a saúde da conta de ${c.name} pode se beneficiar de um contato próximo — podemos alinhar as próximas entregas?`;
 const escalate=(text:string)=>confirmAction({title:"Criar pendência a partir da comunicação",description:`Isso cria uma pendência para ${c.name} com base em "${text}".`,impact:"operacional",successMessage:"Pendência criada.",onConfirm:()=>createPendency({clientId:c.id,category:"Cliente",title:text,description:text,assignee:c.owner,priority:"Alta",dueDate:"2026-09-20"})});
 return <><PageHeader eyebrow="Customer 360" title={c.name} description={`${c.cnpj} · ${c.segment} · ${c.regime}`} action={<div className="flex gap-2"><Badge tone={healthTone(c.health)}>Health Score {c.health}/100</Badge><Button size="sm" variant="outline"><MoreHorizontal/></Button></div>}/><div className="grid gap-4 xl:grid-cols-4"><Kpi label="Honorário" value={brl(c.fee)} change="receita mensal" tone="brand"/><Kpi label="Custo operacional real" value={brl(cProfitability?.current.totalCost??c.cost)} change={`${cProfitability?.current.hours??c.hoursMonth}h/mês`} tone="warn"/><Kpi label="Margem" value={`${cProfitability?.current.margin??clientMargin(c)}%`} change={(cProfitability?.current.margin??clientMargin(c))>35?"acima da meta":"reajuste recomendado"} tone={(cProfitability?.current.margin??clientMargin(c))>35?"good":"bad"}/><Kpi label="NPS" value={c.nps?String(c.nps):"—"} change={`cliente desde ${c.since.slice(0,4)}`} tone="brand"/></div><Tabs value={tab} onValueChange={setTab} className="mt-4"><TabsList className="glass-soft h-auto flex-wrap justify-start p-1"><TabsTrigger value="resumo">Resumo</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger><TabsTrigger value="processos">Processos</TabsTrigger><TabsTrigger value="financeiro">Financeiro</TabsTrigger><TabsTrigger value="documentos">Documentos</TabsTrigger><TabsTrigger value="obrigacoes">Obrigações</TabsTrigger><TabsTrigger value="pendencias">Pendências<Badge tone="brand" className="ml-1.5">{cPendencies.filter(p=>p.status!=="Concluída"&&p.status!=="Cancelada").length}</Badge></TabsTrigger><TabsTrigger value="comunicacao">Comunicação</TabsTrigger><TabsTrigger value="oportunidades">Oportunidades</TabsTrigger><TabsTrigger value="notas">Notas internas</TabsTrigger></TabsList><TabsContent value="resumo"><div className="grid gap-4 xl:grid-cols-3"><Glass className="p-5 xl:col-span-2">
  <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-semibold">Customer Health Score</h2>{cHealth&&<Badge tone={cHealth.classification==="Saudável"?"good":cHealth.classification==="Atenção"?"warn":"bad"}>{cHealth.score}/100 · {cHealth.classification}</Badge>}</div>
  <p className="mt-1 text-xs text-muted-foreground">Metodologia transparente: soma de 11 fatores com peso fixo (NPS, inadimplência, reclamações, solicitações, atrasos, utilização, interação, frequência, rentabilidade, pendências e evolução do relacionamento).</p>
  {cHealth&&<>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div><p className="mb-1.5 text-xs font-semibold uppercase text-good">Fatores positivos</p><div className="space-y-1.5">{cHealth.positiveFactors.length===0&&<p className="text-xs text-muted-foreground">Nenhum fator de destaque no momento.</p>}{cHealth.positiveFactors.map(f=><div key={f.key} className="glass-soft flex items-center gap-2 rounded-lg p-2 text-xs"><StatusDot tone="good"/><span>{f.detail}</span></div>)}</div></div>
      <div><p className="mb-1.5 text-xs font-semibold uppercase text-bad">Fatores negativos</p><div className="space-y-1.5">{cHealth.negativeFactors.length===0&&<p className="text-xs text-muted-foreground">Nenhum fator crítico no momento.</p>}{cHealth.negativeFactors.map(f=><div key={f.key} className="glass-soft flex items-center gap-2 rounded-lg p-2 text-xs"><StatusDot tone="bad"/><span>{f.detail}</span></div>)}</div></div>
    </div>
    <div className="mt-4 h-32"><ResponsiveContainer width="100%" height="100%"><LineChart data={cHealth.history}><XAxis dataKey="month" fontSize={11} axisLine={false} tickLine={false}/><YAxis hide domain={[0,100]}/><Tooltip/><Line type="monotone" dataKey="score" name="Health Score" stroke="var(--color-brand)" strokeWidth={2} dot={{fill:"var(--color-brand)"}}/></LineChart></ResponsiveContainer></div>
    <div className="mt-3 rounded-xl bg-brand/10 p-4"><p className="text-sm font-semibold text-brand">Recomendação</p><p className="mt-1 text-sm">{cHealth.recommendation}</p><Button className="mt-3" size="sm" onClick={()=>toast.success("Reunião adicionada à agenda.")}>Agendar reunião</Button></div>
  </>}
</Glass><div className="space-y-4"><Glass className="p-5"><h2 className="font-display text-lg font-semibold">Contato principal</h2>{cContact?<div className="mt-3 space-y-1 text-sm"><p className="font-semibold">{cContact.name}</p><p className="text-muted-foreground">{cContact.role}</p><p className="text-muted-foreground">{cContact.email}</p><p className="text-muted-foreground">{cContact.phone}</p></div>:<p className="mt-3 text-sm text-muted-foreground">Sem contato cadastrado.</p>}</Glass><Glass className="p-5"><h2 className="font-display text-lg font-semibold">Contrato</h2>{cContract?<div className="mt-3 space-y-1 text-sm"><div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><Badge tone={cContract.status==="Ativo"?"good":cContract.status==="Encerrado"?"bad":"warn"}>{cContract.status}</Badge></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Valor</span><span className="font-semibold">{brl(cContract.value)}/mês</span></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Renovação</span><span>{cContract.renewalDate}</span></div></div>:<p className="mt-3 text-sm text-muted-foreground">Sem contrato cadastrado.</p>}</Glass></div></div>
{cChurn&&<Glass className="mt-4 p-5">
  <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-semibold">Churn Risk</h2><Badge tone={cChurn.level==="Crítico"||cChurn.level==="Alto"?"bad":cChurn.level==="Médio"?"warn":"good"}>{cChurn.level} · {cChurn.score}/100</Badge></div>
  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Pontuação determinística baseada em regras (MVP) — não é um modelo de machine learning treinado.</p>
  <p className="mt-3 text-sm">{cChurn.explanation}</p>
  {churnReviewed[c.id]&&<p className="mt-2 text-xs text-good">Analisado pelo gestor em {churnReviewed[c.id]}.</p>}
  <div className="mt-4 flex flex-wrap gap-2">
    <Button size="sm" variant="outline" onClick={()=>confirmAction({title:"Criar tarefa",description:`Investigar risco de churn de ${c.name}.`,impact:"operacional",successMessage:"Tarefa criada em /tarefas.",onConfirm:()=>createTaskForClient(c.id,`Investigar risco de churn — ${c.name}`)})}>Criar tarefa</Button>
    <Button size="sm" variant="outline" onClick={()=>toast(`Mensagem preparada: "${contactMessage}"`)}>Preparar contato</Button>
    <Button size="sm" variant="outline" onClick={()=>setTab("timeline")}>Ver histórico</Button>
    <Button size="sm" variant="ghost" onClick={()=>confirmAction({title:"Marcar como analisado",description:`Confirma que o risco de churn de ${c.name} foi analisado?`,impact:"operacional",successMessage:"Cliente marcado como analisado.",onConfirm:()=>markChurnReviewed(c.id)})}>Marcar como analisado</Button>
  </div>
</Glass>}
<Glass className="mt-4 p-5"><h2 className="font-display text-lg font-semibold">Serviços contratados</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{["Contábil","Fiscal","Pessoal","BPO","Societário","Consultoria"].map(s=><div key={s} className="flex items-center justify-between rounded-lg bg-glass p-2.5 text-sm"><span>{s}</span>{c.services.includes(s as never)?<Badge tone="good">Ativo</Badge>:<Button size="sm" variant="ghost" className="h-7 text-accent">Oportunidade</Button>}</div>)}</div></Glass></TabsContent><TabsContent value="timeline"><TimelineList events={events}/></TabsContent><TabsContent value="processos"><Glass className="p-5"><DataList items={cProcesses.map(p=>({title:p.name,sub:`${p.progress}% concluído · ${p.rework}% retrabalho`,badge:p.slaOk?"Dentro do SLA":"Risco de atraso",tone:p.slaOk?"good":"bad"}))}/></Glass></TabsContent><TabsContent value="financeiro"><Glass className="p-5"><h2 className="font-display text-lg font-semibold">Financeiro do cliente</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><MiniStat label="Receita" value={brl(c.fee)}/><MiniStat label="Custo total" value={brl(cProfitability?.current.totalCost??c.cost)}/><MiniStat label="Em aberto" value={brl(c.overdue)}/></div></Glass>{cProfitability&&<Glass className="mt-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">Motor de Rentabilidade Real</h2><p className="mt-1 text-sm text-muted-foreground">Custo operacional calculado a partir das horas consumidas e do custo/hora dos colaboradores envolvidos.</p></div><Badge tone={cProfitability.current.margin<0?"bad":cProfitability.current.margin<35?"warn":"good"}>Margem {cProfitability.current.margin}%{cMargin3mAgo!==null&&cMargin3mAgo!==cProfitability.current.margin?` (${cMargin3mAgo}% há 3 meses)`:""}</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-4"><MiniStat label="Mão de obra" value={brl(cProfitability.current.laborCost)}/><MiniStat label="Indiretos" value={brl(cProfitability.current.indirectCost)}/><MiniStat label="Terceirizados" value={cProfitability.current.outsourcedCost?brl(cProfitability.current.outsourcedCost):"—"}/><MiniStat label="Lucro" value={brl(cProfitability.current.profit)}/></div><p className="mt-4 text-xs text-muted-foreground">Colaboradores envolvidos: {cEmployees.length?cEmployees.join(", "):"—"} · {cProfitability.current.hours}h consumidas este mês.</p><div className="mt-4 h-40"><ResponsiveContainer width="100%" height="100%"><LineChart data={cProfitability.history}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/><XAxis dataKey="month" fontSize={11}/><YAxis hide/><Tooltip formatter={(v:number)=>`${v}%`}/><Line type="monotone" dataKey="margin" name="Margem" stroke="var(--color-brand)" strokeWidth={2} dot={{fill:"var(--color-brand)"}}/></LineChart></ResponsiveContainer></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>toast(`Preço recomendado: ${brl(suggestedFee(cProfitability.current))}/mês (margem alvo 35%).`)}>Simular reajuste</Button><Button size="sm" variant="outline" onClick={()=>confirmAction({title:"Criar tarefa de revisão",description:`Analisar rentabilidade de ${c.name}.`,impact:"operacional",successMessage:"Tarefa criada em /tarefas.",onConfirm:()=>createTaskForClient(c.id,`Revisar rentabilidade — ${c.name}`)})}>Criar tarefa</Button><Button size="sm" variant="outline" onClick={()=>confirmAction({title:"Gerar recomendação comercial",description:`Reajuste sugerido: ${brl(suggestedFee(cProfitability.current))}/mês.`,impact:"operacional",successMessage:"Recomendação registrada na Central de Pendências.",onConfirm:()=>createCommercialRecommendation(c.id,`Propor reajuste — ${c.name}`,`Margem atual ${cProfitability.current.margin}%. Preço sugerido: ${brl(suggestedFee(cProfitability.current))}/mês.`)})}>Gerar recomendação comercial</Button></div></Glass>}</TabsContent><TabsContent value="documentos"><Glass className="p-5">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-semibold">Documentos</h2><Link to="/documentos" className="text-xs font-semibold text-brand">Enviar novo documento →</Link></div>
  <p className="mb-3 text-[10px] uppercase tracking-wide text-muted-foreground">{OCR_DEMO_DISCLAIMER}</p>
  <div className="space-y-2">
    {cDocuments.length===0&&<p className="text-sm text-muted-foreground">Nenhum documento para este cliente.</p>}
    {cDocuments.map(d=>(
      <div key={d.id} className="glass-soft rounded-xl p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0"><p className="text-sm font-semibold">{d.name}</p><p className="text-xs text-muted-foreground">{d.category} · competência {d.competence} · {d.assignee}</p></div>
          <div className="flex shrink-0 items-center gap-1.5"><Badge tone={d.status==="Vencido"||d.status==="Rejeitado"?"bad":d.status==="Aprovado"?"good":d.status==="Pendente"?"warn":"neutral"}>{d.status}</Badge><Badge tone="neutral">{d.pipelineStage}</Badge></div>
        </div>
        {d.extraction&&<div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-glass p-2.5 text-[11px] text-muted-foreground sm:grid-cols-3"><span>CNPJ: {d.extraction.cnpj}</span><span>Nº: {d.extraction.numero}</span><span>Confiança OCR: {d.extraction.confidence}%</span>{d.extraction.valor!==null&&<span>Valor: {brl(d.extraction.valor)}</span>}{d.extraction.vencimento&&<span>Vencimento: {d.extraction.vencimento}</span>}</div>}
        {d.linkedObligationId&&<p className="mt-2 text-xs text-brand">Evidência vinculada à obrigação {obligations.find(o=>o.id===d.linkedObligationId)?.type ?? d.linkedObligationId}.</p>}
        {d.pipelineStage==="Recebido"&&<div className="mt-2.5"><Button size="sm" className="h-7" onClick={()=>confirmAction({title:"Processar documento",description:`Identificar, classificar, extrair (OCR simulado), validar e relacionar "${d.name}" ao cliente e à obrigação correspondente.`,impact:"operacional",successMessage:"Documento processado.",onConfirm:()=>processDocument(d.id)})}>Processar documento</Button></div>}
      </div>
    ))}
  </div>
</Glass></TabsContent>
<TabsContent value="obrigacoes"><Glass className="p-5">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-semibold">Obrigações</h2><Link to="/obrigacoes" className="text-xs font-semibold text-brand">Ver calendário completo →</Link></div>
  <p className="mb-3 text-[10px] uppercase tracking-wide text-muted-foreground">{OBLIGATIONS_DEMO_DISCLAIMER}</p>
  <div className="space-y-2">
    {cObligations.length===0&&<p className="text-sm text-muted-foreground">Nenhuma obrigação para este cliente.</p>}
    {cObligations.map(o=>{const done=o.checklist.filter(i=>i.done).length; return (
      <div key={o.id} className="glass-soft rounded-xl p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0"><p className="text-sm font-semibold">{o.type} · {o.competence}</p><p className="text-xs text-muted-foreground">vence {o.dueDate} · {o.municipality} · {o.regime} · {o.assignee}</p></div>
          <div className="flex shrink-0 items-center gap-1.5"><Badge tone={o.status==="Atrasada"?"bad":o.status==="Concluída"?"good":o.status==="Aguardando cliente"?"warn":"neutral"}>{o.status}</Badge><Badge tone={o.priority==="Crítica"||o.priority==="Alta"?"bad":"neutral"}>{o.priority}</Badge></div>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">Checklist: {done}/{o.checklist.length} concluído{o.evidenceDocumentId?" · evidência anexada":""}</p>
        {o.status!=="Concluída"&&<div className="mt-2"><Button size="sm" variant="outline" className="h-7" onClick={()=>confirmAction({title:"Gerar pendência",description:`Criar pendência para regularizar ${o.type} (${o.competence}).`,impact:"operacional",successMessage:"Pendência criada.",onConfirm:()=>createPendencyFromObligation(o.id)})}>Gerar pendência</Button></div>}
      </div>
    );})}
  </div>
</Glass></TabsContent><TabsContent value="pendencias"><Glass className="p-5"><div className="space-y-2">{cPendencies.length===0&&<p className="text-sm text-muted-foreground">Nenhuma pendência para este cliente.</p>}{cPendencies.map(p=><div key={p.id} className="glass-soft rounded-xl p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold">{p.title}</p><p className="text-xs text-muted-foreground">{p.category} · {p.assignee} · prazo {p.dueDate}</p></div><Badge tone={p.status==="Concluída"?"good":p.priority==="Crítica"||p.priority==="Alta"?"bad":"warn"}>{p.status}</Badge></div>{p.status!=="Concluída"&&p.status!=="Cancelada"&&<div className="mt-2 flex flex-wrap gap-1.5"><Button size="sm" className="h-7" onClick={()=>confirmAction({title:"Concluir pendência",description:p.title,impact:"operacional",successMessage:"Pendência concluída.",onConfirm:()=>completePendency(p.id)})}>Concluir</Button><Button size="sm" variant="outline" className="h-7" onClick={()=>confirmAction({title:"Gerar tarefa",description:p.title,impact:"operacional",successMessage:"Tarefa criada.",onConfirm:()=>createTaskFromPendency(p.id)})}>Gerar tarefa</Button><Button size="sm" variant="outline" className="h-7" onClick={()=>confirmAction({title:"Gerar comunicação",description:p.title,impact:"operacional",successMessage:"Comunicação criada.",onConfirm:()=>createCommunicationFromPendency(p.id)})}>Gerar comunicação</Button></div>}</div>)}</div></Glass></TabsContent><TabsContent value="comunicacao"><Glass className="p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-semibold">Comunicação</h2><Link to="/comunicacao" className="text-xs font-semibold text-brand">Abrir inbox unificada →</Link></div><div className="space-y-2">{feed.length===0&&<p className="text-sm text-muted-foreground">Sem comunicação registrada.</p>}{feed.map(f=><div key={f.id} className="glass-soft flex items-start justify-between gap-3 rounded-xl p-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase text-muted-foreground">{f.label} · {f.date}</p><p className="text-sm">{f.text}</p></div>{f.canEscalate&&<Button size="sm" variant="outline" className="h-7 shrink-0" onClick={()=>escalate(f.text)}>Criar pendência</Button>}</div>)}</div></Glass></TabsContent><TabsContent value="oportunidades"><Glass className="p-5"><DataList items={cOpportunities.map(o=>({title:`${o.services.slice(0,2).join(" + ")}`,sub:`${brl(o.mrr)}/mês · ${o.probability}%`,badge:o.stage,tone:o.stage==="Perdido"?"bad":o.stage==="Fechado"?"good":"brand"}))}/>{cOpportunities.length===0&&<p className="text-sm text-muted-foreground">Nenhuma oportunidade em aberto para este cliente.</p>}</Glass></TabsContent><TabsContent value="notas"><Glass className="p-5"><Textarea placeholder="Registre uma nota interna sobre este cliente…"/><Button className="mt-3" onClick={()=>toast.success("Nota interna salva.")}>Salvar nota</Button></Glass></TabsContent></Tabs><Glass className="mt-4 p-5"><h2 className="font-display text-lg font-semibold">Próximas tarefas</h2><div className="mt-3"><DataList items={cTasks.map(t=>({title:t.title,sub:`${t.assignee} · ${t.due}`,badge:t.priority,tone:t.late?"bad":"neutral"}))}/></div></Glass></>;
}

function TimelineList({events}:{events:typeof timeline}){return <Glass className="p-5"><div className="relative ml-3 border-l border-brand/20 pl-6">{events.map(e=><div key={e.id} className="relative pb-6 last:pb-0"><span className="absolute -left-[29px] top-1 size-2 rounded-full bg-brand ring-4 ring-background"/><p className="text-xs text-muted-foreground">{new Date(`${e.date}T12:00:00`).toLocaleDateString("pt-BR")}</p><p className="mt-1 text-sm font-semibold">{e.title}</p><p className="text-sm text-muted-foreground">{e.detail}</p></div>)}</div></Glass>}

function CommercialPage(){const stages=["Lead","Diagnóstico","Proposta","Negociação","Fechado","Perdido","Onboarding"] as const; const pipe=opportunities.filter(o=>!["Fechado","Perdido","Onboarding"].includes(o.stage)).reduce((s,o)=>s+o.mrr,0); return <><PageHeader title="CRM Contábil" description="Do primeiro contato ao onboarding, com pipeline ponderado e próximas ações." action={<Button><Plus/> Nova oportunidade</Button>}/><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Kpi label="Pipeline total" value={brl(pipe)} change="MRR potencial" tone="brand"/><Kpi label="Pipeline ponderado" value={brl(Math.round(opportunities.reduce((s,o)=>s+o.mrr*o.probability/100,0)))} change="probabilidade aplicada"/><Kpi label="Conversão" value="34%" change="▲ 4 p.p. no mês"/><Kpi label="Ciclo médio" value="23 dias" change="▼ 3 dias"/></div><div className="mt-4 flex gap-3 overflow-x-auto pb-3">{stages.map(stage=><div key={stage} className="glass-panel w-64 shrink-0 rounded-2xl p-3"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">{stage}</h3><Badge>{opportunities.filter(o=>o.stage===stage).length}</Badge></div><div className="space-y-2">{opportunities.filter(o=>o.stage===stage).slice(0,5).map(o=><div key={o.id} className="glass-soft rounded-xl p-3"><p className="text-sm font-semibold">{o.company}</p><p className="mt-1 text-xs text-muted-foreground">{o.services.slice(0,2).join(" + ")}</p><div className="mt-3 flex items-center justify-between"><span className="text-xs font-semibold text-brand">{brl(o.mrr)}/mês</span><span className="text-[10px] text-muted-foreground">{o.probability}%</span></div></div>)}</div></div>)}</div><RevenueIntelligenceSection/></>}

function RevenueIntelligenceSection(){
  const navigate=useNavigate();
  const {confirmAction,createCommercialRecommendation}=useOfficeStore();
  const [expanded,setExpanded]=useState<string|null>(null);
  const totalPotential=revenueOpportunities.reduce((s,o)=>s+o.potentialIncrease,0);

  const simulate=(o:typeof revenueOpportunities[number],name:string)=>toast(`${name}: faixa recomendada ${brl(o.recommendedRange.min)} – ${brl(o.recommendedRange.max)}/mês (hoje ${brl(o.currentFee)}). Margem ${o.marginBefore}% → ${o.marginAfter}%.`);
  const approve=(o:typeof revenueOpportunities[number],name:string)=>confirmAction({title:"Enviar para aprovação do gestor",description:`Reajuste de ${name} para a faixa ${brl(o.recommendedRange.min)}–${brl(o.recommendedRange.max)}/mês exige aprovação — nada é executado automaticamente.`,impact:"operacional",confirmLabel:"Enviar para aprovação",successMessage:"Recomendação enviada à Central de Pendências para aprovação do gestor.",onConfirm:()=>createCommercialRecommendation(o.clientId,`Aprovar reajuste — ${name}`,`${o.situation} Faixa recomendada: ${brl(o.recommendedRange.min)}–${brl(o.recommendedRange.max)}/mês.`)});

  return <Glass className="mt-4 p-5">
    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="font-display text-lg font-semibold">Revenue Intelligence</h2><p className="mt-1 text-xs text-muted-foreground">Oportunidades de receita que normalmente passam despercebidas — nunca executadas automaticamente, sempre aprovadas pelo gestor.</p></div>
      <Badge tone="accent">{brl(totalPotential)}/mês de potencial identificado</Badge>
    </div>
    <div className="mt-4 space-y-2">
      {revenueOpportunities.length===0&&<p className="text-sm text-muted-foreground">Nenhuma oportunidade de receita identificada no momento.</p>}
      {revenueOpportunities.map(o=>{const client=clientById(o.clientId); const name=client?.name??o.clientId; const open=expanded===o.clientId; return (
        <div key={o.clientId} className="glass-soft rounded-xl p-4">
          <button className="flex w-full flex-wrap items-start justify-between gap-3 text-left" onClick={()=>setExpanded(open?null:o.clientId)}>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{name}</p><p className="mt-1 text-xs text-muted-foreground">{o.situation}</p></div>
            <div className="flex shrink-0 items-center gap-2"><Badge tone={o.score>=60?"bad":o.score>=30?"warn":"brand"}>Score {o.score}</Badge><ChevronRight className={cn("size-4 text-muted-foreground transition-transform",open&&"rotate-90")}/></div>
          </button>
          {open&&<div className="mt-4 space-y-4 border-t border-glass-line pt-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Evidências</p>
              <ul className="mt-2 space-y-1.5">{o.evidence.map((e,i)=><li key={i} className="flex items-start gap-2 text-sm"><StatusDot tone="brand"/><span>{e}</span></li>)}</ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <MiniStat label="Honorário atual" value={brl(o.currentFee)}/>
              <MiniStat label="Faixa recomendada" value={`${brl(o.recommendedRange.min)} – ${brl(o.recommendedRange.max)}`}/>
              <MiniStat label="Aumento potencial" value={`${brl(o.potentialIncrease)}/mês`}/>
              <MiniStat label="Margem antes → depois" value={`${o.marginBefore}% → ${o.marginAfter}%`}/>
            </div>
            <div className="rounded-xl bg-brand/10 p-3 text-sm"><span className="font-semibold text-brand">Impacto estimado: </span>{o.estimatedImpact}</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={()=>simulate(o,name)}>Simular reajuste</Button>
              <Button size="sm" variant="outline" onClick={()=>approve(o,name)}>Enviar para aprovação</Button>
              <Button size="sm" variant="ghost" onClick={()=>client&&void navigate({to:"/clientes/$clientId",params:{clientId:client.id}})}>Abrir Cliente 360</Button>
            </div>
          </div>}
        </div>
      );})}
    </div>
  </Glass>;
}

function ProcessesPage(){const [filter,setFilter]=useState("Todos"); const list=processes.filter(p=>filter==="Todos"||filter==="Em risco"&&!p.slaOk||filter===p.department); return <><PageHeader title="Processos" description="Execução recorrente, SLA e inteligência sobre gargalos e retrabalho." action={<Button><Plus/> Novo processo</Button>}/><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Kpi label="Processos ativos" value="50" change="38 no fechamento" tone="brand"/><Kpi label="SLA" value="94%" change="▲ 1 p.p."/><Kpi label="Em risco" value="6" change="exigem atenção" tone="warn"/><Kpi label="Retrabalho" value="6%" change="▲ 12% no Fiscal" tone="bad"/></div><Glass className="mt-4 p-4"><div className="mb-4 flex flex-wrap gap-2">{["Todos","Em risco","Fiscal","Contábil","Pessoal","Societário"].map(f=><Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f}</Button>)}</div><div className="space-y-3">{list.slice(0,20).map(p=><details key={p.id} className="glass-soft rounded-xl p-4"><summary className="flex cursor-pointer list-none items-center gap-3"><div className="min-w-0 flex-1"><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.department} · ciclo médio {p.cycleDays} dias · retrabalho {p.rework}%</p></div><div className="w-24"><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{width:`${p.progress}%`}}/></div><p className="mt-1 text-right text-[10px]">{p.progress}%</p></div><Badge tone={p.slaOk?"good":"bad"}>{p.slaOk?"No SLA":"Em risco"}</Badge></summary><div className="mt-4 grid gap-2 border-t border-glass-line pt-4 md:grid-cols-4">{p.steps.map((s,i)=><div key={s.name} className="rounded-lg bg-glass p-3"><p className="text-xs font-semibold">{i+1}. {s.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{s.owner}</p><Badge tone={s.status==="Atrasada"?"bad":s.status==="Concluída"?"good":"neutral"}>{s.status}</Badge></div>)}</div></details>)}</div></Glass></>}

function TasksPage(){const {tasks}=useOfficeStore(); const [filter,setFilter]=useState("Todas"); const list=tasks.filter(t=>filter==="Todas"||filter==="Atrasadas"&&t.late||filter===t.status||filter===t.department); return <><PageHeader title="Tarefas" description="Prioridades, responsáveis e contexto do cliente sem depender de planilhas." action={<Button><Plus/> Nova tarefa</Button>}/><Glass className="p-4"><div className="mb-4 flex flex-wrap gap-2">{["Todas","Atrasadas","A fazer","Em andamento","Em revisão","Fiscal","Contábil","Pessoal"].map(f=><Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f}</Button>)}</div><div className="space-y-2">{list.slice(0,30).map(t=><div key={t.id} className="glass-soft flex flex-wrap items-center gap-3 rounded-xl p-3"><button className="grid size-6 place-items-center rounded-full border border-input" onClick={()=>toast.success("Tarefa concluída.")}><CheckCircle2 className="size-4 text-muted-foreground"/></button><div className="min-w-[240px] flex-1"><p className="text-sm font-semibold">{t.title}</p><p className="text-xs text-muted-foreground">{t.assignee} · vence {new Date(`${t.due}T12:00`).toLocaleDateString("pt-BR")}</p></div><Badge tone={t.late?"bad":t.priority==="Alta"?"warn":"neutral"}>{t.late?"Atrasada":t.priority}</Badge><Badge tone="brand">{t.department}</Badge><span className="text-xs text-muted-foreground">{t.hours}h</span></div>)}</div></Glass></>}


function ProfitabilityPage(){
  const navigate=useNavigate();
  const {confirmAction,createTaskForClient,createCommercialRecommendation}=useOfficeStore();
  const [rankTab,setRankTab]=useState<"top"|"bottom"|"deficit">("top");
  const rows=clientProfitability.map(cp=>({cp,client:clientById(cp.clientId)})).filter((r):r is {cp:typeof clientProfitability[number];client:Client}=>Boolean(r.client));
  const ranked=[...rows].sort((a,b)=>b.cp.current.margin-a.cp.current.margin);
  const rankList=rankTab==="top"?ranked.slice(0,5):rankTab==="bottom"?[...ranked].reverse().slice(0,5):rows.filter(r=>r.cp.current.profit<0);

  const openClient=(clientId:string)=>void navigate({to:"/clientes/$clientId",params:{clientId}});
  const simulate=(client:Client,cp:typeof clientProfitability[number])=>toast(`Preço recomendado para ${client.name}: ${brl(suggestedFee(cp.current))}/mês (margem alvo 35%).`);
  const createTask=(client:Client)=>confirmAction({title:"Criar tarefa de revisão",description:`Analisar rentabilidade de ${client.name}.`,impact:"operacional",successMessage:"Tarefa criada em /tarefas.",onConfirm:()=>createTaskForClient(client.id,`Revisar rentabilidade — ${client.name}`)});
  const recommend=(client:Client,cp:typeof clientProfitability[number])=>confirmAction({title:"Gerar recomendação comercial",description:`Reajuste sugerido: ${brl(suggestedFee(cp.current))}/mês.`,impact:"operacional",successMessage:"Recomendação registrada na Central de Pendências.",onConfirm:()=>createCommercialRecommendation(client.id,`Propor reajuste — ${client.name}`,`Margem atual ${cp.current.margin}%. Preço sugerido: ${brl(suggestedFee(cp.current))}/mês.`)});

  return <>
    <PageHeader eyebrow="Motor de Rentabilidade Real" title="Rentabilidade por Cliente" description="Custo operacional real (mão de obra por hora + indiretos + terceirizados), não só faturamento." action={<Button asChild><Link to="/simulador"><Calculator/> Simulador</Link></Button>}/>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Kpi label="Receita da carteira" value={brl(profitabilityDashboard.totalRevenue)} change="honorários do mês" tone="brand"/>
      <Kpi label="Custo operacional real" value={brl(profitabilityDashboard.totalCost)} change="mão de obra + indiretos + terceirizados" tone="warn"/>
      <Kpi label="Lucro" value={brl(profitabilityDashboard.totalProfit)} change={`margem média ${profitabilityDashboard.avgMargin}%`} tone={profitabilityDashboard.totalProfit>=0?"good":"bad"}/>
      <Kpi label="Clientes deficitários" value={String(profitabilityDashboard.deficitClients.length)} change="exigem reajuste" tone="bad"/>
    </div>

    <div className="mt-4 grid gap-4 xl:grid-cols-5">
      <Glass className="p-5 xl:col-span-3">
        <h2 className="font-display text-lg font-semibold">Evolução mensal</h2>
        <div className="mt-4 h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={profitabilityDashboard.monthlyEvolution}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/><XAxis dataKey="month"/><YAxis tickFormatter={v=>`${Math.round(v/1000)}k`}/><Tooltip formatter={(v)=>brl(Number(v))}/><Line type="monotone" dataKey="revenue" name="Receita" stroke="var(--color-brand)" strokeWidth={2}/><Line type="monotone" dataKey="cost" name="Custo" stroke="var(--color-bad,#e5484d)" strokeWidth={2}/><Line type="monotone" dataKey="profit" name="Lucro" stroke="var(--color-good,#30a46c)" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
      </Glass>
      <Glass className="p-5 xl:col-span-2">
        <h2 className="font-display text-lg font-semibold">Distribuição de margem</h2>
        <div className="mt-4 space-y-3">{profitabilityDashboard.marginDistribution.map(b=><div key={b.bucket}><div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{b.bucket}</span><span className="font-semibold">{b.count}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{width:`${clients.length?Math.round(b.count/clients.length*100):0}%`}}/></div></div>)}</div>
      </Glass>
    </div>

    <Glass className="mt-4 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Ranking de clientes</h2>
        <div className="flex gap-2">
          <Button size="sm" variant={rankTab==="top"?"default":"outline"} onClick={()=>setRankTab("top")}>Mais rentáveis</Button>
          <Button size="sm" variant={rankTab==="bottom"?"default":"outline"} onClick={()=>setRankTab("bottom")}>Menos rentáveis</Button>
          <Button size="sm" variant={rankTab==="deficit"?"default":"outline"} onClick={()=>setRankTab("deficit")}>Deficitários<Badge tone="bad" className="ml-1.5">{profitabilityDashboard.deficitClients.length}</Badge></Button>
        </div>
      </div>
      <div className="space-y-2">
        {rankList.length===0&&<p className="text-sm text-muted-foreground">Nenhum cliente nesta categoria.</p>}
        {rankList.map(({cp,client})=><button key={client.id} onClick={()=>openClient(client.id)} className="glass-soft flex w-full flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-left"><div><p className="text-sm font-semibold">{client.name}</p><p className="text-xs text-muted-foreground">{brl(cp.current.profit)}/mês · {cp.current.hours}h consumidas</p></div><Badge tone={cp.current.margin<0?"bad":cp.current.margin<35?"warn":"good"}>{cp.current.margin}%</Badge></button>)}
      </div>
    </Glass>

    <Glass className="mt-4 p-4">
      <h2 className="mb-3 px-1 font-display text-lg font-semibold">Custo operacional real por cliente</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead><tr className="border-b border-glass-line text-[11px] uppercase text-muted-foreground"><th className="p-3">Cliente</th><th>Colaboradores</th><th>Horas</th><th>Mão de obra</th><th>Indiretos</th><th>Terceirizados</th><th>Custo total</th><th>Receita</th><th>Lucro</th><th>Margem</th><th>Ações</th></tr></thead>
          <tbody>{ranked.map(({cp,client})=>{const emps=cp.employeeIds.map(id=>employees.find(e=>e.id===id)?.name).filter((n):n is string=>Boolean(n)); return <tr key={client.id} className="border-b border-glass-line/60 align-top"><td className="p-3 font-semibold"><Link to="/clientes/$clientId" params={{clientId:client.id}}>{client.name}</Link></td><td className="max-w-[160px] text-xs text-muted-foreground">{emps.join(", ")}</td><td>{cp.current.hours}h</td><td>{brl(cp.current.laborCost)}</td><td>{brl(cp.current.indirectCost)}</td><td>{cp.current.outsourcedCost?brl(cp.current.outsourcedCost):"—"}</td><td className="font-medium">{brl(cp.current.totalCost)}</td><td>{brl(cp.current.revenue)}</td><td className={cp.current.profit<0?"font-semibold text-bad":"font-semibold text-good"}>{brl(cp.current.profit)}</td><td><Badge tone={cp.current.margin<0?"bad":cp.current.margin<35?"warn":"good"}>{cp.current.margin}%</Badge></td><td><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" className="h-7" onClick={()=>openClient(client.id)}>Abrir</Button><Button size="sm" variant="outline" className="h-7" onClick={()=>openClient(client.id)}>Horas</Button><Button size="sm" variant="outline" className="h-7" onClick={()=>simulate(client,cp)}>Simular</Button><Button size="sm" variant="outline" className="h-7" onClick={()=>createTask(client)}>Tarefa</Button><Button size="sm" variant="outline" className="h-7" onClick={()=>recommend(client,cp)}>Recomendar</Button></div></td></tr>})}</tbody>
        </table>
      </div>
    </Glass>
  </>;
}

function IntelligencePage(){const navigate=useNavigate(); const {insightStatus,resolveInsight,ignoreInsight,confirmAction}=useOfficeStore(); const [kind,setKind]=useState("Problema"); const items=insights.filter(i=>i.kind===kind); return <><PageHeader eyebrow="DADOS → INTELIGÊNCIA → AÇÃO" title="Intelligence Center" description="Problemas, oportunidades e previsões calculados a partir dos dados da operação — não texto fixo." action={<Badge tone="accent"><Sparkles className="mr-1 size-3"/> 6 agentes monitorando</Badge>}/><div className="mb-4 flex gap-2">{["Problema","Oportunidade","Previsão"].map(k=><Button key={k} variant={kind===k?"default":"outline"} onClick={()=>setKind(k)}>{k}s <Badge tone={kind===k?"brand":"neutral"}>{insights.filter(i=>i.kind===k).length}</Badge></Button>)}</div><div className="grid gap-4 lg:grid-cols-2">{items.map(i=>{const status=insightStatus[i.id]; return <Glass key={i.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><Badge tone={i.kind==="Problema"?"bad":i.kind==="Oportunidade"?"good":"brand"}>{i.kind}</Badge><h2 className="mt-3 font-display text-lg font-semibold">{i.title}</h2></div><Lightbulb className="size-5 text-brand"/></div><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-xs font-semibold uppercase text-muted-foreground">Impacto</dt><dd className="mt-1">{i.impact}</dd></div><div><dt className="text-xs font-semibold uppercase text-muted-foreground">Causa provável</dt><dd className="mt-1">{i.cause}</dd></div><div className="rounded-xl bg-brand/10 p-3"><dt className="text-xs font-semibold uppercase text-brand">Recomendação</dt><dd className="mt-1">{i.recommendation}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2">{status?<Badge tone={status==="resolvido"?"good":"neutral"}>{status==="resolvido"?"Resolvido":"Ignorado"}</Badge>:<>{i.actions.map((a,j)=><Button key={a} size="sm" variant={j===0?"default":"outline"} onClick={()=>j===0?confirmAction({title:a,description:i.title,impact:"operacional",successMessage:`${a}: ação executada.`,onConfirm:()=>resolveInsight(i.id)}):void navigate({to:i.link as "/pessoas"})}>{a}</Button>)}<Button size="sm" variant="ghost" onClick={()=>ignoreInsight(i.id)}>Ignorar</Button></>}</div></Glass>})}</div><h2 className="mb-3 mt-7 font-display text-xl font-semibold">Agentes de IA</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{agents.map(a=><Glass key={a.id} className="p-4"><div className="flex items-start gap-3"><div className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent"><Bot className="size-4"/></div><div className="min-w-0 flex-1"><p className="font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.scope}</p></div></div><div className="mt-4 flex items-center justify-between"><Badge tone={a.status==="Ativo"?"good":"warn"}>{a.status}</Badge><span className="text-[11px] text-muted-foreground">{a.findings} achados · {a.lastRun}</span></div></Glass>)}</div></>}

function FinancePage(){return <><PageHeader title="Financeiro" description="Receita recorrente, recebimentos, inadimplência, expansão e contração." action={<Button><FileText/> Gerar relatório</Button>}/><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Kpi label="MRR" value="R$ 480.000" change="▲ 8% no trimestre"/><Kpi label="Recebido no mês" value="R$ 463.640" change="96,6% realizado"/><Kpi label="Inadimplência" value="R$ 18.700" change="6 contas vencidas" tone="bad"/><Kpi label="Ticket médio" value="R$ 3.750" change="▲ R$ 180"/></div><div className="mt-4 grid gap-4 xl:grid-cols-3"><Glass className="p-5 xl:col-span-2"><h2 className="font-display text-lg font-semibold">Movimento da receita</h2><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyRevenue}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/><XAxis dataKey="month"/><YAxis tickFormatter={v=>`${Math.round(v/1000)}k`}/><Tooltip formatter={(v)=>brl(Number(v))}/><Line type="monotone" dataKey="receita" stroke="var(--color-brand)" strokeWidth={3} dot={{fill:"var(--color-brand)"}}/></LineChart></ResponsiveContainer></div></Glass><Glass className="p-5"><h2 className="font-display text-lg font-semibold">Movimentação do MRR</h2><DataList items={[{title:"Novos clientes",sub:"+ R$ 14.800",badge:"+4",tone:"good"},{title:"Expansão",sub:"+ R$ 8.400",badge:"upsell",tone:"good"},{title:"Reajustes",sub:"+ R$ 6.300",badge:"12 clientes",tone:"brand"},{title:"Churn",sub:"− R$ 4.200",badge:"2 clientes",tone:"bad"},{title:"Downgrade",sub:"− R$ 1.800",badge:"1 cliente",tone:"warn"}]}/></Glass></div><Glass className="mt-4 p-5"><h2 className="font-display text-lg font-semibold">Contas vencidas</h2><div className="mt-3"><DataList items={clients.filter(c=>c.overdue).map(c=>({title:c.name,sub:`Vencido · responsável ${c.owner}`,badge:brl(c.overdue),tone:"bad"}))}/></div></Glass></>}

function AutomationPage(){return <><PageHeader title="Automação" description="Construa fluxos WHEN → IF → THEN com aprovação humana para ações críticas." action={<Button><Plus/> Nova automação</Button>}/><div className="grid gap-4 lg:grid-cols-2">{automations.map(w=><Glass key={w.id} className="p-5"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><Zap className="size-4 text-brand"/><h2 className="font-display text-lg font-semibold">{w.name}</h2></div><p className="mt-1 text-xs text-muted-foreground">{w.runs} execuções</p></div><Switch checked={w.active} onCheckedChange={()=>toast.success(w.active?"Automação pausada.":"Automação ativada.")}/></div><div className="mt-4 rounded-xl bg-brand/10 p-3"><p className="text-[10px] font-semibold uppercase text-brand">When</p><p className="mt-1 text-sm font-medium">{w.when}</p></div><div className="mt-3 space-y-2">{w.rules.map((r,i)=><div key={r.if} className="glass-soft grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2 rounded-xl p-3 text-xs"><Badge tone="warn">IF</Badge><span>{r.if}</span><ArrowRight className="size-3"/><span className="font-medium">{r.then}</span></div>)}</div></Glass>)}</div></>}

function KnowledgePage(){const [q,setQ]=useState(""); const list=knowledgeArticles.filter(x=>(x.title+x.category).toLowerCase().includes(q.toLowerCase())); return <><PageHeader title="Conhecimento" description="Processos, procedimentos, decisões e memória empresarial com controle de acesso." action={<Button><Plus/> Novo artigo</Button>}/><Glass className="p-5"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input className="h-11 pl-9" value={q} onChange={e=>setQ(e.target.value)} placeholder="Pergunte: como fazemos o fechamento fiscal?"/></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map(k=><article key={k.id} className="glass-soft rounded-xl p-4"><Badge tone="brand">{k.category}</Badge><h2 className="mt-3 font-semibold">{k.title}</h2><p className="mt-1 text-sm text-muted-foreground">{k.summary}</p><Button variant="ghost" size="sm" className="mt-3 px-0 text-brand">Abrir <ArrowRight/></Button></article>)}</div></Glass></>}

function BenchmarkingPage(){const metrics=[{name:"Clientes por funcionário",yours:8.5,market:10.2,unit:""},{name:"Receita por funcionário",yours:32,market:38,unit:" mil"},{name:"Margem",yours:27,market:34,unit:"%"},{name:"Ticket médio",yours:3.75,market:3.4,unit:" mil"},{name:"Produtividade",yours:78,market:84,unit:"%"},{name:"Churn",yours:2.3,market:2.8,unit:"%"}];return <><PageHeader title="Benchmarking" description="Comparação anonimizada com escritórios de porte e perfil semelhantes." action={<Badge tone="good"><ShieldCheck className="mr-1 size-3"/> Dados agregados</Badge>}/><Glass className="p-5"><div className="mb-5 rounded-xl bg-brand/10 p-4"><p className="font-display text-xl font-semibold">Você está no percentil 32 de produtividade.</p><p className="mt-1 text-sm text-muted-foreground">Escritórios semelhantes têm margem média de 34%. Sua margem é 27,4%.</p></div><div className="grid gap-3 md:grid-cols-2">{metrics.map(m=><div key={m.name} className="glass-soft rounded-xl p-4"><div className="flex justify-between"><span className="text-sm font-medium">{m.name}</span><Badge tone={(m.name==="Churn"?m.yours<m.market:m.yours>m.market)?"good":"warn"}>{m.name==="Churn"?m.yours<m.market?"Melhor":"Abaixo":m.yours>m.market?"Melhor":"Abaixo"}</Badge></div><div className="mt-3 grid grid-cols-2 gap-4"><div><p className="text-[10px] uppercase text-muted-foreground">Seu escritório</p><p className="font-display text-2xl font-semibold">{m.yours}{m.unit}</p></div><div><p className="text-[10px] uppercase text-muted-foreground">Mercado</p><p className="font-display text-2xl font-semibold text-muted-foreground">{m.market}{m.unit}</p></div></div></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Nenhum dado individual de outro escritório é exibido. Amostra demonstrativa para o protótipo.</p></Glass></>}

function OnboardingPage(){const steps=["Nome do escritório","Número de funcionários","Departamentos","Número de clientes","Sistemas utilizados","Importação","Configuração de processos","Convidar equipe"]; const [current,setCurrent]=useState(3);return <><PageHeader title="Onboarding do escritório" description="Configure a operação uma vez. O sistema reutiliza os dados em todos os módulos."/><Glass className="mx-auto max-w-3xl p-6"><div className="flex justify-between gap-1">{steps.map((s,i)=><div key={s} className="flex-1"><div className={cn("h-1.5 rounded-full",i<=current?"bg-brand":"bg-muted")}/><p className="mt-2 hidden text-[10px] text-muted-foreground md:block">{i+1}. {s}</p></div>)}</div><div className="py-10 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand"><Building2/></div><p className="mt-5 font-serif text-lg italic text-brand">Etapa {current+1} de 8</p><h2 className="mt-1 font-display text-2xl font-semibold">{steps[current]}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{current===3?"Quantos clientes ativos o escritório atende hoje?":"Configure esta etapa para personalizar seu ContaAI."}</p>{current===3&&<Input type="number" defaultValue="128" className="mx-auto mt-5 max-w-xs text-center text-lg"/>}</div><div className="flex justify-between"><Button variant="outline" disabled={current===0} onClick={()=>setCurrent(v=>Math.max(0,v-1))}>Voltar</Button><Button onClick={()=>{if(current===7){toast.success("Seu escritório está pronto.");setCurrent(0)}else setCurrent(v=>v+1)}}>{current===7?"Finalizar":"Continuar"}<ArrowRight/></Button></div></Glass></>}

function SimulatorPage(){const [clientsGrowth,setClientsGrowth]=useState(100);const [hires,setHires]=useState(0);const [price,setPrice]=useState(0);const hours=clientsGrowth*8; const people=Math.ceil(Math.max(0,hours-hires*168)/168);const revenue=clientsGrowth*3750; const cost=people*6800+hires*6800;return <><PageHeader eyebrow="Digital Twin do Escritório" title="Simulador" description="Teste cenários de crescimento, contratação e preço antes de decidir."/><Glass className="p-5"><div className="grid gap-6 lg:grid-cols-3"><label className="space-y-2"><span className="text-sm font-semibold">Quero ganhar novos clientes</span><Input type="number" value={clientsGrowth} onChange={e=>setClientsGrowth(Number(e.target.value))}/><span className="text-xs text-muted-foreground">Estimativa baseada no ticket e esforço médios da carteira.</span></label><label className="space-y-2"><span className="text-sm font-semibold">Se eu contratar analistas</span><Input type="number" value={hires} onChange={e=>setHires(Number(e.target.value))}/><span className="text-xs text-muted-foreground">Cada analista adiciona aproximadamente 168h/mês.</span></label><label className="space-y-2"><span className="text-sm font-semibold">Se eu aumentar o preço médio</span><div className="relative"><Input type="number" value={price} onChange={e=>setPrice(Number(e.target.value))}/><span className="absolute right-3 top-2 text-muted-foreground">%</span></div><span className="text-xs text-muted-foreground">Aplicado à carteira atual de 128 clientes.</span></label></div></Glass><div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4"><Kpi label="Horas adicionais" value={`${hours}h/mês`} change="demanda estimada" tone="brand"/><Kpi label="Pessoas necessárias" value={String(people)} change={`${hires} contratação(ões) informadas`} tone={people>5?"warn":"good"}/><Kpi label="Receita adicional" value={brl(revenue+480000*price/100)} change="por mês"/><Kpi label="Impacto estimado" value={brl(revenue+480000*price/100-cost)} change="antes de impostos" tone="good"/></div><Glass className="mt-4 p-5"><h2 className="font-display text-lg font-semibold">Plano sugerido</h2><div className="mt-3 space-y-2"><p className="glass-soft rounded-xl p-3 text-sm">1. Automatizar validações para recuperar aproximadamente {Math.round(hours*.12)}h/mês.</p><p className="glass-soft rounded-xl p-3 text-sm">2. Contratar {people} analistas além das contratações já planejadas.</p><p className="glass-soft rounded-xl p-3 text-sm">3. Crescer em ondas de 25 clientes, medindo SLA e margem a cada ciclo.</p></div><Button className="mt-4" onClick={()=>toast.success("Cenário salvo para revisão.")}>Salvar cenário</Button></Glass></>}

function ClientPortal(){
  const {createClientMessage}=useOfficeStore();
  const [msg,setMsg]=useState("");
  const portalClient=clients[0];
  const send=()=>{
    if(!msg.trim()||!portalClient)return;
    createClientMessage(portalClient.id,msg.trim());
    toast.success("Mensagem enviada ao escritório.");
    setMsg("");
  };
  return <div className="mx-auto max-w-5xl"><PageHeader eyebrow="Portal do Cliente" title="Olá, Vetta Alimentos." description="Veja o que precisa ser feito, acompanhe seu escritório e encontre seus documentos."/><div className="grid gap-3 sm:grid-cols-3"><Kpi label="Pendências" value="2" change="precisam de você" tone="bad" icon={AlertTriangle}/><Kpi label="Documento" value="1" change="aguardando validação" tone="warn" icon={FileText}/><Kpi label="Processos concluídos" value="8" change="este mês" icon={CheckCircle2}/></div><div className="mt-4 grid gap-4 lg:grid-cols-3"><Glass className="p-5 lg:col-span-2"><h2 className="font-display text-xl font-semibold">O que preciso fazer?</h2><div className="mt-4 space-y-3"><PortalTask title="Enviar extratos bancários de agosto" due="Hoje" tone="bad"/><PortalTask title="Confirmar admissões do mês" due="Até 16 set" tone="warn"/><PortalTask title="Validar relatório gerencial" due="Pronto para você" tone="brand"/></div></Glass><Glass className="p-5"><h2 className="font-display text-xl font-semibold">Fale com a gente</h2><p className="mt-2 text-sm text-muted-foreground">Sua responsável é Ana Beatriz. Tempo médio de resposta: 18 min.</p><Textarea className="mt-4" value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Como podemos ajudar?"/><Button className="mt-3 w-full" onClick={send} disabled={!msg.trim()}><MessageSquare/> Enviar mensagem</Button><p className="mt-2 text-[11px] text-muted-foreground">Sua mensagem cai direto na inbox unificada do escritório.</p></Glass></div><Glass className="mt-4 p-5"><div className="flex justify-between"><h2 className="font-display text-xl font-semibold">Seus processos</h2><Button variant="ghost" size="sm">Ver todos</Button></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{["Fechamento Contábil","Apuração Fiscal","Folha de Pagamento"].map((x,i)=><div key={x} className="glass-soft rounded-xl p-4"><p className="font-semibold">{x}</p><p className="mt-1 text-xs text-muted-foreground">{i===0?"Em conferência":i===1?"Concluído":"Aguardando documentos"}</p><div className="mt-3 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{width:`${[72,100,38][i]}%`}}/></div></div>)}</div></Glass></div>;
}
function PortalTask({title,due,tone}:{title:string;due:string;tone:"bad"|"warn"|"brand"}){return <div className="glass-soft flex items-center gap-3 rounded-xl p-4"><StatusDot tone={tone}/><div className="flex-1"><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{due}</p></div><Button size="sm">Resolver</Button></div>}

function AlertsPage(){const navigate=useNavigate(); const {alertStatus,resolveAlert,confirmAction}=useOfficeStore(); const [filter,setFilter]=useState("Todos");const list=alerts.filter(a=>filter==="Todos"||a.level===filter);return <><PageHeader title="Central de Alertas" description="Tudo que exige atenção, decisão ou representa oportunidade."/><div className="mb-4 flex flex-wrap gap-2">{["Todos","Crítico","Atenção","Informação","Oportunidade"].map(f=><Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f}</Button>)}</div><Glass className="p-4"><div className="space-y-2">{list.map(a=>{const status=alertStatus[a.id]; return <div key={a.id} className="glass-soft rounded-xl p-4"><div className="flex items-start gap-3"><StatusDot tone={a.level==="Crítico"?"bad":a.level==="Atenção"?"warn":a.level==="Oportunidade"?"good":"brand"}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{a.title}</p><Badge tone={a.level==="Crítico"?"bad":a.level==="Atenção"?"warn":a.level==="Oportunidade"?"good":"brand"}>{a.level}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{a.detail}</p><div className="mt-3 flex flex-wrap gap-2">{status?<Badge tone="good">Resolvido</Badge>:<>{a.actions.map((x,i)=><Button key={x} size="sm" variant={i===0?"default":"outline"} onClick={()=>i===0?confirmAction({title:x,description:a.title,impact:"operacional",successMessage:`${x}: ação executada.`,onConfirm:()=>resolveAlert(a.id)}):void navigate({to:a.link as "/pessoas"})}>{x}</Button>)}</>}</div></div></div></div>})}</div></Glass></>}

function ProjectsPage(){
  const navigate=useNavigate();
  const [filter,setFilter]=useState("Todos");
  const list=projects.filter(p=>filter==="Todos"||filter===p.status);
  return <><PageHeader title="Projetos" description="Entregas não recorrentes, escopo, responsáveis e marcos em um único lugar." action={<Button><Plus/> Novo projeto</Button>}/>
    <Glass className="p-4">
      <div className="mb-4 flex flex-wrap gap-2">{["Todos","Planejado","Em andamento","Em aprovação","Concluído"].map(f=><Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f}</Button>)}</div>
      <div className="space-y-2">{list.map(p=>{const client=clientById(p.clientId); return <button key={p.id} onClick={()=>client&&void navigate({to:"/clientes/$clientId",params:{clientId:client.id}})} className="glass-soft flex w-full flex-wrap items-center gap-3 rounded-xl p-3 text-left"><div className="min-w-[220px] flex-1"><p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">vence {p.dueDate}</p></div><div className="w-28"><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{width:`${p.progress}%`}}/></div><p className="mt-1 text-right text-[10px]">{p.progress}%</p></div><Badge tone={p.status==="Concluído"?"good":p.status==="Em aprovação"?"warn":"brand"}>{p.status}</Badge></button>})}</div>
    </Glass>
  </>;
}

function SimpleModule({title,description,icon:Icon,items}:{title:string;description:string;icon:typeof Activity;items:string[]}){return <><PageHeader title={title} description={description} action={<Button><Plus/> Criar</Button>}/><Glass className="p-6"><div className="grid gap-4 md:grid-cols-2">{items.map((x,i)=><div key={x} className="glass-soft flex items-center gap-4 rounded-xl p-5"><div className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand"><Icon/></div><div className="flex-1"><p className="font-semibold">{x}</p><p className="text-xs text-muted-foreground">Atualizado há {i+1} hora{(i+1)>1?'s':''}</p></div><ChevronRight className="size-4 text-muted-foreground"/></div>)}</div></Glass></>}

function DataList({items}:{items:{title:string;sub:string;badge:string;tone:string}[]}){return <div className="space-y-2">{items.map((x,i)=><div key={i} className="flex items-center gap-3 rounded-xl bg-glass p-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{x.title}</p><p className="text-xs text-muted-foreground">{x.sub}</p></div><Badge tone={x.tone as "good"|"warn"|"bad"|"brand"|"neutral"}>{x.badge}</Badge></div>)}</div>}
function MiniStat({label,value}:{label:string;value:string}){return <div className="glass-soft rounded-xl p-4"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl font-semibold">{value}</p></div>}

function AICopilot({open,setOpen}:{open:boolean;setOpen:(v:boolean)=>void}){
 const [input,setInput]=useState(""); const [question,setQuestion]=useState("Como está meu escritório?");
 const answer=useMemo(()=>{const q=question.toLowerCase();if(q.includes("risco")||q.includes("churn"))return `${clients.filter(c=>c.health<55).length} clientes apresentam alto risco: ${clients.filter(c=>c.health<55).map(c=>c.name).join(", ")}. Os principais sinais são reclamações, atrasos e inadimplência.`;if(q.includes("sobrecarreg")||q.includes("capacidade"))return `${employees.filter(e=>e.allocated/e.capacity>1).length} pessoas estão acima da capacidade. João Ferreira lidera com 118%. Maria Souza tem 26% disponível e pode absorver parte da demanda.`;if(q.includes("margem")||q.includes("preju"))return `A margem operacional está em 27,4%, 2 p.p. abaixo do período anterior. O retrabalho no Fiscal subiu 12% e ${clients.filter(c=>clientMargin(c)<0).length} clientes estão deficitários.`;if(q.includes("document"))return `${clients.filter(c=>c.lateTasks>2).length} clientes ainda têm solicitações de documentos pendentes. A maior concentração está nos processos de fechamento fiscal.`;if(q.includes("receita")||q.includes("bpo"))return `Há ${crossSellTargets.length} clientes elegíveis para BPO financeiro, com potencial estimado de ${brl(crossSellTargets.reduce((s,x)=>s+x.potential,0))}/mês.`;if(q.includes("tarefa")||q.includes("atras"))return `Existem ${totals.lateTasks} tarefas atrasadas. O Departamento Fiscal concentra o maior risco e deve redistribuir 8 tarefas hoje.`;if(q.includes("escritório")||q.includes("resumo"))return `O escritório tem 128 clientes ativos, MRR de R$ 480 mil, margem de 27,4% e ocupação de 96%. Hoje, priorize capacidade do Fiscal, 4 clientes em risco e R$ 18.700 vencidos.`;return "Não encontrei dados suficientes para responder com segurança. Posso analisar clientes, capacidade, margem, tarefas, receita e documentos disponíveis no protótipo."},[question]);
 const ask=()=>{if(!input.trim())return;setQuestion(input.trim());setInput("")};
 return <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full max-w-lg border-glass-line bg-background/95 p-0 backdrop-blur-2xl"><SheetHeader className="border-b border-glass-line p-5"><SheetTitle className="flex items-center gap-2 font-display"><span className="grid size-8 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-brand-foreground"><Sparkles className="size-4"/></span>Ask AI</SheetTitle></SheetHeader><div className="flex h-[calc(100vh-80px)] flex-col p-5"><div className="flex-1 overflow-y-auto"><div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary p-3 text-sm text-primary-foreground">{question}</div><div className="mt-3 max-w-[92%] rounded-2xl rounded-bl-sm bg-muted p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand"><Bot className="size-4"/> Análise com dados do sistema</div><p className="text-sm leading-relaxed">{answer}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={()=>toast.success("Plano criado e aguardando sua aprovação.")}>Criar plano</Button><Button size="sm" variant="outline" onClick={()=>toast("Análise aberta no Intelligence Center.")}>Ver evidências</Button></div></div><div className="mt-6"><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Sugestões</p><div className="flex flex-wrap gap-2">{["Quais clientes estão em risco?","Quem está sobrecarregado?","Por que minha margem caiu?","Quanto posso vender de BPO?"].map(q=><Button key={q} size="sm" variant="outline" className="rounded-full" onClick={()=>setQuestion(q)}>{q}</Button>)}</div></div></div><div className="mt-4 flex gap-2 border-t border-glass-line pt-4"><Textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask()}}} className="min-h-10 resize-none" placeholder="Pergunte sobre sua operação…"/><Button size="icon" className="h-10 w-10 shrink-0" onClick={ask}><ArrowRight/></Button></div><p className="mt-2 text-[10px] text-muted-foreground">Respostas usam apenas os dados demonstrativos disponíveis. Ações críticas exigem aprovação.</p></div></SheetContent></Sheet>
}
