"use client";

import { useRef } from "react";
import Link from "next/link";
import { CapaImagem } from "@/components/capa-imagem";
import { urlCapa } from "@/lib/apostilas";

type Item = { id: string; slug: string; titulo: string; uf: string | null; regiao: string | null; data: string | null };

// Carrossel no meio da matéria: outras matérias do mesmo estado (brasão em fundo branco + chamada),
// só para dar uma quebra na leitura. Desliza com o dedo/scroll; as setas aparecem no computador.
export function CarrosselEstado({ uf, itens }: { uf: string; itens: Item[] }) {
  const trilho = useRef<HTMLUListElement>(null);
  if (itens.length === 0) return null;
  const mover = (dir: 1 | -1) => trilho.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  return (
    <section aria-label={`Mais concursos em ${uf}`} className="not-prose my-10 rounded-xl border border-[#D7DEE6] bg-[#F6F9FC] py-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="font-display text-[14px] font-extrabold uppercase tracking-wide text-[#14213A]">
          Mais concursos em <span className="text-brand">{uf}</span>
        </h2>
        {itens.length > 2 && (
          <div className="hidden gap-1.5 sm:flex">
            {([-1, 1] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => mover(d)}
                aria-label={d < 0 ? "Anteriores" : "Próximas"}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D7DEE6] bg-white text-brand transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
              >
                {d < 0 ? "←" : "→"}
              </button>
            ))}
          </div>
        )}
      </div>
      <ul ref={trilho} className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:thin]">
        {itens.map((p) => (
          <li key={p.id} className="w-[220px] shrink-0 snap-start">
            <Link
              href={`/noticias/${p.slug}`}
              className="group flex h-full flex-col rounded-lg border border-[#E1E7EE] bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_12px_28px_-18px_rgba(11,42,74,0.55)]"
            >
              <span className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden bg-white">
                <CapaImagem
                  src={urlCapa(`posts/brasao-${p.slug}.webp`)!}
                  alt=""
                  sizes="80px"
                  className="object-contain transition-transform duration-300 group-hover:scale-110"
                  fallback={
                    <span className="flex h-full w-full items-center justify-center font-display text-[22px] font-extrabold text-brand">
                      {p.uf ?? p.regiao ?? "BR"}
                    </span>
                  }
                />
              </span>
              <span className="mt-2.5 line-clamp-3 font-display text-[13.5px] font-bold leading-snug text-[#14213A] transition-colors group-hover:text-brand">
                {p.titulo}
              </span>
              {p.data && (
                <span className="mt-auto pt-2 font-data text-[10.5px] font-semibold uppercase tracking-wide text-accent-2">{p.data}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
