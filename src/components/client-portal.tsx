import { useState } from "react";
import {
  Calendar,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Gauge,
  Megaphone,
  MessageSquare,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Badge, Glass, Kpi, PageHeader } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ContaAILogo } from "@/components/brand/logo";
import { useOfficeStore, type NewDocumentInput } from "@/data/store";
import {
  accountsPaid,
  accountsReceivable,
  announcements,
  brl,
  clientById,
  meetings,
  type Communication,
  type CommunicationStatus,
  type DocumentStatus,
  type DocumentType,
  type Obligation,
  type ObligationStatus,
  type Pendency,
  type PendencyPriority,
} from "@/data/office";
import { buildObligationCalendar, OBLIGATIONS_DEMO_DISCLAIMER } from "@/lib/obligations-engine";
import { DOCUMENT_DEFAULT_CATEGORY } from "@/lib/documents-engine";
import {
  computeClientMessages,
  computeClientPendingItems,
  computeClientRequests,
  computeClientWaitingObligations,
  computePaymentStatus,
  PORTAL_DEMO_DISCLAIMER,
} from "@/lib/client-portal-engine";

/**
 * Login simulado — protótipo sem autenticação real. Em produção, isso viria
 * da sessão autenticada do cliente, nunca de uma constante fixa.
 */
const PORTAL_CLIENT_ID = "c1";

const DOCUMENT_TYPES: DocumentType[] = ["Nota fiscal", "Extrato bancário", "Folha de ponto", "Contrato social", "Guia de imposto", "Relatório gerencial"];

function documentStatusTone(status: DocumentStatus): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (status === "Aprovado") return "good";
  if (status === "Vencido" || status === "Rejeitado") return "bad";
  if (status === "Pendente" || status === "Processando") return "warn";
  return "neutral";
}

function obligationStatusTone(status: ObligationStatus): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (status === "Concluída") return "good";
  if (status === "Atrasada") return "bad";
  if (status === "Aguardando cliente") return "warn";
  return "neutral";
}

function priorityTone(priority: PendencyPriority): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (priority === "Crítica") return "bad";
  if (priority === "Alta") return "warn";
  return "brand";
}

function requestStatusTone(status: CommunicationStatus): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (status === "Resolvida" || status === "Respondida") return "good";
  if (status === "Aguardando cliente") return "warn";
  return "brand";
}

export function ClientPortalShell() {
  const client = clientById(PORTAL_CLIENT_ID);
  if (!client) return null;

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="sticky top-0 z-30 border-b border-glass-line/60 bg-background/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <ContaAILogo variant="horizontal" size={30} />
          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{client.name}</p>
              <p className="text-[11px] text-muted-foreground">Portal do Cliente</p>
            </div>
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand/20 to-accent/20 text-sm font-semibold text-brand">
              {client.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        <ClientPortalContent clientId={client.id} />
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-10 pt-2 sm:px-6">
        <p className="text-center text-[11px] text-muted-foreground">{PORTAL_DEMO_DISCLAIMER}</p>
      </footer>
    </div>
  );
}

