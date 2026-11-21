import Image from "next/image";
import Link from "next/link";
import { MenuCursos } from "@/components/menu-cursos";
import { BotaoSair } from "@/components/botao-sair";
import { NavAluno, type LinkAluno } from "@/components/nav-aluno";
import { dadosBarraAluno } from "@/lib/aluno";

// Barra da área logada (Wagner, 21/11/2026): diferente da do site, sem busca, com os atalhos do aluno,
// a foto e o primeiro nome. No celular os atalhos viram botões roláveis numa 2ª linha.
export async function BarraAluno() {
  const d = await dadosBarraAluno();
  const links: LinkAluno[] = [
    { rotulo: "Meus cursos", href: "/minha-area" },
    { rotulo: "Certificados", href: "/minha-area/certificados" },
    ...(d?.temRedacao ? [{ rotulo: "Redação", href: "/minha-area/redacao" }] : []),
    { rotulo: "Meus dados", href: "/minha-area/meus-dados" },
  ];
  const inicial = (d?.nome || "A")[0];

  return (
    <header className="border-b-[3px] border-accent bg-white">
      <div className="mx-auto flex max-w-[1180px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6">
        <MenuCursos />
        <Link href="/minha-area" aria-label="SIBRAP — minha área" className="shrink-0">
          <Image
            src="/logo-sibrap.png"
            alt="SIBRAP — Sistema Brasileiro de Aprendizagem Profissional"
            width={707}
            height={154}
            priority
            className="h-7 w-auto min-[400px]:h-9 sm:h-11"
          />
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <NavAluno links={links} modo="linha" />
          <Link
            prefetch={false}
            href="/minha-area/meus-dados"
            title="Meus dados"
            className="ml-1 flex items-center gap-2 py-1 pl-1 pr-1.5 text-[14px] font-bold text-[#14213A] hover:text-brand"
          >
            {d?.foto ? (
              // foto do aluno (até 50 KB) no bucket público 'avatares'
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.foto} alt="" width={34} height={34} className="h-[34px] w-[34px] rounded-full border-2 border-accent object-cover" />
            ) : (
              <span aria-hidden className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand font-display text-[15px] font-extrabold text-white">
                {inicial}
              </span>
            )}
            <span className="hidden max-w-[110px] truncate sm:inline">{d?.nome || "Aluno"}</span>
          </Link>
          <BotaoSair />
        </div>
      </div>
      {/* celular: sem 2ª linha de botões; os atalhos viraram sanfonas na Minha área (Wagner, 21/11/2026) */}
    </header>
  );
}
