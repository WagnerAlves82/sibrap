// src/lib/entrega.ts
//
// Entrega automática depois do pagamento: quando o pedido vira "aprovado"
// (webhook ou tela de pagamento), o acesso já é liberado pelo banco (trigger
// conceder_acesso_apos_pagamento) e aqui sai o e-mail com o caminho de
// acesso. O envio é reivindicado no banco antes de disparar, então chamadas
// simultâneas (webhook + polling) não geram e-mail duplicado.

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { enviarEntregaApostila } from "@/lib/resend";

export async function entregarPedido(pedidoId: string): Promise<void> {
  const admin = criarClienteSupabaseAdmin();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, user_id, produto_id, valor_centavos, status, entrega_enviada_em")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido || pedido.status !== "aprovado" || pedido.entrega_enviada_em) return;

  // Por ora só apostilas têm e-mail de entrega (cursos/certificado seguem
  // pela própria área do aluno).
  const { data: apostila } = await admin
    .from("apostilas")
    .select("slug, titulo")
    .eq("produto_id", pedido.produto_id)
    .maybeSingle();
  if (!apostila) return;

  const { data: reivindicado } = await admin
    .from("pedidos")
    .update({ entrega_enviada_em: new Date().toISOString() })
    .eq("id", pedido.id)
    .is("entrega_enviada_em", null)
    .select("id");
  if (!reivindicado?.length) return;

  const { data: usuario } = await admin.auth.admin.getUserById(pedido.user_id);
  const email = usuario.user?.email;
  const resultado = email
    ? await enviarEntregaApostila({
        email,
        nome: (usuario.user?.user_metadata as { nome?: string } | undefined)?.nome,
        titulo: apostila.titulo,
        slug: apostila.slug,
        valorCentavos: pedido.valor_centavos,
        pedidoId: pedido.id,
      })
    : ({ ok: false, erro: "usuário sem e-mail" } as const);

  if (!resultado.ok) {
    // libera para uma nova tentativa (próxima confirmação); o download
    // continua disponível na área do aluno de qualquer forma
    await admin.from("pedidos").update({ entrega_enviada_em: null }).eq("id", pedido.id);
    console.error("E-mail de entrega não enviado:", resultado.erro);
  }
}
