"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {  ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { BUCKET_CAPAS, BUCKET_PDFS, CATEGORIAS, UFS, slugValido } from "@/lib/apostilas";

const TAMANHO_MAXIMO_CAPA = 3.5 * 1024 * 1024;

async function autorizado() {
  const cookieStore = await cookies();
  return (await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value));
}

// Confere os primeiros bytes (não confia só no tipo declarado)
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
const dataOuNula = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function inteiroOuNulo(fd: FormData, campo: string): number | null | "invalido" {
  const v = texto(fd, campo);
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : "invalido";
}

function precoEmCentavos(v: string): number | null {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function revalidarVitrine(slug?: string) {
  revalidatePath("/");
  revalidatePath("/apostilas");
  if (slug) revalidatePath(`/apostilas/${slug}`);
  revalidatePath("/admin/apostilas");
}

async function enviarMockups(
  admin: ReturnType<typeof criarClienteSupabaseAdmin>,
  lista: { path: string; bytes: Uint8Array; mime: string }[]
): Promise<string[] | null> {
  const enviados: string[] = [];
  for (const m of lista) {
    const { error } = await admin.storage
      .from(BUCKET_CAPAS)
      .upload(m.path, m.bytes, { contentType: m.mime, cacheControl: "31536000" });
    if (error) {
      if (enviados.length) await admin.storage.from(BUCKET_CAPAS).remove(enviados);
      return null;
    }
    enviados.push(m.path);
  }
  return enviados;
}

export type EstadoApostila = { erro?: string; ok?: boolean } | null;

export async function salvarApostilaAction(
  _anterior: EstadoApostila,
  formData: FormData
): Promise<EstadoApostila> {
  if (!(await autorizado())) return { erro: "Não autorizado" };

  const id = texto(formData, "id");
  const slugInformado = texto(formData, "slug").toLowerCase();
  const titulo = texto(formData, "titulo");
  const orgao = texto(formData, "orgao");
  const cargo = texto(formData, "cargo");
  const uf = texto(formData, "uf");
  const categoria = texto(formData, "categoria");
  const status = texto(formData, "status") === "publicada" ? "publicada" : "rascunho";
  const centavos = precoEmCentavos(texto(formData, "preco"));
  const paginas = inteiroOuNulo(formData, "paginas");
  const questoes = inteiroOuNulo(formData, "questoes");
  const simulados = inteiroOuNulo(formData, "simulados");
  const ordem = inteiroOuNulo(formData, "ordem");

  if (!titulo || !orgao || !cargo) return { erro: "Preencha título, órgão e cargo." };
  if (!(UFS as readonly string[]).includes(uf)) return { erro: "Escolha o estado (UF)." };
  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return { erro: "Escolha a categoria." };
  if (centavos === null) return { erro: "Preço inválido. Exemplo: 39,90" };
  if ([paginas, questoes, simulados, ordem].includes("invalido")) {
    return { erro: "Páginas, questões, simulados e ordem devem ser números inteiros." };
  }

  const selos = texto(formData, "selos")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (selos.length > 5 || selos.some((l) => l.length > 30)) {
    return { erro: "Selos: no máximo 5, com até 30 caracteres cada (um por linha)." };
  }
  const originalBruto = texto(formData, "preco_original");
  const precoOriginal = originalBruto ? precoEmCentavos(originalBruto) : null;
  if (originalBruto && (precoOriginal === null || precoOriginal <= centavos)) {
    return { erro: "O preço de referência precisa ser maior que o preço de venda (ou deixe vazio)." };
  }

  const admin = criarClienteSupabaseAdmin();

  // Mockups (opcionais; se enviar algum, substitui os atuais)
  const mockupsNovos: { path: string; bytes: Uint8Array; mime: string }[] = [];
  const arquivosMockup = formData.getAll("mockups").filter((f): f is File => f instanceof File && f.size > 0);
  if (arquivosMockup.length > 4) return { erro: "Envie no máximo 4 imagens de mockup." };
  for (const [i, arq] of arquivosMockup.entries()) {
    if (arq.size > TAMANHO_MAXIMO_CAPA) return { erro: `O mockup ${arq.name} é grande demais (máximo 3,5 MB). Use WebP.` };
    const bytes = new Uint8Array(await arq.arrayBuffer());
    const tipo = tipoDaImagem(bytes);
    if (!tipo) return { erro: `Formato não aceito em ${arq.name}. Use JPG, PNG ou WebP.` };
    mockupsNovos.push({ path: `${id ? "mockup" : slugInformado}-${Date.now()}-${i + 1}.${tipo.ext}`, bytes, mime: tipo.mime });
  }

  // Capa (opcional)
  let capaNova: { path: string; bytes: Uint8Array; mime: string } | null = null;
  const capa = formData.get("capa");
  if (capa instanceof File && capa.size > 0) {
    if (capa.size > TAMANHO_MAXIMO_CAPA) return { erro: "A capa é grande demais (máximo 3,5 MB)." };
    const bytes = new Uint8Array(await capa.arrayBuffer());
    const tipo = tipoDaImagem(bytes);
    if (!tipo) return { erro: "Formato de capa não aceito. Use JPG, PNG ou WebP." };
    capaNova = { path: "", bytes, mime: tipo.mime };
    capaNova.path = `${id ? "capa" : slugInformado}-${Date.now()}.${tipo.ext}`;
  }

  const campos = {
    titulo,
    orgao,
    cargo,
    uf,
    categoria,
    cidade: opcional(formData, "cidade"),
    banca: opcional(formData, "banca"),
    descricao: opcional(formData, "descricao"),
    salario: opcional(formData, "salario"),
    vagas: opcional(formData, "vagas"),
    data_prova: dataOuNula(opcional(formData, "data_prova")),
    inscricoes_ate: dataOuNula(opcional(formData, "inscricoes_ate")),
    paginas: paginas as number | null,
    questoes: questoes as number | null,
    simulados: simulados as number | null,
    ordem: (ordem as number | null) ?? 0,
    selos,
    preco_original_centavos: precoOriginal,
    destaque: formData.get("destaque") === "on",
    status,
    atualizado_em: new Date().toISOString(),
  };

  // ---------- criar ----------
  if (!id) {
    if (!slugValido(slugInformado)) {
      return { erro: "Slug inválido. Use minúsculas, números e hífens (ex.: cacador-professor-anos-iniciais)." };
    }
    if (status === "publicada") {
      return { erro: "Salve como rascunho, envie o PDF e a capa e só então publique." };
    }
    const { data: produto, error: erroProduto } = await admin
      .from("produtos")
      .insert({
        slug: `apostila-${slugInformado}`,
        nome: `Apostila — ${titulo} — ${orgao}`,
        descricao: campos.descricao,
        preco_centavos: centavos,
        inclui_apostila: true,
        inclui_simulado: false,
        ativo: false,
        tipo: "apostila",
      })
      .select("id")
      .single();
    if (erroProduto || !produto) {
      return { erro: erroProduto?.message ?? "Não foi possível criar o produto." };
    }

    let capaPath: string | null = null;
    if (capaNova) {
      const { error } = await admin.storage
        .from(BUCKET_CAPAS)
        .upload(capaNova.path, capaNova.bytes, { contentType: capaNova.mime });
      if (error) {
        await admin.from("produtos").delete().eq("id", produto.id);
        return { erro: "Não deu pra enviar a capa. Tente de novo." };
      }
      capaPath = capaNova.path;
    }

    const imagens = await enviarMockups(admin, mockupsNovos);
    if (!imagens) {
      await admin.from("produtos").delete().eq("id", produto.id);
      if (capaPath) await admin.storage.from(BUCKET_CAPAS).remove([capaPath]);
      return { erro: "Não deu pra enviar os mockups. Tente de novo." };
    }

    const { error: erroApostila } = await admin
      .from("apostilas")
      .insert({ ...campos, slug: slugInformado, produto_id: produto.id, capa_path: capaPath, imagens });
    if (erroApostila) {
      await admin.from("produtos").delete().eq("id", produto.id);
      await admin.storage.from(BUCKET_CAPAS).remove([...(capaPath ? [capaPath] : []), ...imagens]);
      return { erro: erroApostila.message };
    }
    revalidarVitrine(slugInformado);
    return { ok: true };
  }

  // ---------- editar ----------
  const { data: atual } = await admin
    .from("apostilas")
    .select("slug, produto_id, capa_path, imagens, produtos(apostila_storage_path)")
    .eq("id", id)
    .maybeSingle();
  if (!atual) return { erro: "Apostila não encontrada." };

  if (status === "publicada") {
    if (!atual.capa_path && !capaNova) return { erro: "Envie a capa antes de publicar." };
    if (!atual.produtos?.apostila_storage_path) return { erro: "Envie o PDF antes de publicar." };
  }

  let capaPath = atual.capa_path;
  if (capaNova) {
    const { error } = await admin.storage
      .from(BUCKET_CAPAS)
      .upload(capaNova.path, capaNova.bytes, { contentType: capaNova.mime });
    if (error) return { erro: "Não deu pra enviar a capa. Tente de novo." };
    capaPath = capaNova.path;
  }

  let imagens = atual.imagens ?? [];
  if (mockupsNovos.length) {
    const enviados = await enviarMockups(admin, mockupsNovos);
    if (!enviados) return { erro: "Não deu pra enviar os mockups. Tente de novo." };
    imagens = enviados;
  }

  const { error: erroApostila } = await admin
    .from("apostilas")
    .update({ ...campos, capa_path: capaPath, imagens })
    .eq("id", id);
  if (erroApostila) return { erro: erroApostila.message };

  const { error: erroProduto } = await admin
    .from("produtos")
    .update({
      nome: `Apostila — ${titulo} — ${orgao}`,
      descricao: campos.descricao,
      preco_centavos: centavos,
      ativo: status === "publicada",
    })
    .eq("id", atual.produto_id);
  if (erroProduto) return { erro: erroProduto.message };

  const descartar = [
    ...(capaNova && atual.capa_path && atual.capa_path !== capaPath ? [atual.capa_path] : []),
    ...(mockupsNovos.length ? (atual.imagens ?? []) : []),
  ];
  if (descartar.length) await admin.storage.from(BUCKET_CAPAS).remove(descartar);

  revalidarVitrine(atual.slug);
  return { ok: true };
}

// O PDF passa de 4 MB, então não vai pelo formulário: o servidor libera
// um endereço de envio de uso único e o navegador manda o arquivo direto
// para o Storage.
export async function prepararUploadPdfAction(
  apostilaId: string
): Promise<{ erro: string } | { path: string; token: string }> {
  if (!(await autorizado())) return { erro: "Não autorizado" };
  const admin = criarClienteSupabaseAdmin();
  const { data: ap } = await admin.from("apostilas").select("slug").eq("id", apostilaId).maybeSingle();
  if (!ap) return { erro: "Apostila não encontrada." };

  const path = `${ap.slug}-${Date.now()}.pdf`;
  const { data, error } = await admin.storage.from(BUCKET_PDFS).createSignedUploadUrl(path);
  if (error || !data) return { erro: "Não deu pra preparar o envio. Tente de novo." };
  return { path, token: data.token };
}

export async function confirmarUploadPdfAction(
  apostilaId: string,
  path: string
): Promise<{ erro: string } | { ok: true }> {
  if (!(await autorizado())) return { erro: "Não autorizado" };
  const admin = criarClienteSupabaseAdmin();
  const { data: ap } = await admin
    .from("apostilas")
    .select("slug, produto_id, produtos(apostila_storage_path)")
    .eq("id", apostilaId)
    .maybeSingle();
  if (!ap) return { erro: "Apostila não encontrada." };
  if (!path.startsWith(`${ap.slug}-`) || !path.endsWith(".pdf")) return { erro: "Arquivo inválido." };

  // O upload vai direto do navegador pro Storage (arquivo grande demais pro
  // formulário) — os bytes nunca passam pelo servidor antes daqui. Confere
  // a assinatura "%PDF-" real, não só o nome do arquivo.
  const { data: arquivo, error: erroDownload } = await admin.storage.from(BUCKET_PDFS).download(path);
  if (erroDownload || !arquivo) return { erro: "O arquivo não chegou ao servidor. Envie de novo." };
  const cabecalho = new Uint8Array(await arquivo.slice(0, 5).arrayBuffer());
  const ehPdf =
    cabecalho[0] === 0x25 && cabecalho[1] === 0x50 && cabecalho[2] === 0x44 && cabecalho[3] === 0x46 && cabecalho[4] === 0x2d;
  if (!ehPdf) {
    await admin.storage.from(BUCKET_PDFS).remove([path]);
    return { erro: "O arquivo enviado não é um PDF válido." };
  }

  const anterior = ap.produtos?.apostila_storage_path;
  const { error } = await admin
    .from("produtos")
    .update({ apostila_storage_path: path })
    .eq("id", ap.produto_id);
  if (error) return { erro: error.message };
  if (anterior && anterior !== path) await admin.storage.from(BUCKET_PDFS).remove([anterior]);

  revalidarVitrine(ap.slug);
  return { ok: true };
}
