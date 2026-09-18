import Link from "next/link";
import { Logo } from "@/components/logo";
import { SeloAbed } from "@/components/selo-abed";
import { sairDaConta } from "@/app/login/actions";
import { EMISSOR } from "@/lib/emissor";

export function CabecalhoSite({ logado }: { logado: boolean }) {
  return (
    <header className="border-b-[3px] border-accent bg-brand text-white">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" aria-label="Página inicial do SIBRAP">
          <Logo tamanho={40} textoClassName="text-white" />
        </Link>

        <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-5">
          <Link href="/cursos" className="hidden px-2 py-2 text-[#DCE6F0] hover:text-white sm:inline">
            Cursos gratuitos
          </Link>
          <Link href="/validar" className="hidden px-2 py-2 text-[#DCE6F0] hover:text-white sm:inline">
            Validar certificado
          </Link>
          <Link
            href={logado ? "/minha-area" : "/login"}
            className="rounded-md border-[1.5px] border-white/40 px-4 py-2 text-white transition-colors hover:bg-white/10"
          >
            {logado ? "Minha Área" : "Entrar"}
          </Link>
          {logado && (
            <form action={sairDaConta}>
              <button type="submit" className="px-2 py-2 text-[#B9CBDF] underline-offset-4 hover:text-white hover:underline">
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
          <Link href="/cursos" className="hover:text-brand">
            Cursos gratuitos
          </Link>
          <Link href="/validar" className="hover:text-brand">
            Validar certificado
          </Link>
        </span>
      </div>
    </footer>
  );
}
