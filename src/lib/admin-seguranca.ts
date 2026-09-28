// src/lib/admin-seguranca.ts
//
// Segurança do painel admin: biometria (WebAuthn/passkey), códigos de
// recuperação, recuperação por e-mail com espera e revogação de sessões.
//
// A biometria (rosto/digital/PIN do aparelho) fica no aparelho: o servidor
// só guarda a chave PÚBLICA de cada passkey. Nenhum dado biométrico chega
// aqui.
//
// Como não travar a si mesmo (camadas, da mais fácil à mais drástica):
//  1. biometria do aparelho — e o PIN/padrão do celular funciona no lugar
//     dela se o rosto/digital falhar;
//  2. mais de um aparelho / passkey sincronizada na conta Google;
//  3. códigos de recuperação de uso único;
//  4. link de recuperação por e-mail (com espera de 60 min e aviso);
//  5. emergência: sem nenhuma passkey cadastrada, a senha volta a valer
//     (basta apagar as linhas de admin_passkeys no Supabase) ou defina
//     ADMIN_PERMITE_SENHA=1 na Vercel.

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_OPCOES,
  assinar,
  criarTokenAcao,
  criarTokenAdmin,
} from "@/lib/admin-auth";
import { invalidarCacheDeSessoes } from "@/lib/admin-sessao";
import { emailDoAdmin, enviarAlertaAdmin, esc } from "@/lib/resend";

export const RECUPERACAO_ESPERA_MIN = 60;
const DESAFIO_MS = 5 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sibrap.tec.br";
const db = () => criarClienteSupabaseAdmin();

// ---------- contexto da requisição ----------

async function contexto(): Promise<{ rpID: string; origem: string }> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
  if (/^(www\.)?sibrap\.tec\.br$/.test(host)) return { rpID: "sibrap.tec.br", origem: `https://${host}` };
  if (/^localhost(:\d+)?$/.test(host)) {
    return { rpID: "localhost", origem: `${h.get("x-forwarded-proto") ?? "http"}://${host}` };
  }
  throw new Error("Endereço não permitido para biometria");
}

async function descreverAcesso(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-vercel-forwarded-for") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  const ipParcial = ip.includes(".") ? ip.replace(/\.\d+$/, ".x") : ip.split(":").slice(0, 3).join(":") + ":…";
  const cidade = h.get("x-vercel-ip-city");
  const pais = h.get("x-vercel-ip-country");
  const agente = (h.get("user-agent") ?? "").slice(0, 120);
  return `${esc(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))} (Brasília) · IP ${esc(ipParcial)}${cidade ? ` · ${esc(decodeURIComponent(cidade))}` : ""}${pais ? `/${esc(pais)}` : ""}<br><span style="font-size:12px;color:#93A0AF;">${esc(agente)}</span>`;
}

// ---------- desafios (uso único, 5 min) ----------

async function guardarDesafio(tipo: "registro" | "login", desafio: string): Promise<string> {
  const { data, error } = await db()
    .from("admin_desafios")
    .insert({ tipo, desafio, expira_em: new Date(Date.now() + DESAFIO_MS).toISOString() })
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível iniciar a verificação");
  // limpeza oportunista de desafios vencidos
  if (Math.random() < 0.1) await db().from("admin_desafios").delete().lt("expira_em", new Date().toISOString());
  return data.id;
}

async function consumirDesafio(id: string, tipo: "registro" | "login"): Promise<string | null> {
  if (!UUID.test(id)) return null;
  const { data } = await db()
    .from("admin_desafios")
    .delete()
    .eq("id", id)
    .eq("tipo", tipo)
    .gt("expira_em", new Date().toISOString())
    .select("desafio")
    .maybeSingle();
  return data?.desafio ?? null;
}

// ---------- passkeys ----------

export async function contarPasskeys(): Promise<number> {
  const { count } = await db().from("admin_passkeys").select("id", { count: "exact", head: true });
  return count ?? 0;
}

export function senhaPermitida(temPasskeys: boolean): boolean {
  return !temPasskeys || process.env.ADMIN_PERMITE_SENHA === "1";
}

export async function listarPasskeys() {
  const { data } = await db()
    .from("admin_passkeys")
    .select("id, nome, tipo_dispositivo, sincronizada, criado_em, ultimo_uso_em")
    .order("criado_em");
  return data ?? [];
}

