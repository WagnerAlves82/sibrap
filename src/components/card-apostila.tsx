import Image from "next/image";
import Link from "next/link";
import {
  descontoPercentual,
  diasAte,
  formatarDataIso,
  imagemDeVitrine,
  type ApostilaVitrine,
} from "@/lib/apostilas";
import { PrecoApostila } from "@/components/preco-apostila";

// Card da vitrine: livro em 3D (mockup) ou capa plana, órgão, cargo, data
// da prova e preço. Serve à home (3 por linha no desktop, 2 no celular) e
// à listagem completa.
export function CardApostila({ apostila }: { apostila: ApostilaVitrine }) {
  const imagem = imagemDeVitrine(apostila);
  const prova = formatarDataIso(apostila.data_prova);
  const dias = diasAte(apostila.data_prova);
  const provaFutura = dias !== null && dias >= 0;
  const pct = descontoPercentual(apostila.preco_original_centavos, apostila.preco_centavos);
  const selo = apostila.selos?.[0];
  const simulados = apostila.simulados ?? 0;

  return (
    <Link
      href={`/apostilas/${apostila.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#D7DEE6] bg-white transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.35)]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-b from-[#E6EEF7] to-[#F6F9FC]">
        {imagem ? (
          <Image
            src={imagem.url}
            alt={`Apostila ${apostila.orgao} — ${apostila.cargo}`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 46vw"
            className={
              imagem.mockup
                ? "object-contain p-7 drop-shadow-[0_14px_16px_rgba(11,42,74,0.28)] transition-transform duration-300 group-hover:scale-[1.03] sm:p-9"
                : "object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center font-display text-lg font-extrabold text-brand">
            {apostila.orgao}
          </div>
        )}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {provaFutura ? (
            <span className="rounded bg-brand px-2 py-1 font-data text-[10.5px] font-semibold text-white shadow">
              {dias === 0 ? "Prova hoje" : dias === 1 ? "Prova amanhã" : `Prova em ${dias} dias`}
            </span>
          ) : (
            <span />
          )}
          {pct !== null ? (
            <span className="rounded bg-accent px-2 py-1 font-data text-[11px] font-bold text-accent-ink shadow">
              -{pct}%
            </span>
          ) : selo ? (
            <span className="rounded bg-accent px-2 py-1 font-data text-[10.5px] font-bold text-accent-ink shadow">
              {selo}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <p className="font-data text-[11px] font-semibold uppercase tracking-wide text-accent-2">
          {apostila.uf}
          {apostila.cidade ? ` · ${apostila.cidade}` : ""} · {apostila.categoria}
        </p>
        <h3 className="line-clamp-2 font-display text-[15px] font-extrabold leading-snug text-[#14213A] sm:text-[16.5px]">
          {apostila.titulo}
        </h3>
        <p className="line-clamp-1 text-[12.5px] text-[#516278]">
          {apostila.orgao}
          {prova ? ` · prova ${prova}` : ""}
        </p>

        {simulados > 0 && (
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-accent-2">
            <span aria-hidden>✓</span>
            {simulados > 1 ? `${simulados} simulados do cargo inclusos` : "Simulado do cargo incluso"}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <PrecoApostila centavos={apostila.preco_centavos} original={apostila.preco_original_centavos} />
          <span
            aria-hidden
            className="rounded-md bg-brand px-3 py-1.5 text-[12.5px] font-bold text-white transition-colors group-hover:brightness-125"
          >
            Ver →
          </span>
        </div>
      </div>
    </Link>
  );
}
