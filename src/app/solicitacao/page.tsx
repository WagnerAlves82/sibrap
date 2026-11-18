import type { Metadata } from "next";
import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { FormSolicitacao } from "./FormSolicitacao";
import { TIPOS_SOLICITACAO } from "./tipos";

// Formulário de pedidos especiais (Wagner, 18/11/2026): link compartilhado quando alguém pede algo fora do catálogo.
// Fora do Google; aceita ?tipo=pacote&origem=whatsapp para já vir preenchido.
export const metadata: Metadata = {
  title: "Faça a sua solicitação",
  description: "Peça um pacote, um curso, um certificado especial ou um treinamento para a sua empresa.",
  robots: { index: false, follow: false },
};

export default async function SolicitacaoPage({ searchParams }: { searchParams: Promise<{ tipo?: string; origem?: string }> }) {
  const sp = await searchParams;
  const tipo = TIPOS_SOLICITACAO.some((t) => t.valor === sp.tipo) ? sp.tipo : undefined;
  const origem = sp.origem?.replace(/[^\w-]/g, "").slice(0, 60) || undefined;
  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite />
      <main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-12 sm:px-6">
        <p className="inline-block border-l-4 border-accent pl-3 font-data text-[13px] font-semibold uppercase tracking-wider text-accent-2">
          Pedido especial
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-[#14213A] sm:text-4xl">Conte o que você precisa</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#516278]">
          Pacote de cursos, certificado diferente, curso novo ou treinamento para a sua equipe. Descreva aqui e a gente responde em até 2 dias úteis.
        </p>
        <div className="mt-7">
          <FormSolicitacao tipoInicial={tipo} origem={origem} />
        </div>
      </main>
      <RodapeSite />
    </div>
  );
}
