import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { salvarAjusteAction, salvarCertificadoAction } from "./actions";

// Painel para buscar certificados por e-mail ou CPF e corrigir os dados (nome, CPF, carga e datas),
// e para deixar ajustes prontos em matrículas que ainda não emitiram o certificado.
// Período (início e término) pelo painel: só no Assistente Administrativo de 80 h (regra do Wagner, 17/11/2026).
export const dynamic = "force-dynamic";

type Cert = {
  id: string;
  codigo: string;
  email: string;
  curso_slug: string;
  curso_nome: string;
  nome_completo: string;
  cpf: string | null;
  carga_horaria_horas: number;
  forma: string;
  emitido_em: string;
  data_inicio: string | null;
  data_conclusao: string | null;
  hash_conferencia: string | null;
  matriculado_em: string | null;
};

type Matricula = {
  user_id: string;
  email: string;
  curso_id: string;
  curso_slug: string;
  curso_nome: string;
  carga_horaria_horas: number;
  matriculado_em: string;
  tem_ajuste: boolean;
  nome_completo: string | null;
  cpf: string | null;
  data_inicio: string | null;
  data_conclusao: string | null;
};

const cpfFormatado = (c: string | null) => (c && c.length === 11 ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}` : c ?? "");
const dia = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
const br = (d: string) => d.slice(0, 10).split("-").reverse().join("/");

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
  let matriculas: Matricula[] = [];
  let falha = "";
  // cursos com certificado por etapas (Assistente Adm.): período só na carga completa
  const cargaCompletaEtapas = new Map<string, number>();
  if (busca) {
    const admin = criarClienteSupabaseAdmin() as unknown as SupabaseClient;
    const [r1, r2] = await Promise.all([
      admin.rpc("admin_buscar_certificados", porCpf ? { p_cpf: soDigitos } : { p_email: busca }),
      admin.rpc("admin_matriculas_sem_certificado", porCpf ? { p_cpf: soDigitos } : { p_email: busca }),
    ]);
    if (r1.error) falha = r1.error.message;
    if (r2.error) falha = r2.error.message;
    certs = (r1.data ?? []) as Cert[];
    matriculas = (r2.data ?? []) as Matricula[];
    const slugs = [...new Set([...certs, ...matriculas].map((x) => x.curso_slug))];
    if (slugs.length) {
      const { data: cursos } = await admin.from("cursos").select("slug, certificado_por_etapas, carga_horaria_horas").in("slug", slugs);
      for (const cu of (cursos ?? []) as { slug: string; certificado_por_etapas: boolean; carga_horaria_horas: number }[]) {
        if (cu.certificado_por_etapas) cargaCompletaEtapas.set(cu.slug, cu.carga_horaria_horas);
      }
    }
  }

  const campo = "mt-1 w-full border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900";
  const rotulo = "block text-xs font-semibold uppercase tracking-wide text-zinc-500";
  const avisoOk = <p className="mb-3 border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Alterações salvas.</p>;
  const avisoErro = <p className="mb-3 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>;

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Certificados</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Busque pelo e-mail do aluno (ou parte dele) ou pelo CPF. Corrija certificados emitidos ou deixe os dados prontos para quem ainda vai emitir.
        </p>

        <form method="get" className="mb-8 flex gap-2">
          <input name="q" defaultValue={busca} placeholder="E-mail ou CPF" className="flex-1 border border-zinc-300 bg-white px-3 py-2 text-sm" autoFocus />
          <button className="bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">Buscar</button>
        </form>

        {falha && <p className="mb-4 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Erro na busca: {falha}</p>}
        {busca && !falha && certs.length === 0 && matriculas.length === 0 && (
          <p className="text-sm text-zinc-500">Nada encontrado para “{busca}”.{porCpf ? " Antes da emissão não há CPF registrado: busque pelo e-mail." : ""}</p>
        )}

        {certs.length > 0 && <h2 className="mb-3 text-lg font-bold text-zinc-900">Certificados emitidos ({certs.length})</h2>}
        <div className="flex flex-col gap-5">
          {certs.map((c) => {
            // período: o do certificado, ou sugestão (matrícula até a emissão)
            const inicioPadrao = c.data_inicio ?? (c.matriculado_em ? dia(c.matriculado_em) : dia(c.emitido_em));
            const terminoPadrao = c.data_conclusao ?? dia(c.emitido_em);
            const cargaCompleta = cargaCompletaEtapas.get(c.curso_slug);
            const comPeriodo = cargaCompleta === undefined || c.carga_horaria_horas === cargaCompleta || c.carga_horaria_horas === 60;
            return (
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

                {ok === c.id && avisoOk}
                {erro && idErro === c.id && avisoErro}

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
                  {comPeriodo ? (
                    <>
                      <label>
                        <span className={rotulo}>Início do curso</span>
                        <input name="data_inicio" type="date" defaultValue={inicioPadrao} required className={campo} />
                      </label>
                      <label>
                        <span className={rotulo}>Término do curso</span>
                        <input name="data_conclusao" type="date" defaultValue={terminoPadrao} required className={campo} />
                      </label>
                      <p className="text-xs text-zinc-500 sm:col-span-2">
                        Ao salvar, o certificado diz &quot;realizado de [início] a [término]&quot;.
                        {!c.data_inicio ? " Hoje ele mostra só a data de emissão; as datas acima são sugestão (matrícula e emissão)." : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-zinc-500 sm:col-span-2">
                      Certificado por etapas: o período (início e término) só entra no de 60 h ou no de {cargaCompleta} h. Para incluir, mude a carga para 60 ou {cargaCompleta} h e salve; os campos aparecem em seguida.
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-3 sm:col-span-2">
                    <p className="text-xs text-zinc-500">Ao salvar, o código de conferência é recalculado e a alteração fica registrada.</p>
                    <button className="shrink-0 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">Salvar</button>
                  </div>
                </form>
              </section>
            );
          })}
        </div>

        {matriculas.length > 0 && (
          <>
            <h2 className="mb-1 mt-10 text-lg font-bold text-zinc-900">Ainda sem certificado ({matriculas.length})</h2>
            <p className="mb-3 text-sm text-zinc-500">
              Os dados salvos aqui entram no certificado quando o aluno pagar e emitir. Campos em branco ficam como o aluno preencher.
            </p>
          </>
        )}
        <div className="flex flex-col gap-5">
          {matriculas.map((m) => {
            const ancora = `m-${m.user_id}-${m.curso_id}`;
            const salvo = m.tem_ajuste;
            return (
              <section key={ancora} id={ancora} className="border border-dashed border-zinc-300 bg-white p-5">
                <div className="mb-4">
                  <p className="font-semibold text-zinc-900">{m.curso_nome}</p>
                  <p className="text-xs text-zinc-500">
                    {m.email} · matrícula em {br(m.matriculado_em)} · {salvo ? "ajuste salvo" : "sem ajuste"}
                  </p>
                </div>

                {ok === ancora && avisoOk}
                {erro && idErro === ancora && avisoErro}

                <form action={salvarAjusteAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <input type="hidden" name="curso_id" value={m.curso_id} />
                  <input type="hidden" name="curso_slug" value={m.curso_slug} />
                  <input type="hidden" name="busca" value={busca} />
                  <label className="sm:col-span-2">
                    <span className={rotulo}>Nome completo no certificado</span>
                    <input name="nome_completo" defaultValue={m.nome_completo ?? ""} className={campo} />
                  </label>
                  <label>
                    <span className={rotulo}>CPF</span>
                    <input name="cpf" defaultValue={cpfFormatado(m.cpf)} inputMode="numeric" className={campo} />
                  </label>
                  <div />
                  <label>
                    <span className={rotulo}>Início do curso</span>
                    <input name="data_inicio" type="date" defaultValue={m.data_inicio ?? ""} required className={campo} />
                  </label>
                  <label>
                    <span className={rotulo}>Término do curso</span>
                    <input name="data_conclusao" type="date" defaultValue={m.data_conclusao ?? ""} required className={campo} />
                  </label>
                  <p className="text-xs text-zinc-500 sm:col-span-2">
                    {salvo
                      ? "Dados salvos por você."
                      : "Dados sugeridos: nome do cadastro, CPF de outro certificado do aluno, início na matrícula e término na última aula ou prova. Confira e salve."}
                    {cargaCompletaEtapas.has(m.curso_slug)
                      ? ` Certificado por etapas: o período só entra se for emitido com 60 h ou ${cargaCompletaEtapas.get(m.curso_slug)} h.`
                      : ""}
                  </p>
                  <div className="flex justify-end sm:col-span-2">
                    <button className="bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">Salvar ajuste</button>
                  </div>
                </form>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
