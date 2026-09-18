import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MessageSquare, Send, Settings, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge, Glass, Kpi, PageHeader } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOfficeStore } from "@/data/store";
import { clientById, contacts, employees, office } from "@/data/office";
import { DOCUMENT_DEFAULT_CATEGORY } from "@/lib/documents-engine";
import { INTEGRATIONS } from "@/integrations/providers/catalog";
import { CATEGORY_LABEL, type IntegrationCategory } from "@/integrations/providers/types";
import {
  mockEmailProvider,
  mockGoogleDriveProvider,
  mockWhatsAppProvider,
  simulateInboundDocument,
  simulateInboundMessage,
} from "@/integrations/providers/mocks";
import {
  disconnectEmailAccountFn,
  getEmailAccountStatusFn,
  getGmailAuthUrlFn,
  triggerEmailSyncFn,
} from "@/data/server-functions/email-integration";

const CATEGORIES: IntegrationCategory[] = [
  "dominio-fiscal",
  "mensageria",
  "armazenamento",
  "planilhas",
  "produtividade",
  "crm",
  "financeiro",
  "open-finance",
  "governo",
];

type BadgeTone = "good" | "warn" | "bad" | "brand" | "accent" | "neutral";

/**
 * Card real do "E-mail (IMAP/SMTP)" do catálogo — status vem do backend
 * (getEmailAccountStatusFn), nunca um badge "Mock" fixo. "Ver exemplo (demo)"
 * é só uma ilustração local (mockEmailProvider) — nunca grava em
 * communications real, sempre rotulado como demonstração.
 */
function EmailIntegrationCard() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const statusQuery = useQuery({
    queryKey: ["email-account-status"],
    queryFn: () => getEmailAccountStatusFn(),
  });
  const account = statusQuery.data;

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["email-account-status"] });

  const connect = async () => {
    try {
      const { url } = await getGmailAuthUrlFn();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao iniciar a conexão com o Gmail.");
    }
  };

  const disconnect = async () => {
    try {
      await disconnectEmailAccountFn();
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao desconectar.");
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const result = await triggerEmailSyncFn();
      if (result.status === "error") toast.error(result.error ?? "Falha na sincronização.");
      else
        toast.success(
          `${result.syncedCount} mensagem(ns) sincronizada(s) — ${result.linkedCount} vinculada(s) a um cliente, ${result.unlinkedCount} aguardando triagem.`,
        );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao sincronizar.");
    } finally {
      setSyncing(false);
      invalidate();
    }
  };

  const badge: { tone: BadgeTone; label: string } = syncing
    ? { tone: "brand", label: "Sincronizando" }
    : account?.status === "connected"
      ? { tone: "good", label: "Conectado" }
      : account?.status === "error"
        ? { tone: "bad", label: "Erro" }
        : account?.status === "disconnected"
          ? { tone: "neutral", label: "Desconectado" }
          : { tone: "neutral", label: "Não configurado" };

  return (
    <div className="glass-soft rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">E-mail (Gmail)</p>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Conecta uma caixa Gmail via OAuth, sincroniza mensagens recebidas, classifica com IA e
        identifica o cliente automaticamente (nunca vincula com baixa confiança).
      </p>
      {account && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {account.emailAddress}
          {account.lastSyncedAt
            ? ` · última sincronização ${account.lastSyncedAt.slice(0, 16).replace("T", " ")}`
            : " · nunca sincronizado"}
        </p>
      )}
      {account?.lastError && <p className="mt-1 text-[11px] text-bad">{account.lastError}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {!account && (
          <Button size="sm" onClick={() => void connect()}>
            Conectar Gmail
          </Button>
        )}
        {account && account.status !== "disconnected" && (
          <Button size="sm" variant="outline" disabled={syncing} onClick={() => void sync()}>
            {syncing ? "Sincronizando…" : "Sincronizar agora"}
          </Button>
        )}
        {account && (
          <Button size="sm" variant="ghost" onClick={() => void disconnect()}>
            Desconectar
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setShowDemo((v) => !v)}>
          {showDemo ? "Ocultar exemplo" : "Ver exemplo (demo)"}
        </Button>
      </div>
      {showDemo && (
        <div className="mt-2 rounded-lg border border-dashed border-glass-line bg-glass p-2.5 text-xs">
          <p className="font-semibold text-warn">
            DEMO — ilustrativo, não é um e-mail real, nada é gravado.
          </p>
          <p className="mt-1 text-muted-foreground">
            {
              mockEmailProvider.receiveInbound(
                "financeiro@clienteexemplo.com.br",
                "Segue em anexo o boleto vencido do mês passado. Podem verificar e confirmar o valor atualizado?",
              ).text
            }
          </p>
        </div>
      )}
    </div>
  );
}

