import { useState } from "react";
import { toast } from "sonner";
import { ContaAILogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/data/session";

export function LoginPage() {
  const { signIn, signUp } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const result =
      mode === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, workspaceName.trim(), fullName.trim());
    setLoading(false);
    if (result.error) toast.error(result.error);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-sm rounded-3xl border border-glass-line bg-glass p-8 shadow-xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <ContaAILogo variant="horizontal" size={36} />
          <p className="mt-2 text-sm text-muted-foreground">{mode === "signin" ? "Entre com sua conta." : "Crie o workspace do seu escritório."}</p>
        </div>

        <div className="mt-6 space-y-3">
          {mode === "signup" && (
            <>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Seu nome</label>
                <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Como devemos te chamar" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Nome do escritório</label>
                <Input className="mt-1" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Ex.: Lapenda Contabilidade" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">E-mail</label>
            <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@escritorio.com" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Senha</label>
            <Input
              className="mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="••••••••"
            />
          </div>
        </div>

        <Button
          className="mt-5 w-full"
          disabled={loading || !email.trim() || !password.trim() || (mode === "signup" && (!fullName.trim() || !workspaceName.trim()))}
          onClick={() => void submit()}
        >
          {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar workspace"}
        </Button>

        <button
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Ainda não tem um workspace? Criar um novo" : "Já tem uma conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
