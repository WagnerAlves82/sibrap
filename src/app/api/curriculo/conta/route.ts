// src/app/api/curriculo/conta/route.ts
//
// Dados da conta para o gerador de currículos: se está logado, o e-mail e o último
// currículo salvo. A página /curriculo fica em cache (igual para todos) e o gerador
// pede isto ao abrir no navegador — bem mais leve que montar a página inteira por visita.

import { NextResponse } from "next/server";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let salvo = null;
  if (user) {
    const { data } = await supabase
      .from("curriculos")
      .select("id, perfil, modelo, dados")
      .order("atualizado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    salvo = data;
  }

  return NextResponse.json(
    { logado: !!user, emailConta: user?.email ?? null, salvo },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
