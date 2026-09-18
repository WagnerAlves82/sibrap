"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { tokenAdminValido, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

async function exigirAdmin() {
  const cookieStore = await cookies();
  if (!tokenAdminValido(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error("Não autorizado");
  }
}

async function decidir(id: string, status: "aprovado" | "recusado", motivo?: string) {
  await exigirAdmin();
  const admin = criarClienteSupabaseAdmin();

  const { data: comprovante } = await admin
    .from("comprovantes_cadunico")
    .select("storage_path, status")
    .eq("id", id)
    .maybeSingle();
  if (!comprovante || comprovante.status !== "pendente") return;

  await admin
    .from("comprovantes_cadunico")
    .update({
      status,
      motivo_recusa: status === "recusado" ? (motivo || null) : null,
      analisado_em: new Date().toISOString(),
      storage_path: null,
    })
    .eq("id", id);

  // minimização de dados (LGPD): o documento é apagado assim que a análise termina
  if (comprovante.storage_path) {
    await admin.storage.from("cadunico").remove([comprovante.storage_path]);
  }

  revalidatePath("/admin/comprovantes");
}

export async function aprovarComprovanteAction(formData: FormData) {
  await decidir(String(formData.get("id") ?? ""), "aprovado");
}

export async function recusarComprovanteAction(formData: FormData) {
  await decidir(
    String(formData.get("id") ?? ""),
    "recusado",
    String(formData.get("motivo") ?? "").trim().slice(0, 200)
  );
}
