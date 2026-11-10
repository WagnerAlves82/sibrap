// src/app/certificado/[codigo]/pdf/route.ts
//
// Baixa o certificado em PDF A4 paisagem, gerado no servidor (src/lib/certificado-pdf.tsx).
// Não depende do navegador: no celular, o "Imprimir / salvar em PDF" saía em retrato e cortado.
// O certificado não muda depois de emitido, então a resposta fica no cache da CDN por 7 dias.

import { criarClienteSupabasePublico } from "@/lib/supabase-publico";
import { gerarPdfCertificado } from "@/lib/certificado-pdf";

export const maxDuration = 30;

export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase();
  if (!/^SIB-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(cod)) return new Response("Código inválido", { status: 400 });

  const supabase = criarClienteSupabasePublico();
  const { data } = await supabase.rpc("validar_certificado", { p_codigo: cod });
  const cert = data?.[0];
  if (!cert) return new Response("Certificado não encontrado", { status: 404 });

  const { data: curso } = await supabase.from("cursos").select("id").eq("slug", cert.curso_slug).maybeSingle();
  const { data: modulos } = curso
    ? await supabase
        .from("modulos")
        .select("titulo, ordem, aulas(titulo, ordem)")
        .eq("curso_id", curso.id)
        .order("ordem")
        .order("ordem", { referencedTable: "aulas" })
    : { data: [] };

  const pdf = await gerarPdfCertificado({
    codigo: cod,
    nome: cert.nome_completo,
    cpfMascarado: cert.cpf_mascarado,
    curso: cert.curso_nome,
    horas: cert.carga_horaria_horas,
    emitidoEm: cert.emitido_em,
    assinadoAlunoEm: cert.assinado_aluno_em,
    assinadoInstituicaoEm: cert.assinado_instituicao_em,
    hashConferencia: cert.hash_conferencia,
    modulos: (modulos ?? []).map((m) => ({ titulo: m.titulo, aulas: m.aulas.map((a) => a.titulo) })),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br",
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-sibrap-${cod}.pdf"`,
      "Cache-Control": "public, max-age=3600, s-maxage=604800",
    },
  });
}
