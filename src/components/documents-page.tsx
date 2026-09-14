import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FolderOpen, Plus, Search } from "lucide-react";
import { Badge, Glass, Kpi, PageHeader } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOfficeStore, type NewDocumentInput } from "@/data/store";
import { clientById, clients, employees, type DocumentStatus, type DocumentType, type PendencyCategory } from "@/data/office";
import { DOCUMENT_DEFAULT_CATEGORY, OCR_DEMO_DISCLAIMER } from "@/lib/documents-engine";

const documentTypes: DocumentType[] = ["Nota fiscal", "Extrato bancário", "Folha de ponto", "Contrato social", "Guia de imposto", "Relatório gerencial"];
const categories: PendencyCategory[] = ["Documento", "Fiscal", "Contábil", "Folha", "Financeiro", "Comercial", "Cliente", "Interna"];
const statuses: DocumentStatus[] = ["Pendente", "Recebido", "Processando", "Aprovado", "Vencido", "Rejeitado"];

function statusTone(status: DocumentStatus): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (status === "Aprovado") return "good";
  if (status === "Vencido" || status === "Rejeitado") return "bad";
  if (status === "Pendente" || status === "Processando") return "warn";
  return "neutral";
}

const emptyForm: NewDocumentInput = {
  clientId: "",
  type: "Nota fiscal",
  category: DOCUMENT_DEFAULT_CATEGORY["Nota fiscal"],
  competence: "2026-09",
  assignee: "",
};

export function DocumentsPage() {
  const navigate = useNavigate();
  const { documents, uploadDocument, processDocument, confirmAction } = useOfficeStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"Todos" | DocumentStatus>("Todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewDocumentInput>(emptyForm);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return documents.filter((d) => {
      const client = clientById(d.clientId);
      const matches = !query || (client?.name ?? "").toLowerCase().includes(query) || d.name.toLowerCase().includes(query);
      return matches && (filter === "Todos" || d.status === filter);
    });
  }, [documents, q, filter]);

  const awaitingProcessing = documents.filter((d) => d.pipelineStage === "Recebido").length;
  const approved = documents.filter((d) => d.status === "Aprovado").length;
  const needsReview = documents.filter((d) => d.status === "Rejeitado" || d.status === "Pendente" || d.status === "Vencido").length;

  const submit = () => {
    if (!form.clientId || !form.assignee) return;
    uploadDocument(form);
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Documentos Inteligentes"
        title="Central de Documentos"
        description="Recebido → Identificação → Classificação → Extração → Validação → Relacionamento com cliente → Verificação da obrigação → Pendência ou conclusão."
        action={<Button className="rounded-xl" onClick={() => setOpen(true)}><Plus /> Enviar documento</Button>}
      />
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{OCR_DEMO_DISCLAIMER}</p>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Documentos" value={String(documents.length)} change={`${clients.length} clientes`} tone="brand" />
        <Kpi label="Aguardando processamento" value={String(awaitingProcessing)} change="pipeline não iniciado" tone="warn" />
        <Kpi label="Aprovados" value={String(approved)} change="validados e relacionados" tone="good" />
        <Kpi label="Precisam de revisão" value={String(needsReview)} change="rejeitado, pendente ou vencido" tone={needsReview > 0 ? "bad" : "good"} />
      </div>

      <Glass className="mt-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Buscar por cliente ou documento…" /></div>
          <div className="flex flex-wrap gap-2">
            {(["Todos", ...statuses] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {list.map((d) => {
            const client = clientById(d.clientId);
            return (
              <div key={d.id} className="glass-soft rounded-xl p-3">
                <div className="flex flex-wrap items-start gap-3">
                  <button className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand" onClick={() => client && void navigate({ to: "/clientes/$clientId", params: { clientId: client.id } })}>
                    <FolderOpen className="size-4" />
                  </button>
                  <div className="min-w-[220px] flex-1">
                    <p className="text-sm font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{client?.name ?? "—"} · {d.category} · competência {d.competence} · {d.assignee}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                    <Badge tone="neutral">{d.pipelineStage}</Badge>
                  </div>
                </div>
                {d.extraction && (
                  <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-glass p-2.5 text-[11px] text-muted-foreground sm:grid-cols-4">
                    <span>CNPJ: {d.extraction.cnpj}</span>
                    <span>Nº: {d.extraction.numero}</span>
                    <span>Confiança OCR: {d.extraction.confidence}%</span>
                    {d.extraction.valor !== null && <span>Valor: R$ {d.extraction.valor}</span>}
                    {d.extraction.vencimento && <span>Vencimento: {d.extraction.vencimento}</span>}
                  </div>
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
            );
          })}
          {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhum documento encontrado.</p>}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{list.length} de {documents.length} documentos</p>
      </Glass>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar documento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Cliente</label>
              <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo</label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as DocumentType, category: DOCUMENT_DEFAULT_CATEGORY[v as DocumentType] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{documentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Categoria</label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as PendencyCategory }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Competência</label>
                <Input className="mt-1" type="month" value={form.competence} onChange={(e) => setForm((f) => ({ ...f, competence: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Responsável</label>
                <Select value={form.assignee} onValueChange={(v) => setForm((f) => ({ ...f, assignee: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{OCR_DEMO_DISCLAIMER}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!form.clientId || !form.assignee}>Enviar documento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
