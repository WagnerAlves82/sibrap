import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { Alert } from "@/components/alert";
import { FormComprovante, FormEmitir, PagamentoCertificado } from "./Formularios";

export const metadata: Metadata = {
  title: "Certificado",
  robots: { index: false },
};

function Item({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[15px] text-[#14213A]">
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${ok ? "bg-accent-2" : "bg-[#C4CEDA]"}`}
      >
        {ok ? "✓" : ""}
      </span>
      <span className={ok ? "" : "text-[#516278]"}>{children}</span>
    </li>
  );
}

export default async function CertificadoAreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await criarClienteSupabaseServer();
  const cursoHref = `/minha-area/cursos/${slug}`;

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, nome, nota_minima, carga_horaria_horas")
    .eq("slug", slug)
    .maybeSingle();
  if (!curso) notFound();

  const [
    { data: userData },
    { data: matricula },
    { data: certificado },
    { data: aulas },
    { data: progresso },
    { data: tentativas },
    { data: comprovante },
    { data: acessoPago },
    { data: produto },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("matriculas").select("curso_id").eq("curso_id", curso.id).maybeSingle(),
    supabase.from("certificados").select("codigo").eq("curso_id", curso.id).maybeSingle(),
    supabase.from("aulas").select("id, youtube_id").eq("curso_id", curso.id),
    supabase.from("progresso_aulas").select("aula_id, concluida_em"),
    supabase
      .from("tentativas_quiz")
      .select("nota")
      .eq("curso_id", curso.id)
      .not("finalizado_em", "is", null),
    supabase
      .from("comprovantes_cadunico")
      .select("status, motivo_recusa")
      .order("enviado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("acessos")
      .select("id, produtos!inner(curso_id)")
      .eq("produtos.curso_id", curso.id)
      .maybeSingle(),
    supabase
      .from("produtos")
      .select("preco_centavos")
      .eq("curso_id", curso.id)
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  if (!matricula) redirect(cursoHref);

  const concluidas = new Set(
    (progresso ?? []).filter((p) => p.concluida_em).map((p) => p.aula_id)
  );
  const totalAulas = aulas?.length ?? 0;
  const aulasOk =
    totalAulas > 0 &&
    (aulas ?? []).every((a) => a.youtube_id && concluidas.has(a.id));
  const melhorNota = (tentativas ?? []).reduce((m, t) => Math.max(m, Number(t.nota ?? 0)), 0);
  const provaOk = melhorNota >= curso.nota_minima;

  const cadunicoAprovado = comprovante?.status === "aprovado";
  const pago = !!acessoPago;
  const elegivel = cadunicoAprovado || pago;
  const podeEmitir = aulasOk && provaOk && elegivel;
  const preco = produto
    ? (produto.preco_centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "R$ 49,90";
  const nome = (userData.user?.user_metadata as { nome?: string } | undefined)?.nome ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
        <Link href={cursoHref} className="text-[13px] font-semibold text-brand underline underline-offset-4">
          ← Voltar ao curso
        </Link>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#14213A]">
          Certificado
        </h1>
        <p className="mt-1 text-[15px] text-[#516278]">{curso.nome}</p>

        {certificado ? (
          <div className="mt-6 rounded-xl border-2 border-accent bg-white p-6">
            <p className="font-display text-xl font-extrabold text-[#14213A]">
              Seu certificado já foi emitido 🎓
            </p>
            <p className="mt-2 text-[15px] text-[#516278]">
              Abra, imprima ou salve em PDF. Qualquer pessoa pode conferir se é
              verdadeiro pelo QR Code.
            </p>
            <Link
              href={`/certificado/${certificado.codigo}`}
              className="mt-5 inline-block rounded-lg bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
            >
              Ver meu certificado →
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-5">
            <section className="rounded-xl border border-[#D7DEE6] bg-white p-6">
              <h2 className="font-display text-lg font-extrabold text-[#14213A]">Requisitos</h2>
              <ul className="mt-4 flex flex-col gap-3">
                <Item ok={aulasOk}>
                  Concluir todas as aulas ({[...concluidas].length}/{totalAulas})
                  {!aulasOk && (
                    <>
                      {" "}
                      —{" "}
                      <Link href={cursoHref} className="font-semibold text-brand underline underline-offset-4">
                        ir para as aulas
                      </Link>
                    </>
                  )}
                </Item>
                <Item ok={provaOk}>
                  Passar na prova final com pelo menos {curso.nota_minima}%
                  {provaOk && ` (sua melhor nota: ${melhorNota.toFixed(0)}%)`}
                  {aulasOk && !provaOk && (
                    <>
                      {" "}
                      —{" "}
                      <Link href={`${cursoHref}/prova`} className="font-semibold text-brand underline underline-offset-4">
                        fazer a prova
                      </Link>
                    </>
                  )}
                </Item>
                <Item ok={elegivel}>
                  {cadunicoAprovado
                    ? "Comprovante do CadÚnico aprovado (certificado gratuito)"
                    : pago
                      ? "Pagamento do certificado confirmado"
                      : "Comprovar inscrição no CadÚnico ou pagar o certificado"}
                </Item>
              </ul>
            </section>

            {!elegivel && (
              <section className="rounded-xl border border-[#D7DEE6] bg-white p-6">
                <h2 className="font-display text-lg font-extrabold text-[#14213A]">
                  Como obter o certificado
                </h2>
                <p className="mt-1 text-[14px] text-[#516278]">
                  Você pode fazer isso agora, mesmo antes de terminar o curso.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="rounded-lg border-2 border-accent p-5">
                    <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent">
                      Baixa renda · grátis
                    </p>
                    {comprovante?.status === "pendente" ? (
                      <Alert variant="info" claro className="mt-3 text-sm">
                        Comprovante em análise. Assim que for conferido, o
                        resultado aparece aqui.
                      </Alert>
                    ) : (
                      <div className="mt-3 flex flex-col gap-3">
                        {comprovante?.status === "recusado" && (
                          <Alert variant="erro" claro className="text-sm">
                            Seu último comprovante não foi aceito
                            {comprovante.motivo_recusa ? `: ${comprovante.motivo_recusa}` : "."}{" "}
                            Você pode enviar outro.
                          </Alert>
                        )}
                        <FormComprovante />
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-[#D7DEE6] p-5">
                    <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#516278]">
                      Demais participantes
                    </p>
                    <p className="mt-1 font-data text-3xl font-semibold text-[#14213A]">{preco}</p>
                    <p className="mb-4 text-[13px] text-[#516278]">Pagamento único por PIX</p>
                    <PagamentoCertificado cursoSlug={slug} />
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-xl border border-[#D7DEE6] bg-white p-6">
              <h2 className="font-display text-lg font-extrabold text-[#14213A]">
                Emitir certificado
              </h2>
              {podeEmitir ? (
                <div className="mt-4">
                  <FormEmitir cursoId={curso.id} nomeSugerido={nome} />
                </div>
              ) : (
                <p className="mt-2 text-[14.5px] text-[#516278]">
                  Disponível quando os três requisitos acima estiverem cumpridos.
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
