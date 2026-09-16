"use client";

import { useActionState } from "react";
import { loginAdmin, type EstadoLoginAdmin } from "../actions";

export default function AdminLoginPage() {
  const [estado, action, pending] = useActionState<EstadoLoginAdmin, FormData>(
    loginAdmin,
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <form
        action={action}
        className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-8"
      >
        <h1 className="mb-1 text-lg font-bold text-white">sibrap</h1>
        <p className="mb-6 text-sm text-zinc-400">Painel administrativo</p>
        <input
          type="password"
          name="senha"
          placeholder="Senha"
          required
          autoFocus
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-md bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
        {estado?.erro && (
          <p className="mt-3 text-sm text-red-400">{estado.erro}</p>
        )}
      </form>
    </div>
  );
}
