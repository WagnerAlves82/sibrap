"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";

// Edição de certificado pelo painel. O gatilho certificados_hash recalcula o hash de conferência
// quando nome, CPF, carga ou data de emissão mudam. Cada edição fica registrada em certificados_edicoes.

function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const dig = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dig(9) === Number(cpf[9]) && dig(10) === Number(cpf[10]);
}

const dataValida = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime());

export async function salvarCertificadoAction(formData: FormData) {
  const cookieStore = await cookies();
  if (!(await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value))) redirect("/admin/login");

  const id = String(formData.get("id") ?? "");
  const busca = String(formData.get("busca") ?? "");
  const voltar = (params: Record<string, string>) =>
    redirect(`/admin/certificados?${new URLSearchParams({ q: busca, ...params }).toString()}#c-${id}`);

  const nome = String(formData.get("nome_completo") ?? "").trim().replace(/\s+/g, " ");
  const cpfBruto = String(formData.get("cpf") ?? "").replace(/\D/g, "");
  const carga = Number(formData.get("carga_horaria_horas"));
  const emissao = String(formData.get("emitido_em") ?? "");
  // período no certificado ("realizado de … a …"): só aparece com as duas datas preenchidas
  const mostrarPeriodo = formData.get("mostrar_periodo") === "on";
  const inicio = mostrarPeriodo ? String(formData.get("data_inicio") ?? "") : "";
  const conclusao = mostrarPeriodo ? String(formData.get("data_conclusao") ?? "") : "";

  if (nome.length < 5) voltar({ erro: "Nome muito curto.", id });
  if (cpfBruto && !cpfValido(cpfBruto)) voltar({ erro: "CPF inválido.", id });
  if (!Number.isInteger(carga) || carga < 1 || carga > 2000) voltar({ erro: "Carga horária inválida.", id });
  if (!dataValida(emissao)) voltar({ erro: "Data de emissão inválida.", id });
  if (mostrarPeriodo && (!inicio || !conclusao)) voltar({ erro: "Para incluir o período, preencha a data de início e a de término.", id });
  if (inicio && !dataValida(inicio)) voltar({ erro: "Data de início inválida.", id });
  if (conclusao && !dataValida(conclusao)) voltar({ erro: "Data de conclusão inválida.", id });

  const admin = criarClienteSupabaseAdmin();
  const { data: atual } = await admin
    .from("certificados")
    .select("codigo, nome_completo, cpf, carga_horaria_horas, emitido_em, data_inicio, data_conclusao")
    .eq("id", id)
    .maybeSingle();
  if (!atual) voltar({ erro: "Certificado não encontrado.", id });

  // a data de emissão é guardada com hora; só muda se o dia mudou (mantém a hora original)
  const diaAtual = new Date(atual!.emitido_em).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const novo = {
    nome_completo: nome,
    cpf: cpfBruto || null,
    carga_horaria_horas: carga,
    emitido_em: diaAtual === emissao ? atual!.emitido_em : `${emissao}T12:00:00-03:00`,
    data_inicio: inicio || null,
    data_conclusao: conclusao || null,
  };

  const { error } = await admin.from("certificados").update(novo).eq("id", id);
  if (error) voltar({ erro: "Não foi possível salvar: " + error.message, id });

  await (admin as unknown as SupabaseClient).from("certificados_edicoes").insert({ certificado_id: id, antes: atual, depois: novo });

  revalidatePath(`/certificado/${atual!.codigo}`);
  revalidatePath("/admin/certificados");
  voltar({ ok: id });
}
