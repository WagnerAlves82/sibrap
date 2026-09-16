import Image from "next/image";
import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { FormularioListaEspera } from "@/components/formulario-lista-espera";
import { Logo } from "@/components/logo";

export default async function Home() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: concurso } = await supabase
    .from("concursos")
    .select("id, nome, descricao, bancas(nome)")
    .eq("slug", "transpetro")
    .maybeSingle();

  const { data: cargos } = await supabase
    .from("cargos")
    .select("vagas")
    .eq("concurso_id", concurso?.id ?? "")
    .eq("quadro", "Terra");

  const nomeBanca = concurso?.bancas?.nome ?? "Cesgranrio";
  const nomeConcurso = concurso?.nome ?? "Transpetro";
  const totalVagas = cargos?.reduce((soma, c) => soma + (c.vagas ?? 0), 0) ?? 614;
  const totalEnfases = cargos?.length ?? 18;

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* Navbar */}
      <header className="border-b border-blue-950/10 bg-blue-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-3">
            <Logo tamanho={40} comTexto={false} />
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight text-white">
                SIBRAP
              </p>
              <p className="hidden text-[10px] uppercase tracking-wide text-blue-300 sm:block">
                Sistema Brasileiro de Aprendizagem Profissional
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-blue-100 md:flex">
            <a href="#inicio" className="text-white">
              Home
            </a>
            <a href="#sobre" className="hover:text-white">
              Sobre Nós
            </a>
            <a href="#recursos" className="hover:text-white">
              Cursos
            </a>
            <a href="#concurso" className="hover:text-white">
              Concursos
            </a>
          </nav>

          <Link
            href={user ? "/minha-area" : "/login"}
            className="rounded-md border border-blue-400/40 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-900"
          >
            Minha Área
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
          {/* Texto + mockup da apostila */}
          <div className="flex flex-col items-start gap-5">
            <span className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Simulado Grátis
            </span>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-blue-950 sm:text-5xl">
              Conhecimentos Básicos
            </h1>

            <p className="max-w-md text-lg text-zinc-600">
              O seu ponto de partida para a aprovação no Concurso{" "}
              {nomeConcurso} 2026. Comece agora e garanta sua base sólida —
              de graça.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-500"
              >
                Fazer Simulado Grátis e Começar Preparação
                <span aria-hidden>›</span>
              </Link>
            </div>
            <p className="text-xs text-zinc-500">
              *5 questões de Português + 5 de Matemática — sem cartão de
              crédito
            </p>

            <div className="mt-4">
              <details className="group text-sm">
                <summary className="cursor-pointer list-none text-zinc-500 underline hover:text-zinc-800">
                  Ainda não tem certeza? Deixe seu e-mail
                </summary>
                <div className="mt-3 max-w-sm">
                  <FormularioListaEspera concursoId={concurso?.id ?? ""} />
                </div>
              </details>
            </div>
          </div>

          {/* Foto + selos */}
          <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
            <LivroMockup3D />

            <div className="relative ml-[-2rem] h-80 w-56 overflow-hidden rounded-2xl shadow-2xl sm:h-96 sm:w-72">
              <Image
                src="https://images.unsplash.com/photo-1530890448995-4d82724f702c?fm=jpg&q=80&w=1200&auto=format&fit=crop"
                alt="Trabalhador em operação industrial"
                fill
                priority
                className="object-cover"
              />
            </div>

            <div className="absolute -top-4 left-0 z-20 rotate-[-6deg] whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-center text-white shadow-lg sm:left-4">
              <p className="text-[10px] font-semibold uppercase leading-none">
                Salário inicial
              </p>
              <p className="text-lg font-extrabold leading-tight">R$ 6.539,54</p>
              <p className="text-[9px] leading-none">+ benefícios</p>
            </div>

            <div className="absolute -bottom-4 right-2 z-20 whitespace-nowrap rounded-lg bg-blue-950 px-4 py-2 text-center text-white shadow-lg sm:right-6">
              <p className="text-[10px] font-semibold uppercase leading-none text-blue-300">
                Prova
              </p>
              <p className="text-base font-bold leading-tight">06/12/2026</p>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa de recursos */}
      <section id="recursos" className="border-y border-zinc-200 bg-zinc-50 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 divide-zinc-200 px-6 sm:grid-cols-4 sm:divide-x">
          <Recurso
            icone={<IconeLivro />}
            titulo="Apostila"
            descricao="Conteúdo completo e atualizado"
          />
          <Recurso
            icone={<IconeChecklist />}
            titulo="Simulados"
            descricao="Teste seus conhecimentos"
          />
          <Recurso
            icone={<IconeAlvo />}
            titulo="Questões"
            descricao="Pratique e evolua"
          />
          <Recurso
            icone={<IconeGrafico />}
            titulo="Planejamento"
            descricao="Estude com método"
          />
        </div>
      </section>

      {/* O sonho por trás do concurso */}
      <section id="sobre" className="relative overflow-hidden bg-blue-950 py-20 text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
          <div className="relative h-72 w-full overflow-hidden rounded-xl md:h-96">
            <Image
              src="https://images.unsplash.com/photo-1726111262949-e22631a8c376?fm=jpg&q=80&w=1600&auto=format&fit=crop"
              alt="Instalação industrial iluminada à noite"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-4 text-left">
            <span className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
              Por que vale a pena
            </span>
            <h2 className="text-3xl font-bold tracking-tight">
              Não é só um cargo. É uma carreira.
            </h2>
            <p className="text-blue-100">
              A Transpetro garante remuneração mínima de{" "}
              <strong className="text-white">R$ 6.539,54</strong> pro cargo de
              nível técnico — bem acima da média do mercado pra quem tá
              começando. Fora o salário, tem Programa de Formação, plano de
              carreira estruturado e a estabilidade de uma empresa do Sistema
              Petrobras.
            </p>
            <p className="text-blue-100">
              E pra quem sonha em embarcar: o Quadro Mar da {nomeConcurso} é
              uma porta de entrada real pra quem quer viver essa rotina —
              viajar, ganhar adicional de embarque e construir uma carreira
              diferente de tudo que existe em terra.
            </p>
          </div>
        </div>
      </section>

      <main id="concurso" className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-8 px-6 py-20 text-center">
        <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-900">
          Banca {nomeBanca} · Inscrições até 21/09/2026
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-blue-950">
          {totalVagas} vagas + cadastro de reserva, em {totalEnfases} ênfases
        </h2>
        <dl className="grid w-full grid-cols-1 gap-6 text-left sm:grid-cols-3">
          <RecursoCard
            titulo="Apostila digital"
            descricao="Conteúdo direto ao ponto, organizado por disciplina do edital."
          />
          <RecursoCard
            titulo="Simulado no estilo da banca"
            descricao="Centenas de questões na proporção real de cada disciplina, conforme o edital oficial."
          />
          <RecursoCard
            titulo="Desempenho por disciplina"
            descricao="Veja exatamente onde focar os estudos."
          />
        </dl>

        <Link
          href="/cadastro"
          className="mt-4 rounded-lg bg-emerald-600 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Criar conta grátis e fazer o simulado
        </Link>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500">
        <p>sibrap.tec.br</p>
        <p className="mt-1 text-xs text-zinc-400">
          Fotos: Dylan McLeod e Kamekichi Photos, via Unsplash
        </p>
      </footer>
    </div>
  );
}

