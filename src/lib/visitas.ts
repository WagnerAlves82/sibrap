// src/lib/visitas.ts
//
// Contador de visitas dos cursos. Conta todas as páginas do curso (a pública
// /cursos/<slug> e as da área do aluno /minha-area/cursos/<slug>/...), mas o
// número só aparece na página do curso depois de 1.000 visitas.

import type { SupabaseClient } from "@supabase/supabase-js";

export const VISITAS_MINIMAS_PARA_EXIBIR = 1000;

/** Páginas que entram na contagem: só as dos cursos. */
export function caminhoContavel(caminho: string): boolean {
  return /^\/(minha-area\/)?cursos(\/[a-z0-9_-]+)*$/.test(caminho) && caminho.length <= 200;
}

/** Total de visitas de um curso (página pública + área do aluno). */
export async function visitasDoCurso(supabase: SupabaseClient, slug: string): Promise<number> {
  if (!/^[a-z0-9-]+$/.test(slug)) return 0;
  const { data } = await supabase
    .from("visitas_paginas")
    .select("total")
    .or(`caminho.eq./cursos/${slug},caminho.eq./minha-area/cursos/${slug},caminho.like./minha-area/cursos/${slug}/%`);
  return (data ?? []).reduce((s: number, v: { total: number }) => s + Number(v.total), 0);
}
