export const EMISSOR = {
  nome: "SIBRAP — Sistema Brasileiro de Aprendizagem Profissional",
  nomeCurto: "SIBRAP",
  cnpj: "34.340.453/0001-89",
} as const;

// Quem assina eletronicamente os certificados pela instituição (Lei 14.063/2020).
export const ASSINATURA_CERTIFICADO = "Wagner A. de S. Jr";
export const ASSINATURA_CARGO = "Professor Habilitado";

// Responsável técnico por curso (ex.: curso de eletricista com técnico em eletrotécnica registrado no CRT).
// Só entra no certificado com o consentimento por escrito do profissional. Chave = slug do curso.
export type ResponsavelTecnico = { nome: string; titulo: string; registro: string };
const RESPONSAVEL_TECNICO_POR_CURSO: Record<string, ResponsavelTecnico> = {
  // sem número de registro: o registro nacional do CFT é o CPF dele (página e validação são públicas)
  "eletricista-residencial-basico": { nome: "Alexsandro de Sousa Silva", titulo: "Técnico em Eletrotécnica", registro: "CRT-01" },
};
export function responsavelTecnico(cursoSlug: string | null | undefined): ResponsavelTecnico | null {
  return (cursoSlug && RESPONSAVEL_TECNICO_POR_CURSO[cursoSlug]) || null;
}
export const textoResponsavel = (r: ResponsavelTecnico) => `${r.nome} · ${r.titulo} · ${r.registro}`;

// Base legal citada logo após "concluiu com aproveitamento..." no certificado (pedido do Wagner, 10/11/2026).
export const BASE_LEGAL_CERTIFICADO =
  "nos termos do Decreto Presidencial nº 5.154, de 23 de julho de 2004, arts. 1º e 3º, e de acordo com as normas do Ministério da Educação (MEC) pela Resolução CNE nº 04/99, art. 11";

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
