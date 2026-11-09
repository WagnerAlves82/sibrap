import Link from "next/link";
import type { Metadata } from "next";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Alert } from "@/components/alert";
import { dadosCartaoCompra } from "@/lib/cartao-transparente";
import { apostilasComRedacao, saldoRedacao } from "@/lib/redacao-dados";
import { BANCAS } from "@/lib/redacao-bancas";
import { criarRedacaoAction, excluirRascunhoAction } from "./actions";
import { CompraExtra } from "./CompraExtra";
import { NovaRedacao } from "./NovaRedacao";

export const metadata: Metadata = { title: "Treino de Redação", robots: { index: false } };

const ERROS: Record<string, string> = {
  tema: "Escolha um tema da lista ou escreva o seu (mínimo de 8 letras).",
  limite: "Muitas redações novas em pouco tempo. Aguarde alguns minutos.",
  criar: "Não deu pra criar a redação agora. Tente de novo.",
};

export default async function RedacaoPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [saldo, apostilas, { data: redacoes }] = await Promise.all([
    saldoRedacao(user!.id),
    apostilasComRedacao(user!.id),
    supabase
      .from("redacoes")
      .select("id, tema, status, nota, nota_max, modo, criado_em, atualizado_em")
      .order("atualizado_em", { ascending: false })
      .limit(50),
  ]);

  const cartao = "border border-[#D7DEE6] bg-white p-6";

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-10 sm:px-6">
        <Link href="/minha-area" className="text-[13.5px] font-bold text-brand">← Minha área</Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A] sm:text-4xl">Treino de Redação</h1>
        <p className="mt-2 max-w-[640px] text-[15px] text-[#33465E]">
          Escreva, receba dicas enquanto desenvolve o texto e veja sua nota pela grade da banca.
        </p>

        {erro && ERROS[erro] && (
          <Alert variant="erro" claro className="mt-5 text-sm">{ERROS[erro]}</Alert>
        )}

        {saldo === null ? (
          <section className={`${cartao} mt-8`}>
            <p className="font-display text-lg font-extrabold text-[#14213A]">Bônus de quem tem apostila com redação</p>
            <p className="mt-2 text-[14.5px] text-[#33465E]">
              Com a apostila da PM-SP, PM-SC ou SEAD-AP você ganha 6 correções com nota da banca.
            </p>
            <Link href="/apostilas" className="mt-4 inline-block bg-accent px-5 py-2.5 text-[14.5px] font-bold text-accent-ink">
              Ver apostilas
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-[1fr_280px]">
              <div className={cartao}>
                <h2 className="font-display text-xl font-extrabold text-[#14213A]">Nova redação</h2>
                <NovaRedacao
                  acao={criarRedacaoAction}
                  apostilas={apostilas.map((a) => ({
                    id: a.id,
                    titulo: `${a.titulo} (${a.uf})`,
                    temas: BANCAS[a.slug]?.temas ?? [],
                    banca: BANCAS[a.slug]?.nome ?? "",
                  }))}
                />
              </div>
              <div className={`${cartao} flex flex-col`}>
                <p className="font-data text-xs font-semibold uppercase tracking-[0.12em] text-accent-2">Correções</p>
                <p className="mt-1 font-display text-5xl font-extrabold text-[#14213A]">{Math.max(0, saldo)}</p>
                <p className="mt-1 text-[13.5px] text-[#516278]">
                  Cada envio para nota gasta 1. As dicas ao vivo são grátis.
                </p>
                <div className="mt-auto pt-5">
                  <p className="mb-2 text-[13.5px] font-bold text-[#14213A]">+5 correções por R$ 6,90</p>
                  <CompraExtra cartao={dadosCartaoCompra("redacao-extra-5", user)} />
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-3 font-display text-xl font-extrabold text-[#14213A]">Minhas redações</h2>
              {!redacoes?.length ? (
                <p className="text-[14.5px] text-[#516278]">Nenhuma ainda. Comece pela primeira acima.</p>
              ) : (
                <ul className="divide-y divide-[#D7DEE6] border border-[#D7DEE6] bg-white">
                  {redacoes.map((r) => (
                    <li key={r.id} className="flex items-center gap-4 px-5 py-4">
                      <Link href={`/minha-area/redacao/${r.id}`} className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[#14213A]">{r.tema}</p>
                        <p className="text-[12.5px] text-[#516278]">
                          {r.modo === "simulado" ? "Simulado" : "Treino"} ·{" "}
                          {new Date(r.atualizado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                        </p>
                      </Link>
                      {r.status === "corrigida" ? (
                        <span className="font-data text-lg font-extrabold text-accent-2">
                          {String(r.nota).replace(".", ",")}/{r.nota_max}
                        </span>
                      ) : (
                        <>
                          <span className="text-[12.5px] font-bold text-[#8A5A00]">Rascunho</span>
                          <form action={excluirRascunhoAction.bind(null, r.id)}>
                            <button className="text-[12.5px] text-[#8B97A8] hover:text-[#B42318]" aria-label="Excluir rascunho">
                              Excluir
                            </button>
                          </form>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
      <RodapeSite />
    </div>
  );
}
