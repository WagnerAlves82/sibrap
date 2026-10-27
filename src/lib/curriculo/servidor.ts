// src/lib/curriculo/servidor.ts
//
// Parte do servidor do gerador de currículos: salva o currículo na conta (só texto; a foto
// vem junto só para desenhar o PDF e é descartada), registra o download (o primeiro de cada
// currículo conta 1 uso) e devolve o PDF.

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { montarDocumento } from "./secoes";
import { gerarPdfCurriculo } from "./pdf";
import { MODELOS, type Curriculo } from "./tipos";

const FOTO_MAX_BYTES = 400 * 1024;

/** Aceita só JPEG já reduzido no navegador (data URL de até ~400 KB). */
export function fotoValida(foto: unknown): string | null {
  if (typeof foto !== "string" || !foto.startsWith("data:image/jpeg;base64,")) return null;
  const base64 = foto.slice("data:image/jpeg;base64,".length);
  if (!/^[A-Za-z0-9+/=]+$/.test(base64) || base64.length * 0.75 > FOTO_MAX_BYTES) return null;
  return foto;
}

export type Lead = { aceite: boolean; whatsapp?: string; cidade?: string; uf?: string };

export async function salvarEGerarPdf(opcoes: {
  userId: string;
  curriculo: Curriculo;
  foto: string | null;
  curriculoId?: string | null;
  lead: Lead;
}): Promise<{ pdf: Buffer; curriculoId: string }> {
  const { userId, curriculo, foto, lead } = opcoes;
  const admin = criarClienteSupabaseAdmin();
  const d = curriculo.dados;
  const formacaoPrincipal = d.formacoes.find((f) => f.curso.trim())?.curso.trim() ?? null;

  const agora = new Date().toISOString();
  const linha = {
    user_id: userId,
    perfil: curriculo.perfil,
    modelo: curriculo.modelo,
    dados: curriculo.dados,
    atualizado_em: agora,
    ultimo_acesso_em: agora,
    // dados de lead só com autorização de marketing (LGPD)
    aceite_marketing: lead.aceite,
    aceite_marketing_em: lead.aceite ? agora : null,
    whatsapp: lead.aceite ? (lead.whatsapp || d.telefone || null) : null,
    cidade: lead.aceite ? (lead.cidade || d.cidade || null) : null,
    uf: lead.aceite ? (lead.uf || d.uf || null) : null,
    area: lead.aceite ? d.objetivo.slice(0, 200) || null : null,
    escolaridade: lead.aceite ? formacaoPrincipal : null,
  };

  // atualiza o currículo da pessoa (se o id for dela) ou cria um novo
  let curriculoId = opcoes.curriculoId ?? null;
  if (curriculoId) {
    const { data } = await admin.from("curriculos").update(linha).eq("id", curriculoId).eq("user_id", userId).select("id").maybeSingle();
    curriculoId = data?.id ?? null;
  }
  if (!curriculoId) {
    const { data, error } = await admin.from("curriculos").insert(linha).select("id").single();
    if (error) throw new Error(`curriculo: ${error.message}`);
    curriculoId = data.id;
  }

  const { count } = await admin.from("curriculo_downloads").select("id", { count: "exact", head: true }).eq("curriculo_id", curriculoId);
  await admin.from("curriculo_downloads").insert({ curriculo_id: curriculoId, user_id: userId, primeiro: !count });

  // limpeza dos currículos sem acesso há 12 meses (barata: usa índice); falha não atrapalha o download
  if (Math.random() < 0.05) await admin.rpc("apagar_curriculos_inativos");

  const pdf = await gerarPdfCurriculo(montarDocumento(curriculo), curriculo.modelo, MODELOS[curriculo.modelo].temFoto ? foto : null);
  return { pdf, curriculoId };
}

export function respostaPdf(pdf: Buffer, nome: string, curriculoId: string) {
  const arquivo = `curriculo-${nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sibrap"}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${arquivo}"`,
      "cache-control": "no-store",
      "x-curriculo-id": curriculoId,
    },
  });
}
