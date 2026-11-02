"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";

// O MiniQuiz informa quantas questões o aluno já respondeu; a barra só libera "Concluir" depois disso.
export const QuizAula = createContext<((respondidas: number) => void) | null>(null);
export function useInformarQuiz() {
  return useContext(QuizAula);
}

export type ItemLista = {
  id: string;
  titulo: string;
  modulo: string;
  href: string | null; // null = bloqueada (ordem obrigatória)
  feita: boolean;
  atual: boolean;
};

// Barra fixa no rodapé da tela, estilo app: ☰ Aulas · ← Anterior · Concluir/Próxima · progresso · 🎓 Certificado
export function BarraAula({
  lista,
  anteriorHref,
  proximaHref,
  provaHref,
  certificadoHref,
  feitas,
  concluida,
  quizOk,
  concluindo,
  onConcluir,
}: {
  lista: ItemLista[];
  anteriorHref: string | null;
  proximaHref: string | null;
  provaHref: string;
  certificadoHref: string;
  feitas: number;
  concluida: boolean;
  quizOk: boolean;
  concluindo: boolean;
  onConcluir: () => void;
}) {
  const [listaAberta, setListaAberta] = useState(false);
  const [dica, setDica] = useState(false);
  const total = lista.length;
  const pct = total ? Math.round((feitas / total) * 100) : 0;

  useEffect(() => {
    if (!dica) return;
    const t = setTimeout(() => setDica(false), 4500);
    return () => clearTimeout(t);
  }, [dica]);

  const tentarConcluir = () => {
    if (!quizOk) {
      setDica(true);
      document.getElementById("fixe-o-que-aprendeu")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    onConcluir();
  };

  const lado = "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11.5px] font-semibold text-[#516278] hover:bg-[#F6F9FC] sm:flex-row sm:gap-1.5 sm:text-[13.5px]";
  const principal = "relative flex min-w-[132px] items-center justify-center gap-1.5 px-4 text-[15px] font-extrabold sm:min-w-[200px] sm:text-[16px]";

  let central: React.ReactNode;
  if (!concluida) {
    central = (
      <button
        type="button"
        onClick={tentarConcluir}
        disabled={concluindo}
        aria-disabled={!quizOk}
        className={`${principal} ${quizOk ? "bg-accent text-accent-ink hover:brightness-105" : "bg-[#E7EDF3] text-[#93A0AF]"}`}
      >
        {concluindo ? "Salvando..." : "✓ Concluir aula"}
        {dica && (
          <span role="status" className="absolute bottom-full left-1/2 mb-2 w-[260px] -translate-x-1/2 bg-[#14213A] px-3 py-2 text-left text-[13px] font-semibold leading-snug text-white shadow-lg">
            Responda o “Fixe o que aprendeu” no fim da aula para concluir e seguir.
            <span aria-hidden className="absolute left-1/2 top-full -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-[#14213A]" />
          </span>
        )}
      </button>
    );
  } else if (proximaHref) {
    central = (
      <Link href={proximaHref} className={`${principal} bg-accent text-accent-ink hover:brightness-105`}>
        Próxima aula <span aria-hidden>→</span>
      </Link>
    );
  } else {
    central = (
      <Link href={provaHref} className={`${principal} bg-accent-2 text-white hover:brightness-110`}>
        Fazer a prova <span aria-hidden>→</span>
      </Link>
    );
  }

  return (
    <>
      <nav
        aria-label="Navegação da aula"
        className="fixed inset-x-0 bottom-0 z-[55] border-t border-[#D7DEE6] bg-white/97 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(11,42,74,0.25)] backdrop-blur"
      >
        <div className="h-1 bg-[#EEF2F6]" aria-hidden>
          <div className="h-1 bg-accent-2 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mx-auto flex h-16 max-w-[1180px] items-stretch">
          <button type="button" onClick={() => setListaAberta(true)} className={lado}>
            <span aria-hidden className="text-[18px]">☰</span> Aulas
          </button>
          {anteriorHref ? (
            <Link href={anteriorHref} className={lado}>
              <span aria-hidden className="text-[18px]">←</span> Anterior
            </Link>
          ) : (
            <span className={`${lado} text-[#C4CEDA] hover:bg-transparent`}>
              <span aria-hidden className="text-[18px]">←</span> Anterior
            </span>
          )}
          {central}
          <span className={`${lado} hover:bg-transparent`} aria-label={`${feitas} de ${total} aulas concluídas`}>
            <span className="font-data text-[15px] font-bold text-[#14213A]">
              {feitas}/{total}
            </span>
            <span className="hidden sm:inline">aulas</span>
            <span className="sm:hidden">{pct}%</span>
          </span>
          <Link href={certificadoHref} className={lado}>
            <span aria-hidden className="text-[18px]">🎓</span> Certificado
          </Link>
        </div>
      </nav>

      {listaAberta && (
        <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true" aria-label="Todas as aulas">
          <button type="button" aria-label="Fechar lista de aulas" onClick={() => setListaAberta(false)} className="flex-1 bg-[#14213A]/50" />
          <div className="flex h-full w-[min(92vw,380px)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E7EDF3] px-4 py-3">
              <p className="font-display text-[17px] font-extrabold text-[#14213A]">
                Todas as aulas · {feitas}/{total}
              </p>
              <button type="button" onClick={() => setListaAberta(false)} className="px-2 text-[22px] text-[#516278]" aria-label="Fechar">
                ×
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {lista.map((a, i) => (
                <li key={a.id}>
                  {(i === 0 || lista[i - 1].modulo !== a.modulo) && (
                    <p className="bg-[#F6F9FC] px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-[#516278]">{a.modulo}</p>
                  )}
                  {a.href && !a.atual ? (
                    <Link href={a.href} onClick={() => setListaAberta(false)} className="flex items-center gap-2.5 border-t border-[#F0F4F8] px-4 py-3 text-[15px] text-[#14213A] hover:bg-[#F6F9FC]">
                      <Icone a={a} /> {a.titulo}
                    </Link>
                  ) : (
                    <div className={`flex items-center gap-2.5 border-t border-[#F0F4F8] px-4 py-3 text-[15px] ${a.atual ? "bg-[#FBF5E4] font-semibold text-[#14213A]" : "text-[#93A0AF]"}`}>
                      <Icone a={a} /> {a.titulo}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function Icone({ a }: { a: ItemLista }) {
  return (
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold ${a.feita ? "bg-accent-2 text-white" : a.atual ? "bg-accent text-accent-ink" : "text-[#93A0AF]"}`}
    >
      {a.feita ? "✓" : a.atual ? "▶" : a.href ? "○" : "🔒"}
    </span>
  );
}
