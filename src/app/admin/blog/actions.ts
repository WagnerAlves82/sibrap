"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { BUCKET_CAPAS, ESFERAS, gerarSlug, slugValidoPost } from "@/lib/blog";

const TAMANHO_MAXIMO_CAPA = 3.5 * 1024 * 1024;

async function autorizado() {
  const cookieStore = await cookies();
  return await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

// Confere os primeiros bytes (não confia só no tipo declarado pelo navegador)
function tipoDaImagem(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();
const opcional = (fd: FormData, campo: string) => texto(fd, campo) || null;

function revalidarBlog(slug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
}

export type EstadoPost = { erro?: string; ok?: boolean } | null;

export async function salvarPostAction(_anterior: EstadoPost, formData: FormData): Promise<EstadoPost> {
  if (!(await autorizado())) return { erro: "Não autorizado" };

  const id = texto(formData, "id");
  const titulo = texto(formData, "titulo");
  if (!titulo) return { erro: "Título é obrigatório." };

  const slug = texto(formData, "slug") || gerarSlug(titulo);
  if (!slugValidoPost(slug)) return { erro: "Slug inválido (use letras minúsculas, números e hífen)." };

  const status = texto(formData, "status") === "publicada" ? "publicada" : "rascunho";
  const conteudo = texto(formData, "conteudo");
  if (!conteudo) return { erro: "O conteúdo do post não pode ficar vazio." };

  const uf = opcional(formData, "uf");
  const regiao = opcional(formData, "regiao");
  const categoria = texto(formData, "categoria") || "Concursos";
  const resumo = opcional(formData, "resumo");
  const autor = texto(formData, "autor") || "SIBRAP";
  const destaque = formData.get("destaque") === "on";
  const editalUrl = opcional(formData, "edital_url");
  if (editalUrl && !/^https?:\/\/\S+$/i.test(editalUrl)) return { erro: "O link do edital precisa começar com http:// ou https://." };
  const esferaBruta = opcional(formData, "esfera");
  const esfera = ESFERAS.find((e) => e.valor === esferaBruta)?.valor ?? null;
  const importancia = Math.min(10, Math.max(0, Math.trunc(Number(texto(formData, "importancia"))) || 0));
  const certameTipo = opcional(formData, "certame_tipo");
  const editalNumero = opcional(formData, "edital_numero");
  const retificacoes = opcional(formData, "retificacoes");
  const apostilasSlugs = texto(formData, "apostilas_slugs")
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (apostilasSlugs.some((sl) => !slugValidoPost(sl))) return { erro: "Slug de apostila inválido (separe por vírgula)." };

  const admin = criarClienteSupabaseAdmin();

  // capa (opcional): envia se um arquivo novo foi escolhido
  let capaPath: string | undefined;
  const arquivoCapa = formData.get("capa");
  if (arquivoCapa instanceof File && arquivoCapa.size > 0) {
    if (arquivoCapa.size > TAMANHO_MAXIMO_CAPA) return { erro: "Capa muito grande (máximo 3,5 MB)." };
    const bytes = new Uint8Array(await arquivoCapa.arrayBuffer());
    const tipo = tipoDaImagem(bytes);
    if (!tipo) return { erro: "A capa precisa ser JPG, PNG ou WebP." };
    const caminho = `blog-${slug}-capa-${Date.now()}.${tipo.ext}`;
    const { error } = await admin.storage.from(BUCKET_CAPAS).upload(caminho, bytes, {
      contentType: tipo.mime,
      cacheControl: "31536000",
    });
    if (error) return { erro: `Falha ao enviar a capa: ${error.message}` };
    capaPath = caminho;
  }

  const publicarAgora = status === "publicada";

  if (id) {
    // edição: se já existia com outro status e virou "publicada" agora,
    // grava publicado_em só se ainda não tinha (não republica a data toda vez)
    const { data: atual } = await admin.from("posts").select("status, publicado_em, capa_path").eq("id", id).maybeSingle();
    if (!atual) return { erro: "Post não encontrado." };

    const { error } = await admin
      .from("posts")
      .update({
        titulo,
        slug,
        resumo,
        conteudo,
        categoria,
        regiao,
        uf,
        autor,
        destaque,
        edital_url: editalUrl,
        certame_tipo: certameTipo,
        esfera,
        importancia,
        edital_numero: editalNumero,
        retificacoes,
        apostilas_slugs: apostilasSlugs,
        status,
        ...(capaPath ? { capa_path: capaPath } : {}),
        ...(publicarAgora && !atual.publicado_em ? { publicado_em: new Date().toISOString() } : {}),
      })
      .eq("id", id);
    if (error) return { erro: error.message };

    if (capaPath && atual.capa_path && atual.capa_path !== capaPath) {
      await admin.storage.from(BUCKET_CAPAS).remove([atual.capa_path]);
    }
  } else {
    const { error } = await admin.from("posts").insert({
      titulo,
      slug,
      resumo,
      conteudo,
      categoria,
      regiao,
      uf,
      autor,
      destaque,
      edital_url: editalUrl,
      certame_tipo: certameTipo,
      esfera,
      importancia,
      edital_numero: editalNumero,
      retificacoes,
      apostilas_slugs: apostilasSlugs,
      status,
      capa_path: capaPath ?? null,
      ...(publicarAgora ? { publicado_em: new Date().toISOString() } : {}),
    });
    if (error) {
      if (capaPath) await admin.storage.from(BUCKET_CAPAS).remove([capaPath]);
      return { erro: error.code === "23505" ? "Já existe um post com esse slug." : error.message };
    }
  }

  revalidarBlog(slug);
  return { ok: true };
}

export async function excluirPostAction(id: string): Promise<{ erro?: string; ok?: boolean }> {
  if (!(await autorizado())) return { erro: "Não autorizado" };
  const admin = criarClienteSupabaseAdmin();
  const { data: post } = await admin.from("posts").select("slug, capa_path").eq("id", id).maybeSingle();
  const { error } = await admin.from("posts").delete().eq("id", id);
  if (error) return { erro: error.message };
  if (post?.capa_path) await admin.storage.from(BUCKET_CAPAS).remove([post.capa_path]);
  revalidarBlog(post?.slug);
  return { ok: true };
}
