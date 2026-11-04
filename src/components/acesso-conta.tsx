"use client";

// Botão "Entrar" / "Minha Área + Sair" do cabeçalho nas páginas em cache.
// Lê o cookie-sinal (ver src/lib/marca-logado.ts) no navegador, para a página
// poder ser a mesma para todo mundo e ficar no cache da Vercel.

import Link from "next/link";
import { useEffect, useState } from "react";
import { sairDaConta } from "@/app/login/actions";
import { COOKIE_LOGADO } from "@/lib/marca-logado";

export function AcessoConta({ next }: { next?: string }) {
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    setLogado(document.cookie.split("; ").some((c) => c === `${COOKIE_LOGADO}=1`));
  }, []);

  return (
    <>
      <Link
        href={logado ? "/minha-area" : next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
        className="ml-1 rounded-md bg-brand px-3 py-2 sm:px-4 text-white transition-colors hover:brightness-125"
      >
        {logado ? "Minha Área" : "Entrar"}
      </Link>
      {logado && (
        <form action={sairDaConta}>
          <button type="submit" className="px-1.5 py-2 sm:px-2 text-[#516278] underline-offset-4 hover:text-brand hover:underline">
            Sair
          </button>
        </form>
      )}
    </>
  );
}
