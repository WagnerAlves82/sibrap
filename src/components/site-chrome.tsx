import Image from "next/image";
import Link from "next/link";
import { SeloAbed } from "@/components/selo-abed";
import { sairDaConta } from "@/app/login/actions";
import { EMISSOR } from "@/lib/emissor";

export function CabecalhoSite({ logado, next }: { logado: boolean; next?: string }) {
  const itemNav = "px-1.5 py-2 sm:px-2 text-[#33465E] transition-colors hover:text-brand";
  return (
    <header className="border-b-[3px] border-accent bg-white">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6">
        <Link href="/" aria-label="SIBRAP — página inicial" className="shrink-0">
          <Image
            src="/logo-sibrap.png"
            alt="SIBRAP — Sistema Brasileiro de Aprendizagem Profissional"
            width={707}
            height={154}
            priority
            className="h-7 w-auto min-[400px]:h-9 sm:h-12"
          />
        </Link>

        <nav className="flex min-w-0 items-center gap-0 text-[13px] font-semibold whitespace-nowrap sm:gap-3 sm:text-sm">
          <Link href="/apostilas" className={itemNav}>
            Apostilas
          </Link>
          <Link href="/blog" className={`${logado ? "hidden sm:inline" : ""} ${itemNav}`}>
            Blog
          </Link>
          <Link href="/cursos" className={`hidden md:inline ${itemNav}`}>
            Cursos gratuitos
          </Link>
          <Link href="/validar" className={`hidden lg:inline ${itemNav}`}>
            Validar certificado
          </Link>
          <Link
            href={logado ? "/minha-area" : next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="ml-1 rounded-md bg-brand px-3 py-2 sm:px-4 text-white transition-colors hover:brightness-125"
          >
            {logado ? "Minha Área" : "Entrar"}
          </Link>
          {logado && (
            <form action={sairDaConta}>
              <button type="submit" className="px-1.5 py-2 sm:px-2 text-[#516278] underline-offset-4 hover:text-brand hover:underline">
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

  return (
    <footer className="relative overflow-hidden border-t-[3px] border-accent bg-gradient-to-br from-brand to-brand-deep text-white">
      <Image
        src="/logo.png"
        alt=""
        aria-hidden
        width={520}
        height={520}
        className="pointer-events-none absolute -right-16 -bottom-20 h-[280px] w-[280px] opacity-[0.07] sm:h-[360px] sm:w-[360px]"
      />

      <div className="relative mx-auto max-w-[1180px] px-6 py-12 sm:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:gap-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="" aria-hidden width={40} height={40} className="h-9 w-9 rounded-full" />
              <p className="font-display text-xl font-extrabold tracking-tight text-white">SIBRAP</p>
            </div>
            <p className="mt-2 text-[12.5px] text-white/55">Sistema Brasileiro de Aprendizagem Profissional</p>
            <p className="mt-4 max-w-[36ch] text-[13px] leading-relaxed text-white/70">
              Apostilas e cursos gratuitos pra quem estuda pra concurso público — direto ao ponto do edital.
            </p>
          </div>

          <div>
            <p className="flex items-center gap-1.5 font-data text-[11px] font-semibold uppercase tracking-wide text-accent">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
              Estudar
            </p>
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
            <p className="flex items-center gap-1.5 font-data text-[11px] font-semibold uppercase tracking-wide text-accent-2">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Institucional
            </p>
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
            <div className="inline-flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-data text-[11px] font-semibold uppercase tracking-wide text-white/55">Selo</p>
              <div className="inline-flex rounded-lg bg-white px-3.5 py-3">
                <SeloAbed altura={40} fonteLegenda="9.5px" />
              </div>
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
