"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FOTO_CURSO_PADRAO, FOTOS_POR_CURSO } from "@/lib/cursos-fotos";

export type CursoVitrine = {
  slug: string;
  nome: string;
  descricao: string | null;
  carga_horaria_horas: number;
  categoria: string | null;
  preco: string | null; // null = gratuito (só o certificado é pago)
  avaliacao: { media: number; total: number } | null; // média real da pesquisa de satisfação
};

// Ordem fixa das categorias: os próximos cursos entram numa delas (ou numa nova, no fim).
export const ORDEM_CATEGORIAS = [
  "Administração e escritório",
  "Tecnologia",
  "Atendimento e comunicação",
  "Serviços e hotelaria",
  "Indústria e logística",
  "Construção e manutenção",
];
const OUTROS = "Outros cursos";

export function VitrineCursos({ cursos }: { cursos: CursoVitrine[] }) {
  const [filtro, setFiltro] = useState("Todos");

  const grupos = useMemo(() => {
    const mapa = new Map<string, CursoVitrine[]>();
    for (const c of cursos) {
      const cat = c.categoria ?? OUTROS;
      mapa.set(cat, [...(mapa.get(cat) ?? []), c]);
    }
    const ordem = (cat: string) => {
      const i = ORDEM_CATEGORIAS.indexOf(cat);
      return i === -1 ? ORDEM_CATEGORIAS.length : i;
    };
    return [...mapa.entries()].sort((a, b) => ordem(a[0]) - ordem(b[0]));
  }, [cursos]);

  const visiveis = filtro === "Todos" ? grupos : grupos.filter(([cat]) => cat === filtro);

  const botao = (ativo: boolean) =>
    `border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
      ativo ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#516278] hover:border-brand hover:text-brand"
    }`;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar cursos por categoria">
        {["Todos", ...grupos.map(([cat]) => cat)].map((cat) => (
          <button key={cat} type="button" onClick={() => setFiltro(cat)} className={botao(filtro === cat)} aria-pressed={filtro === cat}>
            {cat}
          </button>
        ))}
      </div>

      {visiveis.map(([cat, lista]) => (
        <section key={cat} className="mt-10" aria-labelledby={`cat-${cat}`}>
          <h2 id={`cat-${cat}`} className="flex items-baseline gap-3 border-b border-[#D7DEE6] pb-2 font-display text-xl font-extrabold text-[#14213A]">
            {cat}
            <span className="font-data text-xs font-semibold text-[#8B97A8]">
              {lista.length} {lista.length === 1 ? "curso" : "cursos"}
            </span>
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((c) => (
              <CardCurso key={c.slug} curso={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CardCurso({ curso }: { curso: CursoVitrine }) {
  return (
    <Link
      href={`/cursos/${curso.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-[#D7DEE6] bg-white transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.3)]"
    >
      {/* 4:3: os banners com título aparecem inteiros; as fotos perdem só um pouco das laterais */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
        <Image
          src={FOTOS_POR_CURSO[curso.slug] ?? FOTO_CURSO_PADRAO}
          alt=""
          fill
          sizes="(min-width: 1024px) 370px, (min-width: 640px) 45vw, 100vw"
          className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="font-data text-xs font-semibold text-accent-2">
          {curso.carga_horaria_horas}h ·{" "}
          {curso.preco ? <span className="text-[#14213A]">{curso.preco}, com certificado</span> : "Grátis"}
        </span>
        <h3 className="mt-2 font-display text-[1.3rem] font-extrabold leading-snug text-[#14213A]">{curso.nome}</h3>
        <div className="flex-1">
          <p className="mt-2 line-clamp-3 text-[14.5px] leading-relaxed text-[#516278]">{curso.descricao}</p>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <Avaliacao avaliacao={curso.avaliacao} />
          <span className="shrink-0 bg-brand px-4 py-2 text-[13.5px] font-bold text-white transition-[filter] group-hover:brightness-125">
            {curso.preco ? "Conheça mais" : "Inscreva-se"}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Estrelas com a média REAL da pesquisa de satisfação (mínimo de 3 respostas).
// Sem respostas suficientes, mostra "Avaliações em breve" em vez de inventar nota.
function Avaliacao({ avaliacao }: { avaliacao: CursoVitrine["avaliacao"] }) {
  if (!avaliacao) {
    return <span className="font-data text-[11.5px] font-semibold uppercase tracking-wide text-[#8B97A8]">Avaliações em breve</span>;
  }
  const pct = Math.max(0, Math.min(100, (avaliacao.media / 5) * 100));
  const media = avaliacao.media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <span className="flex items-center gap-1.5" aria-label={`Nota ${media} de 5, ${avaliacao.total} avaliações de alunos`}>
      <span aria-hidden className="relative inline-block text-[15px] leading-none tracking-[1px]">
        <span className="text-[#D7DEE6]">★★★★★</span>
        <span className="absolute inset-0 overflow-hidden whitespace-nowrap text-[#F2B01E]" style={{ width: `${pct}%` }}>
          ★★★★★
        </span>
      </span>
      <span className="font-data text-[12.5px] font-bold text-[#14213A]">{media}</span>
      <span className="text-[11.5px] text-[#8B97A8]">({avaliacao.total})</span>
    </span>
  );
}
