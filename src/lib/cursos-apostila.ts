// Apostila prática (manual em PDF) dos cursos profissionalizantes.
// O arquivo fica no bucket privado de PDFs (o mesmo das apostilas pagas); só quem está matriculado baixa,
// pela rota /minha-area/cursos/<slug>/apostila, que gera um link assinado de 2 minutos.
export const APOSTILA_DO_CURSO: Record<string, { caminho: string; arquivo: string }> = {
  "eletricista-residencial-basico": {
    caminho: "cursos/eletricista-residencial-basico/apostila-pratica.pdf",
    arquivo: "SIBRAP-Apostila-Pratica-Eletricista-Residencial.pdf",
  },
  "automacao-residencial-inteligente": {
    caminho: "cursos/automacao-residencial-inteligente/apostila-pratica.pdf",
    arquivo: "SIBRAP-Apostila-Pratica-Automacao-Residencial.pdf",
  },
  "bombeiro-hidraulico": {
    caminho: "cursos/bombeiro-hidraulico/apostila-pratica.pdf",
    arquivo: "SIBRAP-Apostila-Pratica-Bombeiro-Hidraulico.pdf",
  },
};

// Desde 17/11/2026 os cursos profissionalizantes são gratuitos: a apostila vai junto com o certificado pago
// (qualquer produto 'certificado-<slug>…' liberado ao aluno, inclusive pela Formação Inicial para Eletricista).
// Recebe o cliente do usuário logado (RLS: acessos só do próprio aluno).
export async function temApostilaDoCurso(
  supabase: { from: (t: string) => any },
  cursoId: string,
  cursoSlug: string
): Promise<boolean> {
  const { data } = await supabase
    .from("acessos")
    .select("id, produtos!inner(slug, curso_id)")
    .eq("produtos.curso_id", cursoId)
    .like("produtos.slug", `certificado-${cursoSlug}%`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}
