// src/lib/marca-logado.ts
//
// Cookie-sinal "sibrap_logado=1", legível pelo navegador, só para o cabeçalho
// das páginas em cache mostrar "Minha Área / Sair" em vez de "Entrar".
// Não dá acesso a nada: a sessão de verdade continua nos cookies httpOnly do
// Supabase, conferida pelo proxy e pelas páginas da área do aluno.

export const COOKIE_LOGADO = "sibrap_logado";

export const OPCOES_COOKIE_LOGADO = {
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};
