import Link from "next/link";
import { CapaImagem } from "@/components/capa-imagem";
import { capaDoPost, formatarDataLonga, type PostVitrine } from "@/lib/blog";

// Coluna lateral das Notícias: listas curtas (miniatura, título e data) que sugerem o próximo clique,
// com um destaque no hover (faixa dourada, miniatura que aproxima e título que muda de cor).
export function BlocoNoticias({ titulo, posts }: { titulo: string; posts: PostVitrine[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-label={titulo} className="overflow-hidden rounded-xl border border-[#D7DEE6] bg-white shadow-[0_18px_40px_-30px_rgba(11,42,74,0.45)]">
      <h2 className="bg-accent px-4 py-2.5 text-center font-display text-[13px] font-extrabold uppercase tracking-wide text-accent-ink">
        {titulo}
      </h2>
      <ul className="divide-y divide-[#EDF1F6]">
        {posts.map((p) => {
          const capa = capaDoPost(p);
          const data = formatarDataLonga(p.publicado_em ?? p.criado_em);
          return (
            <li key={p.id}>
              <Link
                href={`/noticias/${p.slug}`}
                className="group flex gap-3 border-l-4 border-transparent px-3 py-3 transition-all duration-200 hover:border-accent hover:bg-[#F4F8FD] hover:pl-4"
              >
                <span className="relative h-[68px] w-[92px] shrink-0 overflow-hidden rounded-md bg-gradient-to-b from-[#E6EEF7] to-[#F6F9FC]">
                  {capa && (
                    <CapaImagem
                      src={capa}
                      alt=""
                      sizes="92px"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      fallback={null}
                    />
                  )}
                  {(p.uf || p.regiao) && (
                    <span className="absolute left-1 top-1 rounded bg-brand px-1.5 py-0.5 font-data text-[9.5px] font-semibold text-white">
                      {p.uf ?? p.regiao}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-3 block font-display text-[13.5px] font-bold leading-snug text-[#14213A] transition-colors group-hover:text-brand">
                    {p.titulo}
                  </span>
                  {data && (
                    <span className="mt-1 flex items-center gap-1 font-data text-[10.5px] font-semibold uppercase tracking-wide text-accent-2">
                      {data}
                      <span aria-hidden className="translate-x-0 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                        →
                      </span>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
