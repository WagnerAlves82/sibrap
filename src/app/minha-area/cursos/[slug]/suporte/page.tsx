import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { dadosCartaoCompra } from "@/lib/cartao-transparente";
import { formatarReais } from "@/lib/curso-pago";
import { CURSO_MARCA } from "@/lib/suporte-marca";
import { ANYDESK_DOWNLOAD, areaSuporte, suporteDoCurso } from "@/lib/suporte-cursos";
import { ComprarSuporte } from "./ComprarSuporte";

export const metadata: Metadata = { title: "Suporte Especializado", robots: { index: false } };

const dataHora = (d: Date) =>
  d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// Suporte Especializado (serviço extra, pago à parte) dos cursos listados em src/lib/suporte-cursos.ts:
// termos + aceite + pagamento; depois do pagamento, instruções do AnyDesk e agendamento por e-mail.
// O prazo de 24 h corridas vale só para o Registro de Marca (termos dele).
export default async function SuportePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = suporteDoCurso(slug);
  if (!config) notFound();
  const com24h = slug === CURSO_MARCA;

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(areaSuporte(slug))}`);

  const [{ data: matricula }, { data: produto }, { data: acesso }] = await Promise.all([
    supabase.from("matriculas").select("curso_id, cursos!inner(slug)").eq("cursos.slug", slug).maybeSingle(),
    supabase.from("produtos").select("preco_centavos").eq("slug", config.produto).eq("ativo", true).maybeSingle(),
    supabase.from("acessos").select("concedido_em, produtos!inner(slug)").eq("produtos.slug", config.produto).maybeSingle(),
  ]);
  if (!matricula) redirect(`/minha-area/cursos/${slug}`);

  const nome = (user.user_metadata as { nome?: string } | undefined)?.nome;
  const voltar = (
    <Link href={`/minha-area/cursos/${slug}`} className="text-[14px] font-semibold text-brand underline underline-offset-4">
      ← Voltar ao curso
    </Link>
  );

  if (acesso) {
    const pago = new Date(acesso.concedido_em);
    const limite = new Date(pago.getTime() + 24 * 60 * 60 * 1000);
    // sem WhatsApp no SIBRAP (Wagner, 18/11/2026): agendamento por e-mail para o contato@ (cai no Gmail do Wagner)
    const email = `mailto:contato@sibrap.tec.br?subject=${encodeURIComponent(`Agendar Suporte Especializado (${config.cursoNome})`)}&body=${encodeURIComponent(
      `Olá! Contratei o Suporte Especializado do curso ${config.cursoNome} e quero agendar o atendimento.\nNome: ${nome ?? ""}\nE-mail: ${user.email ?? ""}\n${config.campoAgendamento}: \nMelhores horários: `
    )}`;
    return (
      <div className="flex min-h-screen flex-col bg-surface-2 font-body">
        <CabecalhoSite aluno logado />
        <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-12">
          {voltar}
          <p className="mt-6 font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Pagamento confirmado</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">Suporte Especializado</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
            Pago em {dataHora(pago)}.{" "}
            {com24h ? (
              <>
                O atendimento começa até <strong className="text-[#14213A]">{dataHora(limite)}</strong> (24 horas corridas).
              </>
            ) : (
              <>Já recebemos o seu pedido e vamos entrar em contato pelo seu e-mail para combinar o horário.</>
            )}
          </p>
          <ol className="mt-7 flex flex-col gap-4">
            <li className="border-l-4 border-accent bg-white p-5">
              <span className="font-data text-[12px] font-bold text-accent-2">PASSO 1</span>
              <h2 className="mt-1 font-display text-[1.1rem] font-extrabold text-[#14213A]">Instale o AnyDesk no computador</h2>
              <p className="mt-1 text-[14.5px] leading-relaxed text-[#516278]">
                Baixe pelo site oficial, instale e abra. Na tela inicial aparece o <strong>seu endereço</strong> (um número de 9 ou 10 dígitos): é ele que você vai nos passar na hora da sessão.
              </p>
              <a href={ANYDESK_DOWNLOAD} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block bg-brand px-5 py-2.5 text-[14.5px] font-bold text-white hover:brightness-125">
                Baixar o AnyDesk (site oficial)
              </a>
            </li>
            <li className="border-l-4 border-accent bg-white p-5">
              <span className="font-data text-[12px] font-bold text-accent-2">PASSO 2</span>
              <h2 className="mt-1 font-display text-[1.1rem] font-extrabold text-[#14213A]">Agende por e-mail</h2>
              <p className="mt-1 text-[14.5px] leading-relaxed text-[#516278]">
                Envie a mensagem com os melhores horários. Se preferir, aguarde: entramos em contato pelo seu e-mail.
              </p>
              <a href={email} className="mt-3 inline-block bg-accent px-5 py-2.5 text-[14.5px] font-extrabold text-accent-ink hover:brightness-110">
                Agendar por e-mail
              </a>
            </li>
            <li className="border-l-4 border-accent bg-white p-5">
              <span className="font-data text-[12px] font-bold text-accent-2">PASSO 3</span>
              <h2 className="mt-1 font-display text-[1.1rem] font-extrabold text-[#14213A]">Separe antes da sessão</h2>
              <ul className="mt-2 flex flex-col gap-1 text-[14.5px] text-[#33465E]">
                {config.separar.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="text-accent-2">✓</span>
                    {i}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[13.5px] text-[#516278]">Você digita as senhas e faz os pagamentos. Nós não pedimos nem guardamos senhas.</p>
            </li>
          </ol>
        </main>
        <RodapeSite />
      </div>
    );
  }

  const valor = produto?.preco_centavos ?? config.precoPadraoCentavos;
  const preco = formatarReais(valor);
  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite aluno logado />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-12">
        {voltar}
        <p className="mt-6 font-data text-xs font-semibold uppercase tracking-wide text-accent-2">{config.pergunta}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">Suporte Especializado</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
          {config.promessa} Pagamento único de <strong className="text-[#14213A]">{preco}</strong>.
        </p>

        <div className="mt-7 flex flex-col gap-4">
          {config.termos.map((s) => (
            <section key={s.titulo} className="border border-[#D7DEE6] bg-white p-5">
              <h2 className="font-display text-[1.05rem] font-extrabold text-[#14213A]">{s.titulo}</h2>
              <ul className="mt-2 flex flex-col gap-1.5 text-[14.5px] leading-relaxed text-[#33465E]">
                {s.itens.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="text-accent-2">·</span>
                    {i}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-7 border border-[#D7DEE6] bg-white p-6">
          <ComprarSuporte cursoSlug={slug} valorCentavos={valor} preco={preco} cartao={dadosCartaoCompra(config.produto, user)} />
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
