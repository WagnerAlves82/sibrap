import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Alert } from "@/components/alert";
import { BarraProgresso, Reveal } from "@/components/reveal";
import { enviarApostilaGratisPorEmail } from "@/lib/resend";

export default async function MinhaAreaPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: acessos } = await supabase
    .from("acessos")
    .select("produtos(slug, nome)")
    .eq("user_id", user!.id);

  const temPremium = acessos?.some((a) => a.produtos?.slug === "premium") ?? false;
  const meta = user?.user_metadata as { nome?: string; origem?: string } | undefined;
  const nome = meta?.nome;

  // Primeira visita depois de confirmar o e-mail: manda a apostila
  // grátis do concurso (ver src/lib/resend.ts) e marca que já foi
  // enviada. Quem se cadastrou pelos cursos não recebe (é outro público
  // e cada e-mail conta na cota do Resend).
  let apostilaAcabouDeSerEnviada = false;
  if (meta?.origem !== "curso") {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("apostila_enviada_em")
      .eq("id", user!.id)
      .maybeSingle();

    if (perfil && !perfil.apostila_enviada_em && user?.email) {
      const resultado = await enviarApostilaGratisPorEmail({ email: user.email, nome });
      if (resultado.ok) {
        await supabase.rpc("marcar_apostila_enviada");
        apostilaAcabouDeSerEnviada = true;
      }
    }
  }

  const [{ data: cursos }, { data: matriculas }, { data: aulas }, { data: progresso }] =
    await Promise.all([
      supabase.from("cursos").select("id, slug, nome, carga_horaria_horas").order("criado_em"),
      supabase.from("matriculas").select("curso_id"),
      supabase.from("aulas").select("id, curso_id"),
      supabase.from("progresso_aulas").select("aula_id").not("concluida_em", "is", null),
    ]);

  const matriculados = new Set((matriculas ?? []).map((m) => m.curso_id));
  const feitas = new Set((progresso ?? []).map((p) => p.aula_id));
  const percentualDe = (cursoId: string) => {
    const doCurso = (aulas ?? []).filter((a) => a.curso_id === cursoId);
    if (!doCurso.length) return 0;
    return (doCurso.filter((a) => feitas.has(a.id)).length / doCurso.length) * 100;
  };
  const meusCursos = (cursos ?? []).filter((c) => matriculados.has(c.id));
  const outrosCursos = (cursos ?? []).filter((c) => !matriculados.has(c.id));

  const cartao = "rounded-xl border border-[#D7DEE6] bg-white p-6";
  const botao =
    "inline-block rounded-lg bg-accent px-5 py-2.5 text-[14.5px] font-bold text-accent-ink transition-colors hover:brightness-105";

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />

      <main className="mx-auto w-full max-w-[900px] flex-1 px-6 py-10">
        <Reveal>
          <p className="text-[14px] text-[#516278]">Olá{nome ? `, ${nome}` : ""}</p>
          <h1 className="font-display text-3xl font-extrabold text-[#14213A] sm:text-4xl">
            Minha área
          </h1>
        </Reveal>

        {apostilaAcabouDeSerEnviada && (
          <Alert variant="sucesso" claro className="mt-6 text-sm">
            Sua apostila grátis de Conhecimentos Básicos foi enviada pra {user?.email}. Se
            não chegar em alguns minutos, confere a caixa de spam.
          </Alert>
        )}

        {meusCursos.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-xl font-extrabold text-[#14213A]">Meus cursos</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {meusCursos.map((curso, i) => {
                const pct = percentualDe(curso.id);
                return (
                  <Reveal key={curso.id} delay={i * 80}>
                    <Link
                      href={`/minha-area/cursos/${curso.slug}`}
                      className={`${cartao} block transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.3)]`}
                    >
                      <p className="font-data text-xs font-semibold text-accent-2">
                        {curso.carga_horaria_horas}h · {Math.round(pct)}% concluído
                      </p>
                      <p className="mt-1 font-display text-lg font-extrabold text-[#14213A]">
                        {curso.nome}
                      </p>
                      <BarraProgresso percentual={pct} className="mt-4" />
                      <span className="mt-4 block text-[13.5px] font-bold text-brand">
                        Continuar →
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        {outrosCursos.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-xl font-extrabold text-[#14213A]">
              Cursos gratuitos
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {outrosCursos.map((curso) => (
                <div key={curso.id} className={cartao}>
                  <p className="font-data text-xs font-semibold text-accent-2">
                    {curso.carga_horaria_horas}h · com certificado
                  </p>
                  <p className="mt-1 font-display text-lg font-extrabold text-[#14213A]">
                    {curso.nome}
                  </p>
                  <Link href={`/cursos/${curso.slug}`} className={`mt-4 ${botao}`}>
                    Conhecer o curso
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-extrabold text-[#14213A]">
            Concurso Transpetro 2026
          </h2>
          {temPremium ? (
            <div className={`${cartao} border-2 border-accent`}>
              <p className="font-display text-lg font-extrabold text-[#14213A]">
                Você já é Premium 🎉
              </p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#516278]">
                Seu acesso ao simulado completo está liberado. A apostila em PDF e as
                vídeo-aulas chegam em breve por e-mail.
              </p>
              <Link href="/minha-area/simulado" className={`mt-4 ${botao}`}>
                Fazer simulado completo
              </Link>
            </div>
          ) : (
            <div className={cartao}>
              <p className="font-display text-lg font-extrabold text-[#14213A]">Simulado grátis</p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#516278]">
                Responda 5 questões de Língua Portuguesa + 5 de Matemática e Raciocínio
                Lógico, no estilo da banca Cesgranrio. É de graça e só pode ser feito uma
                vez.
              </p>
              <Link href="/minha-area/simulado-gratis" className={`mt-4 ${botao}`}>
                Começar amostra grátis
              </Link>
            </div>
          )}
        </section>
      </main>

      <RodapeSite />
    </div>
  );
}