export async function opcoesRegistro() {
  const { rpID } = await contexto();
  const existentes = await db().from("admin_passkeys").select("credential_id, transports");
  const opcoes = await generateRegistrationOptions({
    rpName: "SIBRAP Admin",
    rpID,
    userName: "admin@sibrap.tec.br",
    userDisplayName: "Administrador SIBRAP",
    attestationType: "none",
    excludeCredentials: (existentes.data ?? []).map((c) => ({ id: c.credential_id, transports: c.transports })),
    // biometria (ou PIN do aparelho) obrigatória; passkey que fica no aparelho/conta
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  const desafioId = await guardarDesafio("registro", opcoes.challenge);
  return { opcoes, desafioId };
}

export async function verificarRegistro(desafioId: string, resposta: RegistrationResponseJSON, nome: string) {
  const { rpID, origem } = await contexto();
  const desafio = await consumirDesafio(desafioId, "registro");
  if (!desafio) return { erro: "A verificação expirou. Tente de novo." };

  const r = await verifyRegistrationResponse({
    response: resposta,
    expectedChallenge: desafio,
    expectedOrigin: origem,
    expectedRPID: rpID,
    requireUserVerification: true,
  });
  if (!r.verified || !r.registrationInfo) return { erro: "Não foi possível confirmar o aparelho." };

  const { credential, credentialDeviceType, credentialBackedUp } = r.registrationInfo;
  const { error } = await db().from("admin_passkeys").insert({
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? [],
    nome: nome.trim().slice(0, 60) || "Aparelho",
    tipo_dispositivo: credentialDeviceType,
    sincronizada: credentialBackedUp,
  });
  if (error) return { erro: "Este aparelho já está cadastrado." };
  return { ok: true as const, sincronizada: credentialBackedUp };
}

export async function opcoesLogin() {
  const { rpID } = await contexto();
  const opcoes = await generateAuthenticationOptions({ rpID, userVerification: "required" });
  const desafioId = await guardarDesafio("login", opcoes.challenge);
  return { opcoes, desafioId };
}

export async function verificarLogin(desafioId: string, resposta: AuthenticationResponseJSON) {
  const { rpID, origem } = await contexto();
  const desafio = await consumirDesafio(desafioId, "login");
  if (!desafio) return { erro: "A verificação expirou. Tente de novo." };

  const { data: cred } = await db()
    .from("admin_passkeys")
    .select("id, credential_id, public_key, counter, transports")
    .eq("credential_id", resposta.id)
    .maybeSingle();
  if (!cred) return { erro: "Este aparelho não está cadastrado." };

  try {
    const r = await verifyAuthenticationResponse({
      response: resposta,
      expectedChallenge: desafio,
      expectedOrigin: origem,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: cred.credential_id,
        publicKey: isoBase64URL.toBuffer(cred.public_key),
        counter: Number(cred.counter),
        transports: cred.transports as never,
      },
    });
    if (!r.verified) return { erro: "Não foi possível confirmar a biometria." };
    await db()
      .from("admin_passkeys")
      .update({ counter: r.authenticationInfo.newCounter, ultimo_uso_em: new Date().toISOString() })
      .eq("id", cred.id);
    return { ok: true as const };
  } catch {
    return { erro: "Não foi possível confirmar a biometria." };
  }
}

export async function removerPasskey(id: string): Promise<void> {
  if (UUID.test(id)) await db().from("admin_passkeys").delete().eq("id", id);
}

// ---------- códigos de recuperação ----------

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function normalizarCodigo(c: string) {
  return c.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
const hashCodigo = (c: string) => assinar(`codigo:${normalizarCodigo(c)}`);

export async function gerarCodigosDeRecuperacao(): Promise<string[]> {
  const codigos = Array.from({ length: 10 }, () => {
    const bruto = Array.from({ length: 12 }, () => ALFABETO[crypto.randomInt(ALFABETO.length)]).join("");
    return `${bruto.slice(0, 4)}-${bruto.slice(4, 8)}-${bruto.slice(8)}`;
  });
  await db().from("admin_codigos_recuperacao").delete().not("id", "is", null); // invalida os antigos
  await db().from("admin_codigos_recuperacao").insert(codigos.map((c) => ({ codigo_hash: hashCodigo(c) })));
  return codigos;
}

export async function contarCodigosRestantes(): Promise<number> {
  const { count } = await db()
    .from("admin_codigos_recuperacao")
    .select("id", { count: "exact", head: true })
    .is("usado_em", null);
  return count ?? 0;
}

export async function consumirCodigo(codigo: string): Promise<boolean> {
  if (normalizarCodigo(codigo).length !== 12) return false;
  const { data } = await db()
    .from("admin_codigos_recuperacao")
    .update({ usado_em: new Date().toISOString() })
    .eq("codigo_hash", hashCodigo(codigo))
    .is("usado_em", null)
    .select("id");
  return (data?.length ?? 0) === 1;
}

// ---------- recuperação por e-mail (com espera) ----------

const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export async function pedirRecuperacaoPorEmail(): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const agora = Date.now();
  await db().from("admin_recuperacoes").insert({
    token_hash: hashToken(token),
    liberar_em: new Date(agora + RECUPERACAO_ESPERA_MIN * 60_000).toISOString(),
    expira_em: new Date(agora + 24 * 3600_000).toISOString(),
  });
  const link = `${siteUrl()}/admin/recuperar/${token}`;
  await enviarAlertaAdmin({
    assunto: "Pedido de recuperação de acesso ao painel SIBRAP",
    titulo: "Recuperação de acesso solicitada",
    corpoHtml: `<p style="margin:0 0 12px 0;">Alguém pediu para recuperar o acesso ao painel admin.</p>
<p style="margin:0 0 12px 0;">${await descreverAcesso()}</p>
<p style="margin:0 0 12px 0;">Por segurança, o link só libera o acesso <strong>${RECUPERACAO_ESPERA_MIN} minutos</strong> depois deste pedido. Se <strong>não foi você</strong>, abra o link e clique em "Cancelar" — ninguém entra.</p>
<p style="margin:0;font-size:12.5px;color:#93A0AF;">O link vale por 24 horas e só funciona uma vez.</p>`,
    botao: { texto: "Abrir o link de recuperação &rarr;", url: link },
  });
}

export async function estadoRecuperacao(token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const { data } = await db()
    .from("admin_recuperacoes")
    .select("id, liberar_em, expira_em, usado_em, cancelado_em")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!data) return null;
  const agora = Date.now();
  const liberarEm = new Date(data.liberar_em).getTime();
  const situacao = data.cancelado_em
    ? "cancelada"
    : data.usado_em
      ? "usada"
      : agora > new Date(data.expira_em).getTime()
        ? "expirada"
        : agora >= liberarEm
          ? "liberada"
          : "aguardando";
  return { id: data.id, situacao, liberarEm } as const;
}

