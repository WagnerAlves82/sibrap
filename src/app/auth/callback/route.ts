// Destino do link de confirmação de e-mail enviado pelo Supabase: troca o
// código (PKCE) por uma sessão e segue pro destino pedido no cadastro.
//
// PKCE exige que o "code_verifier" gerado na hora do cadastro esteja no
// mesmo navegador que abre o link de confirmação (fica num cookie). Se o
// link for aberto numa aba anônima, outro navegador, ou uma aba onde já
// tem outra conta logada com cookies separados, a troca falha com
// "bad_code_verifier" — nesse caso mandamos pro login com aviso claro em
// vez de simplesmente devolver pra tela de login sem explicação nenhuma.

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { caminhoSeguro } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = caminhoSeguro(url.searchParams.get("next"), "/minha-area");

  let confirmadoEmOutroNavegador = false;
  if (code) {
    const supabase = await criarClienteSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    // Sem o cookie do navegador que fez o cadastro (e-mail aberto em outro app ou
    // aparelho) não dá pra abrir a sessão, mas o e-mail JÁ foi confirmado pelo Supabase
    // antes de chegar aqui: é só entrar com a senha. Não é "link expirado".
    confirmadoEmOutroNavegador = /verifier/i.test(error.message ?? "") || error.name === "AuthPKCECodeVerifierMissingError";
  }

  const loginComAviso = new URL("/login", url.origin);
  loginComAviso.searchParams.set("erro", confirmadoEmOutroNavegador ? "confirmado" : "link");
  if (next !== "/minha-area") loginComAviso.searchParams.set("next", next);
  return NextResponse.redirect(loginComAviso);
}
