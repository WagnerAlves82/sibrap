"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { criarTokenAdmin, ADMIN_COOKIE_NAME, ADMIN_COOKIE_OPCOES } from "@/lib/admin-auth";
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

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, criarTokenAdmin(), ADMIN_COOKIE_OPCOES);

  redirect("/admin");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  // expira com os mesmos atributos (cookie __Host- exige Secure e Path=/)
  cookieStore.set(ADMIN_COOKIE_NAME, "", { ...ADMIN_COOKIE_OPCOES, maxAge: 0 });
  redirect("/admin/login");
}
