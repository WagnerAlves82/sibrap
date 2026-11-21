"use client";

// Links da barra da área logada, com o item da página atual destacado.
// "linha": links de texto no computador; "chips": botões roláveis numa 2ª linha no celular.
import Link from "next/link";
import { usePathname } from "next/navigation";

export type LinkAluno = { rotulo: string; href: string };

function ativo(caminho: string, href: string) {
  if (href === "/minha-area") return caminho === "/minha-area" || caminho.startsWith("/minha-area/cursos");
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function NavAluno({ links, modo }: { links: LinkAluno[]; modo: "linha" | "chips" }) {
  const caminho = usePathname() ?? "";
  if (modo === "chips") {
    return (
      <nav aria-label="Área do aluno" className="flex gap-2 overflow-x-auto px-3 pb-2.5 [scrollbar-width:none] sm:px-6">
        {links.map((l) => {
          const sel = ativo(caminho, l.href);
          return (
            <Link
              key={l.href}
              prefetch={false}
              href={l.href}
              aria-current={sel ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap border px-3 py-1.5 text-[13.5px] font-bold transition-colors ${
                sel ? "border-brand bg-brand text-white" : "border-[#C5CFDA] bg-white text-[#33465E] hover:border-brand hover:text-brand"
              }`}
            >
              {l.rotulo}
            </Link>
          );
        })}
      </nav>
    );
  }
  return (
    <nav aria-label="Área do aluno" className="hidden items-center gap-1 text-sm font-semibold md:flex">
      {links.map((l) => {
        const sel = ativo(caminho, l.href);
        return (
          <Link
            key={l.href}
            prefetch={false}
            href={l.href}
            aria-current={sel ? "page" : undefined}
            className={`whitespace-nowrap border-b-[3px] px-2.5 py-2 transition-colors ${
              sel ? "border-accent text-brand" : "border-transparent text-[#33465E] hover:text-brand"
            }`}
          >
            {l.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
