"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { tokenAdminValido, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

export type Estado = { erro?: string; ok?: boolean } | null;

async function autorizado() {
  const cookieStore = await cookies();
  return tokenAdminValido(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

function texto(formData: FormData, campo: string, max = 4000) {
  return String(formData.get(campo) ?? "").trim().slice(0, max);
}

export async function salvarConteudoAction(_a: Estado, formData: FormData): Promise<Estado> {
  if (!(await autorizado())) return { erro: "Não autorizado" };
  const id = texto(formData, "id", 60);
  const admin = criarClienteSupabaseAdmin();
  const { error } = await admin
    .from("aulas")
    .update({
      objetivo: texto(formData, "objetivo", 600) || null,
      resumo: texto(formData, "resumo") || null,
      atividade: texto(formData, "atividade") || null,
    })
    .eq("id", id);
  if (error) return { erro: error.message };
  revalidatePath(`/admin/cursos/aula/${id}`);
  return { ok: true };
}

const TIPOS: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export async function adicionarMaterialAction(_a: Estado, formData: FormData): Promise<Estado> {
  if (!(await autorizado())) return { erro: "Não autorizado" };
  const aulaId = texto(formData, "aula_id", 60);
  const titulo = texto(formData, "titulo", 120);
  const link = texto(formData, "link", 500);
  const arquivo = formData.get("arquivo");
  if (!titulo) return { erro: "Dê um título ao material." };

  const admin = criarClienteSupabaseAdmin();
  let url = "";

  if (arquivo instanceof File && arquivo.size > 0) {
    if (arquivo.size > 3.5 * 1024 * 1024) return { erro: "Arquivo grande demais (máximo 3,5 MB)." };
    const ext = arquivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!TIPOS[ext]) return { erro: "Formato não aceito. Use PDF, DOCX, XLSX, PPTX, PNG ou JPG." };
    const caminho = `${aulaId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await admin.storage
      .from("material-cursos")
      .upload(caminho, new Uint8Array(await arquivo.arrayBuffer()), { contentType: TIPOS[ext] });
    if (error) return { erro: "Não deu pra enviar o arquivo." };
    url = admin.storage.from("material-cursos").getPublicUrl(caminho).data.publicUrl;
  } else if (link) {
    if (!/^https:\/\/[^\s]+$/.test(link)) return { erro: "O link precisa começar com https://" };
    url = link;
  } else {
    return { erro: "Envie um arquivo ou cole um link." };
  }

  const { error } = await admin.from("aula_materiais").insert({ aula_id: aulaId, titulo, url });
  if (error) return { erro: error.message };
  revalidatePath(`/admin/cursos/aula/${aulaId}`);
  return { ok: true };
}

export async function removerMaterialAction(formData: FormData) {
  if (!(await autorizado())) return;
  const id = texto(formData, "id", 60);
  const aulaId = texto(formData, "aula_id", 60);
  const admin = criarClienteSupabaseAdmin();
  const { data: material } = await admin.from("aula_materiais").select("url").eq("id", id).maybeSingle();
  await admin.from("aula_materiais").delete().eq("id", id);
  const marca = "/material-cursos/";
  if (material?.url.includes(marca)) {
    await admin.storage.from("material-cursos").remove([material.url.split(marca)[1]]);
  }
  revalidatePath(`/admin/cursos/aula/${aulaId}`);
}

export async function salvarQuestaoAction(_a: Estado, formData: FormData): Promise<Estado> {
  if (!(await autorizado())) return { erro: "Não autorizado" };
  const id = texto(formData, "id", 60);
  const aulaId = texto(formData, "aula_id", 60);
  const enunciado = texto(formData, "enunciado", 500);
  const textos = ["A", "B", "C", "D"].map((l) => texto(formData, `alt_${l}`, 250));
  const gabarito = texto(formData, "gabarito", 1).toUpperCase();
  const ordem = Number(formData.get("ordem")) || 1;

  if (!enunciado) return { erro: "Escreva o enunciado." };
  if (textos.some((t) => !t)) return { erro: "Preencha as 4 alternativas." };
  if (!["A", "B", "C", "D"].includes(gabarito)) return { erro: "Escolha a alternativa correta." };

  const dados = {
    aula_id: aulaId,
    ordem,
    enunciado,
    alternativas: textos.map((t, i) => ({ letra: "ABCD"[i], texto: t })),
    gabarito,
    comentario: texto(formData, "comentario", 400) || null,
  };
  const admin = criarClienteSupabaseAdmin();
  const { error } = id
    ? await admin.from("aula_quiz").update(dados).eq("id", id)
    : await admin.from("aula_quiz").insert(dados);
  if (error) return { erro: error.message };
  revalidatePath(`/admin/cursos/aula/${aulaId}`);
  return { ok: true };
}

export async function removerQuestaoAction(formData: FormData) {
  if (!(await autorizado())) return;
  const aulaId = texto(formData, "aula_id", 60);
  await criarClienteSupabaseAdmin().from("aula_quiz").delete().eq("id", texto(formData, "id", 60));
  revalidatePath(`/admin/cursos/aula/${aulaId}`);
}
