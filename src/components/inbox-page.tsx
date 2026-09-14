import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Inbox as InboxIcon, Search, Sparkles } from "lucide-react";
import { Badge, Glass, Kpi, PageHeader, StatusDot } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useOfficeStore } from "@/data/store";
import { clientById, employees, office, type Communication, type CommunicationChannel, type CommunicationClassification, type CommunicationStatus } from "@/data/office";
import { CLASSIFIER_DEMO_DISCLAIMER, COMMUNICATION_DEMO_DISCLAIMER, generateReplyDraft, REPLY_DRAFT_DISCLAIMER } from "@/lib/communication-engine";

const channels: CommunicationChannel[] = ["E-mail", "WhatsApp", "Mensagem interna", "Portal"];
const categories: CommunicationClassification[] = ["Documento", "Dúvida", "Cobrança", "Solicitação", "Reclamação", "Comercial", "Urgente", "Outros"];
const statuses: CommunicationStatus[] = ["Novo", "Em andamento", "Aguardando cliente", "Respondida", "Resolvida"];

function categoryTone(category: CommunicationClassification): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (category === "Urgente" || category === "Reclamação") return "bad";
  if (category === "Cobrança") return "warn";
  if (category === "Comercial") return "good";
  return "brand";
}

function statusTone(status: CommunicationStatus): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (status === "Novo") return "warn";
  if (status === "Resolvida" || status === "Respondida") return "good";
  if (status === "Aguardando cliente") return "neutral";
  return "brand";
}

function sentimentTone(sentiment: Communication["sentiment"]): "good" | "warn" | "bad" | "brand" {
  return sentiment === "Positivo" ? "good" : sentiment === "Negativo" ? "bad" : "brand";
}

