import Image from "next/image";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { FormularioListaEspera } from "@/components/formulario-lista-espera";
import { Logo } from "@/components/logo";

export default async function Home() {
  const supabase = await criarClienteSupabaseServer();
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
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo />
        </div>
      </header>

      {/* Hero com foto real de navio-tanque */}
      <section className="relative flex min-h-[640px] flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
        <Image
          src="https://images.unsplash.com/photo-1530890448995-4d82724f702c?fm=jpg&q=80&w=2400&auto=format&fit=crop"
          alt="Navio-tanque em operação"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />

        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6">
          <span className="rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-blue-200 backdrop-blur">
            Banca {nomeBanca} · Inscrições até 21/09/2026
          </span>

          <p className="text-base font-semibold italic text-blue-400">
            ✦ O sonho de trabalhar EMBARCADO começa aqui ✦
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Sua aprovação na {nomeConcurso} começa aqui
          </h1>

          <p className="max-w-xl text-lg text-zinc-200">
            Estabilidade, salário garantido e a chance de vestir a camisa de
            uma das maiores empresas do país. Apostila digital + simulado com
            questões no estilo da banca, baseado no edital oficial.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-zinc-300">
            <span>
              <strong className="text-white">{totalVagas}</strong> vagas +
              cadastro de reserva
            </span>
            <span>
              <strong className="text-white">{totalEnfases}</strong> ênfases
              (nível médio/técnico)
            </span>
            <span>Prova em 06/12/2026</span>
          </div>

          <div className="w-full max-w-md">
            <FormularioListaEspera concursoId={concurso?.id ?? ""} />
            <p className="mt-3 text-sm text-zinc-400">
              Avisamos por e-mail assim que a apostila e o simulado estiverem
              prontos. Sem spam.
            </p>
          </div>
        </div>
      </section>

      {/* O sonho por trás do concurso */}
      <section className="relative overflow-hidden bg-zinc-900 py-20 text-white">
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
            <span className="text-sm font-semibold uppercase tracking-wide text-blue-400">
              Por que vale a pena
            </span>
            <h2 className="text-3xl font-bold tracking-tight">
              Não é só um cargo. É uma carreira.
            </h2>
            <p className="text-zinc-300">
              A Transpetro garante remuneração mínima de{" "}
              <strong className="text-white">R$ 6.539,54</strong> pro cargo de
              nível técnico — bem acima da média do mercado pra quem tá
              começando. Fora o salário, tem Programa de Formação, plano de
              carreira estruturado e a estabilidade de uma empresa do Sistema
              Petrobras.
            </p>
            <p className="text-zinc-300">
              E pra quem sonha em embarcar: o Quadro Mar da Transpetro é uma
              porta de entrada real pra quem quer viver essa rotina — viajar,
              ganhar adicional de embarque e construir uma carreira diferente
              de tudo que existe em terra.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-8 px-6 py-20 text-center">
        <dl className="grid w-full grid-cols-1 gap-6 text-left sm:grid-cols-3">
          <Recurso
            titulo="Apostila digital"
            descricao="Conteúdo direto ao ponto, organizado por disciplina do edital."
          />
          <Recurso
            titulo="Simulado no estilo da banca"
            descricao="Centenas de questões na proporção real de cada disciplina, conforme o edital oficial."
          />
          <Recurso
            titulo="Desempenho por disciplina"
            descricao="Veja exatamente onde focar os estudos."
          />
        </dl>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        <p>sibrap.tec.br</p>
        <p className="mt-1 text-xs text-zinc-400">
          Fotos: Dylan McLeod e Kamekichi Photos, via Unsplash
        </p>
      </footer>
    </div>
  );
}

function Recurso({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
      <dt className="font-semibold">{titulo}</dt>
      <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {descricao}
      </dd>
    </div>
  );
}
