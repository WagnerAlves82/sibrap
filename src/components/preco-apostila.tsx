import {
  PARCELAMENTO,
  descontoPercentual,
  formatarPreco,
  maxParcelas,
  textoParcela,
} from "@/lib/apostilas";
import { SeloPromocao } from "@/components/selo-promocao";
import { SeloBlackFriday } from "@/components/black-friday";

// Bloco de preço. Mostra o "de" riscado e o selo de percentual somente
// quando há preço de referência cadastrado para aquela apostila; mostra
// as parcelas somente quando o pagamento por cartão estiver ativo.
export function PrecoApostila({
  centavos,
  original,
  tamanho = "card",
  acao,
}: {
  centavos: number;
  original?: number | null;
  tamanho?: "card" | "grande";
  /** elemento pequeno (ex.: botão "Ver") na mesma linha das parcelas, à direita */
  acao?: React.ReactNode;
}) {
  const pct = descontoPercentual(original, centavos);
  const grande = tamanho === "grande";

  return (
    <div>
      {pct !== null && original && <SeloPromocao />}
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
      <div className="flex items-center justify-between gap-1.5">
      <p className={`${grande ? "text-[14px]" : acao ? "whitespace-nowrap text-[10.5px] sm:text-[11.5px]" : "text-[11.5px]"} min-w-0 text-[#516278]`}>
        {PARCELAMENTO.ativo && maxParcelas(centavos) > 1 ? (
          <>
            <span className={acao ? "max-[380px]:hidden" : undefined}>ou </span><strong className="text-[#14213A]">{textoParcela(centavos)}</strong>
          </>
        ) : (
          "à vista no PIX"
        )}
      </p>
      {acao}
      </div>
      {grande && <SeloBlackFriday grande />}
    </div>
  );
}
