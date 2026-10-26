import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { RastrearCompras, type CompraRecente } from "@/components/rastrear-compras";

const tresDiasAtras = () => new Date(Date.now() - 3 * 86_400_000).toISOString();

// Toda página da área do aluno confere as compras aprovadas dos últimos
// 3 dias, para a conversão sair mesmo quando a pessoa não ficou na tela do PIX.
export default async function MinhaAreaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let compras: CompraRecente[] = [];
  if (user) {
    const { data } = await supabase
      .from("pedidos")
      .select("id, valor_centavos, produtos(slug, nome)")
      .eq("user_id", user.id)
      .eq("status", "aprovado")
      .gte("atualizado_em", tresDiasAtras());
    compras = (data ?? []).map((p) => ({
      pedidoId: p.id,
      valorCentavos: p.valor_centavos,
      itemId: p.produtos?.slug ?? "produto",
      itemNome: p.produtos?.nome ?? "Produto",
    }));
  }

  return (
    <>
      {children}
      {compras.length > 0 && <RastrearCompras compras={compras} />}
    </>
  );
}