export async function cancelarRecuperacao(token: string): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/.test(token)) return false;
  const { data } = await db()
    .from("admin_recuperacoes")
    .update({ cancelado_em: new Date().toISOString() })
    .eq("token_hash", hashToken(token))
    .is("cancelado_em", null)
    .is("usado_em", null)
    .select("id");
  return (data?.length ?? 0) > 0;
}

/** Consome o link (uma vez) se já passou a espera. */
export async function consumirRecuperacao(token: string): Promise<boolean> {
  const estado = await estadoRecuperacao(token);
  if (!estado || estado.situacao !== "liberada") return false;
  const { data } = await db()
    .from("admin_recuperacoes")
    .update({ usado_em: new Date().toISOString() })
    .eq("id", estado.id)
    .is("usado_em", null)
    .is("cancelado_em", null)
    .select("id");
  return (data?.length ?? 0) === 1;
}

// ---------- sessão e revogação ----------

/** Abre a sessão do admin e avisa por e-mail (com link para encerrar todas). */
export async function iniciarSessaoAdmin(metodo: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, criarTokenAdmin(), ADMIN_COOKIE_OPCOES);

  const revogar = `${siteUrl()}/admin/revogar/${criarTokenAcao("revogar")}`;
  try {
    await enviarAlertaAdmin({
      assunto: "Novo acesso ao painel admin do SIBRAP",
      titulo: "Novo acesso ao painel",
      corpoHtml: `<p style="margin:0 0 12px 0;">Método: <strong>${esc(metodo)}</strong></p>
<p style="margin:0 0 12px 0;">${await descreverAcesso()}</p>
<p style="margin:0;">Foi você? Então ignore este e-mail. <strong>Se não foi</strong>, encerre todas as sessões agora e troque as senhas.</p>`,
      botao: { texto: "Não fui eu: encerrar todas as sessões &rarr;", url: revogar },
    });
  } catch {
    // o aviso é um reforço; falha de e-mail não impede o acesso legítimo
  }
}

export async function revogarTodasAsSessoes(): Promise<void> {
  await db().from("admin_config").update({ sessoes_validas_desde: new Date().toISOString() }).eq("id", true);
  invalidarCacheDeSessoes();
}

export { emailDoAdmin };
