export const EMISSOR = {
  nome: "SIBRAP — Sistema Brasileiro de Aprendizagem Profissional",
  nomeCurto: "SIBRAP",
  cnpj: "34.340.453/0001-89",
} as const;

export const AVISO_CURSO_LIVRE =
  "Curso livre, de qualificação profissional, sem equivalência a curso regulamentado pelo MEC. Conteúdo independente, sem vínculo com a Microsoft.";

export function formatarHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, "0")}`;
}
