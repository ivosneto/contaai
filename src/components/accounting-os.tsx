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
  clients,
  crossSellTargets,
  departmentLoad,
  employees,
  healthTone,
  insights,
  knowledgeArticles,
  margin,
  monthlyRevenue,
  opportunities,
  processes,
  tasks,
  timeline,
  totals,
  utilization,
  type Client,
} from "@/data/office";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Operação",
    items: [
      ["/", "Visão Geral", LayoutDashboard],
      ["/clientes", "Clientes", Building2],
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
  return routeTitles[path] ?? "Accounting OS";
}

function Glass({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <section className={cn("glass-panel rounded-2xl", className)} onClick={onClick}>
      {children}
    </section>
  );
}

function StatusDot({ tone }: { tone: "good" | "warn" | "bad" | "brand" }) {
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

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "good" | "warn" | "bad" | "brand" | "accent" | "neutral" }) {
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
      )}
    >
      {children}
    </span>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
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

function Kpi({ label, value, change, tone = "good", icon: Icon, onClick }: { label: string; value: string; change: string; tone?: "good" | "bad" | "warn" | "brand"; icon?: typeof Activity; onClick?: () => void }) {
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
        <div className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand to-accent font-display text-lg font-bold text-brand-foreground shadow-lg">A</div>
        <div>
          <p className="font-display text-[15px] font-semibold leading-none">Accounting OS</p>
          <p className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">Inteligente</p>
        </div>
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
    case "/comercial": return <CommercialPage />;
    case "/processos": return <ProcessesPage />;
    case "/tarefas": return <TasksPage />;
    case "/pessoas": return <PeoplePage />;
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
    case "/documentos": return <SimpleModule title="Central de Documentos" description="Documentos organizados por cliente, ano, departamento e tipo." icon={FolderOpen} items={["20 documentos recentes", "4 aguardando aprovação", "2 com validade próxima", "OCR preparado para integração"]} />;
    case "/comunicacao": return <SimpleModule title="Comunicação" description="Mensagens, solicitações e ocorrências associadas à memória de cada cliente." icon={MessageSquare} items={["14 conversas aguardando resposta", "3 reclamações classificadas", "8 documentos recebidos", "WhatsApp Business: integração não configurada"]} />;
    case "/projetos": return <SimpleModule title="Projetos" description="Entregas não recorrentes, escopo, responsáveis e marcos em um único lugar." icon={BriefcaseBusiness} items={["12 projetos ativos", "3 marcos esta semana", "94% dentro do prazo", "1 aprovação pendente"]} />;
    case "/configuracoes": return <SimpleModule title="Configurações" description="Workspace, equipe, permissões, departamentos e integrações." icon={Settings} items={["Workspace Lapenda Contabilidade", "15 usuários ativos", "6 departamentos", "Integrações futuras preparadas"]} />;
    case "/relatorios": return <SimpleModule title="Relatórios" description="Gere relatórios executivos por período, cliente, departamento ou indicador." icon={FileText} items={["Relatório Operacional — Setembro", "Relatório de Rentabilidade", "Relatório de Capacidade", "Exportação PDF preparada"]} />;
    default: return <Dashboard openAI={openAI} />;
  }
}

