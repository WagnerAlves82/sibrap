// src/components/alert.tsx
//
// Aviso pequeno e discreto (não é toast/popup) pra chamar atenção pra
// uma informação específica sem interromper o fluxo. Variantes
// seguem o mesmo padrão visual (fundo escuro translúcido + borda
// colorida) já usado nos cards de destaque do site.

const ESTILOS = {
  info: "border-blue-700/50 bg-blue-950/30 text-blue-200",
  aviso: "border-yellow-700/50 bg-yellow-950/30 text-yellow-200",
  sucesso: "border-emerald-700/50 bg-emerald-950/30 text-emerald-200",
  erro: "border-red-700/50 bg-red-950/30 text-red-200",
} as const;

const ICONES = {
  info: "ℹ",
  aviso: "⚠",
  sucesso: "✓",
  erro: "✕",
} as const;

export function Alert({
  variant = "info",
  children,
  className = "",
}: {
  variant?: keyof typeof ESTILOS;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs leading-relaxed ${ESTILOS[variant]} ${className}`}
    >
      <span aria-hidden className="mt-px">
        {ICONES[variant]}
      </span>
      <span>{children}</span>
    </div>
  );
}
