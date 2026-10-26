// Selo discreto de preço promocional: ponto pulsante + "Preço promocional".
// Aparece só quando a apostila tem preço de referência ("de") cadastrado.
// Sem animação para quem pede menos movimento (motion-safe).
export function SeloPromocao({ escuro = false }: { escuro?: boolean }) {
  const cor = escuro ? "bg-accent" : "bg-[#1BAA7E]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-data text-[11px] font-semibold uppercase tracking-wide ${escuro ? "text-accent" : "text-[#0a6151]"}`}
    >
      <span className="relative inline-flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-ping ${cor}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${cor}`} />
      </span>
      Preço promocional
    </span>
  );
}
