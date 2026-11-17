import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";

// Teste da conta do AbacatePay do Cenapro (Wagner, 17/11/2026): gera um link de pagamento de R$ 9,90
// usando ABACATEPAY_API_KEY_SENAPRO, só no servidor. Não cria pedido no SIBRAP e não mexe nos pagamentos do site.
export const dynamic = "force-dynamic";

const BASE = "https://api.abacatepay.com/v2";
type Envelope<T> = { data: T | null; error: string | null; success: boolean };

async function exigirAdmin() {
  const cookieStore = await cookies();
  if (!(await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value))) redirect("/admin/login");
}

async function chamar<T>(chave: string, caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const corpo = (await r.json().catch(() => null)) as Envelope<T> | null;
  if (!r.ok || !corpo?.success || !corpo.data) throw new Error(`AbacatePay ${r.status}: ${corpo?.error ?? "resposta inválida"}`);
  return corpo.data;
}

async function gerarLinkAction() {
  "use server";
  await exigirAdmin();
  const chave = process.env.ABACATEPAY_API_KEY_SENAPRO;
  if (!chave) redirect("/admin/teste-cenapro?erro=" + encodeURIComponent("Chave do Cenapro não configurada na Vercel."));

  let url = "";
  try {
    // produto de teste (o checkout hospedado exige um produto cadastrado na conta)
    const externalId = "teste-cenapro-990";
    let produtoId = "";
    const busca = await fetch(`${BASE}/products/get?externalId=${externalId}`, {
      headers: { Authorization: `Bearer ${chave}` },
      cache: "no-store",
    });
    const corpoBusca = (await busca.json().catch(() => null)) as Envelope<{ id: string }> | null;
    if (busca.ok && corpoBusca?.success && corpoBusca.data) produtoId = corpoBusca.data.id;
    else {
      const criado = await chamar<{ id: string }>(chave!, "/products/create", {
        method: "POST",
        body: JSON.stringify({ externalId, name: "Teste de pagamento", price: 990, currency: "BRL" }),
      });
      produtoId = criado.id;
    }
    const checkout = await chamar<{ id: string; url: string }>(chave!, "/checkouts/create", {
      method: "POST",
      body: JSON.stringify({
        items: [{ id: produtoId, quantity: 1 }],
        methods: ["PIX"],
        externalId: `teste-cenapro-${Date.now()}`,
        returnUrl: "https://cenapro.com.br",
        completionUrl: "https://cenapro.com.br",
        metadata: { teste: "sibrap-admin" },
      }),
    });
    url = checkout.url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    redirect("/admin/teste-cenapro?erro=" + encodeURIComponent(msg));
  }
  redirect("/admin/teste-cenapro?link=" + encodeURIComponent(url));
}

export default async function TesteCenaproPage({ searchParams }: { searchParams: Promise<{ link?: string; erro?: string }> }) {
  await exigirAdmin();
  const { link, erro } = await searchParams;
  const linkSeguro = link && /^https:\/\/[a-z0-9.-]*abacatepay\.com\//i.test(link) ? link : null;

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Teste da conta do Cenapro</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Gera um link de pagamento PIX de R$ 9,90 na conta do AbacatePay do Cenapro. Não cria pedido no SIBRAP e não muda os
          pagamentos do site.
        </p>
        <form action={gerarLinkAction}>
          <button className="bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">Gerar link de teste (R$ 9,90)</button>
        </form>
        {erro && <p className="mt-5 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Não deu certo: {erro}</p>}
        {linkSeguro && (
          <div className="mt-5 border border-emerald-300 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Link criado na conta do Cenapro:</p>
            <a href={linkSeguro} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all underline">
              {linkSeguro}
            </a>
            <p className="mt-2 text-xs text-emerald-800">No app do banco, o recebedor deve aparecer como o Cenapro.</p>
          </div>
        )}
      </div>
    </div>
  );
}
