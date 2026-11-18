export const TIPOS_SOLICITACAO = [
  { valor: "pacote", rotulo: "Pacote de cursos ou certificados" },
  { valor: "curso", rotulo: "Curso que ainda não existe no site" },
  { valor: "certificado", rotulo: "Certificado (carga horária, dados, segunda via)" },
  { valor: "apostila", rotulo: "Apostila para um concurso" },
  { valor: "empresa", rotulo: "Treinamento para empresa ou turma" },
  { valor: "outro", rotulo: "Outro pedido" },
] as const;

export const STATUS_SOLICITACAO = [
  { valor: "nova", rotulo: "Nova" },
  { valor: "em_analise", rotulo: "Em análise" },
  { valor: "respondida", rotulo: "Respondida" },
  { valor: "recusada", rotulo: "Recusada" },
] as const;
