"use client";

// Link do cabeçalho que some para quem está logado (Wagner, 21/11/2026: "Apostilas" ocupava espaço à toa na barra logada).
// Páginas em cache não sabem quem está logado no servidor: lê o mesmo cookie-sinal do botão "Minha Área".
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { COOKIE_LOGADO } from "@/lib/marca-logado";

const nada = () => () => {};
const estaLogado = () => document.cookie.split("; ").some((c) => c === `${COOKIE_LOGADO}=1`);

export function LinkSoDeslogado({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const logado = useSyncExternalStore(nada, estaLogado, () => false);
  if (logado) return null;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
