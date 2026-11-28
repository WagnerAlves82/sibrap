"use server";

import { redirect } from "next/navigation";
import { descadastrar, emailDoLink, recadastrar } from "@/lib/descadastro";

function lerLink(form: FormData) {
  const e = String(form.get("e") ?? "");
  const t = String(form.get("t") ?? "");
  return { e, t, email: emailDoLink(e, t) };
}

export async function confirmarDescadastroAction(form: FormData) {
  const { e, t, email } = lerLink(form);
  if (email) await descadastrar(email, "link do e-mail");
  redirect(`/descadastrar?e=${encodeURIComponent(e)}&t=${encodeURIComponent(t)}&ok=1`);
}

export async function desfazerDescadastroAction(form: FormData) {
  const { e, t, email } = lerLink(form);
  if (email) await recadastrar(email);
  redirect(`/descadastrar?e=${encodeURIComponent(e)}&t=${encodeURIComponent(t)}&volta=1`);
}
