"use client";

import { useEffect, useState } from "react";
import { PixCheckoutClaro } from "@/components/pix-checkout-claro";
import { CartaoTransparente, type DadosCartaoCompra } from "@/components/cartao-transparente";
import { formatarPreco, maxParcelas, textoParcela } from "@/lib/apostilas";
import type { EstadoPix } from "@/lib/pix";
import { gadsCompra } from "@/lib/google-ads";

// Um botão "Comprar" que abre um modal: a pessoa escolhe PIX ou cartão e paga ali mesmo,
// sem sair da página. Sem cartão disponível (sem chave pública), mostra direto o PIX.
export function EscolherPagamento({
  valorCentavos,
  rotuloComprar,
  criarPix,
  conversaoAds = false,
  cartao,
  aoAprovar,
}: {
  valorCentavos: number;
  /** texto do botão principal, ex.: "Comprar por R$ 35,90" */
  rotuloComprar?: string;
  criarPix: () => Promise<EstadoPix>;
  /** o PIX registra a compra no Google Ads sozinho (certificado, curso); a apostila registra no aoAprovar */
  conversaoAds?: boolean;
  cartao: DadosCartaoCompra | null | undefined;
  aoAprovar: (pedidoId: string, forma: "pix" | "cartao") => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [forma, setForma] = useState<"pix" | "cartao" | null>(null);
  const preco = formatarPreco(valorCentavos);
  const parcelas = maxParcelas(valorCentavos);

  // trava a rolagem da página e fecha com Esc enquanto o modal está aberto
  useEffect(() => {
    if (!aberto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  if (!cartao) {
    return (
      <PixCheckoutClaro
        rotuloBotao={`Pagar ${preco} com PIX`}
        criarPix={criarPix}
        aoAprovar={(id) => aoAprovar(id, "pix")}
        conversaoAds={conversaoAds}
      />
    );
  }

  const opcao =
    "flex w-full items-center justify-between gap-3 border-[1.5px] border-[#D7DEE6] bg-white px-4 py-4 text-left transition-colors hover:border-brand";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setForma(null);
          setAberto(true);
        }}
        className="w-full bg-accent px-5 py-3.5 text-[15.5px] font-bold text-accent-ink transition-colors hover:brightness-105"
      >
        {rotuloComprar ?? `Comprar por ${preco}`}
      </button>
      {parcelas > 1 && <p className="mt-1.5 text-center text-[12.5px] text-[#516278]">PIX ou {textoParcela(valorCentavos)}</p>}

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#071B33]/60 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setAberto(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Forma de pagamento"
        >
          <div className="max-h-[92vh] w-full max-w-[480px] overflow-y-auto bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                {forma && (
                  <button type="button" onClick={() => setForma(null)} className="mb-1 text-[13px] font-semibold text-brand underline underline-offset-4">
                    ← Trocar forma de pagamento
                  </button>
                )}
                <p className="font-display text-[19px] font-extrabold text-[#14213A]">
                  {forma === "pix" ? "Pagar com PIX" : forma === "cartao" ? "Pagar no cartão" : "Como você quer pagar?"}
                </p>
                <p className="text-[13.5px] text-[#516278]">Total: {preco}</p>
              </div>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="text-[22px] leading-none text-[#93A0AF] hover:text-[#14213A]">
                ×
              </button>
            </div>

            {forma === null && (
              <div className="flex flex-col gap-2.5">
                <button type="button" className={opcao} onClick={() => setForma("pix")}>
                  <span>
                    <span className="block text-[16px] font-bold text-[#14213A]">PIX</span>
                    <span className="block text-[13px] text-[#516278]">Aprovação na hora</span>
                  </span>
                  <span className="font-data text-[15px] font-semibold text-[#14213A]">{preco}</span>
                </button>
                <button type="button" className={opcao} onClick={() => setForma("cartao")}>
                  <span>
                    <span className="block text-[16px] font-bold text-[#14213A]">Cartão de crédito</span>
                    <span className="block text-[13px] text-[#516278]">{parcelas > 1 ? `Em até ${parcelas}x` : "À vista"}</span>
                  </span>
                  <span className="font-data text-[15px] font-semibold text-[#14213A]">
                    {parcelas > 1 ? textoParcela(valorCentavos) : preco}
                  </span>
                </button>
                <p className="mt-1 text-center text-[12px] text-[#93A0AF]">🔒 Pagamento seguro. Acesso liberado automaticamente após o pagamento.</p>
              </div>
            )}

            {forma === "pix" && (
              <PixCheckoutClaro
                rotuloBotao={`Pagar ${preco} com PIX`}
                criarPix={criarPix}
                iniciarAutomatico
                conversaoAds={conversaoAds}
                aoAprovar={(id) => {
                  setAberto(false);
                  aoAprovar(id, "pix");
                }}
              />
            )}

            {forma === "cartao" && (
              <CartaoTransparente
                produtoSlug={cartao.produtoSlug}
                valorCentavos={valorCentavos}
                chavePublica={cartao.chavePublica}
                emailCliente={cartao.email}
                nomeInicial={cartao.nome}
                abertoInicial
                embutido
                aoAprovar={(id, valor) => {
                  setAberto(false);
                  if (conversaoAds) gadsCompra({ valor: valor / 100, pedidoId: id });
                  aoAprovar(id, "cartao");
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
