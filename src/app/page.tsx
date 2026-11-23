import { blackFridayAtiva } from "@/lib/black-friday";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { criarClienteSupabasePublico } from "@/lib/supabase-publico";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { CarrosselHome } from "@/components/carrossel-home";
import { VitrineApostilas } from "@/components/vitrine-apostilas";
import { VitrinePosts } from "@/components/vitrine-posts";
import { IconeSolido, type NomeIconeSolido } from "@/components/icones-solidos";
import { Reveal } from "@/components/reveal";
import { CursosHome, type CursoHome } from "@/components/cursos-home";
import { formatarPreco, listarApostilasPublicadas } from "@/lib/apostilas";
import { listarPostsVitrine } from "@/lib/blog";
import { EMAIL_CONTATO, EMISSOR, RAZAO_SOCIAL } from "@/lib/emissor";

// Página igual para todos os visitantes: a Vercel guarda em cache e refaz no máximo a cada 1 h
// (gasta CPU só nessa hora, não a cada visita). Nada de cookies aqui — ver src/lib/supabase-publico.ts.
export const revalidate = 3600;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const supabase = criarClienteSupabasePublico();

  const [apostilas, posts, { data: iscaTranspetro }, { data: cursosHome }, { data: cursosPagos }] = await Promise.all([
    listarApostilasPublicadas(supabase),
    listarPostsVitrine(supabase),
    supabase.from("produtos").select("ativo").eq("slug", "simulado-gratis").maybeSingle(),
    supabase.from("cursos").select("slug, nome, descricao, carga_horaria_horas, categoria").eq("ativo", true).order("criado_em"),
    supabase.from("produtos").select("slug, preco_centavos").like("slug", "curso-%").eq("ativo", true),
  ]);
  // vitrine de cursos: os mais vendidos, na ordem da lista
  const precoCurso = new Map((cursosPagos ?? []).map((p) => [p.slug.slice("curso-".length), p.preco_centavos]));
  const paraHome = (c: NonNullable<typeof cursosHome>[number], texto?: string): CursoHome => {
    const centavos = precoCurso.get(c.slug);
    return {
      slug: c.slug,
      nome: c.nome,
      texto: texto ?? c.descricao ?? "",
      carga_horaria_horas: c.carga_horaria_horas,
      categoria: c.categoria,
      preco: centavos ? formatarPreco(centavos) : null,
    };
  };
  const todosCursos = (cursosHome ?? []).map((c) => paraHome(c));
  const destaquesCursos = CURSOS_MAIS_VENDIDOS.flatMap(({ slug, chamada }) => {
    const curso = (cursosHome ?? []).find((c) => c.slug === slug);
    return curso ? [paraHome(curso, chamada)] : [];
  });
  // Isca gratuita do Transpetro desativada por ora (ver handle_new_user()
  // no banco e src/app/minha-area/page.tsx) — mesmo campo produtos.ativo
  // controla os dois lugares, reativar é só voltar ele a true.
  const iscaTranspetroAtiva = !!iscaTranspetro?.ativo;
  // menor preço da vitrine (a primeira da lista é a mais nova, não a mais barata)
  const pmsp = apostilas.find((a) => a.slug === "pmsp-soldado");
  const preco = apostilas.length ? Math.min(...apostilas.map((a) => a.preco_centavos)) : 2990;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
  const organizacao = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organizacao`,
        name: EMISSOR.nomeCurto,
        legalName: RAZAO_SOCIAL,
        alternateName: EMISSOR.nome,
        taxID: EMISSOR.cnpj,
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        description:
          "Apostilas em PDF para concursos públicos de todo o Brasil, com questões comentadas e simulado online, e cursos livres gratuitos com certificado.",
        areaServed: "BR",
        contactPoint: [
          { "@type": "ContactPoint", contactType: "customer support", email: EMAIL_CONTATO, availableLanguage: "pt-BR" },
          { "@type": "ContactPoint", contactType: "customer support", email: EMAIL_CONTATO, availableLanguage: "pt-BR" },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#site`,
        url: siteUrl,
        name: "SIBRAP",
        inLanguage: "pt-BR",
        publisher: { "@id": `${siteUrl}/#organizacao` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/busca?q={termo}` },
          "query-input": "required name=termo",
        },
      },
    ],
  };

  const BLACK_FRIDAY = blackFridayAtiva();

  return (
    <div id="topo" className="flex flex-1 flex-col bg-white font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizacao) }} />
      {/* Faixa "Próxima prova" removida em 19/11/2026 (Wagner): a home começa direto no cabeçalho do SIBRAP. */}
      <CabecalhoSite semLinks semFaixaBlackFriday />

      {/* celular/tablet: as 3 escolhas no topo; desktop: logo abaixo do carrossel */}
      <HeroEscolha totalApostilas={apostilas.length} precoApostila={formatarPreco(preco)} className="lg:hidden" />

      <MenuAncora />

      <CarrosselHome
        precoTexto={`A partir de ${formatarPreco(preco)}`}
        precoPmsp={pmsp ? formatarPreco(pmsp.preco_centavos) : undefined}
        blackFriday={BLACK_FRIDAY}
      />

      <HeroEscolha totalApostilas={apostilas.length} precoApostila={formatarPreco(preco)} className="hidden lg:block" sufixo="-desktop" titulo="h2" />

      {/* Vitrine de apostilas */}
      <section id="apostilas" className="md:scroll-mt-14 bg-[#F6F8FB] py-14 sm:py-16">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <Reveal className="mb-8 max-w-[60ch]">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#0E7C6B]/10 py-1.5 pr-3.5 pl-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#0A6151] ring-1 ring-[#0E7C6B]/15">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0E7C6B] text-white" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
                  <path d="M8 8h6M8 12h6" />
                </svg>
              </span>
              Apostilas · concursos públicos
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

          <div id="apostilas-produtos" className="scroll-mt-16">
            <VitrineApostilas apostilas={apostilas} comBusca compacto limiteInicial={10} />
          </div>

          <div className="mt-8 text-center">
            <Link href="/apostilas" className="text-sm font-semibold text-brand underline underline-offset-4">
              Ver todas as apostilas
            </Link>
          </div>
        </div>
      </section>

      {/* Comece de graça */}
      <section id="cursos-gratuitos" className="md:scroll-mt-14 overflow-hidden bg-surface-2 py-14 sm:py-16">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#0E7C6B]/10 py-1.5 pr-3.5 pl-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#0A6151] ring-1 ring-[#0E7C6B]/15">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0E7C6B] text-white" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9l10-5 10 5-10 5z" />
                  <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
                </svg>
              </span>
              Cursos livres · mercado de trabalho
            </span>
            <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.2rem]">
              Comece gratuitamente. Aprenda no seu ritmo.
            </h2>
            {iscaTranspetroAtiva && (
              <ul className="mt-4 flex flex-col gap-3 text-[15.5px] leading-relaxed text-[#516278]">
                <li className="flex gap-2">
                  <span className="mt-0.5 text-accent-2" aria-hidden>✓</span>
                  <span>
                    <strong className="text-[#14213A]">Apostila e simulado grátis do concurso Transpetro</strong>{" "}
                    — Conhecimentos Básicos e um teste de 10 questões, no estilo da banca.
                  </span>
                </li>
              </ul>
            )}
            <CursosHome destaques={destaquesCursos} cursos={todosCursos} />
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              {iscaTranspetroAtiva && (
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
                >
                  Fazer simulado grátis <span aria-hidden>→</span>
                </Link>
              )}
              <Link href="/cursos" className="text-sm font-semibold text-brand underline underline-offset-4">
                Ver todos os cursos
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cursos profissionalizantes (no lugar do antigo combo SESA-AP) */}
      <section id="profissionalizantes" className="scroll-mt-14 overflow-hidden bg-brand py-14 text-white sm:py-16">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Reveal variante="esquerda" className="max-w-[56ch]">
            <span className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 font-data text-xs font-semibold text-[#D7E6F7]">
              <span className="h-1.5 w-1.5 bg-accent" />
              Novo · Cursos profissionalizantes
            </span>
            <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold leading-tight sm:text-[2.3rem]">
              Aprenda uma profissão do zero. Saia com certificado.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#D7E6F7]">
              Elétrica, Automação ou Bombeiro Hidráulico: escolha a sua área e comece pelo celular.
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-[15px] text-white/90">
              {["Curso grátis, 100% online", "Certificado válido em todo o Brasil, com QR Code", "Apostila em PDF e manual de instruções"].map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 text-accent" aria-hidden>
                    ✓
                  </span>
                  {i}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="/cursos/profissionalizantes"
                className="btn-pulso brilho inline-flex items-center gap-2 bg-accent px-7 py-4 text-[16px] font-extrabold text-accent-ink"
              >
                Escolher minha área <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
          <Reveal variante="direita" delay={150}>
            <Link href="/cursos/profissionalizantes" aria-label="Ver os cursos profissionalizantes">
              <Image
                src="/cursos/profissionalizantes/hero.webp"
                alt="Eletricista, técnico de automação e bombeiro hidráulico com suas ferramentas numa casa em construção"
                width={1376}
                height={768}
                sizes="(min-width: 768px) 560px, 90vw"
                className="mx-auto h-auto w-full max-w-[560px] border-2 border-accent drop-shadow-[0_22px_40px_rgba(0,0,0,0.45)]"
              />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Notícias de concursos */}
      {posts.length > 0 && (
        <section id="noticias" className="scroll-mt-14 bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <Reveal className="mb-8 max-w-[60ch]">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand shadow-sm">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-2 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-2" />
                </span>
                Notícias todos os dias
              </span>
              <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.3rem]">
                Notícias de concursos e processos seletivos.
              </h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
                Editais novos, prazos de inscrição e vagas abertas. Filtre
                por região, estado ou só concursos federais.
              </p>
            </Reveal>

  
            <VitrinePosts posts={posts} limiteInicial={6} />

            <div className="mt-8 text-center">
              <Link href="/noticias" className="text-sm font-semibold text-brand underline underline-offset-4">
                Ver todas as notícias
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Diferenciais */}
      <section id="metodo" className="scroll-mt-14 border-y border-[#D7DEE6] bg-white py-12 sm:py-14">
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

      {/* Simulado online */}
      <section id="simulado-online" className="scroll-mt-14 bg-[#F6F8FB] py-14 sm:py-16">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <Reveal className="mb-10 max-w-[64ch]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Simulado online
            </span>
            <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.3rem]">
              Treine como será a prova e descubra onde melhorar.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
              Ler a teoria é só metade do caminho. O simulado online coloca você diante de
              questões no estilo da banca do seu concurso, mostra onde você acerta e onde
              ainda erra e transforma o estudo em prática diária. Quem pratica com constância
              fixa melhor o conteúdo, ganha ritmo e chega à prova com mais segurança.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-px border border-[#D7DEE6] bg-[#D7DEE6] sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS_SIMULADO.map(([icone, titulo, texto], i) => (
              <div key={titulo} className="bg-white p-5 transition-colors hover:bg-[#FFFBEF] sm:p-6">
                <IconeSolido nome={icone} atraso={i * 350} />
                <h3 className="mt-4 font-display text-[1.1rem] font-bold text-[#14213A]">{titulo}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#516278]">{texto}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#apostilas"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
            >
              Escolher minha apostila <span aria-hidden>→</span>
            </a>
            <p className="max-w-[52ch] text-[13.5px] text-[#516278]">
              O acesso ao simulado online é liberado na sua área, logo após a confirmação do
              pagamento das apostilas que o incluem.
            </p>
          </div>
        </div>
      </section>

      {/* Gerador de currículo */}
      <section id="curriculo" className="scroll-mt-14 border-t border-[#D7DEE6] bg-white py-14 sm:py-16">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_260px]">
          <Reveal variante="esquerda" className="max-w-[56ch]">
            <span className="font-data text-xs font-semibold uppercase tracking-[0.18em] text-accent-2">Gerador de currículo grátis</span>
            <h2 className="mt-3 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.2rem]">
              Seu currículo pronto em alguns cliques.
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[#516278]">
              Responda algumas perguntas e baixe em PDF, com modelo profissional para o primeiro emprego ou para quem já tem experiência.
            </p>
            <Link
              href="/curriculo"
              className="mt-6 inline-flex items-center gap-2 bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
            >
              Montar meu currículo grátis <span aria-hidden>→</span>
            </Link>
          </Reveal>
          <Reveal variante="direita" delay={150}>
            {/* miniatura de uma folha de currículo (só desenho, sem dados de ninguém) */}
            <Link href="/curriculo" aria-label="Abrir o gerador de currículo" className="mx-auto flex aspect-[210/297] w-full max-w-[220px] border border-[#D7DEE6] bg-white shadow-[0_24px_50px_-30px_rgba(11,42,74,0.55)]">
              <span className="flex w-[34%] flex-col gap-1.5 bg-[#0b2a4a] p-2.5">
                <span className="block aspect-[3/4] w-4/5 bg-[#4a6584]" />
                <span className="mt-1 block h-1 w-4/5 bg-[#d4a24a]" />
                <span className="block h-1 w-3/5 bg-[#6d86a3]" />
                <span className="block h-1 w-2/3 bg-[#6d86a3]" />
                <span className="mt-1 block h-1 w-4/5 bg-[#d4a24a]" />
                <span className="block h-1 w-1/2 bg-[#6d86a3]" />
              </span>
              <span className="flex flex-1 flex-col gap-1.5 p-2.5">
                <span className="block h-2 w-4/5 bg-[#0b2a4a]" />
                {[0, 1, 2].map((i) => (
                  <span key={i} className="mt-1.5 flex flex-col gap-1">
                    <span className="block h-1 w-2/5 bg-[#d4a24a]" />
                    <span className="block h-1 w-full bg-[#D7DEE6]" />
                    <span className="block h-1 w-11/12 bg-[#D7DEE6]" />
                    <span className="block h-1 w-4/5 bg-[#D7DEE6]" />
                  </span>
                ))}
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Por que escolher */}
      <section id="sobre" className="scroll-mt-14 bg-brand py-16 text-white sm:py-20">
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
                Apostilas a partir de {formatarPreco(preco)}, sem mensalidade e sem
                assinatura. O arquivo é seu para sempre.
              </Motivo>
            </Reveal>
            <Reveal delay={300}>
              <Motivo titulo="Transparência">
                Antes de comprar você vê o que a apostila traz: páginas,
                questões, capítulos online e a data da prova.
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

// Cursos mais vendidos (pedidos aprovados em 02/11/2026), na ordem da vitrine da home, com a chamada do card
const CURSOS_MAIS_VENDIDOS: { slug: string; chamada: string }[] = [
  { slug: "auxiliar-administrativo", chamada: "Documentos, planilhas e rotina de escritório para a sua primeira vaga." },
  { slug: "informatica-basica-ia", chamada: "Word, Excel, internet e IA no dia a dia, do zero ao currículo." },
  { slug: "atendimento-ao-cliente", chamada: "Encante clientes e resolva reclamações sem perder a calma." },
  { slug: "ingles-basico-atendimento-ao-publico", chamada: "Frases prontas para atender turistas em lojas, hotéis e recepções." },
  { slug: "estoque-logistica-controle-de-mercadorias", chamada: "Recebimento, inventário e expedição como nas empresas de verdade." },
  { slug: "conserto-e-manutencao-de-celulares", chamada: "Diagnóstico e troca de peças para ganhar renda com consertos." },
];

const RECURSOS_SIMULADO: [NomeIconeSolido, string, string][] = [
  ["questoes", "Questões do seu cargo", "O banco é montado para o cargo da apostila. A cada tentativa, as questões são sorteadas na proporção da prova, e você escolhe quantas quer fazer."],
  ["salvo", "Seu progresso fica salvo", "Cada resposta é guardada na hora. Pode parar quando precisar e continuar depois, exatamente de onde parou, no computador ou no celular."],
  ["desempenho", "Desempenho por disciplina", "Ao terminar, você vê seus acertos matéria por matéria e sabe onde focar a próxima rodada de estudo."],
  ["trofeu", "Missões e pontos (XP)", "Complete missões como fazer o primeiro simulado, tirar nota 6 ou mais e estudar três dias seguidos. A constância vira hábito."],
  ["calendario", "Cronograma de estudos", "Os tópicos do edital organizados em checklist, com o percentual concluído por disciplina, para você saber quanto já avançou."],
  ["jogo", "Minigame Verdadeiro ou Falso", "Revisão rápida entre uma sessão de estudo e outra, para fixar o que costuma cair na prova."],
];

const ANCORAS: [string, string][] = [
  ["Apostilas", "#apostilas"],
  ["Cursos gratuitos", "#cursos-gratuitos"],
  ["Profissionalizantes", "#profissionalizantes"],
  ["Notícias", "#noticias"],
  ["Simulado online", "#simulado-online"],
  ["Currículo grátis", "#curriculo"],
  ["Sobre", "#sobre"],
  ["Validar certificado", "/validar"],
];

// Menu de âncoras da home. Cada item leva a uma seção da página e serve de
// destino para os sitelinks do Google Ads (ex.: https://sibrap.tec.br/#simulado-online).
// Topo da home (teste 15/11/2026): o visitante escolhe logo o que veio buscar.
function HeroEscolha({
  totalApostilas,
  precoApostila,
  className = "",
  sufixo = "",
  titulo: Titulo = "h1",
}: {
  totalApostilas: number;
  precoApostila: string;
  className?: string;
  sufixo?: string;
  /** só um h1 por página: a cópia do desktop usa h2 */
  titulo?: "h1" | "h2";
}) {
  const opcoes = [
    {
      href: "#apostilas",
      rotulo: "Concursos",
      titulo: "Apostilas para concurso",
      texto: `${totalApostilas} apostilas em PDF, a partir de ${precoApostila}.`,
      icone: "livro" as NomeIconeSolido,
    },
    {
      href: "#cursos-gratuitos",
      rotulo: "Grátis",
      titulo: "Cursos gratuitos",
      texto: "Estude de graça. Certificado opcional.",
      icone: "video" as NomeIconeSolido,
    },
    {
      href: "/cursos/profissionalizantes",
      rotulo: "Profissão",
      titulo: "Cursos profissionalizantes",
      texto: "Certificações exigidas para o mercado de trabalho.",
      icone: "raio" as NomeIconeSolido,
    },
  ];
  return (
    <section aria-labelledby={`hero-escolha${sufixo}`} className={`bg-brand-deep text-white ${className}`}>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 sm:py-10">
        <Titulo id={`hero-escolha${sufixo}`} className="font-display text-[1.45rem] font-extrabold leading-tight sm:text-[2.1rem]">
          Clique na opção desejada para continuar.
        </Titulo>
        <p className="mt-1.5 text-[14px] text-[#C9D6E6] sm:text-[15.5px]">Escolha um caminho e comece agora.</p>
        <ul className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-4">
          {opcoes.map((o) => (
            <li key={o.href}>
              <a
                href={o.href}
                className="group flex h-full items-center gap-3 border border-white/15 bg-white/[0.06] p-3.5 transition-colors hover:border-accent hover:bg-white/10 sm:flex-col sm:items-start sm:gap-2 sm:p-5"
              >
                <span className="shrink-0">
                  <IconeSolido nome={o.icone} tamanho="medio" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-data text-[10.5px] font-semibold uppercase tracking-[0.16em] text-accent">{o.rotulo}</span>
                  <span className="block font-display text-[16px] font-extrabold leading-snug sm:text-[19px]">{o.titulo}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-[#C9D6E6] sm:text-[14px]">{o.texto}</span>
                </span>
                <span aria-hidden className="text-[18px] font-bold text-accent transition-transform group-hover:translate-x-1 sm:self-end">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MenuAncora() {
  return (
    <nav aria-label="Seções da página" className="sticky top-0 z-30 hidden border-b md:block border-[#D7DEE6] bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-[1180px] items-center gap-1 overflow-x-auto px-3 py-1 text-[13px] font-semibold whitespace-nowrap sm:gap-3 sm:px-6 sm:text-sm">
        {ANCORAS.map(([rotulo, href]) => (
          <li key={href}>
            <a href={href} className="block px-2 py-2 text-[#33465E] transition-colors hover:text-brand">
              {rotulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
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
