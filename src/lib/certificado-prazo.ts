// Cursos profissionalizantes: o certificado só pode ser emitido 5 dias depois da compra (matrícula).
// A regra é conferida no banco (trigger certificados_profissionalizante); aqui só para avisar o aluno.
// Não anunciar na página pública: o aluno fica sabendo na área do curso, depois de comprar.
export const DIAS_PARA_CERTIFICADO = 5;

// cursos com ritmo (cursos.dias_minimos_prova, ex.: 15 na Formação para Eletricista) esperam mais
export function diasParaCertificado(diasMinimosProva: number | null | undefined): number {
  return Math.max(DIAS_PARA_CERTIFICADO, diasMinimosProva ?? DIAS_PARA_CERTIFICADO);
}

export function liberacaoCertificado(matriculaEm: string, dias: number = DIAS_PARA_CERTIFICADO): Date {
  return new Date(new Date(matriculaEm).getTime() + dias * 24 * 60 * 60 * 1000);
}

/** "2026-11-15T..." -> "2026-11-15" no fuso de Brasília */
export function diaBR(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function dataHoraBR(d: Date): string {
  const data = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return `${data} às ${hora}`;
}

// Formação continuada (seção Educação): prazo mínimo desde a matrícula conforme a carga do certificado.
// A regra é conferida no banco (trigger certificados_formacao_continuada e horas_liberadas_certificado).
export function diasMinimosCarga(horas: number): number {
  return horas <= 20 ? 5 : horas <= 40 ? 7 : horas <= 60 ? 10 : 12;
}
