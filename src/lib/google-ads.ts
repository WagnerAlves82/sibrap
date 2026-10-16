// Conversão de compra do Google Ads (conta 111-923-3215, ação "Compra de apostila").
// A tag base (gtag.js) é carregada no layout; aqui só enviamos o evento de compra,
// com o id do pedido para o Google não contar a mesma venda duas vezes.
export const GOOGLE_ADS_ID = "AW-369139107";
const COMPRA_APOSTILA = `${GOOGLE_ADS_ID}/MafuCL_HhZ8dEKO7grAB`;

type JanelaGtag = Window & { gtag?: (...args: unknown[]) => void };

export function gadsCompra({ valor, pedidoId }: { valor: number; pedidoId: string }) {
  const gtag = (window as JanelaGtag).gtag;
  if (!gtag) return;
  gtag("event", "conversion", {
    send_to: COMPRA_APOSTILA,
    value: valor,
    currency: "BRL",
    transaction_id: pedidoId,
  });
}
