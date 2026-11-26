"use client";

import { useState, useTransition } from "react";
import { enviarFeedbackRedacaoAction } from "../actions";

// Campo de feedback no fim da correção: nota de 1 a 5 + comentário (26/11/2026).
export function FeedbackRedacao({ id, notaInicial, comentarioInicial }: { id: string; notaInicial?: number; comentarioInicial?: string }) {
  const [nota, setNota] = useState(notaInicial ?? 0);
  const [comentario, setComentario] = useState(comentarioInicial ?? "");
  const [enviado, setEnviado] = useState(!!notaInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nota) return setErro("Escolha uma nota de 1 a 5.");
    setErro(null);
    iniciar(async () => {
      const r = await enviarFeedbackRedacaoAction(id, nota, comentario);
      if ("erro" in r) setErro(r.erro);
      else setEnviado(true);
    });
  }

  return (
    <section className="mt-6 border border-l-[4px] border-[#D7DEE6] border-l-accent bg-white p-5 sm:p-6">
      <p className="font-display text-lg font-extrabold text-[#14213A]">O que você achou do Treino de Redação?</p>
      {enviado ? (
        <p className="mt-2 text-[14.5px] text-[#0E7C6B]">
          Obrigado pelo feedback! Ele ajuda a melhorar a correção. {" "}
          <button type="button" onClick={() => setEnviado(false)} className="font-bold text-brand underline">Editar</button>
        </p>
      ) : (
        <form onSubmit={enviar} className="mt-3 flex flex-col gap-3">
          <div className="flex gap-2" role="radiogroup" aria-label="Nota de 1 a 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={nota === n}
                onClick={() => setNota(n)}
                className={`h-11 w-11 border text-[17px] font-bold transition-colors ${nota >= n ? "border-accent bg-accent text-accent-ink" : "border-[#D7DEE6] bg-white text-[#516278] hover:border-accent"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-[13px] font-semibold text-[#516278]">
            Conte o que funcionou, o que confundiu e o que você mudaria (opcional)
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value.slice(0, 2000))}
              rows={4}
              className="w-full border border-[#D7DEE6] bg-white px-3 py-2.5 text-[15px] font-normal text-[#14213A] outline-none focus:border-brand"
            />
          </label>
          {erro && <p className="text-[13.5px] font-semibold text-[#B42318]">{erro}</p>}
          <button type="submit" disabled={pendente} className="self-start bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink hover:brightness-105 disabled:opacity-50">
            {pendente ? "Enviando…" : "Enviar feedback"}
          </button>
        </form>
      )}
    </section>
  );
}
