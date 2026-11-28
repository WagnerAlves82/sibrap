"use server";

import { redirect } from "next/navigation";
import { descadastrar, emailDoToken, recadastrar } from "@/lib/descadastro";

export async function confirmarDescadastroAction(form: FormData) {
  const t = String(form.get("t") ?? "");
  const email = await emailDoToken(t);
  if (email) await descadastrar(email, "link do e-mail");
  redirect(`/descadastrar?t=${encodeURIComponent(t)}&ok=1`);
}

export async function desfazerDescadastroAction(form: FormData) {
  const t = String(form.get("t") ?? "");
  const email = await emailDoToken(t);
  if (email) await recadastrar(email);
  redirect(`/descadastrar?t=${encodeURIComponent(t)}&volta=1`);
}
