import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { dadosCartaoCompra } from "@/lib/cartao-transparente";
import { formatarReais } from "@/lib/curso-pago";
import {
  AREA_FORMACAO_PORTARIA,
  CURSOS_FORMACAO_PORTARIA,
  CURSOS_SLUGS_FORMACAO_PORTARIA,
  FORMACAO_PORTARIA,
  PRODUTO_FORMACAO_PORTARIA,
} from "@/lib/formacao-portaria";
import { ComprarFormacaoPortaria } from "./ComprarFormacao";

export const metadata: Metadata = { title: "Formação Profissional em Portaria e Condomínios", robots: { index: false } };

// Área da formação: sem compra, mostra o pagamento; com compra, matricula nos 3 cursos (gratuitos) e lista os links.
export default async function FormacaoPortariaAreaPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cadastro?next=${encodeURIComponent(AREA_FORMACAO_PORTARIA)}`);

  const [{ data: produto }, { data: acessos }, { data: cursos }] = await Promise.all([
    supabase.from("produtos").select("preco_centavos").eq("slug", PRODUTO_FORMACAO_PORTARIA).eq("ativo", true).maybeSingle(),
    supabase.from("acessos").select("produtos!inner(slug)").eq("produtos.slug", PRODUTO_FORMACAO_PORTARIA),
    supabase.from("cursos").select("id, slug, nome, carga_horaria_horas").in("slug", [...CURSOS_SLUGS_FORMACAO_PORTARIA]),
  ]);
  const comprou = (acessos ?? []).length > 0;
  const valor = produto?.preco_centavos ?? FORMACAO_PORTARIA.precoCentavos;

  if (!comprou) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-2 font-body">
        <CabecalhoSite aluno logado />
        <main className="mx-auto flex w-full max-w-[640px] flex-1 items-center px-6 py-14">
          <div className="w-full border border-[#D7DEE6] bg-white p-8">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
              3 cursos · 3 certificados · {FORMACAO_PORTARIA.horasTotais} h
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">{FORMACAO_PORTARIA.nome}</h1>
            <ul className="mt-4 flex flex-col gap-2 text-[15px] text-[#2B3A52]">
              {CURSOS_FORMACAO_PORTARIA.map((c) => (
                <li key={c.n} className="flex gap-2">
                  <span aria-hidden className="font-bold text-accent-2">
                    ✓
                  </span>
                  {c.nome} ({c.horas} h)
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[15px] leading-relaxed text-[#516278]">
              Pagamento único de <strong className="text-[#14213A]">{formatarReais(valor)}</strong> no PIX ou em até 3x sem
              juros no cartão. Assim que o pagamento cair, os três cursos e certificados são liberados nesta página.
            </p>
            <div className="mt-6">
              <ComprarFormacaoPortaria
                preco={formatarReais(valor)}
                valorCentavos={valor}
                cartao={dadosCartaoCompra(PRODUTO_FORMACAO_PORTARIA, user)}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // cursos gratuitos: matricula nos 3 (idempotente) para o aluno já cair estudando
  await Promise.all(CURSOS_SLUGS_FORMACAO_PORTARIA.map((s) => supabase.rpc("matricular_curso", { p_curso_slug: s })));

  const ordem = (slug: string) => CURSOS_SLUGS_FORMACAO_PORTARIA.indexOf(slug as (typeof CURSOS_SLUGS_FORMACAO_PORTARIA)[number]);
  const lista = [...(cursos ?? [])].sort((a, b) => ordem(a.slug) - ordem(b.slug));
  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite aluno logado />
      <main className="mx-auto w-full max-w-[820px] flex-1 px-6 py-14">
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Compra confirmada</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">{FORMACAO_PORTARIA.nome}</h1>
        <p className="mt-2 text-[15.5px] text-[#516278]">
          Seus três cursos estão liberados, e os três certificados já estão pagos: é só concluir cada curso.
        </p>
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
