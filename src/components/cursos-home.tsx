"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FOTO_CURSO_PADRAO, FOTOS_POR_CURSO } from "@/lib/cursos-fotos";
import { ORDEM_CATEGORIAS } from "@/components/vitrine-cursos";

export type CursoHome = {
  slug: string;
  nome: string;
  texto: string; // chamada curta (mais procurados) ou descrição do curso
  carga_horaria_horas: number;
  categoria: string | null;
  preco: string | null; // null = curso grátis (só o certificado é pago)
};

const MAIS = "Mais procurados";

// Cursos na home com filtro por área: o visitante escolhe a área ali mesmo,
// sem precisar ir para outra página (pedido do Wagner, 23/11/2026).
export function CursosHome({ destaques, cursos }: { destaques: CursoHome[]; cursos: CursoHome[] }) {
  const [area, setArea] = useState(MAIS);

  const areas = useMemo(() => {
    const n = new Map<string, number>();
    for (const c of cursos) if (c.categoria) n.set(c.categoria, (n.get(c.categoria) ?? 0) + 1);
    const ordem = (cat: string) => {
      const i = ORDEM_CATEGORIAS.indexOf(cat);
      return i === -1 ? ORDEM_CATEGORIAS.length : i;
    };
    return [...n.entries()].sort((a, b) => ordem(a[0]) - ordem(b[0]));
  }, [cursos]);

  const lista = area === MAIS ? destaques : cursos.filter((c) => c.categoria === area);

  const chip = (ativo: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
      ativo ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#3A4A63] hover:border-brand hover:text-brand"
    }`;

  return (
    <div className="mt-6">
      <div role="group" aria-label="Filtrar cursos por área">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setArea(MAIS)} className={chip(area === MAIS)} aria-pressed={area === MAIS}>
            {MAIS}
          </button>
          {areas.map(([cat, n]) => (
            <button key={cat} type="button" onClick={() => setArea(cat)} className={chip(area === cat)} aria-pressed={area === cat}>
              {cat}
              <span className={`text-[11.5px] font-bold ${area === cat ? "text-white/70" : "text-[#8A97A8]"}`}>{n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {lista.map((curso) => (
          <Link
            key={curso.slug}
            href={`/cursos/${curso.slug}`}
            className="group flex h-full flex-col overflow-hidden border border-[#D7DEE6] bg-white transition-shadow hover:shadow-[0_16px_36px_-22px_rgba(11,42,74,0.35)]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
              <Image
                src={FOTOS_POR_CURSO[curso.slug] ?? FOTO_CURSO_PADRAO}
                alt=""
                fill
                sizes="(min-width: 1024px) 380px, 50vw"
                className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col p-3.5 sm:p-5">
              <span className="font-data text-[11px] font-semibold text-accent-2 sm:text-xs">
                {curso.carga_horaria_horas}h · {curso.preco ?? "Grátis"}
              </span>
              <p className="mt-1 font-display text-[14.5px] font-bold leading-snug text-[#14213A] sm:text-[17px]">{curso.nome}</p>
              <p className="mt-1.5 line-clamp-3 flex-1 text-[12.5px] leading-snug text-[#516278] sm:text-[14.5px] sm:leading-relaxed">
                {curso.texto}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 self-end text-[13px] font-bold text-brand transition-transform group-hover:translate-x-1 sm:text-[14px]">
                Saiba mais <span aria-hidden className="text-accent">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
