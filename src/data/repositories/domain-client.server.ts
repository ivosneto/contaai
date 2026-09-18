// Cliente Supabase server-only (service_role) para as tabelas de domínio —
// mesma forma de src/integrations/supabase/client.server.ts (nunca importar
// fora de módulos *.server.ts; a service_role key nunca chega ao browser),
// mas tipado contra DomainDatabase em vez do types.ts gerado, que ainda não
// conhece as tabelas desta migration.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DomainDatabase } from "./domain-types";

/** Tipo comum injetado em todo repository — tanto supabaseDomain (scripts) quanto o client por-sessão (app) satisfazem esse tipo. */
export type DomainClient = SupabaseClient<DomainDatabase>;

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createDomainClient() {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase service role environment variable(s) (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createClient<DomainDatabase>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

let _supabaseDomain: ReturnType<typeof createDomainClient> | undefined;

/**
 * service_role — ignora RLS. Só é seguro usar em scripts administrativos
 * offline (seed, criação de usuário de teste via Admin API), NUNCA no
 * caminho de uma requisição de usuário. Toda leitura/escrita a pedido de um
 * usuário passa por createSessionScopedClient() abaixo, onde o RLS do
 * Postgres é a fronteira real de isolamento — ver
 * src/data/server-functions/auth-context.server.ts.
 */
export const supabaseDomain = new Proxy({} as ReturnType<typeof createDomainClient>, {
  get(_, prop, receiver) {
    if (!_supabaseDomain) _supabaseDomain = createDomainClient();
    return Reflect.get(_supabaseDomain, prop, receiver);
  },
});

/**
 * Client por-requisição, autenticado como o usuário dono de `accessToken`
 * (chave publishable + Authorization: Bearer <jwt do usuário>, nunca
 * service_role) — toda query feita com este client passa pelas RLS policies
 * de supabase/migrations/20260918090000_identity_rls.sql como aquele
 * usuário específico. Não é singleton: cada requisição tem um token
 * diferente.
 */
export function createSessionScopedClient(accessToken: string) {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing Supabase environment variable(s) (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY).");
  }
  return createClient<DomainDatabase>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
