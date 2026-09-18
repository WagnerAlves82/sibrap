"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { tokenAdminValido, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

// Aceita o link do YouTube (watch, youtu.be, embed, shorts) ou o id direto
function extrairIdYoutube(entrada: string): string | null {
  const texto = entrada.trim();
  if (!texto) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(texto)) return texto;
  try {
    const url = new URL(texto);
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1);
    else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      id = url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop() ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export type EstadoSalvarAula = { erro?: string; ok?: boolean } | null;

export async function salvarAulaAction(
  _anterior: EstadoSalvarAula,
  formData: FormData
): Promise<EstadoSalvarAula> {
  const cookieStore = await cookies();
  if (!tokenAdminValido(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return { erro: "Não autorizado" };
  }

  const id = String(formData.get("id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const link = String(formData.get("youtube") ?? "");
  const cargaMin = Number(formData.get("carga_min"));
  const duracaoBruta = String(formData.get("duracao_video_min") ?? "").trim();
  const duracao = duracaoBruta ? Number(duracaoBruta) : null;

  if (!titulo) return { erro: "Título vazio" };
  if (!Number.isInteger(cargaMin) || cargaMin <= 0) return { erro: "Carga inválida" };
  if (duracao !== null && (!Number.isInteger(duracao) || duracao <= 0)) {
    return { erro: "Duração do vídeo inválida" };
  }
  const youtubeId = link.trim() ? extrairIdYoutube(link) : null;
  if (link.trim() && !youtubeId) return { erro: "Link do YouTube inválido" };

  const admin = criarClienteSupabaseAdmin();
  const { error } = await admin
    .from("aulas")
    .update({ titulo, carga_min: cargaMin, duracao_video_min: duracao, youtube_id: youtubeId })
    .eq("id", id);
  if (error) return { erro: error.message };

  revalidatePath("/admin/cursos");
  return { ok: true };
}
