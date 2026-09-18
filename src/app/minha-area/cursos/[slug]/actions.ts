"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export async function matricularAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const supabase = await criarClienteSupabaseServer();
  await supabase.rpc("matricular_curso", { p_curso_slug: slug });
  redirect(`/minha-area/cursos/${slug}`);
}
