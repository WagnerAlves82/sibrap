import Image from "next/image";
import Link from "next/link";
import { descontoPercentual, diasAte, formatarPreco, imagemDeVitrine, type ApostilaVitrine } from "@/lib/apostilas";

// Anúncio grande da apostila na coluna lateral das Notícias (entre "Leia também" e "Concursos em <UF>"),
// no mesmo azul-marinho dos posts do Facebook e dos anúncios do Google: mockup grande, de/por e Pix.
export function AnuncioLateral({ apostila, origem = "blog-lateral" }: { apostila: ApostilaVitrine; origem?: string }) {
  const imagem = imagemDeVitrine(apostila);
  const pct = descontoPercentual(apostila.preco_original_centavos, apostila.preco_centavos);
  const dias = diasAte(apostila.data_prova);
  const href = `/apostilas/${apostila.slug}?utm_source=site&utm_medium=organico&utm_campaign=${origem}`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center overflow-hidden bg-gradient-to-b from-brand-deep via-[#0E3A66] to-brand-deep px-5 pt-5 pb-6 text-center shadow-[0_24px_50px_-28px_rgba(7,27,51,0.8)] transition-transform duration-200 hover:-translate-y-0.5"
    >
      <p className="font-data text-[11px] font-semibold uppercase tracking-wider text-[#5FD3D5]">
        Apostila · {apostila.uf} · {apostila.orgao}
      </p>
      <div className="relative mt-3 h-[230px] w-full">
        {imagem && (
          <Image
            src={imagem.url}
            alt={`Apostila ${apostila.orgao} — ${apostila.cargo}`}
            fill
            sizes="300px"
            className={`transition-transform duration-300 group-hover:scale-105 ${
              imagem.mockup ? "object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,0.45)]" : "object-contain"
            }`}
          />
        )}
        {pct !== null && (
          <span className="absolute right-1 top-1 animate-pulse bg-accent px-2 py-1 font-data text-[13px] font-extrabold text-accent-ink shadow">
            -{pct}%
          </span>
        )}
      </div>
      <h3 className="mt-4 line-clamp-3 font-display text-[17px] font-extrabold leading-snug text-white">{apostila.titulo}</h3>
      {dias !== null && dias >= 0 && (
        <p className="mt-1 font-data text-[11.5px] font-semibold uppercase tracking-wide text-[#5FD3D5]">Prova em {dias} dias</p>
      )}
      <div className="mt-3 flex items-baseline justify-center gap-2">
        {pct !== null && apostila.preco_original_centavos && (
          <span className="text-[14px] text-white/60 line-through">{formatarPreco(apostila.preco_original_centavos)}</span>
        )}
        <span className="font-display text-[2rem] leading-none font-extrabold text-white">{formatarPreco(apostila.preco_centavos)}</span>
      </div>
      <p className="mt-1 text-[13px] font-semibold text-white/80">à vista no Pix · download na hora</p>
      <span className="mt-4 w-full bg-accent px-4 py-2.5 text-[14px] font-extrabold text-accent-ink transition-all group-hover:brightness-110">
        Quero estudar →
      </span>
    </Link>
  );
}
