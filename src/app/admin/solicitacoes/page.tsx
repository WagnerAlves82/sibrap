import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { STATUS_SOLICITACAO, TIPOS_SOLICITACAO } from "@/app/solicitacao/tipos";
import { apagarSolicitacao, atualizarSolicitacao } from "./actions";

export const dynamic = "force-dynamic";

type Solicitacao = {
  id: string;
  criado_em: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  tipo: string;
  descricao: string;
  origem: string | null;
  status: string;
  nota_admin: string | null;
};

const COR: Record<string, string> = {
  nova: "bg-amber-100 text-amber-900",
  em_analise: "bg-sky-100 text-sky-900",
  respondida: "bg-emerald-100 text-emerald-900",
  recusada: "bg-zinc-200 text-zinc-700",
};

export default async function AdminSolicitacoesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const cookieStore = await cookies();
  if (!(await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value))) redirect("/admin/login");
  const { status } = await searchParams;
  const filtro = STATUS_SOLICITACAO.some((s) => s.valor === status) ? status : undefined;

  const admin = criarClienteSupabaseAdmin() as unknown as SupabaseClient;
  let consulta = admin.from("solicitacoes").select("*").order("criado_em", { ascending: false }).limit(300);
  if (filtro) consulta = consulta.eq("status", filtro);
  const { data, error } = await consulta;
  const lista = (data ?? []) as Solicitacao[];
  const tipo = new Map<string, string>(TIPOS_SOLICITACAO.map((t) => [t.valor, t.rotulo]));
  const rotuloStatus = new Map<string, string>(STATUS_SOLICITACAO.map((s) => [s.valor, s.rotulo]));
  const quando = (d: string) =>
    new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const zap = (w: string) => {
    const n = w.replace(/\D/g, "");
    return `https://wa.me/${n.startsWith("55") ? n : `55${n}`}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Solicitações</h1>
        <p className="mb-4 text-sm text-zinc-500">
          Pedidos enviados pelo formulário <a href="/solicitacao" target="_blank" className="underline">sibrap.tec.br/solicitacao</a>.
          Link já preenchido: <code>/solicitacao?tipo=pacote&amp;origem=whatsapp</code>
        </p>
        <nav className="mb-6 flex flex-wrap gap-2 text-sm">
          <Link href="/admin/solicitacoes" className={`border px-3 py-1.5 ${!filtro ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700"}`}>
            Todas
          </Link>
          {STATUS_SOLICITACAO.map((s) => (
            <Link
              key={s.valor}
              href={`/admin/solicitacoes?status=${s.valor}`}
              className={`border px-3 py-1.5 ${filtro === s.valor ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700"}`}
            >
              {s.rotulo}
            </Link>
          ))}
        </nav>
        {error && <p className="bg-red-50 p-4 text-sm text-red-700">Erro ao carregar: {error.message}</p>}
        {!error && lista.length === 0 && <p className="text-sm text-zinc-500">Nenhuma solicitação.</p>}
        <div className="flex flex-col gap-4">
          {lista.map((s) => (
            <article key={s.id} className="border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 font-semibold ${COR[s.status] ?? ""}`}>{rotuloStatus.get(s.status) ?? s.status}</span>
                <span className="font-semibold text-zinc-900">{tipo.get(s.tipo) ?? s.tipo}</span>
                <span className="text-zinc-500">· {quando(s.criado_em)}</span>
                {s.origem && <span className="text-zinc-500">· origem: {s.origem}</span>}
              </div>
              <p className="mt-2 text-sm text-zinc-800">
                <b>{s.nome}</b> ·{" "}
                <a href={`mailto:${s.email}`} className="underline">{s.email}</a>
                {s.whatsapp && (
                  <>
                    {" "}·{" "}
                    <a href={zap(s.whatsapp)} target="_blank" rel="noreferrer" className="underline">WhatsApp {s.whatsapp}</a>
                  </>
                )}
              </p>
              <p className="mt-3 whitespace-pre-wrap border-l-4 border-amber-400 pl-3 text-[15px] text-zinc-800">{s.descricao}</p>
              <form action={atualizarSolicitacao} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
                <input type="hidden" name="id" value={s.id} />
                <select name="status" defaultValue={s.status} className="border border-zinc-300 bg-white px-2 py-1.5 text-sm">
                  {STATUS_SOLICITACAO.map((o) => (
                    <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                  ))}
                </select>
                <textarea
                  name="nota"
                  defaultValue={s.nota_admin ?? ""}
                  rows={2}
                  placeholder="Anotação interna (proposta, valor, próximo passo)"
                  className="flex-1 border border-zinc-300 px-2 py-1.5 text-sm"
                />
                <button type="submit" className="bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700">
                  Salvar
                </button>
              </form>
              <form action={apagarSolicitacao} className="mt-2 text-right">
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="text-xs text-zinc-400 underline hover:text-red-700">
                  Apagar
                </button>
              </form>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
