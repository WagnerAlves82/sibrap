export const EMISSOR = {
  nome: "SIBRAP — Sistema Brasileiro de Aprendizagem Profissional",
  nomeCurto: "SIBRAP",
  cnpj: "34.340.453/0001-89",
} as const;

export const AVISO_CURSO_LIVRE =
  "Curso livre de qualificação profissional, amparado pelo art. 42 da Lei nº 9.394/1996 (Lei de Diretrizes e Bases da Educação Nacional), que garante seu valor como capacitação profissional em todo o território nacional.";

export function formatarHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

// Versão dos Termos/Privacidade aceitos no cadastro (mude a data quando os textos mudarem).
export const VERSAO_TERMOS = "2026-09-19";

// E-mail de contato exibido nos textos legais (a caixa precisa existir).
export const EMAIL_CONTATO = "secretaria@sibrap.tec.br";

export const RAZAO_SOCIAL = "34.340.453 Wagner Alves de Souza Junior";

// WhatsApp de atendimento (só dígitos, com DDI+DDD, ex.: "5547999999999").
// Enquanto estiver vazio, o botão "Posso ajudar?" não aparece no site.
export const WHATSAPP_NUMERO = "5547992069330";