function LivroMockup3D() {
  return (
    <div
      className="relative z-10 hidden h-80 w-52 shrink-0 sm:block"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-r-lg bg-gradient-to-br from-blue-600 to-blue-950 shadow-2xl"
        style={{ transform: "rotateY(-22deg) rotateX(2deg)" }}
      >
        <div className="absolute inset-y-0 left-0 w-2 bg-blue-950/60" />
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <Image src="/logo.png" width={48} height={48} alt="" className="rounded-full" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-200">
            Apostila Gratuita
          </p>
          <p className="text-xl font-extrabold leading-tight">
            Conhecimentos
            <br />
            Básicos
          </p>
          <p className="text-[10px] text-blue-200">Concurso Transpetro 2026</p>
        </div>
      </div>
      <div className="mx-auto mt-2 h-4 w-36 rounded-full bg-black/20 blur-md" />
    </div>
  );
}

function IconeLivro() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-emerald-600">
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5c.83 0 1.5-.67 1.5-1.5v-13Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IconeChecklist() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-emerald-600">
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 9.5l1.8 1.8L14 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 15h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconeAlvo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-emerald-600">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

function IconeGrafico() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-emerald-600">
      <path d="M5 19.5V4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 19.5h14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="7.5" y="13" width="2.6" height="6.5" fill="currentColor" />
      <rect x="12" y="9.5" width="2.6" height="10" fill="currentColor" />
      <rect x="16.5" y="6" width="2.6" height="13.5" fill="currentColor" />
    </svg>
  );
}

function Recurso({
  icone,
  titulo,
  descricao,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex items-start gap-3 pl-0 text-left sm:pl-6 first:sm:pl-0">
      <div className="mt-0.5">{icone}</div>
      <div>
        <p className="font-semibold text-blue-950">{titulo}</p>
        <p className="text-sm text-zinc-500">{descricao}</p>
      </div>
    </div>
  );
}

function RecursoCard({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-5">
      <dt className="font-semibold text-blue-950">{titulo}</dt>
      <dd className="mt-1 text-sm text-zinc-600">{descricao}</dd>
    </div>
  );
}
