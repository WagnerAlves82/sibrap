"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_OPCOES } from "@/lib/admin-auth";
import { contarPasskeys, iniciarSessaoAdmin, senhaPermitida } from "@/lib/admin-seguranca";
import { dentroDoLimite, identificarCliente, MSG_MUITAS_TENTATIVAS } from "@/lib/limite";

export type EstadoLoginAdmin = { erro: string } | null;

export async function loginAdmin(
  _estadoAnterior: EstadoLoginAdmin,
  formData: FormData
): Promise<EstadoLoginAdmin> {
  const senha = String(formData.get("senha") ?? "");
  const senhaCorreta = process.env.ADMIN_PASSWORD;

  if (!senhaCorreta) {
    return { erro: "ADMIN_PASSWORD não está configurada no servidor." };
  }

  // Limite de tentativas: por origem (5 em 15 min) e geral (40 em 15 min,
  // contra ataque distribuído). Se o contador falhar, bloqueia por segurança.
  // Com biometria cadastrada, a senha deixa de valer (a menos que o modo de
  // emergência esteja ligado na Vercel: ADMIN_PERMITE_SENHA=1)
  const temBiometria = (await contarPasskeys()) > 0;
  if (!senhaPermitida(temBiometria)) {
    return { erro: "Este painel usa biometria. Volte à tela de entrada e use o botão de biometria." };
  }

  const cliente = await identificarCliente();
  const okOrigem = await dentroDoLimite(`admin:${cliente}`, 5, 900, false);
  const okGeral = await dentroDoLimite("admin:geral", 40, 900, false);
  if (!okOrigem || !okGeral) return { erro: MSG_MUITAS_TENTATIVAS };
  // Comparação em tempo constante (hash dos dois lados iguala o tamanho)
  const hash = (v: string) => crypto.createHash("sha256").update(v).digest();
  if (!crypto.timingSafeEqual(hash(senha), hash(senhaCorreta))) {
    // atraso fixo: encarece tentativas em massa vindas de um mesmo cliente
    await new Promise((r) => setTimeout(r, 1200));
    return { erro: "Senha incorreta." };
  }

  await iniciarSessaoAdmin(temBiometria ? "Senha (modo de emergência)" : "Senha");

  // primeiro acesso, ainda sem biometria: leva direto para cadastrá-la
  redirect(temBiometria ? "/admin" : "/admin/seguranca?aviso=cadastrar");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  // expira com os mesmos atributos (cookie __Host- exige Secure e Path=/)
  cookieStore.set(ADMIN_COOKIE_NAME, "", { ...ADMIN_COOKIE_OPCOES, maxAge: 0 });
  redirect("/admin/login");
}
