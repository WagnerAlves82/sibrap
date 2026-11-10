// src/proxy.ts
//
// Roda antes de toda requisição: renova a sessão do Supabase, bloqueia
// acesso a /minha-area pra quem não estiver logado, e bloqueia /admin
// pra quem não tiver o cookie de admin válido (senha única, sem tabela
// de usuário — ver src/lib/admin-auth.ts).

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import { COOKIE_LOGADO, OPCOES_COOKIE_LOGADO } from "@/lib/marca-logado";

// páginas do admin que não exigem sessão (login, recuperação, "não fui eu")
const ADMIN_PUBLICO = /^\/admin\/(login|recuperar|revogar)(\/|$)/;

// Larguras aceitas pela rota /img (as mesmas de src/app/img/[largura]/[...caminho]/route.ts)
const LARGURAS_IMG = [64, 128, 256, 384, 640, 828, 1080, 1280, 1920];
const PREFIXO_CAPAS = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/apostilas-capas/`;

// O site não usa mais o otimizador da Vercel (/_next/image), mas links antigos (Google, AdSense,
// páginas em cache) ainda chamam esse endereço e cada chamada gastava a cota de transformações.
// Aqui ele vira um redirecionamento: arquivo de /public direto, capa do Supabase pela rota /img.
function redirecionarImagemAntiga(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") ?? "";
  const largura = Number(request.nextUrl.searchParams.get("w")) || 640;
  if (url.startsWith("/") && !url.startsWith("//")) {
    return NextResponse.redirect(new URL(url, request.url), 308);
  }
  if (url.startsWith(PREFIXO_CAPAS)) {
    const w = LARGURAS_IMG.find((l) => l >= largura) ?? 1920;
    return NextResponse.redirect(new URL(`/img/${w}/${url.slice(PREFIXO_CAPAS.length)}`, request.url), 308);
  }
  return new NextResponse("Imagem não encontrada", { status: 404 });
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/_next/image") return redirecionarImagemAntiga(request);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaSalvar) {
          cookiesParaSalvar.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesParaSalvar.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/minha-area")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    const redirecionar = NextResponse.redirect(login);
    redirecionar.cookies.delete(COOKIE_LOGADO);
    return redirecionar;
  }

  // sinal para o cabeçalho das páginas em cache (ver src/lib/marca-logado.ts)
  if (user && request.cookies.get(COOKIE_LOGADO)?.value !== "1") {
    response.cookies.set(COOKIE_LOGADO, "1", OPCOES_COOKIE_LOGADO);
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !ADMIN_PUBLICO.test(request.nextUrl.pathname)) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!(await sessaoAdminValida(adminToken))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/minha-area/:path*", "/admin/:path*", "/_next/image"],
};
