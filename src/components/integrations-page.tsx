import { useState } from "react";
import { Building2, MessageSquare, Send, Settings, Upload } from "lucide-react";
import { Badge, Glass, Kpi, PageHeader } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOfficeStore } from "@/data/store";
import { clientById, contacts, employees, office } from "@/data/office";
import { DOCUMENT_DEFAULT_CATEGORY } from "@/lib/documents-engine";
import { INTEGRATIONS } from "@/integrations/providers/catalog";
import { CATEGORY_LABEL, type IntegrationCategory } from "@/integrations/providers/types";
import { mockGoogleDriveProvider, mockWhatsAppProvider, simulateInboundDocument, simulateInboundMessage } from "@/integrations/providers/mocks";

const CATEGORIES: IntegrationCategory[] = ["dominio-fiscal", "mensageria", "armazenamento", "planilhas", "produtividade", "crm", "financeiro", "open-finance", "governo"];

export function IntegrationsPage() {
  const { createClientMessage, uploadDocument } = useOfficeStore();

  const [waContact, setWaContact] = useState(contacts[0]?.phone ?? "");
  const [waText, setWaText] = useState("Preciso enviar os documentos do fechamento.");
  const [waResult, setWaResult] = useState<string | null>(null);

  const [driveFile, setDriveFile] = useState("extrato-setembro.pdf");
  const [driveContact, setDriveContact] = useState(contacts[0]?.email ?? "");
  const [driveResult, setDriveResult] = useState<string | null>(null);

  const runWhatsApp = () => {
    const { payload, clientId } = simulateInboundMessage(mockWhatsAppProvider, waContact, waText, contacts);
    if (!clientId) {
      setWaResult(`Não identificamos nenhum cliente pelo contato "${payload.from}". Uma integração real precisaria de um passo de cadastro/match manual aqui.`);
      return;
    }
    const client = clientById(clientId);
    createClientMessage(clientId, payload.text);
    setWaResult(`Cliente identificado: ${client?.name ?? clientId}. Mensagem recebida, classificada e registrada na Inbox — veja em /comunicacao.`);
  };

  const runDrive = () => {
    const { payload, clientId } = simulateInboundDocument(mockGoogleDriveProvider, driveFile, driveContact, contacts);
    if (!clientId) {
      setDriveResult(`Não identificamos nenhum cliente pelo contato "${driveContact}". Uma integração real precisaria de um passo de cadastro/match manual aqui.`);
      return;
    }
    const client = clientById(clientId);
    uploadDocument({ clientId, type: "Nota fiscal", category: DOCUMENT_DEFAULT_CATEGORY["Nota fiscal"], competence: "2026-09", assignee: client?.owner ?? "Equipe" });
    setDriveResult(`Cliente identificado: ${client?.name ?? clientId}. Arquivo "${payload.fileName}" recebido e entrou no pipeline de Documentos — veja em /documentos.`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace e integrações"
        title="Configurações"
        description="Workspace, equipe, departamentos e o catálogo de integrações externas do ContaAI."
        action={<Badge tone="warn"><Settings className="mr-1 size-3" /> Todas as integrações abaixo são mock</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Workspace" value={office.name} change={office.plan} tone="brand" icon={Building2} />
        <Kpi label="Colaboradores" value={String(employees.length)} change="usuários ativos" tone="brand" icon={Building2} />
        <Kpi label="Departamentos" value={String(office.departments.length)} change={office.departments.join(", ")} tone="brand" icon={Building2} />
        <Kpi label="Integrações" value={String(INTEGRATIONS.length)} change="todas em modo mock" tone="warn" icon={Settings} />
      </div>

      <Glass className="mt-4 p-5">
        <h2 className="font-display text-lg font-semibold">Catálogo de integrações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nenhuma chamada de rede real acontece hoje. Cada integração já tem um contrato definido (ver <code>src/integrations/providers</code>) e um lugar claro para plugar a API real quando existir — sem tocar na lógica de negócio.
        </p>
        <div className="mt-4 space-y-5">
          {CATEGORIES.map((cat) => {
            const items = INTEGRATIONS.filter((i) => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORY_LABEL[cat]}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {items.map((i) => (
                    <div key={i.id} className="glass-soft rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{i.name}</p>
                        <Badge tone="warn">Mock</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{i.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">{i.feeds.map((f) => <Badge key={f} tone="neutral">{f}</Badge>)}</div>
                      <p className="mt-2 text-[11px] text-muted-foreground">{i.disclaimer}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Glass>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Glass className="p-5">
          <div className="flex items-center gap-2"><MessageSquare className="size-4 text-brand" /><h2 className="font-display text-lg font-semibold">Testar: WhatsApp (mock)</h2></div>
          <p className="mt-1 text-xs text-muted-foreground">Simula uma mensagem chegando de fora — identifica o cliente pelo telefone, classifica e registra na Inbox de verdade.</p>
          <div className="mt-3 space-y-2">
            <Select value={waContact} onValueChange={setWaContact}>
              <SelectTrigger><SelectValue placeholder="Contato de origem" /></SelectTrigger>
              <SelectContent>{contacts.slice(0, 20).map((c) => <SelectItem key={c.id} value={c.phone}>{c.name} · {c.phone}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea value={waText} onChange={(e) => setWaText(e.target.value)} />
            <Button size="sm" onClick={runWhatsApp}><Send /> Simular recebimento</Button>
            {waResult && <p className="rounded-lg bg-glass p-2.5 text-xs">{waResult}</p>}
          </div>
        </Glass>

        <Glass className="p-5">
          <div className="flex items-center gap-2"><Upload className="size-4 text-brand" /><h2 className="font-display text-lg font-semibold">Testar: Google Drive (mock)</h2></div>
          <p className="mt-1 text-xs text-muted-foreground">Simula um arquivo chegando numa pasta compartilhada — identifica o cliente pelo e-mail e entra no pipeline de Documentos Inteligentes.</p>
          <div className="mt-3 space-y-2">
            <Select value={driveContact} onValueChange={setDriveContact}>
              <SelectTrigger><SelectValue placeholder="Contato de origem" /></SelectTrigger>
              <SelectContent>{contacts.slice(0, 20).map((c) => <SelectItem key={c.id} value={c.email}>{c.name} · {c.email}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={driveFile} onChange={(e) => setDriveFile(e.target.value)} placeholder="nome-do-arquivo.pdf" />
            <Button size="sm" onClick={runDrive}><Send /> Simular chegada de arquivo</Button>
            {driveResult && <p className="rounded-lg bg-glass p-2.5 text-xs">{driveResult}</p>}
          </div>
        </Glass>
      </div>
    </>
  );
}
