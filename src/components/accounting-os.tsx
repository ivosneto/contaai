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

function ClientsPage(){
 const navigate=useNavigate(); const [q,setQ]=useState(""); const [filter,setFilter]=useState("Todos");
 const list=clients.filter(c=>(filter==="Todos"||filter==="Em risco"&&c.health<55||filter===c.status||filter==="Alta rentabilidade"&&clientMargin(c)>=50||filter==="Baixa rentabilidade"&&clientMargin(c)<35)&&c.name.toLowerCase().includes(q.toLowerCase()));
 return <><PageHeader title="Clientes" description="CRM contábil com saúde, rentabilidade, serviços e relacionamento em uma única visão." action={<Button className="rounded-xl"><Plus/> Novo cliente</Button>}/><Glass className="p-4"><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input value={q} onChange={e=>setQ(e.target.value)} className="pl-9" placeholder="Buscar por empresa, CNPJ ou responsável…"/></div><div className="flex flex-wrap gap-2">{["Todos","Ativo","Em onboarding","Em risco","Inadimplente","Alta rentabilidade","Baixa rentabilidade"].map(f=><Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f}</Button>)}</div></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-glass-line text-[11px] uppercase text-muted-foreground"><th className="px-3 py-3">Cliente</th><th>Regime</th><th>Serviços</th><th>Honorário</th><th>Margem</th><th>NPS</th><th>Health Score</th><th>Status</th></tr></thead><tbody>{list.map(c=><tr key={c.id} onClick={()=>void navigate({to:"/clientes/$clientId",params:{clientId:c.id}})} className="cursor-pointer border-b border-glass-line/60 hover:bg-glass"><td className="px-3 py-3"><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.cnpj} · {c.owner}</p></td><td>{c.regime}</td><td><div className="flex gap-1">{c.services.slice(0,3).map(s=><Badge key={s} tone="brand">{s}</Badge>)}</div></td><td className="font-medium">{brl(c.fee)}</td><td className={clientMargin(c)<0?"font-semibold text-bad":clientMargin(c)<35?"font-semibold text-warn":"font-semibold text-good"}>{clientMargin(c)}%</td><td>{c.nps??"—"}</td><td><Badge tone={healthTone(c.health)}>{c.health}/100</Badge></td><td><Badge tone={c.status==="Em risco"?"bad":c.status==="Inadimplente"?"warn":"neutral"}>{c.status}</Badge></td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-muted-foreground">{list.length} de {clients.length} clientes demonstrativos</p></Glass></>;
}

