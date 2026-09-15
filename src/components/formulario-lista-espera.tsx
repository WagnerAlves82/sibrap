"use client";

import { useActionState } from "react";
import { entrarNaListaDeEspera, type EstadoListaEspera } from "@/app/actions";

export function FormularioListaEspera({ concursoId }: { concursoId: string }) {
  const [estado, action, pending] = useActionState<EstadoListaEspera, FormData>(
    entrarNaListaDeEspera,
    null
  );

  if (estado?.ok) {
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        {estado.mensagem}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={action} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="concursoId" value={concursoId} />
        <input
          type="email"
          name="email"
          required
          placeholder="seu@email.com"
          className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-white"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Enviando..." : "Quero ser avisado"}
        </button>
      </form>
      {estado && !estado.ok && (
        <p className="text-sm text-red-600">{estado.mensagem}</p>
      )}
    </div>
  );
}
