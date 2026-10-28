"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { gerarPixParaPedido, type EstadoPix } from "@/lib/pix";
import { cpfValido, normalizarCpf } from "@/lib/cpf";
import { enviarCertificadoEmitido } from "@/lib/resend";

const TAMANHO_MAXIMO = 3.5 * 1024 * 1024;

// Confere os primeiros bytes do arquivo (não confia só no tipo declarado)
function tipoRealDoArquivo(bytes: Uint8Array): { mime: string; ext: string } | null {
  const b = bytes;
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
    return { mime: "application/pdf", ext: "pdf" };
  }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { mime: "image/png", ext: "png" };
  }
  return null;
}

export type EstadoComprovante = { erro?: string; ok?: boolean } | null;

export async function enviarComprovanteAction(
  _anterior: EstadoComprovante,
  formData: FormData
): Promise<EstadoComprovante> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Você precisa estar logado." };

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Escolha o arquivo do comprovante." };
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return { erro: "O arquivo é grande demais (máximo 3,5 MB). Envie uma foto ou um PDF menor." };
  }

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const tipo = tipoRealDoArquivo(bytes);
  if (!tipo) return { erro: "Formato não aceito. Envie PDF, JPG ou PNG." };

  const { data: existentes } = await supabase
    .from("comprovantes_cadunico")
    .select("status")
    .in("status", ["pendente", "aprovado"]);
  if (existentes?.some((c) => c.status === "aprovado")) {
    return { erro: "Seu comprovante já foi aprovado." };
  }
  if (existentes?.some((c) => c.status === "pendente")) {
    return { erro: "Você já enviou um comprovante. Aguarde a análise." };
  }

  const admin = criarClienteSupabaseAdmin();
  const caminho = `${user.id}/${crypto.randomUUID()}.${tipo.ext}`;
  const { error: erroUpload } = await admin.storage
    .from("cadunico")
    .upload(caminho, bytes, { contentType: tipo.mime });
  if (erroUpload) return { erro: "Não deu pra enviar o arquivo agora. Tenta de novo." };

  const { error: erroInsert } = await admin.from("comprovantes_cadunico").insert({
    user_id: user.id,
    storage_path: caminho,
    nome_arquivo: arquivo.name.slice(0, 120),
  });
  if (erroInsert) {
    await admin.storage.from("cadunico").remove([caminho]);
    return { erro: "Não deu pra registrar o envio agora. Tenta de novo." };
  }

  revalidatePath("/minha-area/cursos", "layout");
  return { ok: true };
}

export async function criarPagamentoCertificadoAction(
  cursoSlug: string,
  formato: "online" | "impresso" = "online"
): Promise<EstadoPix> {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { erro: "Você precisa estar logado com um e-mail válido." };
  }

  const produtoSlug = formato === "impresso" ? `certificado-impresso-${cursoSlug}` : `certificado-${cursoSlug}`;
  const { data: pedidoRows, error } = await supabase.rpc("criar_pedido_por_slug", {
    p_slug: produtoSlug,
  });
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

export type EstadoEmissao = { erro: string } | null;

export async function emitirCertificadoAction(
  _anterior: EstadoEmissao,
  formData: FormData
): Promise<EstadoEmissao> {
  const cursoId = String(formData.get("curso_id") ?? "");
  const nome = String(formData.get("nome") ?? "");
  const cpf = normalizarCpf(String(formData.get("cpf") ?? ""));

  if (!cpfValido(cpf)) {
    return { erro: "Digite um CPF válido." };
  }

  const impresso = String(formData.get("formato") ?? "") === "impresso";
  let endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
    telefone: string;
  } | null = null;
  if (impresso) {
    const campo = (chave: string) => String(formData.get(chave) ?? "").trim();
    endereco = {
      cep: campo("cep"),
      logradouro: campo("logradouro"),
      numero: campo("numero"),
      complemento: campo("complemento") || null,
      bairro: campo("bairro"),
      cidade: campo("cidade"),
      uf: campo("uf").toUpperCase(),
      telefone: campo("telefone"),
    };
    if (!endereco.cep || !endereco.logradouro || !endereco.numero || !endereco.bairro || !endereco.cidade || !endereco.uf || !endereco.telefone) {
      return { erro: "Preencha todos os campos do endereço de entrega." };
    }
  }

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pesquisa } = await supabase
    .from("pesquisas_satisfacao")
    .select("id")
    .eq("curso_id", cursoId)
    .maybeSingle();
  if (!pesquisa) {
    return { erro: "Responda a pesquisa de satisfação antes de emitir o certificado." };
  }

  const { data: codigo, error } = await supabase.rpc("emitir_certificado", {
    p_curso_id: cursoId,
    p_nome: nome,
    p_cpf: cpf,
  });
  if (error || !codigo) {
    return { erro: error?.message ?? "Não foi possível emitir o certificado agora." };
  }

  const [{ data: cert }, { data: curso }] = await Promise.all([
    supabase.from("certificados").select("id").eq("codigo", codigo).maybeSingle(),
    supabase.from("cursos").select("nome").eq("id", cursoId).maybeSingle(),
  ]);

  if (endereco && cert && user) {
    await supabase.from("certificados_envio").insert({
      certificado_id: cert.id,
      user_id: user.id,
      ...endereco,
    });
  }

  if (user?.email) {
    await enviarCertificadoEmitido({
      email: user.email,
      nome: (user.user_metadata as { nome?: string } | undefined)?.nome,
      cursoNome: curso?.nome ?? "",
      codigo,
      impresso,
    }).catch((e) => console.error("Falha ao enviar e-mail do certificado", e));
  }

  redirect(`/certificado/${codigo}`);
}

export type EstadoPesquisa = { erro?: string; ok?: boolean } | null;

const NOTAS_1_A_5 = ["satisfacao", "clareza", "material", "exercicios", "aplicacao"] as const;

export async function responderPesquisaAction(
  _anterior: EstadoPesquisa,
  formData: FormData
): Promise<EstadoPesquisa> {
  const cursoId = String(formData.get("curso_id") ?? "");
  const notas = Object.fromEntries(NOTAS_1_A_5.map((k) => [k, Number(formData.get(k))])) as Record<
    (typeof NOTAS_1_A_5)[number],
    number
  >;
  if (NOTAS_1_A_5.some((k) => !Number.isInteger(notas[k]) || notas[k] < 1 || notas[k] > 5)) {
    return { erro: "Responda todas as perguntas para continuar." };
  }
  const duracao = String(formData.get("duracao") ?? "");
  if (!["curta", "adequada", "longa"].includes(duracao)) {
    return { erro: "Diga o que achou da duração do curso." };
  }
  const recomendacao = Number(formData.get("recomendacao"));
  if (!Number.isInteger(recomendacao) || recomendacao < 0 || recomendacao > 10) {
    return { erro: "Escolha uma nota de 0 a 10 para a recomendação." };
  }
  const comentario = String(formData.get("comentario") ?? "").trim().slice(0, 1000) || null;

  const supabase = await criarClienteSupabaseServer();
  const { error } = await supabase
    .from("pesquisas_satisfacao")
    .insert({ curso_id: cursoId, ...notas, duracao, recomendacao, comentario });
  // 23505 = já respondida (resposta duplicada); segue em frente
  if (error && error.code !== "23505") {
    return { erro: "Não deu pra enviar sua resposta agora. Tenta de novo." };
  }
  revalidatePath("/minha-area/cursos", "layout");
  return { ok: true };
}
