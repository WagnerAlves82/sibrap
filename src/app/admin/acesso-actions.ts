"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_OPCOES, sessaoRecente, tokenAcaoValido } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import { dentroDoLimite, identificarCliente, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";
import {
  cancelarRecuperacao,
  consumirCodigo,
  consumirRecuperacao,
  gerarCodigosDeRecuperacao,
  iniciarSessaoAdmin,
  opcoesLogin,
  opcoesRegistro,
  pedirRecuperacaoPorEmail,
  removerPasskey,
  revogarTodasAsSessoes,
  verificarLogin,
  verificarRegistro,
} from "@/lib/admin-seguranca";

// Limites em duas camadas (por origem e geral), sempre falhando fechado.
async function tentativaPermitida(acao: string, porOrigem: number, geral: number): Promise<boolean> {
  const cliente = await identificarCliente();
  const a = await dentroDoLimite(`admin:${acao}:${cliente}`, porOrigem, 900, false);
  const b = await dentroDoLimite(`admin:${acao}:geral`, geral, 900, false);
  return a && b;
}

async function exigirAdmin(recente = false): Promise<string | null> {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!(await sessaoAdminValida(token))) return "Sessão expirada. Entre de novo.";
  if (recente && !sessaoRecente(token)) {
    return "Por segurança, entre de novo (biometria) antes de fazer esta alteração.";
  }
  return null;
}

// ---------- entrada por biometria ----------

export async function opcoesLoginAction() {
  if (!(await tentativaPermitida("bio-opcoes", 20, 100))) return { erro: MSG_MUITAS_TENTATIVAS };
  try {
    const { opcoes, desafioId } = await opcoesLogin();
    return { opcoes, desafioId };
  } catch {
    return { erro: "Não foi possível iniciar a biometria neste endereço." };
  }
}

export async function verificarLoginAction(desafioId: string, resposta: AuthenticationResponseJSON) {
  if (!(await tentativaPermitida("bio", 10, 60))) return { erro: MSG_MUITAS_TENTATIVAS };
  const r = await verificarLogin(desafioId, resposta).catch(() => ({ erro: "Falha ao verificar." }));
  if (!("ok" in r)) return { erro: r.erro };
  await iniciarSessaoAdmin("Biometria (passkey)");
  return { ok: true as const };
}

// ---------- entrada por código de recuperação ----------

export type EstadoCodigo = { erro: string } | null;

export async function entrarComCodigoAction(_: EstadoCodigo, formData: FormData): Promise<EstadoCodigo> {
  if (!(await tentativaPermitida("codigo", 5, 30))) return { erro: MSG_MUITAS_TENTATIVAS };
  const ok = await consumirCodigo(String(formData.get("codigo") ?? ""));
  if (!ok) return { erro: "Código inválido ou já usado." };
  await iniciarSessaoAdmin("Código de recuperação (uso único)");
  redirect("/admin/seguranca?aviso=codigo");
}

// ---------- recuperação por e-mail ----------

export type EstadoRecuperacao = { enviado?: boolean; erro?: string } | null;

export async function pedirRecuperacaoAction(_: EstadoRecuperacao): Promise<EstadoRecuperacao> {
  // poucos pedidos: cada um dispara um e-mail para o dono
  const cliente = await identificarCliente();
  const okOrigem = await dentroDoLimite(`admin:recuperar:${cliente}`, 2, 3600, false);
  const okGeral = await dentroDoLimite("admin:recuperar:geral", 4, 3600, false);
  if (!okOrigem || !okGeral) return { erro: MSG_MUITAS_TENTATIVAS };
  if (process.env.ADMIN_RECUPERACAO_EMAIL === "off") return { erro: "A recuperação por e-mail está desativada." };
  try {
    await pedirRecuperacaoPorEmail();
  } catch {
    // resposta igual em qualquer caso
  }
  return { enviado: true };
}

export async function cancelarRecuperacaoAction(formData: FormData) {
  await cancelarRecuperacao(String(formData.get("token") ?? ""));
  redirect(`/admin/recuperar/${String(formData.get("token") ?? "")}`);
}

export async function concluirRecuperacaoAction(formData: FormData) {
  if (!(await tentativaPermitida("recuperar-usar", 5, 20))) redirect("/admin/login");
  const token = String(formData.get("token") ?? "");
  if (!(await consumirRecuperacao(token))) redirect(`/admin/recuperar/${token}`);
  await iniciarSessaoAdmin("Recuperação por e-mail");
  redirect("/admin/seguranca?aviso=recuperado");
}

// ---------- "não fui eu": encerrar todas as sessões ----------

export async function revogarPorLinkAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!tokenAcaoValido("revogar", token)) redirect("/admin/login");
  await revogarTodasAsSessoes();
  redirect("/admin/login?revogado=1");
}

// ---------- gestão (exige sessão) ----------

export async function encerrarSessoesAction() {
  if (await exigirAdmin()) redirect("/admin/login");
  await revogarTodasAsSessoes();
  redirect("/admin/login?revogado=1");
}

export async function opcoesRegistroAction() {
  const erro = await exigirAdmin(true);
  if (erro) return { erro };
  try {
    const { opcoes, desafioId } = await opcoesRegistro();
    return { opcoes, desafioId };
  } catch {
    return { erro: "Não foi possível iniciar o cadastro neste endereço." };
  }
}

export async function verificarRegistroAction(
  desafioId: string,
  resposta: RegistrationResponseJSON,
  nome: string
) {
  const erro = await exigirAdmin(true);
  if (erro) return { erro };
  const r = await verificarRegistro(desafioId, resposta, nome).catch(() => ({ erro: "Falha ao verificar o aparelho." }));
  if ("erro" in r) return { erro: r.erro };
  return r;
}

export async function gerarCodigosAction(): Promise<{ erro: string } | { codigos: string[] }> {
  const erro = await exigirAdmin(true);
  if (erro) return { erro };
  return { codigos: await gerarCodigosDeRecuperacao() };
}

export async function removerPasskeyAction(formData: FormData) {
  if (await exigirAdmin(true)) redirect("/admin/login");
  await removerPasskey(String(formData.get("id") ?? ""));
  redirect("/admin/seguranca?aviso=removido");
}

export async function sairDoAdminAction() {
  (await cookies()).set(ADMIN_COOKIE_NAME, "", { ...ADMIN_COOKIE_OPCOES, maxAge: 0 });
  redirect("/admin/login");
}
