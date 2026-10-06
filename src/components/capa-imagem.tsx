"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";

// Capa por link externo (Wikimedia): se o arquivo não carregar, mostra o
// substituto em vez de um quadro quebrado.
export function CapaImagem({
  src,
  alt,
  sizes,
  className,
  priority,
  fallback,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fallback: ReactNode;
}) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return <>{fallback}</>;
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} onError={() => setFalhou(true)} />;
}
