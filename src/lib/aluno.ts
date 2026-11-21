import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { apostilasComRedacao } from "@/lib/redacao-dados";

// Dados da barra da área logada (nome, foto e se o aluno tem Treino de Redação). Só em páginas da Minha área,
// que já são dinâmicas (com login); páginas públicas em cache não chamam isto.
export type DadosBarraAluno = { nome: string; foto: string | null; temRedacao: boolean };

export function primeiroNome(n: string | null | undefined): string {
  const p = /\d/.test(n ?? "") ? "" : (n ?? "").trim().split(/\s+/)[0] ?? "";
  return p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : "";
}

export async function dadosBarraAluno(): Promise<DadosBarraAluno | null> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: perfil }, redacao] = await Promise.all([
    supabase.from("profiles").select("nome, foto_url").eq("id", user.id).maybeSingle(),
    apostilasComRedacao(user.id).catch(() => []),
  ]);
  return {
    nome: primeiroNome(perfil?.nome ?? (user.user_metadata?.nome as string | undefined)),
    foto: perfil?.foto_url ?? null,
    temRedacao: redacao.some((a) => a.vigente),
  };
}
