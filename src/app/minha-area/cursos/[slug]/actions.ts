"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";

export async function matricularAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const supabase = await criarClienteSupabaseServer();
  await supabase.rpc("matricular_curso", { p_curso_slug: slug });
  redirect(`/minha-area/cursos/${slug}`);
}

// Curso pago: cria o pedido do produto 'curso-<slug>' e gera o PIX.
// Ao aprovar, o banco libera o acesso, matricula o aluno e inclui o certificado online.
export async function criarPagamentoCursoAction(slug: string): Promise<EstadoPix> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { erro: "Você precisa estar logado com um e-mail válido." };
  }
  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", { p_slug: `curso-${slug}` });
  if (error || !pedidoRows?.[0]) {
    return { erro: error?.message ?? "Não deu pra criar o pedido agora. Tenta de novo." };
  }
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
