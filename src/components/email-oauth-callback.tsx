import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Glass } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { completeGmailOAuthFn } from "@/data/server-functions/email-integration";

/**
 * Página de destino do redirect do Google após o consentimento OAuth —
 * rota normal (/integracoes/email/callback), não uma API separada: lê
 * `code`/`state` da URL e conclui a conexão chamando o mesmo server
 * function que qualquer outra ação da UI usaria.
 */
export function EmailOAuthCallbackPage() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search }) as {
    code?: string;
    state?: string;
    error?: string;
  };
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (search.error) {
      setStatus("error");
      setMessage("Conexão cancelada ou negada no Google.");
      return;
    }
    if (!search.code || !search.state) {
      setStatus("error");
      setMessage("Parâmetros de retorno do Google ausentes.");
      return;
    }
    completeGmailOAuthFn({ data: { code: search.code, state: search.state } })
      .then((account) => {
        setStatus("success");
        setMessage(`Caixa ${account.emailAddress} conectada com sucesso.`);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Falha ao concluir a conexão.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <Glass className="max-w-sm p-6 text-center">
        {status === "pending" && <Loader2 className="mx-auto size-8 animate-spin text-brand" />}
        {status === "success" && <CheckCircle2 className="mx-auto size-8 text-good" />}
        {status === "error" && <XCircle className="mx-auto size-8 text-bad" />}
        <p className="mt-3 text-sm font-medium">
          {status === "pending" ? "Concluindo a conexão com o Gmail…" : message}
        </p>
        {status !== "pending" && (
          <Button className="mt-4" onClick={() => void navigate({ to: "/configuracoes" })}>
            Voltar para Configurações
          </Button>
        )}
      </Glass>
    </div>
  );
}
