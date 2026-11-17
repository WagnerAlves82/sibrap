"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";
import { CURSO_MARCA, PRODUTO_SUPORTE_MARCA } from "@/lib/suporte-marca";

// Suporte Especializado (registro de marca): só para quem está matriculado no curso e aceitou os termos.
export async function criarPagamentoSuporteAction(aceitouTermos: boolean): Promise<EstadoPix> {
  if (!aceitouTermos) return { erro: "Leia e aceite os termos do suporte para continuar." };
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { erro: "Você precisa estar logado com um e-mail válido." };

  const { data: matricula } = await supabase
    .from("matriculas")
    .select("curso_id, cursos!inner(slug)")
    .eq("cursos.slug", CURSO_MARCA)
    .maybeSingle();
  if (!matricula) return { erro: "O suporte é exclusivo para alunos do curso Registre Sua Marca no INPI." };

  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", { p_slug: PRODUTO_SUPORTE_MARCA });
  if (error || !pedidoRows?.[0]) return { erro: error?.message ?? "Não deu pra criar o pedido agora. Tenta de novo." };
  const { pedido_id, produto_nome, valor_centavos } = pedidoRows[0];
  return gerarPixParaPedido({
    supabase,
    pedidoId: pedido_id,
    produtoNome: produto_nome,
    valorCentavos: valor_centavos,
    email: user.email,
    nome: (user.user_metadata as { nome?: string } | undefined)?.nome,
  });
}
