// src/lib/entrega.ts
//
// Entrega automática depois do pagamento: quando o pedido vira "aprovado"
// (webhook ou tela de pagamento), o acesso já é liberado pelo banco (trigger
// conceder_acesso_apos_pagamento) e aqui sai o e-mail com o caminho de
// acesso. O envio é reivindicado no banco antes de disparar, então chamadas
// simultâneas (webhook + polling) não geram e-mail duplicado.

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { enviarAvisoVenda, enviarEntregaApostila } from "@/lib/resend";
import { descreverOrigem, type OrigemVenda } from "@/lib/origem";

export async function entregarPedido(pedidoId: string): Promise<void> {
  const admin = criarClienteSupabaseAdmin();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, user_id, produto_id, valor_centavos, status, entrega_enviada_em, origem")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido || pedido.status !== "aprovado" || pedido.entrega_enviada_em) return;

  // Só apostilas têm e-mail de entrega (cursos, certificados, combos e
  // Premium seguem pela própria área do aluno), mas toda venda gera o aviso
  // ao dono, com a origem.
  const [{ data: apostila }, { data: produto }] = await Promise.all([
    admin.from("apostilas").select("slug, titulo").eq("produto_id", pedido.produto_id).maybeSingle(),
    admin.from("produtos").select("nome, tipo").eq("id", pedido.produto_id).maybeSingle(),
  ]);

  const { data: reivindicado } = await admin
    .from("pedidos")
    .update({ entrega_enviada_em: new Date().toISOString() })
    .eq("id", pedido.id)
    .is("entrega_enviada_em", null)
    .select("id");
  if (!reivindicado?.length) return;

  const { data: usuario } = await admin.auth.admin.getUserById(pedido.user_id);
  const email = usuario.user?.email;
  const nome = (usuario.user?.user_metadata as { nome?: string } | undefined)?.nome;
  const resultado = !apostila
    ? ({ ok: true } as const)
    : email
      ? await enviarEntregaApostila({
          email,
          nome,
          titulo: apostila.titulo,
          slug: apostila.slug,
          valorCentavos: pedido.valor_centavos,
          pedidoId: pedido.id,
        })
      : ({ ok: false, erro: "usuário sem e-mail" } as const);

  // aviso ao dono a cada venda; falha aqui não atrapalha a entrega ao cliente
  await enviarAvisoVenda({
    comprador: nome,
    email,
    titulo: apostila?.titulo ?? produto?.nome ?? "Produto sem nome",
    tipo: apostila ? "apostila" : produto?.tipo ?? null,
    valorCentavos: pedido.valor_centavos,
    pedidoId: pedido.id,
    entregaOk: resultado.ok,
    origem: descreverOrigem(pedido.origem as OrigemVenda | null),
  }).catch((e) => console.error("Aviso de venda não enviado:", e));

  if (!resultado.ok) {
    // libera para uma nova tentativa (próxima confirmação); o download
    // continua disponível na área do aluno de qualquer forma
    await admin.from("pedidos").update({ entrega_enviada_em: null }).eq("id", pedido.id);
    console.error("E-mail de entrega não enviado:", "erro" in resultado ? resultado.erro : "");
  }
}
