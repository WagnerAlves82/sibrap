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
  const linkRodape = "text-white/70 transition-colors hover:text-white";
  const rotuloColuna = "font-data text-[11px] font-semibold uppercase tracking-wide text-accent";

  return (
    <footer className="bg-brand-deep text-white">
      <div className="mx-auto max-w-[1180px] px-6 py-12 sm:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:gap-10">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-xl font-extrabold tracking-tight text-white">SIBRAP</p>
            <p className="mt-1 text-[12.5px] text-white/55">Sistema Brasileiro de Aprendizagem Profissional</p>
            <p className="mt-4 max-w-[36ch] text-[13px] leading-relaxed text-white/70">
              Apostilas e cursos gratuitos pra quem estuda pra concurso público — direto ao ponto do edital.
            </p>
          </div>

          <div>
            <p className={rotuloColuna}>Estudar</p>
            <ul className="mt-3 flex flex-col gap-2.5 text-[13.5px]">
              <li>
                <Link href="/apostilas" className={linkRodape}>
                  Apostilas
                </Link>
              </li>
              <li>
                <Link href="/blog" className={linkRodape}>
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/cursos" className={linkRodape}>
                  Cursos gratuitos
                </Link>
              </li>
              <li>
                <Link href="/validar" className={linkRodape}>
                  Validar certificado
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={rotuloColuna}>Institucional</p>
            <ul className="mt-3 flex flex-col gap-2.5 text-[13.5px]">
              <li>
                <Link href="/login" className={linkRodape}>
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/termos" className={linkRodape}>
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className={linkRodape}>
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className={rotuloColuna}>Selo</p>
            <div className="mt-3 inline-flex rounded-lg bg-white px-3.5 py-3">
              <SeloAbed altura={40} fonteLegenda="9.5px" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {EMISSOR.nome}
          </p>
          <p>Material de estudo independente, sem vínculo com bancas ou órgãos públicos.</p>
        </div>
      </div>
    </footer>
  );
}
