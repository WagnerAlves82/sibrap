// src/lib/black-friday.ts
//
// Liga/desliga o visual de Black Friday no site inteiro (faixa do topo, selo no preço,
// slide da home). Para encerrar: false aqui + desativar o cupom no banco
// (update cupons set ativo = false where codigo = 'voupassar').

export const BLACK_FRIDAY = true;
export const CUPOM_BLACK_FRIDAY = "VOUPASSAR";
