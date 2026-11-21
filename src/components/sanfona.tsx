// Sanfona da Minha área (Wagner, 21/11/2026): bloco que abre e fecha mostrando o conteúdo ali mesmo.
// <details> nativo: funciona sem JavaScript e mantém a página como componente de servidor.
export function Sanfona({
  titulo,
  resumo,
  contador,
  aberta = false,
  id,
  children,
}: {
  titulo: string;
  resumo?: string;
  contador?: number | string;
  aberta?: boolean;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <details id={id} open={aberta} className="group scroll-mt-24 rounded-xl border border-[#D7DEE6] bg-white open:shadow-[0_18px_40px_-28px_rgba(11,42,74,0.35)]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-display text-[18px] font-extrabold text-[#14213A] sm:text-xl">{titulo}</span>
            {contador !== undefined && (
              <span className="bg-[#EEF3F8] px-2 py-0.5 font-data text-[12px] font-bold text-brand">{contador}</span>
            )}
          </span>
          {resumo && <span className="mt-0.5 block text-[13.5px] text-[#516278]">{resumo}</span>}
        </span>
        <svg
          aria-hidden
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          className="shrink-0 text-brand transition-transform duration-200 group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-[#EEF2F6] px-5 py-5">{children}</div>
    </details>
  );
}
