"use client";

// Tour de boas-vindas dos cursos com certificado por etapas: 3 passos, aparece na primeira visita
// (guardado no navegador) e pode ser reaberto pelo botão "Como funciona o certificado".
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const assinar = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const jaVisto = (id: string) => {
  try {
    return localStorage.getItem(id) === "1";
  } catch {
    return true;
  }
};

type Etapa = { horas: number; aulas: number };

export function TourEtapas({
  chave,
  cargaTotal,
  etapas,
  totalAulas,
}: {
  chave: string;
  cargaTotal: number;
  etapas: Etapa[];
  totalAulas: number;
}) {
  const id = `sibrap-tour-etapas-${chave}`;
  const visto = useSyncExternalStore(assinar, () => jaVisto(id), () => true);
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const [dispensado, setDispensado] = useState(false);
  // primeira visita: abre sozinho no passo 1; depois, só pelo botão
  const passo = escolhido ?? (visto || dispensado ? null : 0);
  const setPasso = (n: number) => setEscolhido(n);

  const fechar = () => {
    try {
      localStorage.setItem(id, "1");
    } catch {
      // ignora
    }
    setEscolhido(null);
    setDispensado(true);
  };

  const primeira = etapas[0];
  const passos = [
    {
      icone: "🎓",
      titulo: "Seu certificado é por etapas",
      texto: `Este curso tem ${totalAulas} aulas e ${cargaTotal} horas. Você não precisa terminar tudo para ter um certificado: cada etapa concluída libera uma carga horária.`,
    },
    {
      icone: "⭐",
      titulo: "Aulas + questionário de 5 questões",
      texto: `Ao concluir ${primeira?.aulas ?? 0} aulas, abre o questionário da etapa de ${primeira?.horas ?? 0} horas. Acertou pelo menos 70%? O certificado dessa etapa é liberado.`,
    },
    {
      icone: "🚀",
      titulo: "Emita agora ou continue a jornada",
      texto: `Etapas: ${etapas.map((e) => `${e.horas} h`).join(", ")} e ${cargaTotal} h (curso completo + prova final). Você pode emitir assim que liberar ou seguir estudando e trocar por um certificado maior, pagando só a diferença.`,
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setPasso(0)}
        className="mb-3 text-[13.5px] font-bold text-brand underline underline-offset-4"
      >
        Como funciona o certificado por etapas?
      </button>
      {passo !== null &&
        createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="tour-etapas-titulo" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2A4A]/70 p-4">
          <div className="relative w-full max-w-[440px] border-t-4 border-accent bg-white p-6">
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-[#93A0AF] hover:text-[#516278]"
            >
              ✕
            </button>
            <p aria-hidden className="text-[44px] leading-none">
              {passos[passo].icone}
            </p>
            <p className="mt-3 font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
              Passo {passo + 1} de {passos.length}
            </p>
            <h2 id="tour-etapas-titulo" className="mt-1 font-display text-xl font-extrabold text-[#14213A]">
              {passos[passo].titulo}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">{passos[passo].texto}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex gap-1.5" aria-hidden>
                {passos.map((_, i) => (
                  <span key={i} className={`h-2 w-6 ${i === passo ? "bg-accent" : "bg-[#D7DEE6]"}`} />
                ))}
              </div>
              {passo < passos.length - 1 ? (
                <button type="button" onClick={() => setPasso(passo + 1)} className="bg-accent px-5 py-2.5 text-[15px] font-bold text-accent-ink">
                  Próximo →
                </button>
              ) : (
                <button type="button" onClick={fechar} className="bg-accent px-5 py-2.5 text-[15px] font-bold text-accent-ink">
                  Começar a estudar
                </button>
              )}
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