export function IntegrationsPage() {
  const { createClientMessage, uploadDocument } = useOfficeStore();

  const [waContact, setWaContact] = useState(contacts[0]?.phone ?? "");
  const [waText, setWaText] = useState("Preciso enviar os documentos do fechamento.");
  const [waResult, setWaResult] = useState<string | null>(null);

  const [driveFile, setDriveFile] = useState("extrato-setembro.pdf");
  const [driveContact, setDriveContact] = useState(contacts[0]?.email ?? "");
  const [driveResult, setDriveResult] = useState<string | null>(null);

  const runWhatsApp = () => {
    const { payload, clientId } = simulateInboundMessage(
      mockWhatsAppProvider,
      waContact,
      waText,
      contacts,
    );
    if (!clientId) {
      setWaResult(
        `Não identificamos nenhum cliente pelo contato "${payload.from}". Uma integração real precisaria de um passo de cadastro/match manual aqui.`,
      );
      return;
    }
    const client = clientById(clientId);
    createClientMessage(clientId, payload.text);
    setWaResult(
      `Cliente identificado: ${client?.name ?? clientId}. Mensagem recebida, classificada e registrada na Inbox — veja em /comunicacao.`,
    );
  };

  const runDrive = async () => {
    const { payload, clientId } = simulateInboundDocument(
      mockGoogleDriveProvider,
      driveFile,
      driveContact,
      contacts,
    );
    if (!clientId) {
      setDriveResult(
        `Não identificamos nenhum cliente pelo contato "${driveContact}". Uma integração real precisaria de um passo de cadastro/match manual aqui.`,
      );
      return;
    }
    const client = clientById(clientId);
    // A origem (Google Drive) é simulada, mas o upload em si é real: gera um
    // arquivo de verdade e envia pro Storage, mesmo caminho de uma integração
    // real — só o "buscar do Drive" é mock, não o armazenamento.
    const file = new File(
      [`Arquivo simulado via integração mock (Google Drive): ${payload.fileName}`],
      payload.fileName,
      { type: "text/plain" },
    );
    await uploadDocument({
      clientId,
      type: "Nota fiscal",
      category: DOCUMENT_DEFAULT_CATEGORY["Nota fiscal"],
      competence: "2026-09",
      assignee: client?.owner ?? "Equipe",
      file,
    });
    setDriveResult(
      `Cliente identificado: ${client?.name ?? clientId}. Arquivo "${payload.fileName}" recebido e entrou no pipeline de Documentos — veja em /documentos.`,
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace e integrações"
        title="Configurações"
        description="Workspace, equipe, departamentos e o catálogo de integrações externas do ContaAI."
        action={
          <Badge tone="warn">
            <Settings className="mr-1 size-3" /> E-mail é real (Gmail OAuth) — as demais integrações
            abaixo são mock
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          label="Workspace"
          value={office.name}
          change={office.plan}
          tone="brand"
          icon={Building2}
        />
        <Kpi
          label="Colaboradores"
          value={String(employees.length)}
          change="usuários ativos"
          tone="brand"
          icon={Building2}
        />
        <Kpi
          label="Departamentos"
          value={String(office.departments.length)}
          change={office.departments.join(", ")}
          tone="brand"
          icon={Building2}
        />
        <Kpi
          label="Integrações"
          value={String(INTEGRATIONS.length)}
          change="1 real (e-mail), demais em modo mock"
          tone="warn"
          icon={Settings}
        />
      </div>

      <Glass className="mt-4 p-5">
        <h2 className="font-display text-lg font-semibold">Catálogo de integrações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          E-mail (Gmail) é uma integração real — conecta via OAuth, sincroniza de verdade. As demais
          já têm um contrato definido (ver <code>src/integrations/providers</code>) e um lugar claro
          para plugar a API real quando existir, mas ainda não fazem nenhuma chamada de rede.
        </p>
        <div className="mt-4 space-y-5">
          {CATEGORIES.map((cat) => {
            const items = INTEGRATIONS.filter((i) => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {CATEGORY_LABEL[cat]}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {items.map((i) =>
                    i.id === "email" ? (
                      <EmailIntegrationCard key={i.id} />
                    ) : (
                      <div key={i.id} className="glass-soft rounded-xl p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{i.name}</p>
                          <Badge tone="warn">Mock</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{i.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {i.feeds.map((f) => (
                            <Badge key={f} tone="neutral">
                              {f}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">{i.disclaimer}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Glass>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Glass className="p-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-brand" />
            <h2 className="font-display text-lg font-semibold">Testar: WhatsApp (mock)</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Simula uma mensagem chegando de fora — identifica o cliente pelo telefone, classifica e
            registra na Inbox de verdade.
          </p>
          <div className="mt-3 space-y-2">
            <Select value={waContact} onValueChange={setWaContact}>
              <SelectTrigger>
                <SelectValue placeholder="Contato de origem" />
              </SelectTrigger>
              <SelectContent>
                {contacts.slice(0, 20).map((c) => (
                  <SelectItem key={c.id} value={c.phone}>
                    {c.name} · {c.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea value={waText} onChange={(e) => setWaText(e.target.value)} />
            <Button size="sm" onClick={runWhatsApp}>
              <Send /> Simular recebimento
            </Button>
            {waResult && <p className="rounded-lg bg-glass p-2.5 text-xs">{waResult}</p>}
          </div>
        </Glass>

        <Glass className="p-5">
          <div className="flex items-center gap-2">
            <Upload className="size-4 text-brand" />
            <h2 className="font-display text-lg font-semibold">Testar: Google Drive (mock)</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Simula um arquivo chegando numa pasta compartilhada — identifica o cliente pelo e-mail e
            entra no pipeline de Documentos Inteligentes.
          </p>
          <div className="mt-3 space-y-2">
            <Select value={driveContact} onValueChange={setDriveContact}>
              <SelectTrigger>
                <SelectValue placeholder="Contato de origem" />
              </SelectTrigger>
              <SelectContent>
                {contacts.slice(0, 20).map((c) => (
                  <SelectItem key={c.id} value={c.email}>
                    {c.name} · {c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={driveFile}
              onChange={(e) => setDriveFile(e.target.value)}
              placeholder="nome-do-arquivo.pdf"
            />
            <Button size="sm" onClick={() => void runDrive()}>
              <Send /> Simular chegada de arquivo
            </Button>
            {driveResult && <p className="rounded-lg bg-glass p-2.5 text-xs">{driveResult}</p>}
          </div>
        </Glass>
      </div>
    </>
  );
}