function Customer360({clientId}:{clientId:string}){
 const c=clientById(clientId)??clients[0]; if(!c)return null; const events=timeline.filter(e=>e.clientId===c.id); const cTasks=tasks.filter(t=>t.clientId===c.id).slice(0,6); const cProcesses=processes.filter(p=>p.clientId===c.id).slice(0,4); const scoreReasons=[c.complaints30d?`${c.complaints30d} reclamações nos últimos 30 dias`:"Sem reclamações recentes",c.lateTasks?`${c.lateTasks} tarefas atrasadas`:"Entregas dentro do prazo",c.overdue?`${brl(c.overdue)} em aberto`:"Financeiro em dia",clientMargin(c)<35?"Rentabilidade abaixo da meta":"Rentabilidade saudável"];
 return <><PageHeader eyebrow="Customer 360" title={c.name} description={`${c.cnpj} · ${c.segment} · ${c.regime}`} action={<div className="flex gap-2"><Badge tone={healthTone(c.health)}>Health Score {c.health}/100</Badge><Button size="sm" variant="outline"><MoreHorizontal/></Button></div>}/><div className="grid gap-4 xl:grid-cols-4"><Kpi label="Honorário" value={brl(c.fee)} change="receita mensal" tone="brand"/><Kpi label="Custo" value={brl(c.cost)} change={`${c.hoursMonth}h/mês`} tone="warn"/><Kpi label="Margem" value={`${clientMargin(c)}%`} change={clientMargin(c)>35?"acima da meta":"reajuste recomendado"} tone={clientMargin(c)>35?"good":"bad"}/><Kpi label="NPS" value={c.nps?String(c.nps):"—"} change={`cliente desde ${c.since.slice(0,4)}`} tone="brand"/></div><Tabs defaultValue="resumo" className="mt-4"><TabsList className="glass-soft h-auto flex-wrap justify-start p-1"><TabsTrigger value="resumo">Resumo</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger><TabsTrigger value="processos">Processos</TabsTrigger><TabsTrigger value="financeiro">Financeiro</TabsTrigger><TabsTrigger value="notas">Notas internas</TabsTrigger></TabsList><TabsContent value="resumo"><div className="grid gap-4 xl:grid-cols-3"><Glass className="p-5 xl:col-span-2"><h2 className="font-display text-lg font-semibold">Saúde do relacionamento</h2><p className="mt-1 text-sm text-muted-foreground">A IA explica o score usando somente os registros associados ao cliente.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{scoreReasons.map((r,i)=><div key={r} className="glass-soft flex items-center gap-3 rounded-xl p-3"><StatusDot tone={i===0&&c.complaints30d?"bad":i===2&&c.overdue?"warn":"good"}/><span className="text-sm">{r}</span></div>)}</div><div className="mt-4 rounded-xl bg-brand/10 p-4"><p className="text-sm font-semibold text-brand">Recomendação</p><p className="mt-1 text-sm">{c.health<65?"Agendar reunião de relacionamento e criar plano de recuperação.":"Manter cadência de relacionamento e avaliar oportunidade de expansão."}</p><Button className="mt-3" size="sm" onClick={()=>toast.success("Reunião adicionada à agenda.")}>Agendar reunião</Button></div></Glass><Glass className="p-5"><h2 className="font-display text-lg font-semibold">Serviços contratados</h2><div className="mt-3 space-y-2">{["Contábil","Fiscal","Pessoal","BPO","Societário","Consultoria"].map(s=><div key={s} className="flex items-center justify-between rounded-lg bg-glass p-2.5 text-sm"><span>{s}</span>{c.services.includes(s as never)?<Badge tone="good">Ativo</Badge>:<Button size="sm" variant="ghost" className="h-7 text-accent">Oportunidade</Button>}</div>)}</div></Glass></div></TabsContent><TabsContent value="timeline"><TimelineList events={events}/></TabsContent><TabsContent value="processos"><Glass className="p-5"><DataList items={cProcesses.map(p=>({title:p.name,sub:`${p.progress}% concluído · ${p.rework}% retrabalho`,badge:p.slaOk?"Dentro do SLA":"Risco de atraso",tone:p.slaOk?"good":"bad"}))}/></Glass></TabsContent><TabsContent value="financeiro"><Glass className="p-5"><h2 className="font-display text-lg font-semibold">Financeiro do cliente</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><MiniStat label="Receita" value={brl(c.fee)}/><MiniStat label="Custo" value={brl(c.cost)}/><MiniStat label="Em aberto" value={brl(c.overdue)}/></div></Glass></TabsContent><TabsContent value="notas"><Glass className="p-5"><Textarea placeholder="Registre uma nota interna sobre este cliente…"/><Button className="mt-3" onClick={()=>toast.success("Nota interna salva.")}>Salvar nota</Button></Glass></TabsContent></Tabs><Glass className="mt-4 p-5"><h2 className="font-display text-lg font-semibold">Pendências</h2><div className="mt-3"><DataList items={cTasks.map(t=>({title:t.title,sub:`${t.assignee} · ${t.due}`,badge:t.priority,tone:t.late?"bad":"neutral"}))}/></div></Glass></>;
}

