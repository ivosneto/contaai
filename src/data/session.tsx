// Sessão real do usuário — substitui qualquer identidade fixa/hardcoded.
// Usa a infraestrutura do Supabase Auth que já existia pronta e nunca era
// usada (src/integrations/supabase/client.ts já persiste sessão;
// attachSupabaseAuth em src/start.ts já anexa o bearer token em toda
// chamada de server function). fetchMySession() nunca confia em nada vindo
// do navegador: workspace/papel/clientId são sempre descobertos no servidor
// a partir do token verificado — ver src/data/server-functions/auth-context.server.ts.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchMySession } from "@/data/server-functions/session";
import type { MySession } from "@/data/server-functions/auth-context.server";
import type { AppRole } from "@/data/office";

type SessionValue = {
  status: "loading" | "signed-out" | "no-workspace" | "signed-in";
  userId: string | null;
  email: string | null;
  workspaceId: string | null;
  role: AppRole | null;
  clientId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, workspaceName: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [authTick, setAuthTick] = useState(0);
  const [hasSupabaseSession, setHasSupabaseSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSupabaseSession(Boolean(data.session));
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSupabaseSession(Boolean(session));
      setEmail(session?.user.email ?? null);
      setAuthTick((t) => t + 1);
      void queryClient.invalidateQueries({ queryKey: ["my-session"] });
      void queryClient.invalidateQueries({ queryKey: ["domain-bootstrap"] });
      void queryClient.invalidateQueries({ queryKey: ["portal-bootstrap"] });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const sessionQuery = useQuery({
    queryKey: ["my-session", authTick],
    queryFn: () => fetchMySession(),
    enabled: hasSupabaseSession === true,
    staleTime: Infinity,
    retry: false,
  });

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, workspaceName: string, fullName: string) => {
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) return { error: signUpError.message };
    const { error: bootstrapError } = await supabase.rpc("bootstrap_workspace", {
      _workspace_name: workspaceName,
      _full_name: fullName,
    });
    if (bootstrapError) return { error: bootstrapError.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const sessionData = sessionQuery.data as MySession | undefined;

  let status: SessionValue["status"] = "loading";
  if (hasSupabaseSession === false) status = "signed-out";
  else if (hasSupabaseSession === true && sessionData) {
    status = sessionData.status === "signed-in" ? "signed-in" : sessionData.status === "no-workspace" ? "no-workspace" : "signed-out";
  } else if (hasSupabaseSession === true && sessionQuery.isError) {
    status = "signed-out";
  }

  const data = sessionData && sessionData.status === "signed-in" ? sessionData : null;

  const value: SessionValue = {
    status,
    userId: data?.userId ?? null,
    email,
    workspaceId: data?.workspaceId ?? null,
    role: (data?.role ?? null) as SessionValue["role"],
    clientId: data?.clientId ?? null,
    signIn,
    signUp,
    signOut,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession precisa estar dentro de <SessionProvider>");
  return ctx;
}
