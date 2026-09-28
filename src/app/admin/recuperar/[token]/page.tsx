import Link from "next/link";
import { estadoRecuperacao } from "@/lib/admin-seguranca";
import { cancelarRecuperacaoAction, concluirRecuperacaoAction } from "../../acesso-actions";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function RecuperacaoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const estado = await estadoRecuperacao(token);

  let corpo: React.ReactNode;
  if (!estado) {
    corpo = <p className="text-sm text-red-400">Link inválido.</p>;
  } else if (estado.situacao === "cancelada") {
    corpo = <p className="text-sm text-emerald-300">Recuperação cancelada. Nenhum acesso foi liberado.</p>;
  } else if (estado.situacao === "usada") {
    corpo = <p className="text-sm text-zinc-300">Este link já foi usado.</p>;
  } else if (estado.situacao === "expirada") {
    corpo = <p className="text-sm text-zinc-300">Este link expirou. Peça um novo na tela de entrada.</p>;
  } else if (estado.situacao === "aguardando") {
    corpo = (
      <>
        <p className="text-sm text-zinc-300">
          Por segurança, o acesso será liberado às{" "}
          <strong className="text-white">
            {new Date(estado.liberarEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
          </strong>{" "}
          (Brasília). Volte a este link a partir desse horário.
        </p>
        <Cancelar token={token} />
      </>
    );
  } else {
    corpo = (
      <>
        <p className="mb-3 text-sm text-zinc-300">
          O prazo de segurança passou. Você entrará no painel para cadastrar um aparelho novo.
        </p>
        <form action={concluirRecuperacaoAction}>
          <input type="hidden" name="token" value={token} />
          <button className="w-full rounded-md bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500">
            Entrar e cadastrar novo aparelho
          </button>
        </form>
        <Cancelar token={token} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-3 text-lg font-bold text-white">Recuperação de acesso</h1>
        {corpo}
        <p className="mt-5 text-sm">
          <Link href="/admin/login" className="text-zinc-400 underline hover:text-zinc-200">
            Ir para a entrada
          </Link>
        </p>
      </div>
    </div>
  );
}

function Cancelar({ token }: { token: string }) {
  return (
    <form action={cancelarRecuperacaoAction} className="mt-4">
      <input type="hidden" name="token" value={token} />
      <button className="text-sm text-red-400 underline hover:text-red-300">
        Não fui eu: cancelar esta recuperação
      </button>
    </form>
  );
}
