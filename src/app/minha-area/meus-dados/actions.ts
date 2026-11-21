"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { nomeProprio } from "@/lib/nome-proprio";

export type EstadoDados = { ok?: boolean; erro?: string };

const MAX_FOTO = 50 * 1024; // 50 KB (Wagner, 21/11/2026)
const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const BUCKET = "avatares";

export async function salvarMeusDados(_: EstadoDados, form: FormData): Promise<EstadoDados> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const nome = nomeProprio(String(form.get("nome") ?? "").replace(/\s+/g, " ").trim()).slice(0, 80);
  const profissao = String(form.get("profissao") ?? "").replace(/\s+/g, " ").trim().slice(0, 60) || null;
  if (nome.length < 5 || !nome.includes(" ") || /\d/.test(nome)) return { erro: "Digite seu nome completo (nome e sobrenome)." };

  const admin = criarClienteSupabaseAdmin();
  const { data: atual } = await admin.from("profiles").select("foto_url").eq("id", user.id).maybeSingle();
  let fotoUrl: string | null = atual?.foto_url ?? null;
  const caminhoAntigo = fotoUrl?.split(`/${BUCKET}/`)[1] ?? null;

  const foto = form.get("foto");
  const removerFoto = form.get("remover_foto") === "1";
  if (foto instanceof File && foto.size > 0) {
    const ext = TIPOS[foto.type];
    if (!ext) return { erro: "A foto precisa ser JPG, PNG ou WEBP." };
    if (foto.size > MAX_FOTO) return { erro: `A foto tem ${Math.ceil(foto.size / 1024)} KB. O máximo é 50 KB.` };
    const caminho = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await admin.storage.from(BUCKET).upload(caminho, foto, { contentType: foto.type, upsert: false });
    if (error) return { erro: "Não consegui salvar a foto agora. Tente de novo." };
    fotoUrl = admin.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
    if (caminhoAntigo) await admin.storage.from(BUCKET).remove([caminhoAntigo]);
  } else if (removerFoto) {
    if (caminhoAntigo) await admin.storage.from(BUCKET).remove([caminhoAntigo]);
    fotoUrl = null;
  }

  const { error } = await admin
    .from("profiles")
    .upsert({ id: user.id, nome, profissao, foto_url: fotoUrl, atualizado_em: new Date().toISOString() }, { onConflict: "id" });
  if (error) return { erro: "Não consegui salvar agora. Tente de novo em instantes." };
  // o nome também fica no cadastro de login (usado em e-mails e no SIBRAP IA)
  await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, nome, profissao } });

  revalidatePath("/minha-area", "layout");
  return { ok: true };
}
