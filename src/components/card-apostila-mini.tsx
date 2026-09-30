import Image from "next/image";
import Link from "next/link";
import { formatarPreco, imagemDeVitrine, type ApostilaVitrine } from "@/lib/apostilas";

// Versão discreta para o fim dos posts: miniatura, título, órgão e preço em
// uma linha só.
export function CardApostilaMini({ apostila }: { apostila: ApostilaVitrine }) {
  const imagem = imagemDeVitrine(apostila);
  return (
    <Link
      href={`/apostilas/${apostila.slug}`}
      className="group flex items-center gap-3 rounded-lg border border-[#E3E9F0] bg-white p-2 transition-colors hover:border-brand"
    >
      <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-[#E6EEF7]">
        {imagem && (
          <Image
            src={imagem.url}
            alt={`Apostila ${apostila.orgao} — ${apostila.cargo}`}
            fill
            sizes="44px"
            className={imagem.mockup ? "object-contain p-0.5" : "object-cover"}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] leading-snug font-semibold text-[#14213A]">{apostila.titulo}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-[#516278]">
          {apostila.orgao} · {formatarPreco(apostila.preco_centavos)}
        </p>
      </div>
      <span aria-hidden className="shrink-0 pr-1 text-[12px] font-bold text-brand group-hover:underline">
        Ver →
      </span>
    </Link>
  );
}
