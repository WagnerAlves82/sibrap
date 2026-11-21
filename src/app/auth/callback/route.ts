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
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { nomeProprio } from "@/lib/nome-proprio";
import { VERSAO_TERMOS } from "@/lib/emissor";
import type { User } from "@supabase/supabase-js";

// Login com Google (21/11/2026): o Google manda nome (full_name) e foto (avatar_url). Completa o perfil
// só no que estiver vazio, para não sobrescrever o que o aluno já ajustou em "Meus dados".
async function completarPerfilGoogle(user: User) {
  const meta = (user.user_metadata ?? {}) as {
    nome?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
    aceite_termos_em?: string;
  };
  const nomeGoogle = nomeProprio(String(meta.full_name ?? meta.name ?? "").trim());
  const foto = meta.avatar_url ?? meta.picture ?? null;
  const admin = criarClienteSupabaseAdmin();
  const { data: perfil } = await admin.from("profiles").select("nome, foto_url").eq("id", user.id).maybeSingle();
  const novo: { id: string; nome?: string; foto_url?: string } = { id: user.id };
  if (!perfil?.nome && nomeGoogle) novo.nome = nomeGoogle;
  if (!perfil?.foto_url && foto && /^https:\/\/lh\d\.googleusercontent\.com\//.test(foto)) novo.foto_url = foto;
  if (novo.nome || novo.foto_url) await admin.from("profiles").upsert(novo, { onConflict: "id" });
  // aceite dos Termos e da Privacidade: no Google não há caixinha; o aviso "Ao continuar com o Google, você
  // concorda…" aparece junto do botão (login e cadastro). Registra data e versão, como no cadastro por e-mail.
  const extra: Record<string, string> = {};
  if (!meta.nome && nomeGoogle) Object.assign(extra, { nome: nomeGoogle, origem: "google" });
  if (!meta.aceite_termos_em) Object.assign(extra, { aceite_termos_em: new Date().toISOString(), versao_termos: VERSAO_TERMOS, aceite_via: "google" });
  if (Object.keys(extra).length) await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...meta, ...extra } });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = caminhoSeguro(url.searchParams.get("next"), "/minha-area");

  let confirmadoEmOutroNavegador = false;
  if (code) {
    const supabase = await criarClienteSupabaseServer();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user?.app_metadata?.provider === "google") await completarPerfilGoogle(data.user).catch(() => {});
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