function ClientPortalContent({ clientId }: { clientId: string }) {
  const { documents, obligations, pendencies, communications, uploadDocument, createClientMessage, completePendency } = useOfficeStore();
  const client = clientById(clientId);
  const [tab, setTab] = useState("inicio");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadContext, setUploadContext] = useState<{ pendencyId: string } | null>(null);
  const [uploadForm, setUploadForm] = useState<NewDocumentInput>({ clientId, type: "Nota fiscal", category: DOCUMENT_DEFAULT_CATEGORY["Nota fiscal"], competence: "2026-09", assignee: client?.owner ?? "" });
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [msg, setMsg] = useState("");

  if (!client) return null;

  const cDocuments = documents.filter((d) => d.clientId === clientId);
  const cObligations = obligations.filter((o) => o.clientId === clientId);
  const pendingItems = computeClientPendingItems(pendencies, clientId);
  const waitingObligations = computeClientWaitingObligations(obligations, clientId);
  const doneItems = pendencies.filter((p) => p.clientId === clientId && (p.status === "Concluída" || p.status === "Cancelada"));
  const messages = computeClientMessages(communications, clientId);
  const requests = computeClientRequests(communications, clientId);
  const cReceivable = accountsReceivable.filter((r) => r.clientId === clientId);
  const cPaid = accountsPaid.filter((p) => p.clientId === clientId);
  const cMeetings = meetings.filter((m) => m.clientId === clientId);
  const paymentStatus = computePaymentStatus(cReceivable);
  const calendar = buildObligationCalendar(cObligations);
  const relevantAnnouncements = announcements.filter((a) => a.audience === "Todos os clientes" || a.audience === client.department);
  const upcomingObligations30d = cObligations.filter((o) => o.status !== "Concluída" && o.dueDate >= "2026-09-14" && o.dueDate <= "2026-10-14").length;

  const openUpload = (pendencyId?: string) => {
    setUploadContext(pendencyId ? { pendencyId } : null);
    setUploadForm({ clientId, type: "Nota fiscal", category: DOCUMENT_DEFAULT_CATEGORY["Nota fiscal"], competence: "2026-09", assignee: client.owner });
    setUploadOpen(true);
  };

  const submitUpload = () => {
    uploadDocument(uploadForm);
    if (uploadContext) completePendency(uploadContext.pendencyId);
    setUploadOpen(false);
  };

  const submitReply = (pendencyId: string, title: string) => {
    if (!replyText.trim()) return;
    createClientMessage(clientId, `Sobre "${title}": ${replyText.trim()}`);
    completePendency(pendencyId);
    setReplyTarget(null);
    setReplyText("");
  };

  const sendMessage = () => {
    if (!msg.trim()) return;
    createClientMessage(clientId, msg.trim());
    setMsg("");
  };

  type HeroItem = { id: string; title: string; detail: string; dueDate: string; action: "documento" | "resposta"; pendency?: Pendency };
  const heroItems: HeroItem[] = [
    ...pendingItems.map((p) => ({ id: p.id, title: p.title, detail: p.description, dueDate: p.dueDate, action: p.category === "Documento" ? ("documento" as const) : ("resposta" as const), pendency: p })),
    ...waitingObligations.map((o) => ({ id: `ob-${o.id}`, title: `${o.type} — competência ${o.competence}`, detail: `Aguardando um documento ou confirmação sua para avançar. Vence em ${o.dueDate}.`, dueDate: o.dueDate, action: "documento" as const })),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <>
      <PageHeader
        eyebrow={`Olá, ${client.name.split(" ")[0]}`}
        title="Seu painel com o escritório"
        description="Acompanhe documentos, obrigações e pendências, e fale com a gente quando precisar."
        action={<Badge tone="good"><ShieldCheck className="mr-1 size-3" /> Acesso só aos seus dados</Badge>}
      />

      <Glass className="p-5">
        <h2 className="font-display text-lg font-semibold">O que precisamos de você</h2>
        <p className="mt-1 text-sm text-muted-foreground">Documentos e informações pendentes para não atrasar nenhum prazo.</p>
        {heroItems.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nada pendente da sua parte no momento. 🎉</p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {heroItems.map((item) => (
              <div key={item.id} className="glass-soft rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Prazo: {item.dueDate}</p>
                  </div>
                  {item.action === "documento" ? (
                    <Button size="sm" onClick={() => openUpload(item.pendency?.id)}><Upload /> Enviar documento</Button>
                  ) : (
                    <Button size="sm" variant={replyTarget === item.id ? "secondary" : "default"} onClick={() => setReplyTarget(replyTarget === item.id ? null : item.id)}><Send /> Responder</Button>
                  )}
                </div>
                {replyTarget === item.id && item.pendency && (
                  <div className="mt-3 space-y-2">
                    <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escreva sua resposta…" />
                    <Button size="sm" disabled={!replyText.trim()} onClick={() => submitReply(item.pendency!.id, item.title)}>Enviar resposta</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Glass>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList className="glass-soft h-auto flex-wrap justify-start p-1">
          <TabsTrigger value="inicio">Indicadores</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="obrigacoes">Obrigações</TabsTrigger>
          <TabsTrigger value="pendencias">Pendências</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="comunicados">Comunicados</TabsTrigger>
        </TabsList>

        <TabsContent value="inicio">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi label="Honorário mensal" value={brl(client.fee)} change={client.services.join(", ")} tone="brand" icon={CircleDollarSign} />
            <Kpi label="Status de pagamento" value={paymentStatus} change={cReceivable.length > 0 ? `${cReceivable.length} fatura(s) em aberto` : "tudo em dia"} tone={paymentStatus === "Vencido" ? "bad" : paymentStatus === "Pendente" ? "warn" : "good"} icon={CircleDollarSign} />
            <Kpi label="Documentos pendentes" value={String(heroItems.filter((i) => i.action === "documento").length)} change="aguardando envio" tone={heroItems.some((i) => i.action === "documento") ? "warn" : "good"} icon={FileText} />
            <Kpi label="Obrigações em 30 dias" value={String(upcomingObligations30d)} change="a vencer" tone={upcomingObligations30d > 0 ? "warn" : "good"} icon={Gauge} />
          </div>
          <Glass className="mt-4 p-5">
            <h2 className="font-display text-lg font-semibold">Sobre o seu atendimento</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="glass-soft rounded-xl p-4"><p className="text-[10px] uppercase text-muted-foreground">Responsável</p><p className="mt-1 font-semibold">{client.owner}</p></div>
              <div className="glass-soft rounded-xl p-4"><p className="text-[10px] uppercase text-muted-foreground">Cliente desde</p><p className="mt-1 font-semibold">{client.since.slice(0, 4)}</p></div>
              <div className="glass-soft rounded-xl p-4"><p className="text-[10px] uppercase text-muted-foreground">Serviços contratados</p><p className="mt-1 font-semibold">{client.services.length}</p></div>
            </div>
          </Glass>
        </TabsContent>

        <TabsContent value="documentos">
          <Glass className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Seus documentos</h2>
              <Button size="sm" onClick={() => openUpload()}><Upload /> Enviar documento</Button>
            </div>
            {cDocuments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum documento enviado ainda.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {cDocuments.map((d) => (
                  <div key={d.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-xl p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-xs text-muted-foreground">Competência {d.competence} · enviado em {d.uploadedAt} · {d.pipelineStage}</p>
                    </div>
                    <Badge tone={documentStatusTone(d.status)}>{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Glass>
        </TabsContent>

        <TabsContent value="obrigacoes">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{OBLIGATIONS_DEMO_DISCLAIMER}</p>
          <Glass className="p-5">
            <h2 className="font-display text-lg font-semibold">Suas obrigações</h2>
            {cObligations.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma obrigação registrada.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {[...cObligations].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((o: Obligation) => (
                  <div key={o.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-xl p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{o.type} · competência {o.competence}</p>
                      <p className="text-xs text-muted-foreground">Vence em {o.dueDate} · responsável {o.assignee} · checklist {o.checklist.filter((c) => c.done).length}/{o.checklist.length}</p>
                    </div>
                    <Badge tone={obligationStatusTone(o.status)}>{o.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Glass>
        </TabsContent>

        <TabsContent value="pendencias">
          <Glass className="p-5">
            <h2 className="font-display text-lg font-semibold">Pendências abertas</h2>
            {pendingItems.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma pendência aberta.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {pendingItems.map((p) => (
                  <div key={p.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-xl p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{p.title}</p>
                      <p className="text-xs text-muted-foreground">Prazo {p.dueDate} · {p.category}</p>
                    </div>
                    <Badge tone={priorityTone(p.priority)}>{p.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Glass>
          {doneItems.length > 0 && (
            <Glass className="mt-4 p-5">
              <h2 className="font-display text-lg font-semibold">Histórico</h2>
              <div className="mt-3 space-y-2">
                {doneItems.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-glass p-3">
                    <p className="text-sm">{p.title}</p>
                    <Badge tone={p.status === "Concluída" ? "good" : "neutral"}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            </Glass>
          )}
        </TabsContent>

        <TabsContent value="solicitacoes">
          <Glass className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Suas solicitações</h2>
              <Button size="sm" variant="outline" onClick={() => setTab("mensagens")}><MessageSquare /> Nova solicitação</Button>
            </div>
            {requests.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Você ainda não abriu nenhuma solicitação. Use "Mensagens" para falar com a gente.</p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {requests.map((r: Communication) => (
                  <div key={r.id} className="glass-soft rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge tone="brand">{r.classification}</Badge>
                      <Badge tone={requestStatusTone(r.status)}>{r.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm">{r.content}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Enviado em {r.createdAt}</p>
                  </div>
                ))}
              </div>
            )}
          </Glass>
        </TabsContent>

        <TabsContent value="mensagens">
          <Glass className="p-5">
            <h2 className="font-display text-lg font-semibold">Fale com a gente</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sua responsável é {client.owner}.</p>
            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
              {messages.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>}
              {messages.map((m) => (
                <div key={m.id} className={m.direction === "Recebida" ? "ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-brand/10 p-3" : "mr-auto max-w-[85%] rounded-xl rounded-tl-sm bg-glass p-3"}>
                  <p className="text-sm">{m.content}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{m.direction === "Recebida" ? "Você" : m.sender} · {m.createdAt}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Textarea className="min-h-0" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Como podemos ajudar?" />
              <Button onClick={sendMessage} disabled={!msg.trim()}><Send /></Button>
            </div>
          </Glass>
        </TabsContent>

        <TabsContent value="financeiro">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Kpi label="Honorário mensal" value={brl(client.fee)} change="valor contratado" tone="brand" icon={CircleDollarSign} />
            <Kpi label="Status" value={paymentStatus} tone={paymentStatus === "Vencido" ? "bad" : paymentStatus === "Pendente" ? "warn" : "good"} change="pagamento" icon={CircleDollarSign} />
            <Kpi label="Faturas em aberto" value={String(cReceivable.length)} change="aguardando pagamento" tone={cReceivable.length > 0 ? "warn" : "good"} icon={ClipboardList} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Glass className="p-5">
              <h2 className="font-display text-lg font-semibold">Em aberto</h2>
              {cReceivable.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhuma fatura em aberto.</p> : (
                <div className="mt-3 space-y-2">
                  {cReceivable.map((r) => (
                    <div key={r.invoiceId} className="glass-soft flex items-center justify-between rounded-xl p-3">
                      <div><p className="text-sm font-semibold">{brl(r.amount)}</p><p className="text-xs text-muted-foreground">Vence {r.dueDate}</p></div>
                      <Badge tone={r.status === "Vencida" ? "bad" : "warn"}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Glass>
            <Glass className="p-5">
              <h2 className="font-display text-lg font-semibold">Histórico de pagamentos</h2>
              {cPaid.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhum pagamento registrado.</p> : (
                <div className="mt-3 space-y-2">
                  {cPaid.map((p) => (
                    <div key={p.paymentId} className="flex items-center justify-between rounded-xl bg-glass p-3">
                      <div><p className="text-sm font-semibold text-good">{brl(p.amount)}</p><p className="text-xs text-muted-foreground">Pago em {p.paidAt} · {p.method}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </Glass>
          </div>
        </TabsContent>

        <TabsContent value="calendario">
          <Glass className="p-5">
            <h2 className="font-display text-lg font-semibold">Próximos prazos e reuniões</h2>
            {calendar.length === 0 && cMeetings.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nada agendado no momento.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {calendar.map((day) => (
                  <div key={day.date} className="glass-soft rounded-xl p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{day.date}</p>
                    {day.items.map((o) => <p key={o.id} className="mt-1 text-sm">{o.type} · competência {o.competence}</p>)}
                  </div>
                ))}
                {[...cMeetings].sort((a, b) => a.at.localeCompare(b.at)).map((m) => (
                  <div key={m.id} className="glass-soft flex items-center gap-3 rounded-xl p-3">
                    <Calendar className="size-4 text-brand" />
                    <div><p className="text-sm font-semibold">{m.title}</p><p className="text-xs text-muted-foreground">{m.at} · {m.type}</p></div>
                  </div>
                ))}
              </div>
            )}
          </Glass>
        </TabsContent>

        <TabsContent value="comunicados">
          <Glass className="p-5">
            <h2 className="font-display text-lg font-semibold">Comunicados do escritório</h2>
            <div className="mt-3 space-y-3">
              {relevantAnnouncements.map((a) => (
                <div key={a.id} className="glass-soft rounded-xl p-4">
                  <div className="flex items-center gap-2"><Megaphone className="size-4 text-brand" /><p className="font-semibold">{a.title}</p></div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{a.body}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{a.publishedAt}</p>
                </div>
              ))}
            </div>
          </Glass>
        </TabsContent>
      </Tabs>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar documento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo de documento</label>
              <Select value={uploadForm.type} onValueChange={(v) => setUploadForm((f) => ({ ...f, type: v as DocumentType, category: DOCUMENT_DEFAULT_CATEGORY[v as DocumentType] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DOCUMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Competência</label>
              <Input className="mt-1" type="month" value={uploadForm.competence} onChange={(e) => setUploadForm((f) => ({ ...f, competence: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground">Este é um protótipo — o envio simula o recebimento do documento pelo escritório, sem upload de arquivo real.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button>
            <Button onClick={submitUpload}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
