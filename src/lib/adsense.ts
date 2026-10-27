// src/lib/adsense.ts
//
// Google AdSense, desligado até o Wagner pedir a veiculação. Para ligar, na Vercel:
//  * ADSENSE_PUB_ID = pub-1234567890123456 (código de editor) → ativa ads.txt, a meta de
//    verificação em todo o site e o script de anúncios só nas páginas liberadas;
//  * ADSENSE_SLOT_NOTICIA_MEIO, ADSENSE_SLOT_NOTICIA_FIM e ADSENSE_SLOT_AULA = ids dos blocos
//    criados no painel do AdSense (opcionais: sem o id, aquele bloco não aparece).
// Anúncios só nas Notícias e nas aulas dos cursos gratuitos; nunca no curso pago, na loja ou no pagamento.

export function clienteAdsense(): string | null {
  const pub = process.env.ADSENSE_PUB_ID?.trim();
  return pub && /^pub-\d{10,20}$/.test(pub) ? `ca-${pub}` : null;
}

export function blocoAdsense(nome: "NOTICIA_MEIO" | "NOTICIA_FIM" | "AULA"): string | null {
  const slot = process.env[`ADSENSE_SLOT_${nome}`]?.trim();
  return slot && /^\d{6,20}$/.test(slot) ? slot : null;
}
