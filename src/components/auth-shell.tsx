import Link from "next/link";
import { Logo } from "@/components/logo";

// Layout meio a meio das telas de login/cadastro: foto + mensagem à
// esquerda (só em telas grandes), formulário à direita. A foto é
// public/login-hero.jpg; se ainda não existir, fica só o degradê navy.
export function AuthShell({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-white font-body lg:grid-cols-2">
      <aside
        className="relative hidden flex-col justify-between bg-brand-deep p-12 text-white lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(7,27,51,0.55) 0%, rgba(7,27,51,0.92) 100%), url(/login-hero.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Link href="/" aria-label="Página inicial do SIBRAP">
          <Logo tamanho={44} textoClassName="text-white" />
        </Link>

        <div>
          <p className="font-data text-xs uppercase tracking-[0.2em] text-[#B9CBDF]">
            Sistema Brasileiro de Aprendizagem Profissional
          </p>
          <p className="mt-4 max-w-[16ch] font-display text-5xl font-extrabold leading-[1.05]">
            Educação que transforma vidas e o futuro.
          </p>
          <ul className="mt-8 flex flex-col gap-2.5 text-[15px] text-[#DCE6F0]">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Cursos gratuitos para quem mais precisa
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Certificado com QR Code de validação
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Estude no seu ritmo, pelo celular
            </li>
          </ul>
        </div>

        <p className="text-xs text-[#93A0AF]">sibrap.tec.br</p>
      </aside>

      <div className="flex flex-col">
        <div className="border-b-[3px] border-accent bg-brand px-6 py-4 lg:hidden">
          <Link href="/" aria-label="Página inicial do SIBRAP">
            <Logo tamanho={36} textoClassName="text-white" />
          </Link>
          <p className="mt-2 text-[13px] text-[#B9CBDF]">
            Educação que transforma vidas e o futuro.
          </p>
        </div>

        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-3xl font-extrabold text-[#14213A]">
              {titulo}
            </h1>
            {subtitulo && (
              <p className="mt-2 mb-8 text-[15px] leading-relaxed text-[#516278]">
                {subtitulo}
              </p>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export const CLASSE_INPUT =
  "w-full rounded-lg border border-[#C4CEDA] bg-white px-4 py-3 text-[15px] text-[#14213A] outline-none transition-colors placeholder:text-[#93A0AF] focus:border-brand focus:ring-2 focus:ring-brand/15";

export const CLASSE_BOTAO_PRIMARIO =
  "w-full rounded-lg bg-accent px-5 py-3.5 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105 disabled:opacity-60";
