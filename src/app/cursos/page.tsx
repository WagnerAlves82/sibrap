import { textoParcela } from "@/lib/apostilas";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { criarClienteSupabasePublico } from "@/lib/supabase-publico";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { VitrineCursos, type CursoVitrine } from "@/components/vitrine-cursos";

// Página igual para todos os visitantes: a Vercel guarda em cache e refaz no máximo a cada 1 h
// (gasta CPU só nessa hora, não a cada visita). Nada de cookies aqui — ver src/lib/supabase-publico.ts.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cursos online com certificado",
  alternates: { canonical: "/cursos" },
  description:
    "Cursos livres do SIBRAP, 100% online, com certificado e QR Code de validação: cursos gratuitos e cursos profissionalizantes com pagamento único no PIX.",
  // prévia do link no WhatsApp/Facebook (a imagem é opengraph-image.jpg desta pasta)
  openGraph: {
    title: "Cursos online grátis com certificado | SIBRAP",
    description:
      "Agente de Portaria, Call Center, Camareira, Auxiliar Administrativo, Informática com IA e mais. 100% online, com certificado e QR Code de validação.",
    url: "/cursos",
    siteName: "SIBRAP",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cursos online grátis com certificado | SIBRAP",
    description: "Agente de Portaria, Call Center, Camareira, Auxiliar Administrativo, Informática com IA e mais.",
  },
};

export default async function CursosPage() {
  const supabase = criarClienteSupabasePublico();

  const [{ data: cursos }, { data: pagos }, { data: avaliacoes }] = await Promise.all([
    supabase.from("cursos").select("id, slug, nome, descricao, carga_horaria_horas, categoria").eq("ativo", true).order("criado_em"),
    // cursos pagos têm produto ativo 'curso-<slug>'; os demais são gratuitos (só o certificado é pago)
    supabase.from("produtos").select("slug, preco_centavos").like("slug", "curso-%").eq("ativo", true),
    // média real da pesquisa de satisfação (só cursos com 3+ respostas)
    supabase.rpc("avaliacoes_cursos"),
  ]);
  const precoDoCurso = new Map(
    (pagos ?? []).map((p) => [
      p.slug.slice("curso-".length),
      `${(p.preco_centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ou ${textoParcela(p.preco_centavos)}`,
    ])
  );
  const notaDoCurso = new Map((avaliacoes ?? []).map((a) => [a.curso_id, { media: Number(a.media), total: Number(a.total) }]));
  const vitrine: CursoVitrine[] = (cursos ?? []).map((c) => ({
    slug: c.slug,
    nome: c.nome,
    descricao: c.descricao,
    carga_horaria_horas: c.carga_horaria_horas,
    categoria: c.categoria,
    preco: precoDoCurso.get(c.slug) ?? null,
    avaliacao: notaDoCurso.get(c.id) ?? null,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-14">
        <Reveal>
          <p className="font-data text-xs uppercase tracking-[0.2em] text-accent-2">
            Educação que transforma vidas e o futuro
          </p>
          <h1 className="mt-3 max-w-[18ch] font-display text-4xl font-extrabold text-[#14213A] sm:text-5xl">
            Cursos online com certificado.
          </h1>
          <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-[#516278]">
            Cursos curtos e práticos para conseguir sua vaga, no celular ou no
            computador, com certificado validado por QR Code.
          </p>
        </Reveal>

        {vitrine.length ? <VitrineCursos cursos={vitrine} /> : <p className="mt-10 text-[#516278]">Novos cursos em breve.</p>}

        {(cursos?.length ?? 0) >= 2 && (
          <Reveal delay={200}>
            <Link
              href="/cursos/combo"
              className="group mt-12 grid overflow-hidden border-2 border-accent bg-white transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.3)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_auto] md:items-center"
            >
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <Image
                  src="/combo-informatica-atendimento.webp"
                  alt="Combo de 2 cursos: Informática Básica com IA e Atendimento ao Cliente"
                  fill
                  sizes="(min-width: 768px) 360px, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="px-6 pt-6 md:py-6">
                <span className="font-data text-xs font-semibold uppercase tracking-wide text-accent">
                  Combo · para o currículo do jovem aprendiz
                </span>
                <h2 className="mt-1 font-display text-xl font-extrabold text-[#14213A]">
                  Leve os 2 cursos por R$ 39,90, com certificação válida em todo o Brasil
                </h2>
                <p className="mt-1 text-[14.5px] text-[#516278]">
                  Informática Básica com IA + Atendimento ao Cliente, em vez de R$ 29,90 cada um.
                </p>
              </div>
              <span className="m-6 inline-flex w-fit shrink-0 items-center bg-accent px-6 py-3 text-[14.5px] font-bold text-accent-ink transition-[filter] group-hover:brightness-95">
                Conheça o combo
              </span>
            </Link>
          </Reveal>
        )}
      </main>

      <RodapeSite />
    </div>
  );
}
