"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { caminhoContavel } from "@/lib/visitas";

// Conta a visita das páginas de curso: uma vez por curso (e por lado — página pública ou
// área do aluno) na sessão do navegador. Antes era uma por página, e cada aula aberta chamava
// a função da Vercel; agora a raiz do curso concentra a contagem (o total soma as duas).
export function ContarVisita() {
  const pagina = usePathname();

  useEffect(() => {
    if (!pagina || !caminhoContavel(pagina)) return;
    const caminho = pagina.match(/^\/(?:minha-area\/)?cursos(?:\/[a-z0-9_-]+)?/)?.[0] ?? pagina;
    const chave = `sibrap_visita_${caminho}`;
    try {
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
    } catch {
      // sem sessionStorage: o limite por IP no servidor evita a repetição
    }
    fetch("/api/visita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caminho }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pagina]);

  return null;
}
