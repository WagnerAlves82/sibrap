"use client";

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-[#0B2A4A] px-4 py-2.5 text-[13.5px] font-semibold text-[#0B2A4A] transition-colors hover:bg-white"
    >
      Imprimir
    </button>
  );
}
