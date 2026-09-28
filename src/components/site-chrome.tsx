import Image from "next/image";
import Link from "next/link";
import { SeloAbed } from "@/components/selo-abed";
import { sairDaConta } from "@/app/login/actions";
import { EMISSOR } from "@/lib/emissor";

export function CabecalhoSite({ logado }: { logado: boolean }) {
  const itemNav = "px-2 py-2 text-[#33465E] transition-colors hover:text-brand";
  return (
    <header className="border-b-[3px] border-accent bg-white">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link href="/" aria-label="SIBRAP — página inicial" className="shrink-0">
          <Image
            src="/logo-sibrap.png"
            alt="SIBRAP — Sistema Brasileiro de Aprendizagem Profissional"
            width={707}
            height={154}
            priority
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav className="flex items-center gap-0.5 text-sm font-semibold sm:gap-3">
          <Link href="/apostilas" className={itemNav}>
            Apostilas
          </Link>
          <Link href="/blog" className={itemNav}>
            Blog
          </Link>
          <Link href="/cursos" className={`hidden md:inline ${itemNav}`}>
            Cursos gratuitos
          </Link>
          <Link href="/validar" className={`hidden lg:inline ${itemNav}`}>
            Validar certificado
          </Link>
          <Link
            href={logado ? "/minha-area" : "/login"}
            className="ml-1 rounded-md bg-brand px-4 py-2 text-white transition-colors hover:brightness-125"
          >
            {logado ? "Minha Área" : "Entrar"}
          </Link>
          {logado && (
            <form action={sairDaConta}>
              <button type="submit" className="px-2 py-2 text-[#516278] underline-offset-4 hover:text-brand hover:underline">
                Sair
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}

export function RodapeSite() {
  return (
    <footer className="border-t border-[#D7DEE6] bg-white py-8">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-6 text-[12.5px] text-[#516278]">
        <span className="flex flex-wrap items-center gap-4">
          <SeloAbed altura={56} />
          <span>
            © {new Date().getFullYear()} {EMISSOR.nome} · CNPJ {EMISSOR.cnpj}
          </span>
        </span>
        <span className="flex gap-4">
          <Link href="/apostilas" className="hover:text-brand">
            Apostilas
          </Link>
          <Link href="/blog" className="hover:text-brand">
            Blog
          </Link>
          <Link href="/cursos" className="hover:text-brand">
            Cursos gratuitos
          </Link>
          <Link href="/validar" className="hover:text-brand">
            Validar certificado
          </Link>
          <Link href="/termos" className="hover:text-brand">
            Termos
          </Link>
          <Link href="/privacidade" className="hover:text-brand">
            Privacidade
          </Link>
        </span>
      </div>
    </footer>
  );
}
