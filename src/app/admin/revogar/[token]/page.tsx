import { tokenAcaoValido } from "@/lib/admin-auth";
import { revogarPorLinkAction } from "../../acesso-actions";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

// O link do e-mail só abre esta tela; quem encerra as sessões é o botão
// (POST), para que leitores automáticos de e-mail não disparem a ação.
export default async function RevogarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valido = tokenAcaoValido("revogar", token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-3 text-lg font-bold text-white">Encerrar todas as sessões</h1>
        {valido ? (
          <form action={revogarPorLinkAction}>
            <p className="mb-4 text-sm text-zinc-300">
              Isso desconecta o painel admin em todos os aparelhos. Para voltar, será preciso entrar de novo com a
              biometria.
            </p>
            <input type="hidden" name="token" value={token} />
            <button className="w-full rounded-md bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-600">
              Encerrar todas as sessões agora
            </button>
          </form>
        ) : (
          <p className="text-sm text-zinc-300">Link inválido ou expirado. Entre no painel e use &quot;Segurança&quot;.</p>
        )}
      </div>
    </div>
  );
}
