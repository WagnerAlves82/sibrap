import type { Metadata } from "next";
import { FormSolicitacao } from "./FormSolicitacao";
import { TIPOS_SOLICITACAO } from "./tipos";

// Formulário de pedidos especiais (Wagner, 18/11/2026): link compartilhado quando alguém pede algo fora do catálogo.
// Fora do Google; aceita ?tipo=pacote&origem=whatsapp para já vir preenchido.
// Wagner, 18/11/2026: página neutra, fundo branco, sem nada que ligue ao SIBRAP (sem cabeçalho, rodapé, logo ou nome).
export const metadata: Metadata = {
  title: { absolute: "Formulário de solicitação" },
  description: "Descreva o seu pedido.",
  robots: { index: false, follow: false },
  authors: [],
  openGraph: { title: "Formulário de solicitação", description: "Descreva o seu pedido.", siteName: undefined, url: undefined },
  twitter: { title: "Formulário de solicitação", description: "Descreva o seu pedido." },
};

export default async function SolicitacaoPage({ searchParams }: { searchParams: Promise<{ tipo?: string; origem?: string }> }) {
  const sp = await searchParams;
  const tipo = TIPOS_SOLICITACAO.some((t) => t.valor === sp.tipo) ? sp.tipo : undefined;
  const origem = sp.origem?.replace(/[^\w-]/g, "").slice(0, 60) || undefined;
  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-12 sm:px-6">
        <p className="font-data text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
          Pedido especial
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-zinc-900 sm:text-4xl">Conte o que você precisa</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-zinc-600">
          Descreva o seu pedido com o máximo de detalhes. A resposta chega no seu e-mail em até 2 dias úteis.
        </p>
        <div className="mt-7">
          <FormSolicitacao tipoInicial={tipo} origem={origem} />
        </div>
      </main>
    </div>
  );
}
