"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { caminhoContavel } from "@/lib/visitas";

// Conta a visita das páginas de curso (uma vez por página na sessão do navegador).
export function ContarVisita() {
  const caminho = usePathname();

  useEffect(() => {
    if (!caminho || !caminhoContavel(caminho)) return;
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
  }, [caminho]);

  return null;
}
