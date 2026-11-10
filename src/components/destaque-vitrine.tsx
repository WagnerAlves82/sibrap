import Image from "next/image";
import Link from "next/link";
import { formatarPreco, imagemDeVitrine, maxParcelas, PARCELAMENTO, textoParcela, type ApostilaVitrine } from "@/lib/apostilas";
import type { DestaqueVitrine } from "@/lib/destaques-vitrine";

// Card de linha inteira na vitrine: mockup à esquerda, preço e chamada no meio,
// depoimento real (quando houver) ou exemplo da correção / números à direita.
export function CardDestaqueVitrine({ destaque, apostila }: { destaque: DestaqueVitrine; apostila: ApostilaVitrine }) {
  const imagem = imagemDeVitrine(apostila);
  const { cores } = destaque;
  const parcelas = PARCELAMENTO.ativo ? maxParcelas(apostila.preco_centavos) : 1;

  return (
    <Link
      href={`/apostilas/${apostila.slug}`}
      className="group col-span-full grid min-w-0 grid-cols-1 overflow-hidden shadow-[0_24px_50px_-28px_rgba(11,42,74,0.55)] md:grid-cols-[0.8fr_1.25fr_1fr]"
      style={{ background: cores.fundo, color: cores.texto }}
    >
      <div className="relative flex items-center justify-center px-6 pt-6 md:py-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(circle at 50% 55%, rgba(255,255,255,0.28) 0%, transparent 62%)" }}
        />
        {imagem && (
          <Image
            src={imagem.url}
            alt={`Apostila ${apostila.orgao} — ${apostila.cargo}`}
            width={420}
            height={560}
            sizes="(min-width: 768px) 260px, 200px"
            className="relative h-auto max-h-[300px] w-auto max-w-[200px] object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.03] md:max-w-[240px]"
          />
        )}
      </div>

      <div className="flex flex-col justify-center gap-3 px-5 py-6 sm:px-7">
        <span
          className="w-fit px-2 py-1 font-data text-[11px] font-bold uppercase tracking-wide"
          style={{ background: cores.destaque, color: cores.destaqueTexto }}
        >
          {destaque.selo}
        </span>
        <h3 className="font-display text-[1.45rem] font-extrabold leading-tight sm:text-[1.8rem]">{destaque.titulo}</h3>
        <p className="max-w-[48ch] text-[14.5px] leading-relaxed" style={{ color: cores.suave }}>
          {destaque.descricao}
        </p>
        <ul className="flex flex-col gap-1 text-[13.5px] font-semibold">
          {destaque.beneficios.map((b) => (
            <li key={b} className="flex gap-2">
              <span aria-hidden style={{ color: cores.destaque }}>✓</span>
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-1 flex flex-wrap items-end gap-4">
          <div>
            {apostila.preco_original_centavos && apostila.preco_original_centavos > apostila.preco_centavos && (
              <p className="text-[12.5px] line-through" style={{ color: cores.suave }}>
                {formatarPreco(apostila.preco_original_centavos)}
              </p>
            )}
            <p className="font-data text-[1.9rem] font-bold leading-none">{formatarPreco(apostila.preco_centavos)}</p>
            {parcelas > 1 && (
              <p className="mt-1 text-[12.5px]" style={{ color: cores.suave }}>
                ou {textoParcela(apostila.preco_centavos, parcelas)}
              </p>
            )}
          </div>
          <span
            className="px-5 py-3 text-[14.5px] font-bold transition-[filter] group-hover:brightness-95"
            style={{ background: cores.destaque, color: cores.destaqueTexto }}
          >
            Ver a apostila →
          </span>
        </div>
      </div>

      <div className="flex items-center px-5 pb-6 sm:px-7 md:py-6 md:pl-0">
        <PainelDireito destaque={destaque} />
      </div>
    </Link>
  );
}

function PainelDireito({ destaque }: { destaque: DestaqueVitrine }) {
  const { cores, depoimento, painel } = destaque;

  if (depoimento) {
    return (
      <figure className="w-full border-l-4 bg-white/10 p-5" style={{ borderColor: cores.destaque }}>
        <blockquote className="text-[15px] italic leading-relaxed">“{depoimento.texto}”</blockquote>
        <figcaption className="mt-3 text-[12.5px] font-semibold" style={{ color: cores.suave }}>
          {depoimento.autor}
        </figcaption>
      </figure>
    );
  }

  if (painel.tipo === "numeros") {
    return (
      <div className="grid w-full grid-cols-3 gap-2">
        {painel.itens.map((i) => (
          <div key={i.t} className="bg-white/10 px-2 py-4 text-center">
            <p className="font-data text-[2rem] font-bold leading-none" style={{ color: cores.destaque }}>
              {i.n}
            </p>
            <p className="mt-1.5 text-[12px] leading-tight" style={{ color: cores.suave }}>
              {i.t}
            </p>
          </div>
        ))}
      </div>
    );
  }

  const marca = (fundo: string, borda: string) => ({ background: fundo, borderBottom: `2px solid ${borda}` });
  return (
    <div className="w-full bg-white text-[#14213A] shadow-[0_14px_30px_rgba(0,0,0,0.35)]">
      <p className="flex items-center justify-between bg-[#F1F4F8] px-3 py-1.5 font-data text-[10px] font-bold uppercase tracking-wide text-[#516278]">
        <span>Exemplo de correção</span>
        <span className="bg-[#0B2A4A] px-1.5 py-0.5 text-white">{painel.nota}</span>
      </p>
      <p className="px-3 pt-2.5 font-serif text-[12.5px] leading-[1.85]">
        Com o crescimento desordenado das cidades, <span style={marca("#FBD9D9", "#C0392B")}>aumentou-se os índices</span> de
        violência, <span style={marca("#D8E6FB", "#2F6DB5")}>e isso dificulta</span> o policiamento.
      </p>
      <div className="flex flex-col gap-1 p-3 text-[11px] text-[#33465E]">
        <p className="border-l-[3px] border-[#C0392B] bg-[#F6F8FA] px-2 py-1">
          <b>Concordância:</b> aumentaram os índices
        </p>
        <p className="border-l-[3px] border-[#2F6DB5] bg-[#F6F8FA] px-2 py-1">
          <b>Coesão:</b> nomeie a ideia retomada
        </p>
      </div>
    </div>
  );
}
