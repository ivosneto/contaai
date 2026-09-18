// Estado do Portal do Cliente — deliberadamente separado de
// src/data/store.tsx (o painel interno). Nunca compartilha o
// OfficeStoreProvider cheio: antes desta tarefa, o Portal montava dentro do
// mesmo provider do painel interno e recebia em memória os dados de TODOS
// os clientes do workspace (só filtrava na renderização) — exatamente o
// vazamento que esta tarefa elimina. Aqui, cada fetchPortalBootstrap() já
// vem filtrado pelo servidor (RLS *_client_read, ver
// supabase/migrations/20260918090000_identity_rls.sql), então não há dado
// de outro cliente para vazar mesmo que a UI tivesse um bug.
//
// Sem reducer/Action Engine local: a superfície de ações do cliente final é
// pequena (enviar documento, concluir pendência ao responder, mandar
// mensagem) — cada uma chama a server function correspondente e recarrega o
// bootstrap, em vez de otimizar com estado local otimista.
import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ContaAILogo } from "@/components/brand/logo";
import { completePortalPendency, createPortalMessage, fetchPortalBootstrap, uploadPortalDocument } from "@/data/server-functions/portal";
import type { NewDocumentInput } from "@/data/store";

type PortalStoreValue = ReturnType<typeof buildValue>;

const PortalStoreContext = createContext<PortalStoreValue | null>(null);

function buildValue(data: Awaited<ReturnType<typeof fetchPortalBootstrap>>, refetch: () => Promise<unknown>) {
  return {
    client: data.clients[0] ?? null,
    documents: data.documents,
    obligations: data.obligations,
    pendencies: data.pendencies,
    communications: data.communications,
    announcements: data.announcements,
    completePendency: async (id: string) => {
      await completePortalPendency({ data: { id } });
      await refetch();
    },
    createClientMessage: async (_clientId: string, content: string) => {
      await createPortalMessage({ data: { content } });
      await refetch();
    },
    uploadDocument: async (input: NewDocumentInput & { pendencyId?: string }) => {
      const formData = new FormData();
      formData.set("file", input.file);
      formData.set("type", input.type);
      formData.set("category", input.category);
      formData.set("competence", input.competence);
      if (input.pendencyId) formData.set("pendencyId", input.pendencyId);
      await uploadPortalDocument({ data: formData });
      await refetch();
    },
  };
}

export function PortalStoreProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const bootstrap = useQuery({
    queryKey: ["portal-bootstrap"],
    queryFn: () => fetchPortalBootstrap(),
    staleTime: Infinity,
    retry: 1,
  });

  if (bootstrap.isPending) return <PortalBootstrapState />;
  if (bootstrap.isError) {
    return <PortalBootstrapState error={bootstrap.error instanceof Error ? bootstrap.error.message : "Erro desconhecido."} onRetry={() => void bootstrap.refetch()} />;
  }

  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ["portal-bootstrap"] });
  };

  const value = buildValue(bootstrap.data, refetch);
  return <PortalStoreContext.Provider value={value}>{children}</PortalStoreContext.Provider>;
}

function PortalBootstrapState({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <ContaAILogo variant="horizontal" size={36} />
        {error ? (
          <>
            <p className="max-w-sm text-sm text-muted-foreground">Não foi possível carregar seus dados.<br />{error}</p>
            {onRetry && (
              <button onClick={onRetry} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Tentar novamente
              </button>
            )}
          </>
        ) : (
          <p className="animate-pulse text-sm text-muted-foreground">Carregando seus dados…</p>
        )}
      </div>
    </div>
  );
}

export function usePortalStore() {
  const ctx = useContext(PortalStoreContext);
  if (!ctx) throw new Error("usePortalStore precisa estar dentro de <PortalStoreProvider>");
  return ctx;
}
