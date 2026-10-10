import Image from "next/image";
import Link from "next/link";
import { formatarPreco, imagemDeVitrine, type ApostilaVitrine } from "@/lib/apostilas";

// Vitrine do fim do post (só quando há apostila pronta para aquele edital):
// capa, título, tamanho do material, preço no Pix e botão de compra. Não
// anuncia parcelamento no cartão, porque hoje a venda é só por PIX.
function tituloOrgao(a: ApostilaVitrine): string {
  const uf = a.uf ? `-${a.uf}` : "";
  if (/^prefeitura/i.test(a.orgao) && a.cidade) return `Prefeitura de ${a.cidade}${uf}`;
  return `${a.orgao.replace(/\s*\([^)]*\)\s*/g, " ").trim()}${uf}`;
}

export function GarantaPreparacao({
  apostilas,
  origem = "blog-post-fim",
}: {
  apostilas: ApostilaVitrine[];
  origem?: string;
}) {
  if (apostilas.length === 0) return null;
  return (
    <section
      aria-labelledby="garanta-preparacao"
      className="mt-10 rounded-2xl border border-accent/40 bg-gradient-to-br from-brand-deep via-brand to-brand-deep p-5 shadow-[0_24px_50px_-28px_rgba(7,27,51,0.8)] sm:p-7"
    >
      <div className="flex items-center gap-3">
        <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-accent" fill="currentColor">
          <path d="M12 3 1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3Zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9ZM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72Z" />
        </svg>
        <h2 id="garanta-preparacao" className="font-display text-[1.5rem] leading-tight font-extrabold text-white">
          Garanta sua preparação
        </h2>
      </div>
      <div className="mt-3 h-px w-full bg-gradient-to-r from-accent via-accent/40 to-transparent" />

      <ul className="mt-5 flex flex-col gap-4">
        {apostilas.map((a) => {
          const imagem = imagemDeVitrine(a);
          const href = `/apostilas/${a.slug}?utm_source=site&utm_medium=organico&utm_campaign=${origem}`;
          return (
            <li key={a.id} className="flex flex-col items-center gap-4 rounded-xl bg-white p-4 text-center shadow-sm sm:flex-row sm:items-start sm:gap-5 sm:text-left">
              <Link href={href} className="relative h-[230px] w-[165px] shrink-0 sm:h-[168px] sm:w-[120px]" aria-label={`Ver apostila ${a.titulo}`}>
                {imagem && (
                  <Image
                    src={imagem.url}
                    alt={`Apostila ${a.orgao} — ${a.cargo}`}
                    fill
                    sizes="(min-width: 640px) 120px, 165px"
                    className={imagem.mockup ? "object-contain drop-shadow-[0_10px_12px_rgba(11,42,74,0.3)]" : "rounded object-cover"}
                  />
                )}
              </Link>
              <div className="w-full min-w-0 flex-1">
                <h3 className="font-display text-[1.1rem] leading-snug font-extrabold text-brand sm:text-[1.2rem]">
                  <Link href={href} className="hover:underline">
                    {a.cargo} - {tituloOrgao(a)}
                  </Link>
                </h3>
                <p className="mt-1 text-[15px] leading-snug font-semibold text-[#14213A]">
                  Volume completo
                  {a.paginas ? ` - ${a.paginas} páginas` : ""} - Apostila Digital
                </p>
                <p className="mt-1 text-[13px] leading-snug font-semibold text-[#8A96A5]">
                  Leitura no computador, tablet, celular e ainda pode imprimir
                </p>
                <p className="text-[13px] leading-snug font-semibold text-[#8A96A5]">
                  Baixe pelo site na hora, após a confirmação do <span className="text-[#0F8B8D]">PIX</span>
                </p>
                <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5 sm:justify-start">
                  {a.preco_original_centavos && a.preco_original_centavos > a.preco_centavos && (
                    <span className="text-[13px] text-[#8A96A5] line-through">{formatarPreco(a.preco_original_centavos)}</span>
                  )}
                  <span className="font-display text-[1.35rem] leading-none font-extrabold text-brand">
                    {formatarPreco(a.preco_centavos)}
                  </span>
                  <span className="text-[14px] font-semibold text-[#14213A]">à vista no Pix</span>
                </p>
                <Link
                  href={href}
                  className="mt-3 block w-full rounded-md bg-accent px-5 py-3 text-center text-[15px] font-bold text-accent-ink transition-colors hover:brightness-110 sm:inline-block sm:w-auto"
                >
                  Comprar - Apostila Digital
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