function TimelineList({events}:{events:typeof timeline}){return <Glass className="p-5"><div className="relative ml-3 border-l border-brand/20 pl-6">{events.map(e=><div key={e.id} className="relative pb-6 last:pb-0"><span className="absolute -left-[29px] top-1 size-2 rounded-full bg-brand ring-4 ring-background"/><p className="text-xs text-muted-foreground">{new Date(`${e.date}T12:00:00`).toLocaleDateString("pt-BR")}</p><p className="mt-1 text-sm font-semibold">{e.title}</p><p className="text-sm text-muted-foreground">{e.detail}</p></div>)}</div></Glass>}

function CommercialPage(){const stages=["Lead","Diagnóstico","Proposta","Negociação","Fechado","Perdido","Onboarding"] as const; const pipe=opportunities.filter(o=>!["Fechado","Perdido","Onboarding"].includes(o.stage)).reduce((s,o)=>s+o.mrr,0); return <><PageHeader title="CRM Contábil" description="Do primeiro contato ao onboarding, com pipeline ponderado e próximas ações." action={<Button><Plus/> Nova oportunidade</Button>}/><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Kpi label="Pipeline total" value={brl(pipe)} change="MRR potencial" tone="brand"/><Kpi label="Pipeline ponderado" value={brl(Math.round(opportunities.reduce((s,o)=>s+o.mrr*o.probability/100,0)))} change="probabilidade aplicada"/><Kpi label="Conversão" value="34%" change="▲ 4 p.p. no mês"/><Kpi label="Ciclo médio" value="23 dias" change="▼ 3 dias"/></div><div className="mt-4 flex gap-3 overflow-x-auto pb-3">{stages.map(stage=><div key={stage} className="glass-panel w-64 shrink-0 rounded-2xl p-3"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">{stage}</h3><Badge>{opportunities.filter(o=>o.stage===stage).length}</Badge></div><div className="space-y-2">{opportunities.filter(o=>o.stage===stage).slice(0,5).map(o=><div key={o.id} className="glass-soft rounded-xl p-3"><p className="text-sm font-semibold">{o.company}</p><p className="mt-1 text-xs text-muted-foreground">{o.services.slice(0,2).join(" + ")}</p><div className="mt-3 flex items-center justify-between"><span className="text-xs font-semibold text-brand">{brl(o.mrr)}/mês</span><span className="text-[10px] text-muted-foreground">{o.probability}%</span></div></div>)}</div></div>)}</div></>}

function ProcessesPage(){const [filter,setFilter]=useState("Todos"); const list=processes.filter(p=>filter==="Todos"||filter==="Em risco"&&!p.slaOk||filter===p.department); return <><PageHeader title="Processos" description="Execução recorrente, SLA e inteligência sobre gargalos e retrabalho." action={<Button><Plus/> Novo processo</Button>}/><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Kpi label="Processos ativos" value="50" change="38 no fechamento" tone="brand"/><Kpi label="SLA" value="94%" change="▲ 1 p.p."/><Kpi label="Em risco" value="6" change="exigem atenção" tone="warn"/><Kpi label="Retrabalho" value="6%" change="▲ 12% no Fiscal" tone="bad"/></div><Glass className="mt-4 p-4"><div className="mb-4 flex flex-wrap gap-2">{["Todos","Em risco","Fiscal","Contábil","Pessoal","Societário"].map(f=><Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f}</Button>)}</div><div className="space-y-3">{list.slice(0,20).map(p=><details key={p.id} className="glass-soft rounded-xl p-4"><summary className="flex cursor-pointer list-none items-center gap-3"><div className="min-w-0 flex-1"><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.department} · ciclo médio {p.cycleDays} dias · retrabalho {p.rework}%</p></div><div className="w-24"><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{width:`${p.progress}%`}}/></div><p className="mt-1 text-right text-[10px]">{p.progress}%</p></div><Badge tone={p.slaOk?"good":"bad"}>{p.slaOk?"No SLA":"Em risco"}</Badge></summary><div className="mt-4 grid gap-2 border-t border-glass-line pt-4 md:grid-cols-4">{p.steps.map((s,i)=><div key={s.name} className="rounded-lg bg-glass p-3"><p className="text-xs font-semibold">{i+1}. {s.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{s.owner}</p><Badge tone={s.status==="Atrasada"?"bad":s.status==="Concluída"?"good":"neutral"}>{s.status}</Badge></div>)}</div></details>)}</div></Glass></>}

function TasksPage(){const [filter,setFilter]=useState("Todas"); const list=tasks.filter(t=>filter==="Todas"||filter==="Atrasadas"&&t.late||filter===t.status||filter===t.department); return <><PageHeader title="Tarefas" description="Prioridades, responsáveis e contexto do cliente sem depender de planilhas." action={<Button><Plus/> Nova tarefa</Button>}/><Glass className="p-4"><div className="mb-4 flex flex-wrap gap-2">{["Todas","Atrasadas","A fazer","Em andamento","Em revisão","Fiscal","Contábil","Pessoal"].map(f=><Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f}</Button>)}</div><div className="space-y-2">{list.slice(0,30).map(t=><div key={t.id} className="glass-soft flex flex-wrap items-center gap-3 rounded-xl p-3"><button className="grid size-6 place-items-center rounded-full border border-input" onClick={()=>toast.success("Tarefa concluída.")}><CheckCircle2 className="size-4 text-muted-foreground"/></button><div className="min-w-[240px] flex-1"><p className="text-sm font-semibold">{t.title}</p><p className="text-xs text-muted-foreground">{t.assignee} · vence {new Date(`${t.due}T12:00`).toLocaleDateString("pt-BR")}</p></div><Badge tone={t.late?"bad":t.priority==="Alta"?"warn":"neutral"}>{t.late?"Atrasada":t.priority}</Badge><Badge tone="brand">{t.department}</Badge><span className="text-xs text-muted-foreground">{t.hours}h</span></div>)}</div></Glass></>}

