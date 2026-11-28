import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { emailDoLink, estaDescadastrado } from "@/lib/descadastro";
import { confirmarDescadastroAction, desfazerDescadastroAction } from "./actions";

export const metadata: Metadata = { title: "Parar de receber e-mails", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ocultar = (email: string) => email.replace(/^(.{2}).*(@.*)$/, "$1***$2");

// Página do link "parar de receber" dos e-mails (LGPD, art. 18). Pede um clique de confirmação para que
// verificadores de link dos provedores de e-mail não descadastrem ninguém sozinhos.
export default async function DescadastrarPage({ searchParams }: { searchParams: Promise<{ e?: string; t?: string; ok?: string; volta?: string }> }) {
  const { e, t, ok, volta } = await searchParams;
  const email = emailDoLink(e, t);
  const jaSaiu = email ? await estaDescadastrado(email) : false;
  const botao = "px-6 py-3 text-[15px] font-bold transition-colors";

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite />
      <main className="mx-auto w-full max-w-[560px] flex-1 px-6 py-14">
        {!email ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-[#14213A]">Link inválido</h1>
            <p className="mt-2 text-[15px] text-[#516278]">
              Use o link do rodapé do e-mail que você recebeu, ou peça o descadastro em{" "}
              <Link href="/contato" className="font-bold text-brand underline">Contato</Link>.
            </p>
          </>
        ) : volta ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-[#14213A]">Pronto, você voltou a receber 🎉</h1>
            <p className="mt-2 text-[15px] text-[#516278]">Os avisos e ofertas do SIBRAP voltam a chegar em {ocultar(email)}.</p>
          </>
        ) : ok || jaSaiu ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-[#14213A]">Descadastro confirmado</h1>
            <p className="mt-2 text-[15px] text-[#516278]">
              {ocultar(email)} não vai mais receber lembretes, ofertas e campanhas do SIBRAP. E-mails sobre suas compras
              (pagamento, entrega e certificado) continuam chegando.
            </p>
            <form action={desfazerDescadastroAction} className="mt-6">
              <input type="hidden" name="e" value={e} />
              <input type="hidden" name="t" value={t} />
              <button type="submit" className={`${botao} border-[1.5px] border-brand text-brand hover:bg-brand/5`}>
                Foi engano, quero continuar recebendo
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-extrabold text-[#14213A]">Parar de receber e-mails?</h1>
            <p className="mt-2 text-[15px] text-[#516278]">
              {ocultar(email)} deixa de receber lembretes, ofertas e campanhas do SIBRAP. E-mails sobre suas compras continuam
              chegando.
            </p>
            <form action={confirmarDescadastroAction} className="mt-6">
              <input type="hidden" name="e" value={e} />
              <input type="hidden" name="t" value={t} />
              <button type="submit" className={`${botao} bg-[#0B2A4A] text-white hover:brightness-110`}>
                Confirmar descadastro
              </button>
            </form>
          </>
        )}
      </main>
      <RodapeSite />
    </div>
  );
}
