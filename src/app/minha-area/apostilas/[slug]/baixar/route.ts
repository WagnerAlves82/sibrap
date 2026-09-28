import { NextResponse } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { BUCKET_PDFS, slugValido } from "@/lib/apostilas";

// Entrega o PDF só a quem comprou: confere login e acesso ao produto e
// redireciona para um link assinado que expira em poucos minutos. O
// arquivo fica num bucket privado — não existe URL pública dele.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const base = new URL(request.url);

  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const destino = `/minha-area/apostilas/${slug}/baixar`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(destino)}`, base));
  }
  if (!slugValido(slug)) return new NextResponse("Apostila não encontrada.", { status: 404 });

  // Leitura administrativa: o dono continua tendo acesso mesmo se a
  // apostila voltar para rascunho. A posse é conferida com o cliente do
  // usuário (as regras de segurança só deixam ver os próprios acessos).
  const admin = criarClienteSupabaseAdmin();
  const { data: apostila } = await admin
    .from("apostilas")
    .select("produto_id, produtos(apostila_storage_path)")
    .eq("slug", slug)
    .maybeSingle();
  const caminho = apostila?.produtos?.apostila_storage_path;
  if (!apostila || !caminho) return new NextResponse("Arquivo indisponível.", { status: 404 });

  const { data: acesso } = await supabase
    .from("acessos")
    .select("id")
    .eq("produto_id", apostila.produto_id)
    .maybeSingle();
  if (!acesso) {
    return NextResponse.redirect(new URL(`/apostilas/${slug}`, base));
  }

  const { data: assinado, error } = await admin.storage
    .from(BUCKET_PDFS)
    .createSignedUrl(caminho, 120, { download: `SIBRAP-${slug}.pdf` });
  if (error || !assinado) {
    return new NextResponse("Não deu pra gerar o download agora. Tente de novo.", { status: 500 });
  }

  const resposta = NextResponse.redirect(assinado.signedUrl);
  resposta.headers.set("Cache-Control", "private, no-store");
  return resposta;
}
