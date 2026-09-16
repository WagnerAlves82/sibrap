"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { criarTokenAdmin, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

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
  if (senha !== senhaCorreta) {
    return { erro: "Senha incorreta." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, criarTokenAdmin(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
