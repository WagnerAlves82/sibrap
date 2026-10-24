import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { Alert } from "@/components/alert";
import { FormComprovante, FormEmitir, PagamentoCertificado } from "./Formularios";
import { PopupParabens } from "./PopupParabens";

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
    .select("id, nome, nota_minima, carga_horaria_horas, permite_isencao_cadunico")
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
    { data: acessos },
    { data: produtoOnline },
    { data: produtoImpresso },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("matriculas").select("curso_id").eq("curso_id", curso.id).maybeSingle(),
    supabase.from("certificados").select("codigo").eq("curso_id", curso.id).maybeSingle(),
    supabase.from("aulas").select("id").eq("curso_id", curso.id),
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
      .select("produtos!inner(slug, curso_id)")
      .eq("produtos.curso_id", curso.id),
    supabase
      .from("produtos")
      .select("preco_centavos")
      .eq("slug", `certificado-${slug}`)
      .eq("ativo", true)
      .maybeSingle(),
    supabase
      .from("produtos")
      .select("preco_centavos")
      .eq("slug", `certificado-impresso-${slug}`)
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
    (aulas ?? []).every((a) => concluidas.has(a.id));
  const melhorNota = (tentativas ?? []).reduce((m, t) => Math.max(m, Number(t.nota ?? 0)), 0);
  const provaOk = melhorNota >= curso.nota_minima;

  const permiteCadunico = curso.permite_isencao_cadunico;
  const cadunicoAprovado = permiteCadunico && comprovante?.status === "aprovado";
  const pagoImpresso = (acessos ?? []).some((a) => a.produtos.slug === `certificado-impresso-${slug}`);
  const pagoOnline = (acessos ?? []).some((a) => a.produtos.slug === `certificado-${slug}`);
  const pago = pagoOnline || pagoImpresso;
  const elegivel = cadunicoAprovado || pago;
  const podeEmitir = aulasOk && provaOk && elegivel;
  const formatoEmissao: "online" | "impresso" = pagoImpresso ? "impresso" : "online";
  const precoOnline = produtoOnline
    ? (produtoOnline.preco_centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "R$ 29,90";
  const precoImpresso = produtoImpresso
    ? (produtoImpresso.preco_centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "R$ 89,90";
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
            {aulasOk && provaOk && !elegivel && (
              <PopupParabens precoOnline={precoOnline} precoImpresso={precoImpresso} permiteCadunico={permiteCadunico} />
            )}
            {!podeEmitir && (
              <Alert variant="info" claro>
                Você precisa concluir todas as etapas para liberar o seu certificado. Bons estudos!
              </Alert>
            )}
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
                      : permiteCadunico
                        ? "Comprovar inscrição no CadÚnico ou pagar o certificado"
                        : "Pagar o certificado"}
                </Item>
              </ul>
            </section>

            {!elegivel && (
              <section className="rounded-xl border border-[#D7DEE6] bg-white p-6">
                <h2 className="font-display text-lg font-extrabold text-[#14213A]">
                  Como obter o certificado
                </h2>
                <p className="mt-1 text-[14px] text-[#516278]">
                  O pagamento (ou o envio do comprovante) pode ser feito a qualquer momento, mas o
                  certificado só é liberado depois que você concluir todas as aulas e passar na prova final.
                </p>

                <div className={`mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 ${permiteCadunico ? "lg:grid-cols-3" : "lg:max-w-[640px]"}`}>
                  {permiteCadunico && (
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
                  )}

                  <div className="rounded-lg border border-[#D7DEE6] p-5">
                    <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#516278]">
                      Certificado online (PDF)
                    </p>
                    <p className="mt-1 font-data text-3xl font-semibold text-[#14213A]">{precoOnline}</p>
                    <p className="text-[13px] text-[#516278]">Pagamento único por PIX</p>
                    <p className="mb-4 mt-2 text-[12.5px] leading-relaxed text-accent-2">
                      Assim que o pagamento for confirmado, seu certificado é liberado na hora e também enviado
                      automaticamente para o seu e-mail.
                    </p>
                    <PagamentoCertificado cursoSlug={slug} formato="online" />
                  </div>

                  <div className="rounded-lg border border-[#D7DEE6] p-5">
                    <p className="font-data text-xs font-semibold uppercase tracking-wide text-[#516278]">
                      Certificado impresso
                    </p>
                    <p className="mt-1 font-data text-3xl font-semibold text-[#14213A]">{precoImpresso}</p>
                    <p className="text-[13px] text-[#516278]">Pagamento único por PIX</p>
                    <p className="mb-4 mt-2 text-[12.5px] leading-relaxed text-[#516278]">
                      Enviado pelos Correios para o seu endereço, além da versão online. Prazo: 5 a 20 dias úteis
                      (varia conforme os Correios).
                    </p>
                    <PagamentoCertificado cursoSlug={slug} formato="impresso" />
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
                  <FormEmitir cursoId={curso.id} nomeSugerido={nome} formato={formatoEmissao} />
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
