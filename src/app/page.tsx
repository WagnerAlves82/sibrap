import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { CarrosselHome, type SlideComCta } from "@/components/carrossel-home";
import { VitrineApostilas } from "@/components/vitrine-apostilas";
import { VitrinePosts } from "@/components/vitrine-posts";
import { SeloAbed } from "@/components/selo-abed";
import { Reveal } from "@/components/reveal";
import { diasAte, formatarDataIso, formatarPreco, listarApostilasPublicadas } from "@/lib/apostilas";
import { listarPostsPublicados } from "@/lib/blog";
import { SLIDES_HOME } from "@/lib/home-slides";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [apostilas, posts, { data: iscaTranspetro }] = await Promise.all([
    listarApostilasPublicadas(supabase),
    listarPostsPublicados(supabase, { limite: 6 }),
    supabase.from("produtos").select("ativo").eq("slug", "simulado-gratis").maybeSingle(),
  ]);
  // Isca gratuita do Transpetro desativada por ora (ver handle_new_user()
  // no banco e src/app/minha-area/page.tsx) — mesmo campo produtos.ativo
  // controla os dois lugares, reativar é só voltar ele a true.
  const iscaTranspetroAtiva = !!iscaTranspetro?.ativo;
  const slugsPublicados = new Set(apostilas.map((a) => a.slug));

  const slides: SlideComCta[] = SLIDES_HOME.map((s) => {
    const temApostila = !!s.apostilaSlug && slugsPublicados.has(s.apostilaSlug);
    return {
      ...s,
      href: temApostila ? `/apostilas/${s.apostilaSlug}` : "#apostilas",
      cta: temApostila ? "Ver a apostila" : "Ver apostilas disponíveis",
      emProducao: !temApostila,
    };
  });

  // Próxima prova entre as em destaque (barra superior)
  const proxima = SLIDES_HOME.map((s) => ({ s, dias: diasAte(s.provaIso) }))
    .filter((x) => x.dias !== null && x.dias >= 0)
    .sort((a, b) => a.dias! - b.dias!)[0];

  const preco = apostilas[0]?.preco_centavos ?? 3990;

  return (
    <div className="flex flex-1 flex-col bg-white font-body">
      {proxima && (
        <div className="bg-brand-deep text-[#C9D6E6]">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-[12.5px] sm:px-6">
            <span>
              <span className="mr-2 rounded bg-accent px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-accent-ink">
                Próxima prova
              </span>
              {proxima.s.orgao} · {formatarDataIso(proxima.s.provaIso)}
              <span className="mx-1.5 opacity-40">·</span>
              {proxima.dias === 0 ? "é hoje" : proxima.dias === 1 ? "falta 1 dia" : `faltam ${proxima.dias} dias`}
            </span>
            <span className="hidden sm:inline">Apostilas em PDF a partir de {formatarPreco(preco)}</span>
          </div>
        </div>
      )}

      <CabecalhoSite logado={!!user} />

      <CarrosselHome slides={slides} />

      {/* Vitrine de apostilas */}
      <section id="apostilas" className="scroll-mt-4 bg-[#F6F8FB] py-14 sm:py-16">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <Reveal className="mb-8 max-w-[60ch]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Apostilas
            </span>
            <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.3rem]">
              Escolha a apostila do seu concurso.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
              Material em PDF montado a partir do edital, com questões de
              treino e gabarito comentado. Pagamento único por PIX e download
              logo após a confirmação.
            </p>
          </Reveal>

          <VitrineApostilas apostilas={apostilas} />

          <div className="mt-8 text-center">
            <Link href="/apostilas" className="text-sm font-semibold text-brand underline underline-offset-4">
              Ver todas as apostilas
            </Link>
          </div>
        </div>
      </section>

      {/* Matérias sobre concursos */}
      {posts.length > 0 && (
        <section id="materias" className="scroll-mt-4 bg-[#FBF6EC] py-14 sm:py-16">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <Reveal className="mb-8 max-w-[60ch]">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand shadow-sm">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-2 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-2" />
                </span>
                Novidades toda semana
              </span>
              <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.3rem]">
                Fique por dentro dos concursos.
              </h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
                Editais novos, prazos de inscrição e dicas de estudo. Filtre
                por região, estado ou só concursos federais.
              </p>
            </Reveal>

            <VitrinePosts posts={posts} />

            <div className="mt-8 text-center">
              <Link href="/blog" className="text-sm font-semibold text-brand underline underline-offset-4">
                Ver todas as matérias
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Diferenciais */}
      <section className="border-y border-[#D7DEE6] bg-white py-12 sm:py-14">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <Reveal>
            <Diferencial
              icone={<IconeLivro />}
              titulo="Conteúdo completo"
              texto="Teoria na ordem do edital, com dicas, exemplos e resumos de cada capítulo."
            />
          </Reveal>
          <Reveal delay={90}>
            <Diferencial
              icone={<IconeChecklist />}
              titulo="Simulados realistas"
              texto="Questões inéditas no estilo da banca, com gabarito comentado e simulados finais."
            />
          </Reveal>
          <Reveal delay={180}>
            <Diferencial
              icone={<IconeAlvo />}
              titulo="Foco no seu resultado"
              texto="Cada apostila é feita para um cargo específico — sem matéria que não cai na sua prova."
            />
          </Reveal>
          <Reveal delay={270}>
            <Diferencial
              icone={<IconeEscudo />}
              titulo="Compra segura"
              texto="Pagamento por PIX pelo Mercado Pago. Confirmou, o download é liberado na sua área."
            />
          </Reveal>
        </div>
      </section>

      {/* Comece de graça */}
      <section id="gratis" className="overflow-hidden bg-surface-2 py-14 sm:py-16">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Reveal variante="esquerda" className="max-w-[60ch]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Comece de graça
            </span>
            <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.2rem]">
              Quer experimentar antes de comprar?
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-[15.5px] leading-relaxed text-[#516278]">
              {iscaTranspetroAtiva && (
                <li className="flex gap-2">
                  <span className="mt-0.5 text-accent-2" aria-hidden>✓</span>
                  <span>
                    <strong className="text-[#14213A]">Apostila e simulado grátis do concurso Transpetro</strong>{" "}
                    — Conhecimentos Básicos e um teste de 10 questões, no estilo da banca.
                  </span>
                </li>
              )}
              <li className="flex gap-2">
                <span className="mt-0.5 text-accent-2" aria-hidden>✓</span>
                <span>
                  <strong className="text-[#14213A]">Curso livre de Informática Básica com IA</strong>{" "}
                  — 40 horas, online e gratuito para quem precisa, com certificado validável.
                </span>
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              {iscaTranspetroAtiva && (
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
                >
                  Fazer simulado grátis <span aria-hidden>→</span>
                </Link>
              )}
              <Link
                href="/cursos/informatica-basica-ia"
                className={iscaTranspetroAtiva ? "text-sm font-semibold text-brand underline underline-offset-4" : "inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"}
              >
                {iscaTranspetroAtiva ? "Conhecer o curso gratuito" : "Conhecer o curso gratuito →"}
              </Link>
              <SeloAbed altura={60} />
            </div>
          </Reveal>
          <Reveal variante="direita" delay={200}>
            <Image
              src="/alunos.png"
              alt="Alunos aprendendo juntos com os aplicativos do Office e o Copilot"
              width={1122}
              height={1402}
              sizes="(min-width: 1024px) 320px, 60vw"
              className="flutuar mx-auto h-auto w-full max-w-[240px] lg:max-w-none"
            />
          </Reveal>
        </div>
      </section>

      {/* Por que escolher */}
      <section id="sobre" className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <Reveal className="mb-10 max-w-[56ch]">
            <span className="text-sm font-semibold uppercase tracking-wide text-accent">
              Por que escolher a SIBRAP
            </span>
            <h2 className="mt-2 font-display text-[1.8rem] font-extrabold tracking-tight sm:text-[2.3rem]">
              Estudo direto ao ponto, do jeito que a prova cobra.
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
            <Reveal>
              <Motivo titulo="Feita a partir do edital">
                Cada apostila parte do conteúdo programático oficial do seu
                cargo. O que não é cobrado, não entra.
              </Motivo>
            </Reveal>
            <Reveal delay={100}>
              <Motivo titulo="Legislação conferida">
                As leis citadas são checadas em texto oficial, com aviso claro
                quando o edital ou uma lei muda.
              </Motivo>
            </Reveal>
            <Reveal delay={200}>
              <Motivo titulo="Preço justo, pagamento único">
                {formatarPreco(preco)} por apostila, sem mensalidade e sem
                assinatura. O arquivo é seu para sempre.
              </Motivo>
            </Reveal>
            <Reveal delay={300}>
              <Motivo titulo="Transparência">
                Somos um material de estudo independente, sem vínculo com
                bancas ou prefeituras. O edital oficial sempre prevalece.
              </Motivo>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <div className="bg-brand-deep py-12 text-white">
        <Reveal className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-4 sm:px-6">
          <div>
            <h2 className="max-w-[32ch] font-display text-2xl font-extrabold sm:text-3xl">
              Garanta sua apostila e seu simulado!
            </h2>
            <p className="mt-2 max-w-[48ch] text-sm text-[#B9CBDF]">
              Escolha o concurso, pague por PIX e comece a estudar hoje mesmo.
            </p>
          </div>
          <a
            href="#apostilas"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-4 text-base font-bold text-accent-ink shadow-lg transition-colors hover:brightness-105"
          >
            Escolher minha apostila <span aria-hidden>→</span>
          </a>
        </Reveal>
      </div>

      <RodapeSite />
    </div>
  );
}

function Diferencial({
  icone,
  titulo,
  texto,
}: {
  icone: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 shrink-0 text-accent-2">{icone}</div>
      <div>
        <h3 className="mb-1 font-body text-base font-bold text-[#14213A]">{titulo}</h3>
        <p className="text-sm leading-relaxed text-[#516278]">{texto}</p>
      </div>
    </div>
  );
}

function Motivo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-accent pl-5">
      <h3 className="font-display text-lg font-extrabold">{titulo}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[#B9CBDF]">{children}</p>
    </div>
  );
}

function IconeLivro() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5.2c0-.7.5-1.2 1.2-1.2H11v16H5.2A1.2 1.2 0 0 1 4 18.8V5.2Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 5.2c0-.7-.5-1.2-1.2-1.2H13v16h5.8c.7 0 1.2-.5 1.2-1.2V5.2Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconeChecklist() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconeAlvo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function IconeEscudo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6l-7-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m9 12 2.2 2.2L15.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
