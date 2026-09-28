"use client";

import Link from "next/link";
import { useActionState } from "react";
import { pedirRecuperacaoAction, type EstadoRecuperacao } from "../acesso-actions";

export default function RecuperarAcessoPage() {
  const [estado, acao, pendente] = useActionState<EstadoRecuperacao, FormData>(
    (anterior) => pedirRecuperacaoAction(anterior),
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10">
      <form action={acao} className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-1 text-lg font-bold text-white">Recuperar acesso</h1>
        <p className="mb-4 text-sm text-zinc-400">
          Enviaremos um link para o e-mail do administrador. Por segurança, ele só libera o acesso 60 minutos depois
          do pedido, e o e-mail traz um botão para cancelar caso não tenha sido você.
        </p>
        {estado?.enviado ? (
          <p className="rounded-md bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Pedido registrado. Se o e-mail do administrador estiver correto, o link chega em instantes.
          </p>
        ) : (
          <button
            disabled={pendente}
            className="w-full rounded-md bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-60"
          >
            {pendente ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        )}
        {estado?.erro && <p className="mt-3 text-sm text-red-400">{estado.erro}</p>}
        <p className="mt-5 text-sm">
          <Link href="/admin/login" className="text-zinc-400 underline hover:text-zinc-200">
            Voltar
          </Link>
        </p>
      </form>
    </div>
  );
}
