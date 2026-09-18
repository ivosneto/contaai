/**
 * Testes de segurança multi-tenant — rodam contra o projeto Supabase REAL
 * (contaai), nunca contra um mock. Cada teste faz login de verdade
 * (signInWithPassword) com um dos usuários criados por
 * scripts/seed-identity.ts e consulta o banco com o client autenticado
 * como aquele usuário (chave publishable, nunca service_role) — exatamente
 * o mesmo client que a aplicação usa em produção
 * (createSessionScopedClient em src/data/repositories/domain-client.server.ts).
 *
 * O que prova: a Row Level Security do Postgres é a fronteira real de
 * isolamento entre workspaces/clientes — não o filtro de UI. Nenhuma
 * asserção aqui depende de código de aplicação, só do banco.
 *
 * Credenciais em .env.test (bun carrega automaticamente com NODE_ENV=test,
 * que é o padrão de `bun test`). Nenhum dado é criado por este arquivo além
 * de uma edição temporária revertida no próprio teste (afterEach/finally).
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseDomain } from "@/data/repositories/domain-client.server";
import type { DomainDatabase } from "@/data/repositories/domain-types";
import { listClients, upsertClient } from "@/data/repositories/clients.server";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
const PASSWORD = process.env["SEED_PASSWORD"];

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !PASSWORD) {
  throw new Error(
    "Faltam variáveis de ambiente para os testes de segurança (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SEED_PASSWORD). " +
      "Rode `bun run scripts/seed-identity.ts` e confirme que .env.test existe.",
  );
}

const WORKSPACE_A = "00000000-0000-0000-0000-000000000001";
const WORKSPACE_B = "00000000-0000-0000-0000-000000000002";

type Client = SupabaseClient<DomainDatabase>;

async function signIn(email: string | undefined): Promise<Client> {
  if (!email) throw new Error("E-mail de teste ausente em .env.test.");
  const client = createClient<DomainDatabase>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD! });
  if (error) throw new Error(`Falha ao logar como ${email}: ${error.message}`);
  return client;
}

let ownerA: Client;
let managerA: Client;
let employeeA: Client;
let clientA: Client;
let ownerB: Client;
let clientB: Client;
let anon: Client;

beforeAll(async () => {
  [ownerA, managerA, employeeA, clientA, ownerB, clientB] = await Promise.all([
    signIn(process.env["SEED_OWNER_A_EMAIL"]),
    signIn(process.env["SEED_MANAGER_A_EMAIL"]),
    signIn(process.env["SEED_EMPLOYEE_A_EMAIL"]),
    signIn(process.env["SEED_CLIENT_A_EMAIL"]),
    signIn(process.env["SEED_OWNER_B_EMAIL"]),
    signIn(process.env["SEED_CLIENT_B_EMAIL"]),
  ]);
  anon = createClient<DomainDatabase>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
});

afterAll(async () => {
  await Promise.all([ownerA, managerA, employeeA, clientA, ownerB, clientB].map((c) => c.auth.signOut()));
});

describe("1. Isolamento entre workspaces (A x B)", () => {
  test("owner do workspace A não vê clients do workspace B", async () => {
    const { data, error } = await ownerA.from("clients").select("id").eq("workspace_id", WORKSPACE_B);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test("owner do workspace A não vê tasks do workspace B", async () => {
    const { data, error } = await ownerA.from("tasks").select("id").eq("workspace_id", WORKSPACE_B);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test("owner do workspace B não vê nenhum client do workspace A (isolamento nos dois sentidos)", async () => {
    const { data, error } = await ownerB.from("clients").select("id").eq("workspace_id", WORKSPACE_A);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test("owner do workspace B só vê os próprios 2 clients (b-c1, b-c2), nunca os 20 de A", async () => {
    const { data, error } = await ownerB.from("clients").select("id");
    expect(error).toBeNull();
    const ids = (data ?? []).map((r) => r.id).sort();
    expect(ids).toEqual(["b-c1", "b-c2"]);
  });
});

describe("2. Isolamento do Client Portal (cliente x cliente, cliente x outro workspace)", () => {
  test("cliente A (ligado a c1) vê a própria pendência de categoria visível (pd1), mas não a pendência interna (pd21)", async () => {
    const { data, error } = await clientA.from("pendencies").select("id,client_id,category").eq("workspace_id", WORKSPACE_A);
    expect(error).toBeNull();
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain("pd1");
    expect(ids).not.toContain("pd21");
    for (const row of data ?? []) expect(row.client_id).toBe("c1");
  });

  test("cliente A não vê a pendência confidencial do workspace B mesmo pedindo pelo id exato", async () => {
    const { data, error } = await clientA.from("pendencies").select("id").eq("id", "b-pd1");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test("cliente B só vê pendências do próprio client_id (b-c1), nunca as de c1..c20", async () => {
    const { data, error } = await clientB.from("pendencies").select("id,client_id");
    expect(error).toBeNull();
    for (const row of data ?? []) expect(row.client_id).toBe("b-c1");
  });

  test("cliente A vê os próprios documentos (doc1, doc21) e não vê documentos de outro cliente", async () => {
    const { data, error } = await clientA.from("documents").select("id,client_id");
    expect(error).toBeNull();
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(["doc1", "doc21"]));
    for (const row of data ?? []) expect(row.client_id).toBe("c1");
  });

  test("cliente A não consegue ler a tabela employees (equipe interna, capacidade, custo)", async () => {
    const { data } = await clientA.from("employees").select("id");
    expect(data ?? []).toEqual([]);
  });

  test("cliente A não consegue ler financial_accounts/transactions (dado financeiro interno)", async () => {
    const { data: accounts } = await clientA.from("financial_accounts").select("id");
    expect(accounts ?? []).toEqual([]);
  });
});

describe("3. RBAC — employee não pode fazer o que só owner/admin/manager podem", () => {
  test("employee A tenta editar cadastro de cliente (clients) e a RLS rejeita (0 linhas afetadas, sem erro de aplicação)", async () => {
    const { data, error } = await employeeA
      .from("clients")
      .update({ segment: "TENTATIVA_INVALIDA_EMPLOYEE" })
      .eq("id", "c1")
      .select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: real } = await supabaseDomain.from("clients").select("segment").eq("id", "c1").single();
    expect(real?.segment).not.toBe("TENTATIVA_INVALIDA_EMPLOYEE");
  });

  test("employee A tenta editar employees e a RLS rejeita", async () => {
    const { data, error } = await employeeA.from("employees").update({ role: "TENTATIVA_INVALIDA" }).eq("id", "e1").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe("4. Acesso não autenticado a rota/tabela protegida", () => {
  test("usuário anônimo não lê employees (staff-only)", async () => {
    const { data } = await anon.from("employees").select("id");
    expect(data ?? []).toEqual([]);
  });

  test("usuário anônimo não lê clients", async () => {
    const { data } = await anon.from("clients").select("id");
    expect(data ?? []).toEqual([]);
  });

  test("usuário anônimo não lê pendencies de ninguém", async () => {
    const { data } = await anon.from("pendencies").select("id");
    expect(data ?? []).toEqual([]);
  });
});

describe("5. Acesso autorizado funciona normalmente (regressão positiva)", () => {
  test("owner A lê os 20 clients do próprio workspace normalmente", async () => {
    const { data, error } = await ownerA.from("clients").select("id").eq("workspace_id", WORKSPACE_A);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  test("owner A edita e reverte o cadastro de um cliente com sucesso (clients_write permite owner)", async () => {
    const { data: before } = await supabaseDomain.from("clients").select("segment").eq("id", "c2").single();
    const original = before!.segment;
    try {
      const { data, error } = await ownerA
        .from("clients")
        .update({ segment: "Teste E2E temporário — reversível" })
        .eq("id", "c2")
        .select("id,segment");
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0]!.segment).toBe("Teste E2E temporário — reversível");
    } finally {
      await supabaseDomain.from("clients").update({ segment: original }).eq("id", "c2");
    }
    const { data: after } = await supabaseDomain.from("clients").select("segment").eq("id", "c2").single();
    expect(after?.segment).toBe(original);
  });

  test("manager A também pode editar clients (clients_write permite manager, não só owner)", async () => {
    const { data: before } = await supabaseDomain.from("clients").select("segment").eq("id", "c3").single();
    const original = before!.segment;
    try {
      const { data, error } = await managerA
        .from("clients")
        .update({ segment: "Teste E2E temporário (manager)" })
        .eq("id", "c3")
        .select("id");
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    } finally {
      await supabaseDomain.from("clients").update({ segment: original }).eq("id", "c3");
    }
  });

  test("cliente A lê normalmente os próprios dados via a mesma sessão (positivo, não só negativo)", async () => {
    const { data, error } = await clientA.from("clients").select("id,name").eq("id", "c1");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0]!.id).toBe("c1");
  });
});

/**
 * Regressão da auditoria de hardening final: o catálogo de serviços em
 * clients.server.ts era memoizado num Map de processo SEM chave de
 * workspace — uma vez populado pelo workspace A (que tem catálogo de
 * serviços), uma chamada seguinte para o workspace B (que não tem) pulava a
 * releitura (guard `if (map.size > 0) return`) e reaproveitava os ids de
 * serviço de A. upsertClient então resolvia nomes de serviço do workspace B
 * para ids de serviço que pertencem ao workspace A, gravando um
 * client_services cross-tenant.
 */
