// Destino dos links de confirmação de cadastro e de recuperação de senha
// enviados por e-mail. Diferente do /auth/callback (que depende de um
// cookie do MESMO navegador que pediu o link), este confere o token
// direto no servidor — funciona mesmo se a pessoa abrir o e-mail em outro
// aparelho ou dentro do aplicativo de e-mail.

import { NextResponse, type NextRequest } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { caminhoSeguro } from "@/lib/auth-redirect";

const TIPOS = ["signup", "recovery", "email"] as const;
type Tipo = (typeof TIPOS)[number];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as Tipo | null;
  const next = url.searchParams.get("next");

  if (tokenHash && tipo && TIPOS.includes(tipo)) {
    const supabase = await criarClienteSupabaseServer();
    const { data, error } = await supabase.auth.verifyOtp({
      type: tipo,
      token_hash: tokenHash,
    });

    if (!error) {
      if (tipo === "recovery") {
        return NextResponse.redirect(new URL("/redefinir-senha", url.origin));
      }
      // o destino escolhido no cadastro fica guardado no perfil do usuário
      const guardado = (data.user?.user_metadata as { proximo?: string } | undefined)?.proximo;
      const destino = caminhoSeguro(next ?? guardado, "/minha-area");
      return NextResponse.redirect(new URL(destino, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?erro=link", url.origin));
}
