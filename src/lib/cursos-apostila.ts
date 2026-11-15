// Apostila prática (manual em PDF) dos cursos profissionalizantes.
// O arquivo fica no bucket privado de PDFs (o mesmo das apostilas pagas); só quem está matriculado baixa,
// pela rota /minha-area/cursos/<slug>/apostila, que gera um link assinado de 2 minutos.
export const APOSTILA_DO_CURSO: Record<string, { caminho: string; arquivo: string }> = {
  "eletricista-residencial-basico": {
    caminho: "cursos/eletricista-residencial-basico/apostila-pratica.pdf",
    arquivo: "SIBRAP-Apostila-Pratica-Eletricista-Residencial.pdf",
  },
};
