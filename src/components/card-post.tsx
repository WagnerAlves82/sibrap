import Image from "next/image";
import Link from "next/link";
import { formatarDataLonga, resumoAutomatico, urlCapa, type PostVitrine } from "@/lib/blog";

export function CardPost({ post }: { post: PostVitrine }) {
  const capa = urlCapa(post.capa_path);
  const data = formatarDataLonga(post.publicado_em ?? post.criado_em);
  const resumo = post.resumo || resumoAutomatico(post.conteudo);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#D7DEE6] bg-white transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.35)]"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-b from-[#E6EEF7] to-[#F6F9FC]">
        {capa ? (
          <Image
            src={capa}
            alt={post.titulo}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center font-display text-lg font-extrabold text-brand">
            {post.categoria}
          </div>
        )}
        {(post.uf || post.regiao) && (
          <span className="absolute left-2 top-2 rounded bg-brand px-2 py-1 font-data text-[10.5px] font-semibold text-white shadow">
            {post.uf ?? post.regiao}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <p className="font-data text-[11px] font-semibold uppercase tracking-wide text-accent-2">
          {post.categoria}
          {data ? ` · ${data}` : ""}
        </p>
        <h3 className="line-clamp-2 font-display text-[15px] font-extrabold leading-snug text-[#14213A] sm:text-[16.5px]">
          {post.titulo}
        </h3>
        <p className="line-clamp-2 text-[12.5px] text-[#516278]">{resumo}</p>
        <span className="mt-auto pt-3 text-[12.5px] font-bold text-brand">Ler mais →</span>
      </div>
    </Link>
  );
}
