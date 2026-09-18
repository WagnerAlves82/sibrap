"use client";

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-accent px-5 py-2.5 text-[14px] font-bold text-accent-ink transition-colors hover:brightness-105"
    >
      Imprimir / salvar em PDF
    </button>
  );
}
