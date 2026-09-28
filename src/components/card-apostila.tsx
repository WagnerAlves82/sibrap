import Image from "next/image";
import Link from "next/link";
import {
  diasAte,
  formatarDataIso,
  formatarPreco,
  urlCapa,
  type ApostilaVitrine,
} from "@/lib/apostilas";

// Card da vitrine: capa no modelo da apostila, órgão, cargo, data da
// prova e preço. Serve à home (3 por linha no desktop, 2 no celular) e à
// listagem completa.
export function CardApostila({ apostila }: { apostila: ApostilaVitrine }) {
  const capa = urlCapa(apostila.capa_path);
  const prova = formatarDataIso(apostila.data_prova);
  const dias = diasAte(apostila.data_prova);
  const provaFutura = dias !== null && dias >= 0;

  return (
    <Link
      href={`/apostilas/${apostila.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#D7DEE6] bg-white transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.35)]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-2">
        {capa ? (
          <Image
            src={capa}
            alt={`Capa da apostila ${apostila.orgao} — ${apostila.cargo}`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 46vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center font-display text-lg font-extrabold text-brand">
            {apostila.orgao}
          </div>
        )}
        {provaFutura && (
          <span className="absolute left-2 top-2 rounded bg-brand px-2 py-1 font-data text-[10.5px] font-semibold text-white shadow">
            {dias === 0 ? "Prova hoje" : dias === 1 ? "Prova amanhã" : `Prova em ${dias} dias`}
          </span>
        )}
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

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="font-data text-xl font-semibold text-[#14213A] sm:text-2xl">
              {formatarPreco(apostila.preco_centavos)}
            </p>
            <p className="text-[11.5px] text-[#516278]">PDF · pagamento único</p>
          </div>
          <span
            aria-hidden
            className="rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-bold text-accent-ink transition-colors group-hover:brightness-105"
          >
            Ver →
          </span>
        </div>
      </div>
    </Link>
  );
}
