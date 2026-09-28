import {
  PARCELAMENTO,
  descontoPercentual,
  formatarPreco,
  textoParcela,
} from "@/lib/apostilas";

// Bloco de preço. Mostra o "de" riscado e o selo de percentual somente
// quando há preço de referência cadastrado para aquela apostila; mostra
// as parcelas somente quando o pagamento por cartão estiver ativo.
export function PrecoApostila({
  centavos,
  original,
  tamanho = "card",
}: {
  centavos: number;
  original?: number | null;
  tamanho?: "card" | "grande";
}) {
  const pct = descontoPercentual(original, centavos);
  const grande = tamanho === "grande";

  return (
    <div>
      {pct !== null && original && (
        <p className="flex items-center gap-2 text-[12px] text-[#516278]">
          <span className="line-through">{formatarPreco(original)}</span>
          <span className="rounded bg-[#DDF3EA] px-1.5 py-0.5 font-data text-[11px] font-bold text-[#0a6151]">
            -{pct}%
          </span>
        </p>
      )}
      <p
        className={`font-data font-semibold text-[#14213A] ${grande ? "text-4xl" : "text-xl sm:text-2xl"}`}
      >
        {formatarPreco(centavos)}
      </p>
      <p className={`${grande ? "text-[14px]" : "text-[11.5px]"} text-[#516278]`}>
        {PARCELAMENTO.ativo ? (
          <>
            ou <strong className="text-[#14213A]">{textoParcela(centavos)}</strong>
          </>
        ) : (
          "à vista no PIX"
        )}
      </p>
    </div>
  );
}
