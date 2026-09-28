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

// páginas do admin que não exigem sessão (login, recuperação, "não fui eu")
const ADMIN_PUBLICO = /^\/admin\/(login|recuperar|revogar)(\/|$)/;

export async function proxy(request: NextRequest) {
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
    return NextResponse.redirect(login);
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
  matcher: ["/minha-area/:path*", "/admin/:path*"],
};
