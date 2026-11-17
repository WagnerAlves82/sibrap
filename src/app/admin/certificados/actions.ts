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
// Wagner (17/11/2026): todo certificado salvo pelo painel tem início e término (obrigatórios, qualquer curso e carga);
// no certificado por etapas (Assistente Administrativo), só no de 60 h e no de 80 h.
// Isso só vale para o que é salvo aqui; a emissão automática do site segue igual.
// Ajustes antes da emissão ficam em certificados_ajustes e são aplicados pelo gatilho certificados_zz_ajuste.

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

// cursos com certificado por etapas: o período entra no de 60 h e na carga completa
const CARGA_MINIMA_PERIODO_ETAPAS = 60;

const dataValida = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime());

async function exigirAdmin() {
  const cookieStore = await cookies();
  if (!(await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value))) redirect("/admin/login");
}

export async function salvarCertificadoAction(formData: FormData) {
  await exigirAdmin();

  const id = String(formData.get("id") ?? "");
  const busca = String(formData.get("busca") ?? "");
  const voltar = (params: Record<string, string>) =>
    redirect(`/admin/certificados?${new URLSearchParams({ q: busca, ...params }).toString()}#c-${id}`);

  const nome = String(formData.get("nome_completo") ?? "").trim().replace(/\s+/g, " ");
  const cpfBruto = String(formData.get("cpf") ?? "").replace(/\D/g, "");
  const carga = Number(formData.get("carga_horaria_horas"));
  const emissao = String(formData.get("emitido_em") ?? "");

  if (nome.length < 5) voltar({ erro: "Nome muito curto.", id });
  if (cpfBruto && !cpfValido(cpfBruto)) voltar({ erro: "CPF inválido.", id });
  if (!Number.isInteger(carga) || carga < 1 || carga > 2000) voltar({ erro: "Carga horária inválida.", id });
  if (!dataValida(emissao)) voltar({ erro: "Data de emissão inválida.", id });

  const admin = criarClienteSupabaseAdmin();
  const { data: atual } = await admin
    .from("certificados")
    .select("codigo, nome_completo, cpf, carga_horaria_horas, emitido_em, data_inicio, data_conclusao, cursos(slug, certificado_por_etapas, carga_horaria_horas)")
    .eq("id", id)
    .maybeSingle();
  if (!atual) voltar({ erro: "Certificado não encontrado.", id });

  type CursoInfo = { slug: string; certificado_por_etapas: boolean; carga_horaria_horas: number };
  const cursoRel = (atual as unknown as { cursos: CursoInfo | CursoInfo[] | null }).cursos;
  const curso = Array.isArray(cursoRel) ? cursoRel[0] : cursoRel;
  // período em qualquer carga; no certificado por etapas (Assistente Adm.), só na carga completa
  // por etapas (Assistente Adm.): período no de 60 h e no de 80 h (Wagner, 17/11/2026)
  const comPeriodo = !curso?.certificado_por_etapas || carga === curso.carga_horaria_horas || carga === CARGA_MINIMA_PERIODO_ETAPAS;
  let inicio = atual!.data_inicio ?? "";
  let conclusao = atual!.data_conclusao ?? "";
  // se a tela não mostrou os campos (ex.: acabou de mudar a carga para a completa), mantém as datas e mostra no próximo passo
  if (comPeriodo && formData.has("data_inicio")) {
    inicio = String(formData.get("data_inicio") ?? "");
    conclusao = String(formData.get("data_conclusao") ?? "");
    if (!dataValida(inicio) || !dataValida(conclusao)) voltar({ erro: "Preencha a data de início e a de término do curso.", id });
  }

  // a data de emissão é guardada com hora; só muda se o dia mudou (mantém a hora original)
  const diaAtual = new Date(atual!.emitido_em).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const { cursos: _curso, ...antes } = atual as typeof atual & { cursos: unknown };
  void _curso;
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

  await (admin as unknown as SupabaseClient).from("certificados_edicoes").insert({ certificado_id: id, antes, depois: novo });

  revalidatePath(`/certificado/${atual!.codigo}`);
  revalidatePath("/admin/certificados");
  voltar({ ok: id });
}

// Ajuste antes da emissão: o aluno ainda não emitiu; os dados entram no certificado quando ele emitir.
export async function salvarAjusteAction(formData: FormData) {
  await exigirAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  const cursoSlug = String(formData.get("curso_slug") ?? "");
  const busca = String(formData.get("busca") ?? "");
  const ancora = `m-${userId}-${cursoId}`;
  const voltar = (params: Record<string, string>) =>
    redirect(`/admin/certificados?${new URLSearchParams({ q: busca, ...params }).toString()}#${ancora}`);

  const nome = String(formData.get("nome_completo") ?? "").trim().replace(/\s+/g, " ");
  const cpfBruto = String(formData.get("cpf") ?? "").replace(/\D/g, "");
  const inicio = String(formData.get("data_inicio") ?? "");
  const conclusao = String(formData.get("data_conclusao") ?? "");

  if (nome && nome.length < 5) voltar({ erro: "Nome muito curto.", id: ancora });
  if (cpfBruto && !cpfValido(cpfBruto)) voltar({ erro: "CPF inválido.", id: ancora });
  void cursoSlug; // o período fica salvo; no certificado por etapas ele só entra se sair com a carga completa (gatilho)
  const comPeriodo = true;
  if (!dataValida(inicio) || !dataValida(conclusao)) {
    voltar({ erro: "Preencha a data de início e a de término do curso.", id: ancora });
  }

  const { error } = await (criarClienteSupabaseAdmin() as unknown as SupabaseClient).from("certificados_ajustes").upsert({
    user_id: userId,
    curso_id: cursoId,
    nome_completo: nome || null,
    cpf: cpfBruto || null,
    data_inicio: comPeriodo ? inicio : null,
    data_conclusao: comPeriodo ? conclusao : null,
    atualizado_em: new Date().toISOString(),
  });
  if (error) voltar({ erro: "Não foi possível salvar: " + error.message, id: ancora });

  revalidatePath("/admin/certificados");
  voltar({ ok: ancora });
}
