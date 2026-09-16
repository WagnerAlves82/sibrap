"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { entrar, type EstadoLogin } from "./actions";

export default function LoginPage() {
  const [estado, action, pending] = useActionState<EstadoLogin, FormData>(
    entrar,
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-20">
      <div className="w-full max-w-sm">
        <form
          action={action}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-8"
        >
          <Logo className="mb-1" />
          <p className="mb-6 text-sm text-zinc-400">Entre na sua conta</p>
          <input
            type="email"
            name="email"
            placeholder="E-mail"
            required
            autoFocus
            className="mb-3 w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-blue-500"
          />
          <input
            type="password"
            name="senha"
            placeholder="Senha"
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
          {estado?.erro && (
            <p className="mt-3 text-sm text-red-400">{estado.erro}</p>
          )}
          <p className="mt-4 text-center text-sm text-zinc-500">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-blue-500 underline">
              Criar conta grátis
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
