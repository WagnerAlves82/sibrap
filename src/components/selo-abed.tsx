"use client";

import { useEffect, useRef, useState } from "react";

// Selo "Somos associados ABED". A imagem é public/abed.png; se o arquivo
// não existir, o selo (e a legenda) simplesmente não aparecem.
export function SeloAbed({
  altura,
  fonteLegenda = "11px",
  className = "",
}: {
  altura: number | string;
  fonteLegenda?: string;
  className?: string;
}) {
  const [ok, setOk] = useState(true);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setOk(false);
  }, []);

  if (!ok) return null;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.35em",
        fontSize: fonteLegenda,
      }}
    >
      <span
        style={{
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#1D3B8B",
          lineHeight: 1,
        }}
      >
        Somos associados
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src="/abed.png"
        alt="ABED — Associação Brasileira de Educação a Distância"
        onError={() => setOk(false)}
        style={{ height: altura, width: "auto" }}
      />
    </span>
  );
}