function PeoplePage(){const top=[...employees].sort((a,b)=>b.allocated/b.capacity-a.allocated/a.capacity); return <><PageHeader title="Pessoas & Capacidade" description="Carga, disponibilidade, produtividade, SLA e previsão por departamento." action={<Button asChild><Link to="/simulador"><Calculator/> Simular cenário</Link></Button>}/><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Kpi label="Pessoas" value="15" change="6 departamentos" tone="brand"/><Kpi label="Ocupação média" value={`${utilization}%`} change="próximo do limite" tone="warn"/><Kpi label="Demanda prevista" value="720h" change="próxima semana" tone="brand"/><Kpi label="Déficit previsto" value="70h" change="risco elevado" tone="bad"/></div><div className="mt-4 grid gap-4 xl:grid-cols-3"><Glass className="p-5 xl:col-span-2"><h2 className="font-display text-lg font-semibold">Capacidade individual</h2><div className="mt-4 space-y-3">{top.map(e=>{const u=Math.round(e.allocated/e.capacity*100);return <div key={e.id} className="glass-soft rounded-xl p-3"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">{e.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{e.name}</p><p className="text-[11px] text-muted-foreground">{e.role} · {e.allocated}h / {e.capacity}h</p></div><span className={cn("font-display text-lg font-semibold",u>100?"text-bad":u<80?"text-warn":"text-foreground")}>{u}%</span></div><div className="mt-2 h-1.5 rounded-full bg-muted"><div className={cn("h-full rounded-full",u>100?"bg-bad":u<80?"bg-warn":"bg-brand")} style={{width:`${Math.min(100,u)}%`}}/></div></div>})}</div></Glass><Glass className="p-5"><h2 className="font-display text-lg font-semibold">Por departamento</h2><div className="mt-4 space-y-3">{departmentLoad.map(d=><div key={d.department} className="rounded-xl bg-glass p-3"><div className="flex justify-between"><span className="text-sm font-medium">{d.department}</span><span className={cn("text-sm font-semibold",d.utilization>100?"text-bad":d.utilization<75?"text-warn":"text-good")}>{d.utilization}%</span></div><p className="mt-1 text-[11px] text-muted-foreground">{d.people} pessoas · {d.allocated}h alocadas</p></div>)}</div><div className="mt-4 rounded-xl bg-bad/10 p-4"><p className="text-sm font-semibold text-bad">Previsão da IA</p><p className="mt-1 text-xs">Risco elevado de atraso no Fiscal. Redistribuir 40h e terceirizar 30h.</p><Button size="sm" className="mt-3" onClick={()=>toast.success("Plano enviado para aprovação.")}>Preparar plano</Button></div></Glass></div></>}

function ProfitabilityPage(){const ranked=[...clients].sort((a,b)=>clientMargin(b)-clientMargin(a)); return <><PageHeader title="Rentabilidade por Cliente" description="Receita, esforço, custos e recomendações de reajuste por cliente." action={<Button><Calculator/> Pricing Engine</Button>}/><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Kpi label="Receita da carteira" value="R$ 480 mil" change="MRR atual" tone="brand"/><Kpi label="Margem média" value={`${margin}%`} change="meta 35%" tone="bad"/><Kpi label="Clientes deficitários" value={String(clients.filter(c=>clientMargin(c)<0).length)} change="exigem reajuste" tone="bad"/><Kpi label="Receita recuperável" value="R$ 3.210" change="por mês"/></div><Glass className="mt-4 p-4"><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead><tr className="border-b border-glass-line text-[11px] uppercase text-muted-foreground"><th className="p-3">Cliente</th><th>Receita</th><th>Custo</th><th>Horas</th><th>Resultado</th><th>Margem</th><th>Recomendação</th></tr></thead><tbody>{ranked.map(c=>{const m=clientMargin(c);const deficit=m<35;return <tr key={c.id} className="border-b border-glass-line/60"><td className="p-3 font-semibold"><Link to="/clientes/$clientId" params={{clientId:c.id}}>{c.name}</Link></td><td>{brl(c.fee)}</td><td>{brl(c.cost)}</td><td>{c.hoursMonth}h</td><td className={c.fee-c.cost<0?"text-bad":"text-good"}>{brl(c.fee-c.cost)}</td><td><Badge tone={m<0?"bad":m<35?"warn":"good"}>{m}%</Badge></td><td>{deficit?<Button size="sm" variant="outline" onClick={()=>toast(`Preço recomendado: ${brl(Math.round(c.cost/.48))}/mês`)}>Calcular reajuste</Button>:<span className="text-xs text-muted-foreground">Preço saudável</span>}</td></tr>})}</tbody></table></div></Glass></>}

function IntelligencePage(){const [kind,setKind]=useState("Problema"); const items=insights.filter(i=>i.kind===kind); return <><PageHeader eyebrow="DADOS → INTELIGÊNCIA → AÇÃO" title="Intelligence Center" description="Problemas, oportunidades e previsões priorizados pelo impacto na operação." action={<Badge tone="accent"><Sparkles className="mr-1 size-3"/> 6 agentes monitorando</Badge>}/><div className="mb-4 flex gap-2">{["Problema","Oportunidade","Previsão"].map(k=><Button key={k} variant={kind===k?"default":"outline"} onClick={()=>setKind(k)}>{k}s <Badge tone={kind===k?"brand":"neutral"}>{insights.filter(i=>i.kind===k).length}</Badge></Button>)}</div><div className="grid gap-4 lg:grid-cols-2">{items.map(i=><Glass key={i.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><Badge tone={i.kind==="Problema"?"bad":i.kind==="Oportunidade"?"good":"brand"}>{i.kind}</Badge><h2 className="mt-3 font-display text-lg font-semibold">{i.title}</h2></div><Lightbulb className="size-5 text-brand"/></div><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-xs font-semibold uppercase text-muted-foreground">Impacto</dt><dd className="mt-1">{i.impact}</dd></div><div><dt className="text-xs font-semibold uppercase text-muted-foreground">Causa provável</dt><dd className="mt-1">{i.cause}</dd></div><div className="rounded-xl bg-brand/10 p-3"><dt className="text-xs font-semibold uppercase text-brand">Recomendação</dt><dd className="mt-1">{i.recommendation}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2">{i.actions.map((a,j)=><Button key={a} size="sm" variant={j===0?"default":"outline"} onClick={()=>toast.success(`${a}: ação preparada para aprovação.`)}>{a}</Button>)}<Button size="sm" variant="ghost">Ignorar</Button></div></Glass>)}</div><h2 className="mb-3 mt-7 font-display text-xl font-semibold">Agentes de IA</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{agents.map(a=><Glass key={a.id} className="p-4"><div className="flex items-start gap-3"><div className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent"><Bot className="size-4"/></div><div className="min-w-0 flex-1"><p className="font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.scope}</p></div></div><div className="mt-4 flex items-center justify-between"><Badge tone={a.status==="Ativo"?"good":"warn"}>{a.status}</Badge><span className="text-[11px] text-muted-foreground">{a.findings} achados · {a.lastRun}</span></div></Glass>)}</div></>}

function FinancePage(){return <><PageHeader title="Financeiro" description="Receita recorrente, recebimentos, inadimplência, expansão e contração." action={<Button><FileText/> Gerar relatório</Button>}/><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Kpi label="MRR" value="R$ 480.000" change="▲ 8% no trimestre"/><Kpi label="Recebido no mês" value="R$ 463.640" change="96,6% realizado"/><Kpi label="Inadimplência" value="R$ 18.700" change="6 contas vencidas" tone="bad"/><Kpi label="Ticket médio" value="R$ 3.750" change="▲ R$ 180"/></div><div className="mt-4 grid gap-4 xl:grid-cols-3"><Glass className="p-5 xl:col-span-2"><h2 className="font-display text-lg font-semibold">Movimento da receita</h2><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyRevenue}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/><XAxis dataKey="month"/><YAxis tickFormatter={v=>`${Math.round(v/1000)}k`}/><Tooltip formatter={(v)=>brl(Number(v))}/><Line type="monotone" dataKey="receita" stroke="var(--color-brand)" strokeWidth={3} dot={{fill:"var(--color-brand)"}}/></LineChart></ResponsiveContainer></div></Glass><Glass className="p-5"><h2 className="font-display text-lg font-semibold">Movimentação do MRR</h2><DataList items={[{title:"Novos clientes",sub:"+ R$ 14.800",badge:"+4",tone:"good"},{title:"Expansão",sub:"+ R$ 8.400",badge:"upsell",tone:"good"},{title:"Reajustes",sub:"+ R$ 6.300",badge:"12 clientes",tone:"brand"},{title:"Churn",sub:"− R$ 4.200",badge:"2 clientes",tone:"bad"},{title:"Downgrade",sub:"− R$ 1.800",badge:"1 cliente",tone:"warn"}]}/></Glass></div><Glass className="mt-4 p-5"><h2 className="font-display text-lg font-semibold">Contas vencidas</h2><div className="mt-3"><DataList items={clients.filter(c=>c.overdue).map(c=>({title:c.name,sub:`Vencido · responsável ${c.owner}`,badge:brl(c.overdue),tone:"bad"}))}/></div></Glass></>}

function AutomationPage(){return <><PageHeader title="Automação" description="Construa fluxos WHEN → IF → THEN com aprovação humana para ações críticas." action={<Button><Plus/> Nova automação</Button>}/><div className="grid gap-4 lg:grid-cols-2">{automations.map(w=><Glass key={w.id} className="p-5"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><Zap className="size-4 text-brand"/><h2 className="font-display text-lg font-semibold">{w.name}</h2></div><p className="mt-1 text-xs text-muted-foreground">{w.runs} execuções</p></div><Switch checked={w.active} onCheckedChange={()=>toast.success(w.active?"Automação pausada.":"Automação ativada.")}/></div><div className="mt-4 rounded-xl bg-brand/10 p-3"><p className="text-[10px] font-semibold uppercase text-brand">When</p><p className="mt-1 text-sm font-medium">{w.when}</p></div><div className="mt-3 space-y-2">{w.rules.map((r,i)=><div key={r.if} className="glass-soft grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2 rounded-xl p-3 text-xs"><Badge tone="warn">IF</Badge><span>{r.if}</span><ArrowRight className="size-3"/><span className="font-medium">{r.then}</span></div>)}</div></Glass>)}</div></>}

function KnowledgePage(){const [q,setQ]=useState(""); const list=knowledgeArticles.filter(x=>(x.title+x.category).toLowerCase().includes(q.toLowerCase())); return <><PageHeader title="Conhecimento" description="Processos, procedimentos, decisões e memória empresarial com controle de acesso." action={<Button><Plus/> Novo artigo</Button>}/><Glass className="p-5"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input className="h-11 pl-9" value={q} onChange={e=>setQ(e.target.value)} placeholder="Pergunte: como fazemos o fechamento fiscal?"/></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map(k=><article key={k.id} className="glass-soft rounded-xl p-4"><Badge tone="brand">{k.category}</Badge><h2 className="mt-3 font-semibold">{k.title}</h2><p className="mt-1 text-sm text-muted-foreground">{k.summary}</p><Button variant="ghost" size="sm" className="mt-3 px-0 text-brand">Abrir <ArrowRight/></Button></article>)}</div></Glass></>}

function BenchmarkingPage(){const metrics=[{name:"Clientes por funcionário",yours:8.5,market:10.2,unit:""},{name:"Receita por funcionário",yours:32,market:38,unit:" mil"},{name:"Margem",yours:27,market:34,unit:"%"},{name:"Ticket médio",yours:3.75,market:3.4,unit:" mil"},{name:"Produtividade",yours:78,market:84,unit:"%"},{name:"Churn",yours:2.3,market:2.8,unit:"%"}];return <><PageHeader title="Benchmarking" description="Comparação anonimizada com escritórios de porte e perfil semelhantes." action={<Badge tone="good"><ShieldCheck className="mr-1 size-3"/> Dados agregados</Badge>}/><Glass className="p-5"><div className="mb-5 rounded-xl bg-brand/10 p-4"><p className="font-display text-xl font-semibold">Você está no percentil 32 de produtividade.</p><p className="mt-1 text-sm text-muted-foreground">Escritórios semelhantes têm margem média de 34%. Sua margem é 27,4%.</p></div><div className="grid gap-3 md:grid-cols-2">{metrics.map(m=><div key={m.name} className="glass-soft rounded-xl p-4"><div className="flex justify-between"><span className="text-sm font-medium">{m.name}</span><Badge tone={(m.name==="Churn"?m.yours<m.market:m.yours>m.market)?"good":"warn"}>{m.name==="Churn"?m.yours<m.market?"Melhor":"Abaixo":m.yours>m.market?"Melhor":"Abaixo"}</Badge></div><div className="mt-3 grid grid-cols-2 gap-4"><div><p className="text-[10px] uppercase text-muted-foreground">Seu escritório</p><p className="font-display text-2xl font-semibold">{m.yours}{m.unit}</p></div><div><p className="text-[10px] uppercase text-muted-foreground">Mercado</p><p className="font-display text-2xl font-semibold text-muted-foreground">{m.market}{m.unit}</p></div></div></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Nenhum dado individual de outro escritório é exibido. Amostra demonstrativa para o protótipo.</p></Glass></>}
