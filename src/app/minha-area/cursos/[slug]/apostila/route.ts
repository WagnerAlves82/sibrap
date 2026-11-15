import { NextResponse } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { BUCKET_PDFS } from "@/lib/apostilas";
import { APOSTILA_DO_CURSO } from "@/lib/cursos-apostila";

// Entrega a apostila prática do curso só a quem está matriculado (no curso pago, a matrícula
// só existe depois do pagamento). Redireciona para um link assinado que expira em 2 minutos.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = new URL(request.url);
  const apostila = APOSTILA_DO_CURSO[slug];
  if (!apostila) return new NextResponse("Este curso não tem apostila.", { status: 404 });

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const destino = `/minha-area/cursos/${slug}/apostila`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(destino)}`, base));
  }

  const { data: curso } = await supabase.from("cursos").select("id").eq("slug", slug).maybeSingle();
  const { data: matricula } = curso
    ? await supabase.from("matriculas").select("curso_id").eq("curso_id", curso.id).maybeSingle()
    : { data: null };
  if (!matricula) return NextResponse.redirect(new URL(`/minha-area/cursos/${slug}`, base));

  const { data: assinado, error } = await criarClienteSupabaseAdmin()
    .storage.from(BUCKET_PDFS)
    .createSignedUrl(apostila.caminho, 120, { download: apostila.arquivo });
  if (error || !assinado) return new NextResponse("Não deu pra gerar o download agora. Tente de novo.", { status: 500 });

  const resposta = NextResponse.redirect(assinado.signedUrl);
  resposta.headers.set("Cache-Control", "private, no-store");
  return resposta;
}
