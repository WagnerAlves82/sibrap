import Link from "next/link";
import { blackFridayAtiva, CUPOM_BLACK_FRIDAY } from "@/lib/black-friday";

/** Faixa preta fina no topo de todas as páginas durante a Black Friday. */
export function FaixaBlackFriday() {
  if (!blackFridayAtiva()) return null;
  return (
    <Link href="/apostilas" className="block bg-[#0D0D0D] text-white transition-colors hover:bg-black">
      <span className="mx-auto flex max-w-[1180px] items-center justify-center gap-2 px-4 py-1.5 text-center text-[12.5px] sm:gap-3">
        <span className="bg-accent px-1.5 py-0.5 font-data text-[10.5px] font-bold uppercase tracking-[0.14em] text-black">
          Black Friday
        </span>
        <span>
          Cupom <strong className="font-data tracking-wider text-accent">{CUPOM_BLACK_FRIDAY}</strong>
          <span className="hidden sm:inline"> em todas as apostilas</span>
        </span>
        <span aria-hidden className="text-accent">→</span>
      </span>
    </Link>
  );
}

/** Selo preto junto ao preço da apostila. */
export function SeloBlackFriday({ grande = false }: { grande?: boolean }) {
  if (!blackFridayAtiva()) return null;
  return (
    <p className={`mt-2 inline-flex items-center gap-1.5 bg-[#0D0D0D] px-2 py-1 font-data font-bold uppercase text-white ${grande ? "text-[12px]" : "text-[10px]"}`}>
      <span className="text-accent">Black Friday</span>
      <span className="opacity-50">·</span>
      <span className="tracking-wider">cupom {CUPOM_BLACK_FRIDAY}</span>
    </p>
  );
}

/** Tarja preta na base da imagem do card de apostila. */
export function FaixaCardBlackFriday() {
  if (!blackFridayAtiva()) return null;
  return (
    <span className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-1.5 whitespace-nowrap bg-[#0D0D0D]/90 px-2 py-1 font-data text-[10px] font-bold uppercase text-white sm:text-[11px]">
      <span className="text-accent">Black Friday</span>
      <span className="opacity-50">·</span>
      <span className="tracking-wider">cupom {CUPOM_BLACK_FRIDAY}</span>
    </span>
  );
}
