import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { dadosCartaoCompra } from "@/lib/cartao-transparente";
import { PagarTeste } from "./PagarTeste";

export const metadata: Metadata = { title: "Teste do cartão", robots: { index: false, follow: false } };

// Página escondida (só pelo link) para testar o cartão em produção com R$ 1,00 (26/11/2026).
export default async function TesteCartaoPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/minha-area/teste-cartao")}`);
  const cartao = dadosCartaoCompra("teste-cartao", user);

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite aluno logado />
      <main className="mx-auto w-full max-w-[520px] flex-1 px-6 py-12">
        <h1 className="font-display text-2xl font-extrabold text-[#14213A]">Teste do cartão: R$ 1,00</h1>
        <p className="mt-2 text-[15px] text-[#516278]">Cobrança real de R$ 1,00 só para conferir se o cartão está sendo aprovado.</p>
        <div className="mt-6">
          {cartao ? <PagarTeste cartao={cartao} /> : <p className="text-[15px] text-[#B42318]">Cartão desligado no site (sem chave pública).</p>}
        </div>
      </main>
    </div>
  );
}
