import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { salvarCertificadoAction } from "./actions";

// Painel para buscar certificados por e-mail ou CPF e corrigir os dados (nome, CPF, carga e datas).
export const dynamic = "force-dynamic";

type Cert = {
  id: string;
  codigo: string;
  email: string;
  curso_nome: string;
  nome_completo: string;
  cpf: string | null;
  carga_horaria_horas: number;
  forma: string;
  emitido_em: string;
  data_inicio: string | null;
  data_conclusao: string | null;
  hash_conferencia: string | null;
};

const cpfFormatado = (c: string | null) => (c && c.length === 11 ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}` : c ?? "");
const dia = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

export default async function AdminCertificadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; erro?: string; id?: string }>;
}) {
  const cookieStore = await cookies();
  if (!(await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value))) redirect("/admin/login");

  const { q = "", ok, erro, id: idErro } = await searchParams;
  const busca = q.trim();
  const soDigitos = busca.replace(/\D/g, "");
  const porCpf = !busca.includes("@") && soDigitos.length === 11;

  let certs: Cert[] = [];
  let falha = "";
  if (busca) {
    const { data, error } = await (criarClienteSupabaseAdmin() as unknown as SupabaseClient).rpc("admin_buscar_certificados", porCpf ? { p_cpf: soDigitos } : { p_email: busca });
    if (error) falha = error.message;
    certs = (data ?? []) as Cert[];
  }

  const campo = "mt-1 w-full border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900";
  const rotulo = "block text-xs font-semibold uppercase tracking-wide text-zinc-500";

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Certificados emitidos</h1>
        <p className="mb-6 text-sm text-zinc-500">Busque pelo e-mail do aluno (ou parte dele) ou pelo CPF e corrija os dados do certificado.</p>

        <form method="get" className="mb-8 flex gap-2">
          <input
            name="q"
            defaultValue={busca}
            placeholder="E-mail ou CPF"
            className="flex-1 border border-zinc-300 bg-white px-3 py-2 text-sm"
            autoFocus
          />
          <button className="bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">Buscar</button>
        </form>

        {falha && <p className="mb-4 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Erro na busca: {falha}</p>}
        {busca && !falha && certs.length === 0 && <p className="text-sm text-zinc-500">Nenhum certificado encontrado para “{busca}”.</p>}
        {certs.length > 0 && (
          <p className="mb-3 text-sm text-zinc-500">
            {certs.length} certificado{certs.length > 1 ? "s" : ""} encontrado{certs.length > 1 ? "s" : ""}
            {certs.length === 50 ? " (mostrando os 50 mais recentes; refine a busca)" : ""}.
          </p>
        )}

        <div className="flex flex-col gap-5">
          {certs.map((c) => (
            <section key={c.id} id={`c-${c.id}`} className="border border-zinc-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900">{c.curso_nome}</p>
                  <p className="text-xs text-zinc-500">
                    {c.email} · código {c.codigo} · {c.forma}
                    {c.hash_conferencia ? ` · conferência ${c.hash_conferencia.slice(0, 12).toUpperCase()}` : ""}
                  </p>
                </div>
                <a href={`/certificado/${c.codigo}`} target="_blank" className="text-sm text-zinc-600 underline hover:text-zinc-900">
                  Ver certificado ↗
                </a>
              </div>

              {ok === c.id && <p className="mb-3 border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Alterações salvas.</p>}
              {erro && idErro === c.id && <p className="mb-3 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>}

              <form action={salvarCertificadoAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="busca" value={busca} />
                <label className="sm:col-span-2">
                  <span className={rotulo}>Nome completo</span>
                  <input name="nome_completo" defaultValue={c.nome_completo} required className={campo} />
                </label>
                <label>
                  <span className={rotulo}>CPF</span>
                  <input name="cpf" defaultValue={cpfFormatado(c.cpf)} inputMode="numeric" className={campo} />
                </label>
                <label>
                  <span className={rotulo}>Carga horária (h)</span>
                  <input name="carga_horaria_horas" type="number" min={1} max={2000} defaultValue={c.carga_horaria_horas} required className={campo} />
                </label>
                <label>
                  <span className={rotulo}>Data de emissão</span>
                  <input name="emitido_em" type="date" defaultValue={dia(c.emitido_em)} required className={campo} />
                </label>
                <div />
                <label>
                  <span className={rotulo}>Início do curso</span>
                  <input name="data_inicio" type="date" defaultValue={c.data_inicio ?? ""} className={campo} />
                </label>
                <label>
                  <span className={rotulo}>Conclusão do curso</span>
                  <input name="data_conclusao" type="date" defaultValue={c.data_conclusao ?? ""} className={campo} />
                </label>
                <div className="flex items-center justify-between gap-3 sm:col-span-2">
                  <p className="text-xs text-zinc-500">Ao salvar, o código de conferência é recalculado e a alteração fica registrada.</p>
                  <button className="shrink-0 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">Salvar</button>
                </div>
              </form>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
