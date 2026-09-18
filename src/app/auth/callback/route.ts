// Destino do link de confirmação de e-mail enviado pelo Supabase: troca o
// código (PKCE) por uma sessão e segue pro destino pedido no cadastro.

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { caminhoSeguro } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = caminhoSeguro(url.searchParams.get("next"), "/minha-area");

  if (code) {
    const supabase = await criarClienteSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login", url.origin));
}
