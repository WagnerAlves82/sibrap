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
const EMAILS_SENAPRO = new Set<string>(["jusapavine@gmail.com"]);

export function senaproConfigurado(): boolean {
  return !!process.env.ABACATEPAY_API_KEY_SENAPRO;
}

export function contaDoEmail(email: string | null | undefined): ContaPagamento {
  if (!email || !senaproConfigurado()) return "sibrap";
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