function Dashboard({ openAI }: { openAI: () => void }) {
  const navigate = useNavigate();
  const critical = alerts.filter((a) => a.level === "Crítico").slice(0, 3);
  return <>
    <PageHeader eyebrow="Bom dia, Matheus." title="Aqui está o que precisa da sua atenção hoje." description="Sua operação está sob controle, com três decisões que podem melhorar margem, capacidade e experiência do cliente." action={<Button className="rounded-xl bg-linear-to-r from-brand to-accent text-brand-foreground" onClick={openAI}><Sparkles /> O que devo fazer agora?</Button>} />
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Kpi label="Receita mensal" value="R$ 482.340" change="▲ 8,2% vs. mês anterior" icon={TrendingUp} onClick={() => void navigate({to:"/financeiro"})}/>
      <Kpi label="MRR" value="R$ 480.000" change="▲ 4,1% expansão" icon={CircleDollarSign} onClick={() => void navigate({to:"/financeiro"})}/>
      <Kpi label="Margem operacional" value="27,4%" change="▼ 2 p.p. atenção" tone="bad" icon={BarChart3} onClick={() => void navigate({to:"/rentabilidade"})}/>
      <Kpi label="Clientes ativos" value="128" change="▲ 4 novos este mês" icon={Users} onClick={() => void navigate({to:"/clientes"})}/>
      <Kpi label="Churn 90d" value="2,3%" change="4 clientes em risco" tone="warn" icon={TrendingDown} onClick={() => void navigate({to:"/clientes", search:{filtro:"risco"} as never})}/>
      <Kpi label="NPS" value="58" change="▬ estável" tone="warn" icon={HeartPulse}/>
      <Kpi label="Tarefas atrasadas" value={String(totals.lateTasks)} change="▼ 18% vs. semana" icon={Clock3} onClick={() => void navigate({to:"/tarefas", search:{filtro:"atrasadas"} as never})}/>
      <Kpi label="Inadimplência" value="R$ 18.700" change="▲ 6 contas vencidas" tone="bad" icon={AlertTriangle} onClick={() => void navigate({to:"/financeiro"})}/>
    </section>
    <section className="mt-4 grid gap-4 xl:grid-cols-5">
      <Glass className="p-5 xl:col-span-3"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">3 problemas críticos</h2><Badge tone="bad">Crítico</Badge></div><div className="space-y-2.5">{critical.map((a) => <button key={a.id} onClick={() => void navigate({to:a.link as "/pessoas"})} className="glass-soft flex w-full items-start gap-3 rounded-xl p-3 text-left hover:border-bad/40"><StatusDot tone="bad"/><div className="min-w-0 flex-1"><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.detail}</p></div><ChevronRight className="size-4 shrink-0 text-muted-foreground"/></button>)}</div></Glass>
      <Glass className="p-5 xl:col-span-2"><div className="mb-3 flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-brand to-accent text-brand-foreground"><Sparkles className="size-4"/></span><h2 className="font-display text-lg font-semibold">O que fazer hoje</h2></div><p className="mb-3 text-xs text-muted-foreground">Priorizado pela IA com base nos dados da operação.</p><div className="space-y-2">{[
        ["Redistribuir 8 tarefas do Fiscal.","Redistribuir"],["Contatar a Vetta Alimentos (risco).","Agendar"],["Revisar preço de 5 clientes.","Calcular"]
      ].map(([x,a],i)=><div key={x} className="glass-soft rounded-xl p-3"><p className="text-sm font-medium">{i+1} · {x}</p><div className="mt-2 flex flex-wrap gap-1.5"><Button size="sm" className="h-7 bg-brand text-brand-foreground" onClick={()=>toast.success("Ação preparada. Confirme para executar.")}>{a}</Button><Button size="sm" variant="secondary" className="h-7" onClick={()=>toast("Automação sugerida salva.")}>Automatizar</Button><Button size="sm" variant="ghost" className="h-7" onClick={()=>toast("Item ignorado por hoje.")}>Ignorar</Button></div></div>)}</div></Glass>
    </section>
    <section className="mt-4 grid gap-4 xl:grid-cols-3">
      <Glass className="p-5 xl:col-span-2"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Capacidade da equipe</h2><Link to="/pessoas" className="text-xs font-semibold text-brand">Ver equipe →</Link></div><div className="space-y-4">{employees.slice(0,3).map((e)=><div key={e.id}><div className="mb-1.5 flex justify-between text-sm"><span>{e.name} · {e.department}</span><span className={cn("font-semibold",e.allocated/e.capacity>1?"text-bad":e.allocated/e.capacity<.8?"text-warn":"text-foreground")}>{Math.round(e.allocated/e.capacity*100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full",e.allocated/e.capacity>1?"bg-bad":e.allocated/e.capacity<.8?"bg-warn":"bg-brand")} style={{width:`${Math.min(100,e.allocated/e.capacity*100)}%`}}/></div></div>)}</div><div className="mt-5 grid grid-cols-3 border-t border-glass-line pt-4 text-center"><div><p className="text-[10px] uppercase text-muted-foreground">Demanda</p><p className="font-display text-lg font-semibold">720h</p></div><div><p className="text-[10px] uppercase text-muted-foreground">Capacidade</p><p className="font-display text-lg font-semibold">650h</p></div><div><p className="text-[10px] uppercase text-muted-foreground">Déficit</p><p className="font-display text-lg font-semibold text-bad">70h</p></div></div></Glass>
      <Glass className="p-5"><h2 className="font-display text-lg font-semibold">Receita · 6 meses</h2><div className="mt-4 h-40"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyRevenue}><Tooltip formatter={(v)=>brl(Number(v))}/><Bar dataKey="receita" fill="var(--color-brand)" radius={[5,5,0,0]}/><XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11}/></BarChart></ResponsiveContainer></div><div className="mt-3 flex flex-wrap gap-1.5"><Badge tone="good">Receita +8%</Badge><Badge tone="bad">Margem −2 p.p.</Badge><Badge tone="warn">Retrabalho +12%</Badge></div></Glass>
    </section>
    <CustomerPreview />
    <Glass className="relative mt-4 overflow-hidden p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-brand-foreground"><Sparkles/></span><div><h2 className="font-display text-lg font-semibold">Ask AI</h2><p className="text-xs text-muted-foreground">Seu copiloto responde somente com os dados disponíveis.</p></div></div><div className="flex flex-1 flex-wrap gap-2">{["Como está meu escritório?","Quais clientes estão em risco?","Quem está sobrecarregado?","Por que minha margem caiu?"].map(q=><Button key={q} variant="outline" size="sm" className="glass-soft rounded-full" onClick={openAI}>{q}</Button>)}</div></div><div className="glass-soft mt-4 rounded-xl p-4 text-sm"><p>Sua margem caiu 2 p.p. porque o retrabalho no Fiscal subiu 12% e 2 clientes estão deficitários. Recomendo redistribuir 8 tarefas e revisar preços.</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={()=>void navigate({to:"/inteligencia"})}>Ver plano</Button><Button size="sm" variant="outline" onClick={()=>toast.success("Plano salvo para aprovação.")}>Salvar recomendação</Button></div></div></Glass>
  </>;
}

function CustomerPreview(){const c=clients[1] ?? clients[0]; if(!c)return null; return <Glass className="mt-4 p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-brand/10 font-display font-bold text-brand">{c.name[0]}</div><div><h2 className="font-display text-lg font-semibold">{c.name}</h2><p className="text-xs text-muted-foreground">CNPJ {c.cnpj} · {c.regime} · {c.headcount} funcionários</p></div></div><Badge tone={healthTone(c.health)}>{c.health}/100 · {c.health>=75?'Saudável':c.health>=55?'Atenção':'Risco'}</Badge></div><div className="grid gap-3 md:grid-cols-3"><div className="glass-soft rounded-xl p-4"><p className="text-xs uppercase text-muted-foreground">Rentabilidade</p><p className="mt-1 font-display text-xl font-semibold">{brl(c.fee)}/mês</p><p className={cn("text-xs font-semibold",clientMargin(c)>35?"text-good":"text-bad")}>Margem {clientMargin(c)}%</p></div><div className="glass-soft rounded-xl p-4"><p className="text-xs uppercase text-muted-foreground">Serviços</p><div className="mt-2 flex flex-wrap gap-1">{c.services.map(s=><Badge key={s} tone="brand">{s}</Badge>)}</div></div><div className="rounded-xl border border-accent/20 bg-accent/5 p-4"><p className="text-xs font-semibold uppercase text-accent">Revenue Intelligence</p><p className="mt-1 text-sm">Não utiliza BPO financeiro.</p><p className="text-xs text-muted-foreground">Potencial estimado: R$ 1.800/mês</p><Button size="sm" className="mt-2 h-7 bg-accent text-accent-foreground" onClick={()=>toast.success("Oportunidade criada no CRM.")}>Criar oportunidade</Button></div></div></Glass>}
