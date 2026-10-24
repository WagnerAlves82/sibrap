import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { formatarHoras } from "@/lib/emissor";
import { PagamentoCombo } from "./PagamentoCombo";

const CURSOS_SLUGS = ["informatica-basica-ia", "atendimento-ao-cliente"] as const;

const titulo = "Combo: Informática Básica com IA + Atendimento ao Cliente";
const descricao =
  "As aulas são gratuitas. Pague uma única vez por PIX e receba os 2 certificados, com QR Code de validação.";

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: "/cursos/combo" },
  openGraph: {
    url: "/cursos/combo",
    locale: "pt_BR",
    title: titulo,
    description: descricao,
    type: "website",
    images: [{ url: "/combo-informatica-atendimento.webp", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: descricao,
    images: ["/combo-informatica-atendimento.webp"],
  },
};

export default async function ComboCursosPage() {
  const supabase = await criarClienteSupabaseServer();
  const admin = criarClienteSupabaseAdmin();

  const [{ data: userData }, { data: produto }, { data: cursos }] = await Promise.all([
    supabase.auth.getUser(),
    admin.from("produtos").select("id, nome, preco_centavos, ativo").eq("slug", "combo-informatica-atendimento").maybeSingle(),
    admin
      .from("cursos")
      .select("slug, nome, descricao, carga_horaria_horas")
      .in("slug", CURSOS_SLUGS),
  ]);
  if (!produto) notFound();

  const user = userData.user;
  const logado = !!user;

  const { data: acesso } = user
    ? await supabase.from("acessos").select("id").eq("produto_id", produto.id).maybeSingle()
    : { data: null };
  const tem = !!acesso;
  if (!tem && !produto.ativo) notFound();

  const lista = CURSOS_SLUGS.map((slug) => cursos?.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => !!c
  );
  const cargaTotal = lista.reduce((s, c) => s + c.carga_horaria_horas, 0);

  const preco = (produto.preco_centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const precoUnitario = (2990 / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const ctaNext = "/cursos/combo";

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <CabecalhoSite logado={logado} />

      <section className="overflow-hidden border-b border-[#D7DEE6] bg-surface-2 py-16">
        <div className="mx-auto grid max-w-[1100px] items-center gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Combo · 2 cursos gratuitos, 2 certificados
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] text-[#14213A] sm:text-5xl">
              {produto.nome}
            </h1>
            <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-[#516278]">{descricao}</p>
          </div>
          <Image
            src="/combo-informatica-atendimento.webp"
            alt="Combo SIBRAP: Informática Básica com IA e Atendimento ao Cliente"
            width={1536}
            height={1024}
            priority
            sizes="(min-width: 1024px) 420px, 90vw"
            className="w-full rounded-xl shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)]"
          />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1000px] px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {lista.map((curso) => (
              <div key={curso.slug} className="rounded-xl border border-[#D7DEE6] bg-white p-6">
                <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
                  {formatarHoras(curso.carga_horaria_horas * 60)} · curso
                </p>
                <h2 className="mt-2 font-display text-xl font-extrabold text-[#14213A]">{curso.nome}</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#516278]">{curso.descricao}</p>
                <p className="mt-4 text-[13px] font-semibold text-[#516278]">
                  Certificado avulso: {precoUnitario}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border-2 border-accent bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent">
                  Combo · {formatarHoras(cargaTotal * 60)} de curso no total
                </p>
                <p className="mt-2 text-[14px] text-[#516278] line-through">
                  {precoUnitario} + {precoUnitario}
                </p>
                <p className="font-data text-4xl font-semibold text-[#14213A]">{preco}</p>
                <p className="mt-2 max-w-[42ch] text-[13.5px] leading-relaxed text-[#516278]">
                  As aulas dos dois cursos são gratuitas. O valor é só pelos 2 certificados, com QR Code de validação.
                </p>
              </div>

              <div className="w-full sm:max-w-[280px]">
                {tem ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-[14.5px] font-semibold text-accent-2">Pagamento confirmado 🎉</p>
                    {lista.map((curso) => (
                      <Link
                        key={curso.slug}
                        href={`/minha-area/cursos/${curso.slug}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-[14.5px] font-bold text-accent-ink transition-colors hover:brightness-105"
                      >
                        Abrir {curso.nome} <span aria-hidden>→</span>
                      </Link>
                    ))}
                  </div>
                ) : logado ? (
                  <PagamentoCombo />
                ) : (
                  <Link
                    href={`/cadastro?next=${encodeURIComponent(ctaNext)}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
                  >
                    Criar conta e comprar <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <RodapeSite />
    </div>
  );
}