export function InboxPage() {
  const navigate = useNavigate();
  const { communications, createPendency, assignMessage, updateMessageStatus, sendReply, confirmAction } = useOfficeStore();
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState<"Todos" | CommunicationChannel>("Todos");
  const [category, setCategory] = useState<"Todas" | CommunicationClassification>("Todas");
  const [status, setStatus] = useState<"Todos" | CommunicationStatus>("Todos");
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...communications]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((m) => {
        const client = clientById(m.clientId);
        const matches = !query || (client?.name ?? "").toLowerCase().includes(query) || m.subject.toLowerCase().includes(query) || m.sender.toLowerCase().includes(query);
        return matches && (channel === "Todos" || m.channel === channel) && (category === "Todas" || m.classification === category) && (status === "Todos" || m.status === status);
      });
  }, [communications, q, channel, category, status]);

  const requiresActionCount = communications.filter((m) => m.requiresAction).length;
  const urgentCount = communications.filter((m) => m.requiresAction && (m.classification === "Urgente" || m.priority === "Crítica")).length;
  const newCount = communications.filter((m) => m.status === "Novo").length;

  const openReply = (m: Communication) => {
    setReplyOpenId(m.id === replyOpenId ? null : m.id);
    setOpenId(m.id);
  };

  const generateDraft = (m: Communication) => {
    const client = clientById(m.clientId);
    const draft = generateReplyDraft({ recipientName: client?.owner ?? m.sender, subject: m.subject, category: m.classification, officeName: office.name });
    setReplyDrafts((d) => ({ ...d, [m.id]: draft }));
  };

  const confirmSend = (m: Communication) => {
    const content = (replyDrafts[m.id] ?? "").trim();
    if (!content) return;
    confirmAction({
      title: "Enviar resposta",
      description: `Enviar esta resposta para ${m.sender} sobre "${m.subject}"? A mensagem não é enviada sem essa confirmação.`,
      impact: "operacional",
      successMessage: "Resposta enviada.",
      onConfirm: () => {
        sendReply(m.id, content);
        setReplyDrafts((d) => ({ ...d, [m.id]: "" }));
        setReplyOpenId(null);
      },
    });
  };

  const createPendencyFromMessage = (m: Communication) => {
    confirmAction({
      title: "Criar pendência",
      description: m.suggestedAction || m.subject,
      impact: "operacional",
      successMessage: "Pendência criada.",
      onConfirm: () =>
        createPendency({
          clientId: m.clientId,
          category: m.classification === "Cobrança" ? "Financeiro" : m.classification === "Comercial" ? "Comercial" : m.classification === "Documento" ? "Documento" : "Cliente",
          title: m.suggestedAction || m.subject,
          description: m.content,
          assignee: m.assignee,
          priority: m.priority,
          dueDate: "2026-09-20",
        }),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Inbox Unificada"
        title="Comunicação"
        description="E-mail, WhatsApp, mensagens internas e solicitações de clientes em um único lugar, com classificação automática e ação sugerida."
        action={<Badge tone="accent"><Sparkles className="mr-1 size-3" /> {requiresActionCount} exigem ação</Badge>}
      />
      <div className="mb-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{COMMUNICATION_DEMO_DISCLAIMER}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{CLASSIFIER_DEMO_DISCLAIMER}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Mensagens" value={String(communications.length)} change={`${channels.length} canais`} tone="brand" icon={InboxIcon} />
        <Kpi label="Novas" value={String(newCount)} change="ainda não triadas" tone="warn" />
        <Kpi label="Exigem ação" value={String(requiresActionCount)} change="segundo a classificação automática" tone={requiresActionCount > 0 ? "bad" : "good"} />
        <Kpi label="Urgentes" value={String(urgentCount)} change="prioridade crítica" tone={urgentCount > 0 ? "bad" : "good"} />
      </div>

      <Glass className="mt-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Buscar por cliente, assunto ou remetente…" /></div>
          <div className="flex flex-wrap gap-2">
            {(["Todos", ...channels] as const).map((f) => (
              <Button key={f} size="sm" variant={channel === f ? "default" : "outline"} onClick={() => setChannel(f)}>{f}</Button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Categoria</span>
          {(["Todas", ...categories] as const).map((f) => (
            <Button key={f} size="sm" variant={category === f ? "default" : "outline"} onClick={() => setCategory(f)}>{f}</Button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Status</span>
          {(["Todos", ...statuses] as const).map((f) => (
            <Button key={f} size="sm" variant={status === f ? "default" : "outline"} onClick={() => setStatus(f)}>{f}</Button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {list.map((m) => {
            const client = clientById(m.clientId);
            const isOpen = openId === m.id;
            return (
              <div key={m.id} className="glass-soft rounded-xl p-3">
                <button className="flex w-full flex-wrap items-start gap-3 text-left" onClick={() => setOpenId(isOpen ? null : m.id)}>
                  <StatusDot tone={m.classification === "Urgente" || m.classification === "Reclamação" ? "bad" : m.status === "Novo" ? "warn" : "good"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{client?.name ?? "—"}</p>
                      <span className="text-xs text-muted-foreground">{m.sender} · {m.channel} · {m.createdAt}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium">{m.subject}</p>
                    <p className="text-xs text-muted-foreground">{m.summary}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge tone={categoryTone(m.classification)}>{m.classification}</Badge>
                    <Badge tone={sentimentTone(m.sentiment)}>{m.sentiment}</Badge>
                    <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 border-t border-glass-line pt-3">
                    <p className="text-sm">{m.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Prioridade {m.priority} · responsável {m.assignee}</p>
                    {m.requiresAction && (
                      <div className="mt-2 rounded-xl bg-brand/10 p-3">
                        <p className="text-xs font-semibold uppercase text-brand">Ação sugerida</p>
                        <p className="mt-1 text-sm">{m.suggestedAction}</p>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" className="h-7" onClick={() => createPendencyFromMessage(m)}>Criar pendência</Button>
                      <Button size="sm" variant="outline" className="h-7" onClick={() => client && void navigate({ to: "/clientes/$clientId", params: { clientId: client.id } })}>Abrir cliente</Button>
                      <Button size="sm" variant="outline" className="h-7" onClick={() => openReply(m)}>Responder</Button>
                      <Select value={m.assignee} onValueChange={(v) => assignMessage(m.id, v)}>
                        <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                      </Select>
                      {m.status !== "Resolvida" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7"
                          onClick={() => confirmAction({ title: "Marcar como resolvida", description: m.subject, impact: "operacional", successMessage: "Mensagem resolvida.", onConfirm: () => updateMessageStatus(m.id, "Resolvida") })}
                        >
                          Marcar resolvida
                        </Button>
                      )}
                    </div>

                    {replyOpenId === m.id && (
                      <div className="mt-3 rounded-xl border border-glass-line p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Gerador de resposta</p>
                          <Button size="sm" variant="outline" className="h-7" onClick={() => generateDraft(m)}><Sparkles className="size-3" /> Gerar rascunho com IA</Button>
                        </div>
                        <Textarea rows={5} value={replyDrafts[m.id] ?? ""} onChange={(e) => setReplyDrafts((d) => ({ ...d, [m.id]: e.target.value }))} placeholder="Gere um rascunho ou escreva sua resposta…" />
                        <p className="mt-1.5 text-[11px] text-muted-foreground">{REPLY_DRAFT_DISCLAIMER}</p>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={() => confirmSend(m)} disabled={!(replyDrafts[m.id] ?? "").trim()}>Enviar resposta</Button>
                          <Button size="sm" variant="outline" onClick={() => setReplyOpenId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem encontrada.</p>}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{list.length} de {communications.length} mensagens</p>
      </Glass>
    </>
  );
}
