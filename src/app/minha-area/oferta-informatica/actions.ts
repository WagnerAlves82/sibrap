"use server";

import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";
import { OFERTA_INFORMATICA, ofertaInformaticaValida, produtoOfertaInformatica } from "@/lib/oferta-informatica";

// Oferta Informática + 1: matricula nos 2 cursos (gratuitos) e gera o PIX do produto da escolha.
// Ao aprovar, o banco libera os 2 certificados (produto_combo_itens).
export async function criarPagamentoOfertaInformaticaAction(cursoSlug: string): Promise<EstadoPix> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { erro: "Você precisa estar logado com um e-mail válido." };
  if (!(await ofertaInformaticaValida(user.email))) return { erro: "Esta oferta não está disponível para a sua conta ou já terminou." };
  if (!/^[a-z0-9-]{3,80}$/.test(cursoSlug)) return { erro: "Escolha o segundo curso." };

  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", { p_slug: produtoOfertaInformatica(cursoSlug) });
  if (error || !pedidoRows?.[0]) return { erro: error?.message ?? "Não deu pra criar o pedido agora. Tenta de novo." };

  // cursos gratuitos: já deixa a pessoa matriculada nos dois (idempotente)
  await Promise.all([OFERTA_INFORMATICA.cursoBase, cursoSlug].map((s) => supabase.rpc("matricular_curso", { p_curso_slug: s })));

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
