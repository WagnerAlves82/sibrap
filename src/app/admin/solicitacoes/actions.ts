"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { STATUS_SOLICITACAO } from "@/app/solicitacao/tipos";

async function exigirAdmin() {
  const cookieStore = await cookies();
  if (!(await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value))) throw new Error("Não autorizado");
}

export async function atualizarSolicitacao(form: FormData) {
  await exigirAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  const nota = String(form.get("nota") ?? "").trim().slice(0, 2000) || null;
  if (!id || !STATUS_SOLICITACAO.some((s) => s.valor === status)) return;
  const admin = criarClienteSupabaseAdmin() as unknown as SupabaseClient;
  await admin.from("solicitacoes").update({ status, nota_admin: nota, atualizado_em: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/solicitacoes");
}

export async function apagarSolicitacao(form: FormData) {
  await exigirAdmin();
  const id = String(form.get("id") ?? "");
  if (!id) return;
  const admin = criarClienteSupabaseAdmin() as unknown as SupabaseClient;
  await admin.from("solicitacoes").delete().eq("id", id);
  revalidatePath("/admin/solicitacoes");
}
