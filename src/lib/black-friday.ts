// src/lib/black-friday.ts
//
// Visual de Black Friday no site inteiro (faixa do topo, tarja dos cards, selo no preço,
// slide da home). Desliga sozinho depois do último dia (horário de Brasília); o cupom
// no banco tem a mesma data em cupons.valido_ate. As páginas em cache atualizam em até 1 h.

export const ULTIMO_DIA_BLACK_FRIDAY = "2026-11-16";
export const CUPOM_BLACK_FRIDAY = "VOUPASSAR";

export function blackFridayAtiva(): boolean {
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  return hoje <= ULTIMO_DIA_BLACK_FRIDAY;
}
