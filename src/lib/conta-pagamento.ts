// src/lib/conta-pagamento.ts
//
// Em qual conta do AbacatePay a cobrança é criada (Wagner, 17/11/2026).
// Para os e-mails abaixo, o PIX e o cartão são cobrados na conta do Senapro (escola do filho do Wagner);
// pedido, liberação do acesso, certificado e e-mails continuam no SIBRAP, sem nenhum aviso ao aluno.
// Só vale quando as chaves do Senapro estiverem na Vercel; sem elas, segue a conta do SIBRAP.
//
// Variáveis na Vercel (conta do Senapro):
//   ABACATEPAY_API_KEY_SENAPRO        chave secreta da API (obrigatória para ligar)
//   ABACATEPAY_WEBHOOK_SECRET_SENAPRO senha do webhook cadastrado na conta do Senapro
//   ABACATEPAY_PUBLIC_KEY_SENAPRO     chave pública (pk_) para o cartão (opcional)
//   ABACATEPAY_CARTAO_SENAPRO=1       liga o cartão nessa conta (só depois de o AbacatePay liberar CARD nela)

export type ContaPagamento = "sibrap" | "senapro";

// Alunos cobrados pela conta do Senapro (minúsculas). Para incluir alguém, acrescente o e-mail aqui.
const EMAILS_SENAPRO = new Set<string>([]);

// Janela em que TODAS as vendas do site são cobradas na conta do Senapro (Cenapro).
// Wagner, 17/11/2026: "a partir desse horário até 22h". Depois do fim, volta tudo para o SIBRAP sozinho.
const TODOS_NO_SENAPRO_ATE = new Date("2026-11-17T22:00:00-03:00");

// Aviso de venda com o logo do Cenapro (filho do Wagner), com cópia para o Wagner.
export const EMAIL_AVISO_SENAPRO = "wagnerneto345@gmail.com";

export function senaproConfigurado(): boolean {
  return !!process.env.ABACATEPAY_API_KEY_SENAPRO;
}

// Histórico (Wagner, 17/11/2026): desligado no fim da tarde ("volta como era antes") e RELIGADO à noite só para a
// janela até 22h ("SIBRAP paga até as 22 horas no site do meu filho"). Lista de e-mails esvaziada: depois das 22h,
// TUDO volta para o SIBRAP sozinho. Se o PIX na conta do Senapro falhar, pix.ts gera pela conta do SIBRAP.
// Pedidos criados na conta do Senapro continuam sendo confirmados nela (pedidos.gateway_conta).
// Wagner, 17/11/2026 ~20h30: "volta pra minha chave" — desligado de novo; tudo na conta do SIBRAP.
const SENAPRO_LIGADO = false;

export function contaDoEmail(email: string | null | undefined): ContaPagamento {
  if (!SENAPRO_LIGADO || !senaproConfigurado()) return "sibrap";
  if (Date.now() < TODOS_NO_SENAPRO_ATE.getTime()) return "senapro";
  if (!email) return "sibrap";
  return EMAILS_SENAPRO.has(email.trim().toLowerCase()) ? "senapro" : "sibrap";
}

export function chaveApi(conta: ContaPagamento): string | undefined {
  return conta === "senapro" ? process.env.ABACATEPAY_API_KEY_SENAPRO : process.env.ABACATEPAY_API_KEY;
}

export function segredoWebhook(conta: ContaPagamento): string | undefined {
  return conta === "senapro" ? process.env.ABACATEPAY_WEBHOOK_SECRET_SENAPRO : process.env.ABACATEPAY_WEBHOOK_SECRET;
}

/** Chave pública do cartão da conta, ou null se o cartão não estiver ligado nela. */
export function chavePublicaDaConta(conta: ContaPagamento): string | null {
  if (conta === "senapro") {
    const chave = process.env.ABACATEPAY_PUBLIC_KEY_SENAPRO;
    return process.env.ABACATEPAY_CARTAO_SENAPRO === "1" && chave ? chave : null;
  }
  return null; // a conta do SIBRAP segue a regra de sempre (chavePublicaCartao)
}
