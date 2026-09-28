"use client";

import Image from "next/image";
import { useState } from "react";

export type ImagemGaleria = { url: string; alt: string; mockup: boolean };

// Imagem principal grande + miniaturas (mockups do livro e capa plana).
export function GaleriaApostila({ imagens }: { imagens: ImagemGaleria[] }) {
  const [atual, setAtual] = useState(0);
  if (imagens.length === 0) return null;
  const img = imagens[atual] ?? imagens[0];

  return (
    <div>
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-[#D7DEE6] bg-gradient-to-b from-[#E6EEF7] to-[#F6F9FC]">
        <Image
          key={img.url}
          src={img.url}
          alt={img.alt}
          fill
          priority
          sizes="(min-width: 768px) 340px, 300px"
          className={
            img.mockup
              ? "object-contain p-4 drop-shadow-[0_22px_24px_rgba(11,42,74,0.35)]"
              : "object-cover"
          }
        />
      </div>
      {imagens.length > 1 && (
        <div className="mt-3 flex gap-2">
          {imagens.map((i, n) => (
            <button
              key={i.url}
              type="button"
              onClick={() => setAtual(n)}
              aria-label={`Ver imagem ${n + 1} de ${imagens.length}`}
              aria-current={n === atual}
              className={`relative aspect-[2/3] w-16 overflow-hidden rounded-md border bg-[#EEF3F9] transition-colors ${
                n === atual ? "border-brand ring-1 ring-brand" : "border-[#D7DEE6] hover:border-brand"
              }`}
            >
              <Image
                src={i.url}
                alt=""
                fill
                sizes="64px"
                className={i.mockup ? "object-contain p-1" : "object-cover"}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
