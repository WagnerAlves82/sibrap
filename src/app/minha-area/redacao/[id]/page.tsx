import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { CONTATO_ADMIN, saldoRedacao } from "@/lib/redacao-dados";
import { bancaDa } from "@/lib/redacao-bancas";
import type { Avaliacao } from "@/lib/redacao";
import { EditorRedacao } from "./EditorRedacao";
import { ResultadoRedacao } from "./ResultadoRedacao";

export const metadata: Metadata = { title: "Redação", robots: { index: false } };
// a correção com IA leva de 10 a 40 segundos
export const maxDuration = 60;

export default async function RedacaoEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: r } = await supabase
    .from("redacoes")
    .select("id, tema, texto, status, modo, nota, nota_max, avaliacao, sugestoes_usadas, criado_em, apostilas(slug, titulo, uf)")
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();

  const banca = bancaDa(r.apostilas?.slug);
  const saldo = r.status === "rascunho" ? await saldoRedacao(user!.id) : null;

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-3 py-6 sm:px-6">
        <Link prefetch={false} href="/minha-area/redacao" className="text-[13.5px] font-bold text-brand">← Minhas redações</Link>
        {r.status === "corrigida" && r.avaliacao ? (
          <ResultadoRedacao
            id={r.id}
            tema={r.tema}
            texto={r.texto}
            banca={banca.nome}
            avaliacao={r.avaliacao as unknown as Avaliacao}
          />
        ) : saldo === null ? (
          <section className="mt-6 max-w-[640px] border border-l-[4px] border-[#D7DEE6] border-l-accent bg-white p-6">
            <p className="font-display text-lg font-extrabold text-[#14213A]">Módulo indisponível</p>
            <p className="mt-2 text-[14.5px] text-[#33465E]">
              O bônus de redação vale até a data da prova do concurso da sua apostila, e esse prazo terminou.
            </p>
            <p className="mt-2 text-[14.5px] text-[#33465E]">
              Dúvidas? Fale com o admin:{" "}
              <a href={`mailto:${CONTATO_ADMIN}`} className="font-bold text-brand underline">{CONTATO_ADMIN}</a>
            </p>
          </section>
        ) : (
          <EditorRedacao
            id={r.id}
            tema={r.tema}
            textoInicial={r.texto}
            modo={r.modo === "simulado" ? "simulado" : "treino"}
            criadoEm={r.criado_em}
            banca={{ nome: banca.nome, linhasMin: banca.linhasMin, linhasMax: banca.linhasMax }}
            concurso={r.apostilas ? `${r.apostilas.titulo} (${r.apostilas.uf})` : ""}
            saldo={saldo}
            analisesUsadas={r.sugestoes_usadas}
          />
        )}
      </main>
    </div>
  );
}
