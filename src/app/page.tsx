import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { FormularioListaEspera } from "@/components/formulario-lista-espera";

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
    .eq("concurso_id", concurso?.id ?? "");

  const nomeBanca = concurso?.bancas?.nome ?? "Cesgranrio";
  const nomeConcurso = concurso?.nome ?? "Transpetro";
  const totalVagas = cargos?.reduce((soma, c) => soma + (c.vagas ?? 0), 0) ?? 614;
  const totalEnfases = cargos?.length ?? 18;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">sibrap</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-8 px-6 py-20 text-center">
        <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Banca {nomeBanca} · Inscrições até 21/09/2026
        </span>

        <p className="text-base font-semibold italic text-amber-700 dark:text-amber-400">
          ✦ O sonho de trabalhar EMBARCADO começa aqui ✦
        </p>

        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Sua aprovação na {nomeConcurso} começa aqui
        </h1>

        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          {concurso?.descricao ??
            "Apostila digital + simulado com centenas de questões no estilo da banca."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-zinc-500">
          <span>
            <strong className="text-zinc-900 dark:text-zinc-100">
              {totalVagas}
            </strong>{" "}
            vagas + cadastro de reserva
          </span>
          <span>
            <strong className="text-zinc-900 dark:text-zinc-100">
              {totalEnfases}
            </strong>{" "}
            ênfases (nível médio/técnico)
          </span>
          <span>Prova em 06/12/2026</span>
        </div>

        <div className="w-full max-w-md">
          <FormularioListaEspera concursoId={concurso?.id ?? ""} />
          <p className="mt-3 text-sm text-zinc-500">
            Avisamos por e-mail assim que a apostila e o simulado estiverem
            prontos. Sem spam.
          </p>
        </div>

        <dl className="mt-8 grid w-full grid-cols-1 gap-6 text-left sm:grid-cols-3">
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
        sibrap.tec.br
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
