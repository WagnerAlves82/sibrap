import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { dadosCartaoCompra } from "@/lib/cartao-transparente";
import { formatarReais } from "@/lib/curso-pago";
import { ANYDESK_DOWNLOAD, AREA_SUPORTE_MARCA, CURSO_MARCA, PRODUTO_SUPORTE_MARCA, TERMOS_SUPORTE } from "@/lib/suporte-marca";
import { ComprarSuporte } from "./ComprarSuporte";

export const metadata: Metadata = { title: "Suporte Especializado", robots: { index: false } };

const dataHora = (d: Date) =>
  d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// Suporte Especializado do curso de registro de marca: termos + aceite + pagamento; depois do pagamento,
// instruções do AnyDesk e agendamento por e-mail, com o prazo de 24 h corridas.
export default async function SuporteMarcaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CURSO_MARCA) notFound();

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(AREA_SUPORTE_MARCA)}`);

  const [{ data: matricula }, { data: produto }, { data: acesso }] = await Promise.all([
    supabase.from("matriculas").select("curso_id, cursos!inner(slug)").eq("cursos.slug", CURSO_MARCA).maybeSingle(),
    supabase.from("produtos").select("preco_centavos").eq("slug", PRODUTO_SUPORTE_MARCA).eq("ativo", true).maybeSingle(),
    supabase.from("acessos").select("concedido_em, produtos!inner(slug)").eq("produtos.slug", PRODUTO_SUPORTE_MARCA).maybeSingle(),
  ]);
  if (!matricula) redirect(`/minha-area/cursos/${CURSO_MARCA}`);

  const nome = (user.user_metadata as { nome?: string } | undefined)?.nome;
  const voltar = (
    <Link href={`/minha-area/cursos/${CURSO_MARCA}`} className="text-[14px] font-semibold text-brand underline underline-offset-4">
      ← Voltar ao curso
    </Link>
  );

  if (acesso) {
    const pago = new Date(acesso.concedido_em);
    const limite = new Date(pago.getTime() + 24 * 60 * 60 * 1000);
    // sem WhatsApp no SIBRAP (Wagner, 18/11/2026): agendamento por e-mail para o contato@ (cai no Gmail do Wagner)
    const zap = `mailto:contato@sibrap.tec.br?subject=${encodeURIComponent("Agendar Suporte Especializado (registro de marca)")}&body=${encodeURIComponent(
      `Olá! Contratei o Suporte Especializado de registro de marca e quero agendar o atendimento.\nNome: ${nome ?? ""}\nE-mail: ${user.email ?? ""}\nMarca: \nMelhores horários: `
    )}`;
    return (
      <div className="flex min-h-screen flex-col bg-surface-2 font-body">
        <CabecalhoSite logado />
        <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-12">
          {voltar}
          <p className="mt-6 font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Pagamento confirmado</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">Suporte Especializado</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
            Pago em {dataHora(pago)}. O atendimento começa até <strong className="text-[#14213A]">{dataHora(limite)}</strong> (24 horas corridas).
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
                Envie a mensagem com o nome da marca e os melhores horários. Se preferir, aguarde: entramos em contato pelo seu e-mail.
              </p>
              <a href={zap} className="mt-3 inline-block bg-accent px-5 py-2.5 text-[14.5px] font-extrabold text-accent-ink hover:brightness-110">
                Agendar por e-mail
              </a>
            </li>
            <li className="border-l-4 border-accent bg-white p-5">
              <span className="font-data text-[12px] font-bold text-accent-2">PASSO 3</span>
              <h2 className="mt-1 font-display text-[1.1rem] font-extrabold text-[#14213A]">Separe antes da sessão</h2>
              <ul className="mt-2 flex flex-col gap-1 text-[14.5px] text-[#33465E]">
                {["Login e senha do e-INPI (ou CPF/CNPJ para criar o cadastro)", "O JPG do logotipo, se a marca for mista", "O que o seu negócio faz ou vende", "Acesso ao banco ou app para pagar a GRU por PIX"].map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="text-accent-2">✓</span>
                    {i}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[13.5px] text-[#516278]">Você digita as senhas e faz o pagamento. Nós não pedimos nem guardamos senhas.</p>
            </li>
          </ol>
        </main>
        <RodapeSite />
      </div>
    );
  }

  const valor = produto?.preco_centavos ?? 5990;
  const preco = formatarReais(valor);
  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-12">
        {voltar}
        <p className="mt-6 font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Travou no pedido?</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A]">Suporte Especializado</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
          Um especialista faz o pedido da sua marca com você, por acesso remoto, em até <strong className="text-[#14213A]">24 horas corridas</strong> após o pagamento.
          Pagamento único de <strong className="text-[#14213A]">{preco}</strong>.
        </p>

        <div className="mt-7 flex flex-col gap-4">
          {TERMOS_SUPORTE.map((s) => (
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
          <ComprarSuporte valorCentavos={valor} preco={preco} cartao={dadosCartaoCompra(PRODUTO_SUPORTE_MARCA, user)} />
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
