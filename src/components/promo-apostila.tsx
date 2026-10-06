import Image from "next/image";
import Link from "next/link";
import {
  descontoPercentual,
  diasAte,
  formatarPreco,
  imagemDeVitrine,
  type ApostilaVitrine,
} from "@/lib/apostilas";

// Propaganda orgânica da própria loja: mesma lógica dos anúncios pagos
// (foto, "de/por", selo de desconto e prazo), pra encaixar entre matérias do
// blog e no meio dos posts. `variante="faixa"` ocupa a largura toda.
export function PromoApostila({
  apostila,
  variante = "card",
  origem = "blog",
}: {
  apostila: ApostilaVitrine;
  variante?: "card" | "faixa";
  origem?: string;
}) {
  const imagem = imagemDeVitrine(apostila);
  const pct = descontoPercentual(apostila.preco_original_centavos, apostila.preco_centavos);
  const dias = diasAte(apostila.data_prova);
  const href = `/apostilas/${apostila.slug}?utm_source=site&utm_medium=organico&utm_campaign=${origem}`;
  const faixa = variante === "faixa";

  return (
    <Link
      href={href}
      className={`group relative flex overflow-hidden rounded-xl border-2 border-accent bg-gradient-to-br from-white to-[#FFF7E0] transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.45)] ${
        faixa ? "col-span-full flex-row items-center gap-4 p-3 sm:gap-6 sm:p-4" : "h-full flex-col"
      }`}
    >
      <span className="absolute right-2 top-2 z-10 rounded bg-brand px-2 py-0.5 font-data text-[10px] font-semibold tracking-wide text-white uppercase">
        Anúncio da loja
      </span>
      <div
        className={`relative shrink-0 bg-gradient-to-b from-[#E6EEF7] to-[#F6F9FC] ${
          faixa ? "h-28 w-24 rounded-lg sm:h-36 sm:w-32" : "aspect-[4/3] w-full"
        }`}
      >
        {imagem ? (
          <Image
            src={imagem.url}
            alt={`Apostila ${apostila.orgao} — ${apostila.cargo}`}
            fill
            sizes={faixa ? "128px" : "(min-width: 1024px) 360px, 92vw"}
            className={imagem.mockup ? "object-contain p-2 drop-shadow-[0_14px_16px_rgba(11,42,74,0.3)]" : "object-cover"}
          />
        ) : null}
        {pct !== null && (
          <span className="absolute left-2 top-2 animate-pulse rounded bg-accent px-2 py-1 font-data text-[12px] font-extrabold text-accent-ink shadow">
            -{pct}%
          </span>
        )}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${faixa ? "pr-2" : "p-4"}`}>
        <p className="font-data text-[11px] font-semibold uppercase tracking-wide text-accent-2">
          {apostila.uf} · {apostila.orgao}
          {dias !== null && dias >= 0 ? ` · prova em ${dias} dias` : ""}
        </p>
        <h3 className="line-clamp-2 font-display text-[16px] font-extrabold leading-snug text-[#14213A]">
          {apostila.titulo}
        </h3>
        <p className="text-[12.5px] text-[#516278]">Questões no estilo da banca, comentadas, com simulado online.</p>
        <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
          {pct !== null && apostila.preco_original_centavos && (
            <span className="text-[13px] text-[#516278] line-through">{formatarPreco(apostila.preco_original_centavos)}</span>
          )}
          <span className="font-display text-[1.6rem] leading-none font-extrabold text-brand">
            {formatarPreco(apostila.preco_centavos)}
          </span>
          <span className="rounded-md bg-brand px-3 py-1.5 text-[12.5px] font-bold text-white transition-colors group-hover:brightness-125">
            Quero estudar →
          </span>
        </div>
      </div>
    </Link>
  );
}
