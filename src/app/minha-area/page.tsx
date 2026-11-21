import Image from "next/image";
import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { Alert } from "@/components/alert";
import { BarraProgresso, Reveal } from "@/components/reveal";
import { enviarApostilaGratisPorEmail } from "@/lib/resend";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { formatarDataIso } from "@/lib/apostilas";
import { FOTO_CURSO_PADRAO, FOTOS_POR_CURSO } from "@/lib/cursos-fotos";
import { Sanfona } from "@/components/sanfona";
import { ListaCertificados, dadosCertificados } from "./certificados/ListaCertificados";
import { FormMeusDados } from "./meus-dados/FormMeusDados";

export default async function MinhaAreaPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: acessos } = await supabase
    .from("acessos")
    .select("produto_id, produtos(slug, nome)")
    .eq("user_id", user!.id);

  // Isca gratuita do Transpetro (apostila por e-mail + simulado grátis):
  // desativada por ora (produtos.ativo=false pra 'simulado-gratis') — volta
  // a rodar sozinha quando um formulário próprio for feito e o campo virar
  // true de novo. Ver handle_new_user() no banco, que segue essa mesma flag.
  const { data: iscaTranspetro } = await supabase
    .from("produtos")
    .select("ativo")
    .eq("slug", "simulado-gratis")
    .maybeSingle();
  const iscaTranspetroAtiva = !!iscaTranspetro?.ativo;

  // Apostilas compradas (leitura administrativa: quem comprou continua
  // vendo mesmo que a apostila tenha saído da vitrine)
  const idsProdutos = (acessos ?? []).map((a) => a.produto_id);
  const { data: minhasApostilas } = idsProdutos.length
    ? await criarClienteSupabaseAdmin()
        .from("apostilas")
        .select("slug, titulo, uf, cidade, data_prova, tem_redacao")
        .in("produto_id", idsProdutos)
        .order("data_prova")
    : { data: [] };

  const hojeBr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const temRedacao = (minhasApostilas ?? []).some((a) => a.tem_redacao && (!a.data_prova || a.data_prova >= hojeBr));
  const temPremium = acessos?.some((a) => a.produtos?.slug === "premium") ?? false;
  const meta = user?.user_metadata as { nome?: string; origem?: string } | undefined;
  const nome = meta?.nome;

  // Primeira visita depois de confirmar o e-mail: manda a apostila
  // grátis do concurso (ver src/lib/resend.ts) e marca que já foi
  // enviada. Quem se cadastrou pelos cursos não recebe (é outro público
  // e cada e-mail conta na cota do Resend).
  let apostilaAcabouDeSerEnviada = false;
  if (iscaTranspetroAtiva && meta?.origem !== "curso") {
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

  const [{ data: cursos }, { data: matriculas }, { data: aulas }, { data: progresso }, certificados, { data: perfil }, { data: redacoes }] =
    await Promise.all([
      supabase.from("cursos").select("id, slug, nome, subtitulo, carga_horaria_horas").order("criado_em"),
      supabase.from("matriculas").select("curso_id"),
      supabase.from("aulas").select("id, curso_id"),
      supabase.from("progresso_aulas").select("aula_id").not("concluida_em", "is", null),
      dadosCertificados(),
      supabase.from("profiles").select("nome, profissao, foto_url").eq("id", user!.id).maybeSingle(),
      supabase.from("redacoes").select("id, tema, status, nota, nota_max, criado_em").order("criado_em", { ascending: false }).limit(3),
    ]);

  const matriculados = new Set((matriculas ?? []).map((m) => m.curso_id));
  const feitas = new Set((progresso ?? []).map((p) => p.aula_id));
  const percentualDe = (cursoId: string) => {
    const doCurso = (aulas ?? []).filter((a) => a.curso_id === cursoId);
    if (!doCurso.length) return 0;
    return (doCurso.filter((a) => feitas.has(a.id)).length / doCurso.length) * 100;
  };
  const meusCursos = (cursos ?? []).filter((c) => matriculados.has(c.id));

  const cartao = "rounded-xl border border-[#D7DEE6] bg-white p-6";
  const botao =
    "inline-block rounded-lg bg-accent px-5 py-2.5 text-[14.5px] font-bold text-accent-ink transition-colors hover:brightness-105";

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite aluno logado />

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

        {/* Minha área em sanfonas (Wagner, 21/11/2026): cada bloco abre e mostra o conteúdo ali mesmo */}
        <div className="mt-8 flex flex-col gap-3">
          {meusCursos.length > 0 && (
            <Sanfona
              id="cursos"
              titulo="Meus cursos"
              contador={meusCursos.length}
              resumo={`${meusCursos.filter((c) => percentualDe(c.id) >= 100).length} concluído(s) · continue de onde parou`}
              aberta
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {meusCursos.map((curso) => {
                  const pct = percentualDe(curso.id);
                  return (
                    // card horizontal: foto à esquerda, título e texto à direita, cantos suaves (Wagner, 21/11/2026)
                    <Link prefetch={false}
                      key={curso.id}
                      href={`/minha-area/cursos/${curso.slug}`}
                      className="group flex h-full overflow-hidden rounded-xl border border-[#D7DEE6] bg-white transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.3)]"
                    >
                      <div className="relative w-[34%] shrink-0 overflow-hidden bg-surface-2 sm:w-[38%]">
                        <Image
                          src={FOTOS_POR_CURSO[curso.slug] ?? FOTO_CURSO_PADRAO}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 180px, 34vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                        <p className="font-data text-[11.5px] font-semibold text-accent-2">
                          {curso.carga_horaria_horas} h · {Math.round(pct)}% concluído
                        </p>
                        <p className="mt-1 font-display text-[16.5px] font-extrabold leading-snug text-[#14213A] sm:text-lg">
                          {curso.nome}
                        </p>
                        {curso.subtitulo && (
                          <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-[#516278]">{curso.subtitulo}</p>
                        )}
                        <div className="mt-auto pt-3">
                          <BarraProgresso percentual={pct} />
                        </div>
                        <span className="mt-3 block text-[13.5px] font-bold text-brand">
                          {pct >= 100 ? "Ver certificado →" : pct > 0 ? "Continuar →" : "Começar →"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Sanfona>
          )}

          {(minhasApostilas?.length ?? 0) > 0 && (
            <Sanfona id="apostilas" titulo="Minhas apostilas" contador={minhasApostilas!.length} resumo="PDF, simulado e plano de estudos" aberta={meusCursos.length === 0}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {minhasApostilas!.map((a) => (
                  <Link prefetch={false}
                    key={a.slug}
                    href={`/minha-area/apostilas/${a.slug}`}
                    className="block rounded-xl border border-[#D7DEE6] bg-white p-5 transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.3)]"
                  >
                    <p className="font-data text-xs font-semibold text-accent-2">
                      {a.uf}
                      {a.cidade ? ` · ${a.cidade}` : ""}
                      {a.data_prova ? ` · prova ${formatarDataIso(a.data_prova)}` : ""}
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold text-[#14213A]">{a.titulo}</p>
                    <span className="mt-4 block text-[13.5px] font-bold text-brand">Abrir e baixar →</span>
                  </Link>
                ))}
              </div>
            </Sanfona>
          )}

          <Sanfona
            id="certificados"
            titulo="Certificados"
            contador={certificados.emitidos.length}
            resumo={
              certificados.prontos.length
                ? `${certificados.prontos.length} pronto(s) para emitir`
                : certificados.emitidos.length
                  ? "Ver, baixar o PDF e validar"
                  : "Conclua um curso para emitir"
            }
            aberta={certificados.prontos.length > 0}
          >
            <ListaCertificados dados={certificados} titulos={certificados.prontos.length > 0 && certificados.emitidos.length > 0} />
          </Sanfona>

          {temRedacao && (
            <Sanfona id="redacao" titulo="Treino de Redação" contador={redacoes?.length ? redacoes.length : undefined} resumo="Dicas enquanto você escreve e nota pela grade da banca">
              {redacoes?.length ? (
                <ul className="mb-4 flex flex-col gap-2">
                  {redacoes.map((r) => (
                    <li key={r.id}>
                      <Link prefetch={false} href={`/minha-area/redacao/${r.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-[#D7DEE6] px-4 py-3 hover:border-brand">
                        <span className="min-w-0">
                          <span className="block truncate text-[14.5px] font-semibold text-[#14213A]">{r.tema}</span>
                          <span className="font-data text-[11.5px] text-[#8A97A8]">{formatarDataIso(r.criado_em.slice(0, 10))}</span>
                        </span>
                        <span className="shrink-0 font-data text-[13px] font-bold text-brand">
                          {r.status === "rascunho" ? "Rascunho" : r.nota != null ? `Nota ${r.nota}/${r.nota_max}` : "Corrigida"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 text-[15px] text-[#516278]">Você ainda não escreveu nenhuma redação. Escolha o tema e comece agora.</p>
              )}
              <Link prefetch={false} href="/minha-area/redacao" className="inline-block bg-accent px-5 py-2.5 text-[14.5px] font-extrabold text-accent-ink hover:brightness-105">
                Escrever uma redação →
              </Link>
            </Sanfona>
          )}

          <Sanfona id="meus-dados" titulo="Meus dados" resumo="Nome do certificado, profissão e foto">
            <FormMeusDados
              nome={/\d/.test(perfil?.nome ?? nome ?? "") ? "" : (perfil?.nome ?? nome ?? "")}
              profissao={perfil?.profissao ?? ""}
              foto={perfil?.foto_url ?? null}
              email={user?.email ?? ""}
            />
          </Sanfona>
        </div>

        {(temPremium || iscaTranspetroAtiva) && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-extrabold text-[#14213A]">
            Concurso Transpetro 2026
          </h2>
          {temPremium ? (
            <div className={`${cartao} border-2 border-accent`}>
              <p className="font-display text-lg font-extrabold text-[#14213A]">
                Banco de questões Transpetro
              </p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#516278]">
                Seu acesso está liberado: escolha o cargo e quantas questões quer responder.
                O seu progresso fica salvo. A apostila em PDF e as vídeo-aulas chegam em
                breve por e-mail.
              </p>
              <Link prefetch={false} href="/minha-area/simulado" className={`mt-4 ${botao}`}>
                Abrir banco de questões
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
              <Link prefetch={false} href="/minha-area/simulado-gratis" className={`mt-4 ${botao}`}>
                Começar amostra grátis
              </Link>
            </div>
          )}
        </section>
        )}
      </main>

      <RodapeSite />
    </div>
  );
}
