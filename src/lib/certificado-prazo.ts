// Cursos profissionalizantes: o certificado só pode ser emitido 5 dias depois da compra (matrícula).
// A regra é conferida no banco (trigger certificados_profissionalizante); aqui só para avisar o aluno.
// Não anunciar na página pública: o aluno fica sabendo na área do curso, depois de comprar.
export const DIAS_PARA_CERTIFICADO = 5;

export function liberacaoCertificado(matriculaEm: string): Date {
  return new Date(new Date(matriculaEm).getTime() + DIAS_PARA_CERTIFICADO * 24 * 60 * 60 * 1000);
}

export function dataHoraBR(d: Date): string {
  const data = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return `${data} às ${hora}`;
}
