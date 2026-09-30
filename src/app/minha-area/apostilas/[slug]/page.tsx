import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { confirmarPagamentoAbacateCheckout } from "@/lib/abacatepay";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { formatarDataIso, formatarPreco, slugValido, urlCapa } from "@/lib/apostilas";
import { ComprarApostila } from "./Comprar";
import { RastrearCompraCartao } from "./RastrearCompraCartao";

export const metadata: Metadata = {
  title: "Minha apostila",
  robots: { index: false },
};

export default async function ApostilaAreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slugValido(slug)) notFound();

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin: quem já comprou continua vendo a apostila mesmo se ela sair do ar
  const admin = criarClienteSupabaseAdmin();
  const { data: apostila } = await admin
    .from("apostilas")
    .select("*, produtos(preco_centavos, ativo, inclui_simulado, cargo_id)")
    .eq("slug", slug)
    .maybeSingle();
  if (!apostila?.produtos) notFound();

  const { data: acesso } = await supabase
    .from("acessos")
    .select("id")
    .eq("produto_id", apostila.produto_id)
    .maybeSingle();

  let tem = !!acesso;
  let aguardandoCartao = false;
  let pedidoCartaoConfirmadoAgora: string | null = null;

  // Quem volta do checkout hospedado (cartão) chega aqui antes do webhook
  // confirmar: tenta uma vez, na hora, pra não mostrar "ainda não comprou"
  // por alguns segundos à toa. Nunca decide sozinho: só confere na API.
  if (!tem && user) {
    const { data: pendente } = await admin
      .from("pedidos")
      .select("id, gateway_charge_id")
      .eq("user_id", user.id)
      .eq("produto_id", apostila.produto_id)
      .eq("status", "pendente")
      .eq("gateway", "abacatepay_checkout")
      .not("gateway_charge_id", "is", null)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendente?.gateway_charge_id) {
      const r = await confirmarPagamentoAbacateCheckout(pendente.gateway_charge_id);
      if (!("erro" in r) && r.status === "aprovado") {
        const { data: acessoNovo } = await supabase
          .from("acessos")
          .select("id")
          .eq("produto_id", apostila.produto_id)
          .maybeSingle();
        tem = !!acessoNovo;
        // só nesta renderização a confirmação acabou de acontecer: é o
        // único momento seguro pra disparar o evento de compra (cartão) —
        // em qualquer atualização de página seguinte, `acesso` já existe e
        // esse bloco inteiro é pulado.
        if (tem) pedidoCartaoConfirmadoAgora = pendente.id;
      } else {
        aguardandoCartao = true;
      }
    }
  }
  const disponivel = apostila.status === "publicada" && apostila.produtos.ativo;
  if (!tem && !disponivel) notFound();

  const capa = urlCapa(apostila.capa_path);
  const preco = formatarPreco(apostila.produtos.preco_centavos);
  const prova = formatarDataIso(apostila.data_prova);
  const temSimulado = !!apostila.produtos.inclui_simulado && !!apostila.produtos.cargo_id;

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado={!!user} next={`/minha-area/apostilas/${apostila.slug}`} />
      <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-10 sm:px-6">
        <Link href="/minha-area" className="text-[13px] font-semibold text-brand underline underline-offset-4">
          ← Minha área
        </Link>

        <div className="mt-5 grid gap-7 rounded-xl border border-[#D7DEE6] bg-white p-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:p-7">
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[200px] overflow-hidden rounded-lg border border-[#D7DEE6] bg-surface-2">
            {capa && (
              <Image
                src={capa}
                alt={`Capa da apostila ${apostila.titulo}`}
                fill
                sizes="200px"
                className="object-cover"
              />
            )}
          </div>

          <div>
            <p className="font-data text-[11.5px] font-semibold uppercase tracking-wide text-accent-2">
              {apostila.uf}
              {apostila.cidade ? ` · ${apostila.cidade}` : ""}
              {prova ? ` · prova ${prova}` : ""}
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-[#14213A] sm:text-3xl">
              {apostila.titulo}
            </h1>

            {tem ? (
              <div className="mt-5">
                {pedidoCartaoConfirmadoAgora && (
                  <RastrearCompraCartao
                    pedidoId={pedidoCartaoConfirmadoAgora}
                    slug={apostila.slug}
                    titulo={apostila.titulo}
                    precoCentavos={apostila.produtos.preco_centavos}
                  />
                )}
                <p className="text-[15px] text-[#516278]">
                  Pagamento confirmado. Sua apostila está liberada — o arquivo
                  fica disponível aqui sempre que você precisar.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={`/minha-area/apostilas/${apostila.slug}/baixar`}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
                  >
                    Baixar apostila (PDF) <span aria-hidden>↓</span>
                  </a>
                  {temSimulado && (
                    <Link
                      href={`/minha-area/apostilas/${apostila.slug}/simulado`}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:brightness-125"
                    >
                      Fazer simulado online <span aria-hidden>→</span>
                    </Link>
                  )}
                  {temSimulado && (
                    <Link
                      href={`/minha-area/apostilas/${apostila.slug}/cronograma`}
                      className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-brand px-6 py-3.5 text-[15px] font-bold text-brand transition-colors hover:bg-brand/5"
                    >
                      Cronograma de estudos
                    </Link>
                  )}
                  {temSimulado && (
                    <Link
                      href={`/minha-area/apostilas/${apostila.slug}/missoes`}
                      className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-accent-2 px-6 py-3.5 text-[15px] font-bold text-accent-2 transition-colors hover:bg-accent-2/5"
                    >
                      Missões
                    </Link>
                  )}
                  {temSimulado && (
                    <Link
                      href={`/minha-area/apostilas/${apostila.slug}/minigame`}
                      className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-[#D7DEE6] px-6 py-3.5 text-[15px] font-bold text-[#33465E] transition-colors hover:bg-[#F6F8FB]"
                    >
                      Minigame relâmpago
                    </Link>
                  )}
                </div>
                <p className="mt-4 text-[12.5px] leading-relaxed text-[#516278]">
                  Material de estudo independente. O edital oficial sempre
                  prevalece. Uso pessoal — não compartilhe nem revenda o arquivo.
                </p>
              </div>
            ) : (
              <div className="mt-5">
                <p className="font-data text-3xl font-semibold text-[#14213A]">{preco}</p>
                <p className="mb-4 text-[13px] text-[#516278]">
                  Pagamento único, por PIX ou cartão de crédito. A liberação é
                  automática assim que o pagamento for confirmado.
                </p>
                {aguardandoCartao && (
                  <p className="mb-4 rounded-lg border border-[#D7DEE6] bg-[#F6F9FC] px-4 py-3 text-[13.5px] text-[#516278]">
                    Estamos confirmando seu pagamento por cartão — isso costuma
                    levar só alguns instantes. Atualize a página em breve.
                  </p>
                )}
                <ComprarApostila
                  slug={apostila.slug}
                  titulo={apostila.titulo}
                  preco={preco}
                  precoCentavos={apostila.produtos.preco_centavos}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
