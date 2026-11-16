import Image from "next/image";
import Link from "next/link";
import { diasAte, formatarPreco, imagemDeVitrine, type ApostilaVitrine } from "@/lib/apostilas";

// Faixa de venda no meio da matéria, só quando existe apostila do próprio concurso (pedido do Wagner, 16/11/2026):
// a maior parte dos leitores não chega ao fim do texto, onde fica o bloco "Garanta sua preparação".
export function FaixaApostilaMateria({ apostila, origem = "blog-post-meio" }: { apostila: ApostilaVitrine; origem?: string }) {
  const imagem = imagemDeVitrine(apostila);
  const dias = diasAte(apostila.data_prova);
  const href = `/apostilas/${apostila.slug}?utm_source=site&utm_medium=organico&utm_campaign=${origem}`;
  return (
    <aside aria-label="Apostila deste concurso" className="my-8">
      <Link
        href={href}
        className="group flex items-center gap-4 border-l-4 border-accent bg-gradient-to-r from-brand-deep via-[#0E3A66] to-brand-deep p-4 shadow-[0_20px_40px_-26px_rgba(7,27,51,0.8)] sm:gap-5 sm:p-5"
      >
        {imagem && (
          <span className="relative h-[120px] w-[86px] shrink-0 sm:h-[140px] sm:w-[100px]">
            <Image
              src={imagem.url}
              alt={`Apostila ${apostila.orgao} — ${apostila.cargo}`}
              fill
              sizes="100px"
              className="object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-105"
            />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-data text-[11px] font-semibold uppercase tracking-wider text-[#5FD3D5]">
            Apostila deste concurso{dias !== null && dias >= 0 ? ` · prova em ${dias} dias` : ""}
          </span>
          <span className="mt-1 block font-display text-[17px] font-extrabold leading-snug text-white sm:text-[20px]">
            {apostila.titulo} · {apostila.orgao.replace(/\s*[—–(].*$/, "")}
          </span>
          <span className="mt-1 block text-[13.5px] leading-snug text-white/80">
            PDF pelo edital, exercícios comentados e simulado online.
          </span>
          <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-display text-[1.45rem] font-extrabold leading-none text-white">{formatarPreco(apostila.preco_centavos)}</span>
            <span className="bg-accent px-4 py-2 text-[13.5px] font-extrabold text-accent-ink transition-all group-hover:brightness-110">
              Ver a apostila →
            </span>
          </span>
        </span>
      </Link>
    </aside>
  );
}
