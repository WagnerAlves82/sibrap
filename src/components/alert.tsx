// src/components/alert.tsx
//
// Aviso pequeno e discreto (não é toast/popup) pra chamar atenção pra
// uma informação específica sem interromper o fluxo. Duas paletas: a
// escura (telas antigas do simulado) e a clara (identidade nova).

const ESTILOS = {
  info: "border-blue-700/50 bg-blue-950/30 text-blue-200",
  aviso: "border-yellow-700/50 bg-yellow-950/30 text-yellow-200",
  sucesso: "border-emerald-700/50 bg-emerald-950/30 text-emerald-200",
  erro: "border-red-700/50 bg-red-950/30 text-red-200",
} as const;

const ESTILOS_CLAROS = {
  info: "border-[#B9CBDF] bg-[#EEF3F8] text-[#0B2A4A]",
  aviso: "border-[#E6CF9C] bg-[#FBF5E4] text-[#5B4210]",
  sucesso: "border-[#A9D7CC] bg-[#EAF6F2] text-[#0B5A4D]",
  erro: "border-[#E8B4B4] bg-[#FBEDED] text-[#8A1F1F]",
} as const;

const ICONES = {
  info: "ℹ",
  aviso: "⚠",
  sucesso: "✓",
  erro: "✕",
} as const;

export function Alert({
  variant = "info",
  claro = false,
  children,
  className = "",
}: {
  variant?: keyof typeof ESTILOS;
  claro?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const estilo = claro ? ESTILOS_CLAROS[variant] : ESTILOS[variant];
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs leading-relaxed ${estilo} ${className}`}
    >
      <span aria-hidden className="mt-px">
        {ICONES[variant]}
      </span>
      <span>{children}</span>
    </div>
  );
}