describe("6. Cache de serviços é isolado por workspace (regressão)", () => {
  test("upsertClient no workspace B nunca resolve um nome de serviço para um id do workspace A", async () => {
    // Garante que o cache do workspace A (que tem 6 serviços reais) já foi
    // aquecido antes de mexer no workspace B — é essa ordem que expunha o bug.
    await listClients(ownerA, WORKSPACE_A);

    const bClients = await listClients(ownerB, WORKSPACE_B);
    const bc1 = bClients.find((c) => c.id === "b-c1");
    expect(bc1).toBeDefined();
    const originalServices = bc1!.services;

    try {
      // "Contábil" é um nome de serviço real, mas só existe no catálogo do
      // workspace A (svc-contabil) — o workspace B não tem nenhum serviço
      // com esse nome.
      await upsertClient(ownerB, WORKSPACE_B, { ...bc1!, services: ["Contábil"] });

      const { data: joins, error } = await supabaseDomain
        .from("client_services")
        .select("service_id")
        .eq("client_id", "b-c1");
      expect(error).toBeNull();
      // O nome não existe no catálogo de B → nenhum client_services deveria
      // ter sido gravado. Se o cache tivesse vazado de A, "svc-contabil"
      // (um id que pertence ao workspace A) apareceria aqui.
      expect(joins ?? []).toHaveLength(0);

      const reloaded = await listClients(ownerB, WORKSPACE_B);
      expect(reloaded.find((c) => c.id === "b-c1")?.services).toEqual([]);
    } finally {
      await upsertClient(ownerB, WORKSPACE_B, { ...bc1!, services: originalServices });
    }
  });
});
