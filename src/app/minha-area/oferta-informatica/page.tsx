import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { dadosCartaoCompra } from "@/lib/cartao-transparente";
import { OFERTA_INFORMATICA, ofertaInformaticaValida, produtoOfertaInformatica } from "@/lib/oferta-informatica";
import { ComprarOfertaInformatica, type CursoOferta } from "./ComprarOferta";

export const metadata: Metadata = { title: "Oferta: Informática + 1 curso", robots: { index: false } };

const reais = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ate = new Date(OFERTA_INFORMATICA.validoAte).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite aluno logado />
      <main className="mx-auto w-full max-w-[680px] flex-1 px-6 py-12">{children}</main>
    </div>
  );
}

// Oferta exclusiva por e-mail: escolhe o segundo curso e paga os 2 certificados juntos.
export default async function OfertaInformaticaPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cadastro?next=${encodeURIComponent(OFERTA_INFORMATICA.caminho)}`);

  const { data: comprados } = await supabase
    .from("acessos")
    .select("produtos!inner(slug)")
    .like("produtos.slug", `${OFERTA_INFORMATICA.prefixoProduto}%`);
  const compra = (comprados ?? [])[0]?.produtos.slug;

  if (compra) {
    const segundo = compra.slice(OFERTA_INFORMATICA.prefixoProduto.length);
    const slugs = [OFERTA_INFORMATICA.cursoBase, segundo];
    await Promise.all(slugs.map((s) => supabase.rpc("matricular_curso", { p_curso_slug: s })));
    const { data: cursos } = await supabase.from("cursos").select("slug, nome, carga_horaria_horas").in("slug", slugs);
    const lista = slugs.map((s) => (cursos ?? []).find((c) => c.slug === s)).filter((c) => !!c);
    return (
      <Moldura>
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Compra confirmada</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">Seus 2 certificados estão garantidos 🎉</h1>
        <p className="mt-2 text-[15.5px] text-[#516278]">Os dois cursos já estão liberados. Conclua cada um e emita o certificado na página do curso.</p>
        <div className="mt-7 flex flex-col gap-3">
          {lista.map((c) => (
            <Link
              key={c.slug}
              href={`/minha-area/cursos/${c.slug}`}
              className="flex items-center justify-between gap-4 border border-[#D7DEE6] bg-white p-5 transition-colors hover:border-brand"
            >
              <span className="font-display text-[17px] font-bold text-[#14213A]">
                {c.nome} <span className="font-data text-[13px] font-normal text-[#516278]">{c.carga_horaria_horas} h</span>
              </span>
              <span className="shrink-0 font-bold text-brand">Estudar →</span>
            </Link>
          ))}
        </div>
      </Moldura>
    );
  }

  if (!(await ofertaInformaticaValida(user.email))) {
    return (
      <Moldura>
        <h1 className="font-display text-2xl font-extrabold text-[#14213A]">Esta oferta não está disponível</h1>
        <p className="mt-2 text-[15.5px] text-[#516278]">
          Ela era exclusiva para quem recebeu o convite por e-mail e valia até {ate}. Os cursos continuam gratuitos.
        </p>
        <Link href="/cursos" className="mt-6 inline-block bg-accent px-6 py-3 font-bold text-accent-ink">
          Ver os cursos gratuitos →
        </Link>
      </Moldura>
    );
  }

  const [{ data: produtos }, { data: certs }] = await Promise.all([
    supabase.from("produtos").select("slug, preco_centavos").like("slug", `${OFERTA_INFORMATICA.prefixoProduto}%`).eq("ativo", true),
    supabase.from("produtos").select("slug, preco_centavos").like("slug", "certificado-%").eq("ativo", true),
  ]);
  const slugsCursos = (produtos ?? []).map((p) => p.slug.slice(OFERTA_INFORMATICA.prefixoProduto.length));
  const { data: cursosDb } = await supabase
    .from("cursos")
    .select("slug, nome, carga_horaria_horas, categoria")
    .in("slug", slugsCursos)
    .eq("ativo", true)
    .order("nome");
  const precoCert = (slug: string) => (certs ?? []).find((p) => p.slug === `certificado-${slug}`)?.preco_centavos ?? 0;
  const cursos: CursoOferta[] = (cursosDb ?? []).map((c) => ({
    slug: c.slug,
    nome: c.nome,
    horas: c.carga_horaria_horas,
    categoria: c.categoria ?? "Outros",
    precoSeparadoCentavos: precoCert(c.slug),
  }));
  const valor = (produtos ?? [])[0]?.preco_centavos ?? OFERTA_INFORMATICA.precoCentavos;
  const cartoes = Object.fromEntries(cursos.map((c) => [c.slug, dadosCartaoCompra(produtoOfertaInformatica(c.slug), user)]));

  return (
    <Moldura>
      <div className="border border-[#D7DEE6] bg-white p-7">
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Oferta exclusiva · até {ate}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">Informática + 1 curso à sua escolha</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
          Dois certificados com carga horária completa e QR Code por <strong className="text-[#14213A]">{reais(valor)}</strong>, no PIX ou
          no cartão. O de <strong className="text-[#14213A]">Informática Básica com IA (60 h)</strong> e o de mais um curso que você escolhe
          abaixo. Os cursos continuam no seu ritmo: o certificado sai quando você concluir cada um.
        </p>
        <div className="mt-6">
          <ComprarOfertaInformatica cursos={cursos} valorCentavos={valor} precoInformaticaCentavos={precoCert(OFERTA_INFORMATICA.cursoBase)} cartoes={cartoes} />
        </div>
      </div>
    </Moldura>
  );
}
