import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { dadosCartaoCompra } from "@/lib/cartao-transparente";
import { formatarReais } from "@/lib/curso-pago";
import {
  AREA_FORMACAO,
  CURSOS_FORMACAO,
  CURSOS_SLUGS_FORMACAO,
  FORMACAO_ELETRICISTA,
  PRODUTO_FORMACAO_CARTAO,
  PRODUTO_FORMACAO_PIX,
  produtoPixFormacao,
} from "@/lib/formacao-eletricista";
import { ComprarFormacao } from "./ComprarFormacao";
import { PixelFormacao } from "@/components/meta-pixel";

export const metadata: Metadata = { title: "Formação Inicial para Eletricista", robots: { index: false } };

// Área do aluno da formação: sem compra, mostra o pagamento; com compra, os 3 cursos liberados.
export default async function FormacaoEletricistaAreaPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cadastro?next=${encodeURIComponent(AREA_FORMACAO)}`);

  const [{ data: produtos }, { data: acessos }, { data: cursos }] = await Promise.all([
    supabase.from("produtos").select("slug, preco_centavos").in("slug", [PRODUTO_FORMACAO_PIX, PRODUTO_FORMACAO_CARTAO]).eq("ativo", true),
    supabase.from("acessos").select("produtos!inner(slug)").in("produtos.slug", [PRODUTO_FORMACAO_PIX, PRODUTO_FORMACAO_CARTAO]),
    supabase.from("cursos").select("id, slug, nome, carga_horaria_horas").in("slug", [...CURSOS_SLUGS_FORMACAO]),
  ]);
  const comprou = (acessos ?? []).length > 0;
  const preco = new Map((produtos ?? []).map((p) => [p.slug, p.preco_centavos]));
  const valorPix = preco.get(produtoPixFormacao()) ?? FORMACAO_ELETRICISTA.precoNormalCentavos;
  const valorCartao = preco.get(PRODUTO_FORMACAO_CARTAO) ?? FORMACAO_ELETRICISTA.precoNormalCentavos;

  if (!comprou) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-2 font-body">
        <PixelFormacao />
        <CabecalhoSite aluno logado />
        <main className="mx-auto flex w-full max-w-[640px] flex-1 items-center px-6 py-14">
          <div className="w-full border border-[#D7DEE6] bg-white p-8">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
              3 cursos · 3 certificados · {FORMACAO_ELETRICISTA.horasTotais} h
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">{FORMACAO_ELETRICISTA.nome}</h1>
            <ul className="mt-4 flex flex-col gap-2 text-[15px] text-[#2B3A52]">
              {CURSOS_FORMACAO.map((c) => (
                <li key={c.n} className="flex gap-2">
                  <span aria-hidden className="font-bold text-accent-2">
                    ✓
                  </span>
                  {c.nome} ({c.horas} h)
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[15px] leading-relaxed text-[#516278]">
              Pagamento único de <strong className="text-[#14213A]">{formatarReais(valorPix)}</strong> no PIX
              {valorCartao !== valorPix ? (
                <>
                  {" "}
                  ou <strong className="text-[#14213A]">{formatarReais(valorCartao)}</strong> em até 3x sem juros no cartão
                </>
              ) : (
                " ou em até 3x sem juros no cartão"
              )}
              . Assim que o pagamento cair, os três cursos são liberados nesta página.
            </p>
            <div className="mt-6">
              <ComprarFormacao
                precoPix={formatarReais(valorPix)}
                valorPixCentavos={valorPix}
                valorCartaoCentavos={valorCartao}
                cartao={dadosCartaoCompra(PRODUTO_FORMACAO_CARTAO, user)}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const ordem = (slug: string) => CURSOS_SLUGS_FORMACAO.indexOf(slug as (typeof CURSOS_SLUGS_FORMACAO)[number]);
  const lista = [...(cursos ?? [])].sort((a, b) => ordem(a.slug) - ordem(b.slug));
  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite aluno logado />
      <main className="mx-auto w-full max-w-[820px] flex-1 px-6 py-14">
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Compra confirmada</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">{FORMACAO_ELETRICISTA.nome}</h1>
        <p className="mt-2 text-[15.5px] text-[#516278]">Seus três cursos estão liberados. Cada um tem o seu certificado.</p>
        <div className="mt-7 flex flex-col gap-3">
          {lista.map((c, i) => (
            <Link
              key={c.slug}
              href={`/minha-area/cursos/${c.slug}`}
              className="flex items-center justify-between gap-4 border border-[#D7DEE6] bg-white p-5 transition-colors hover:border-brand"
            >
              <span>
                <span className="font-display text-2xl font-extrabold text-accent">{i + 1}</span>
                <span className="ml-3 font-display text-[17px] font-bold text-[#14213A]">{c.nome}</span>
                <span className="ml-2 font-data text-[13px] text-[#516278]">{c.carga_horaria_horas} h</span>
              </span>
              <span className="shrink-0 font-bold text-brand">Estudar →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
