"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { cadastrar, type EstadoCadastro } from "./actions";

export default function CadastroPage() {
  const [estado, action, pending] = useActionState<EstadoCadastro, FormData>(
    cadastrar,
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
          <p className="mb-6 text-sm text-zinc-400">
            Crie sua conta grátis e responda 10 questões de amostra (5 de
            Português + 5 de Matemática) no estilo da banca Cesgranrio.
          </p>

          {estado?.precisaConfirmarEmail ? (
            <p className="rounded-md bg-emerald-950 p-4 text-sm text-emerald-300">
              Quase lá! Enviamos um link de confirmação para o seu e-mail.
              Confirme para acessar o simulado grátis.
            </p>
          ) : (
            <>
              <input
                type="text"
                name="nome"
                placeholder="Nome"
                required
                autoFocus
                className="mb-3 w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-blue-500"
              />
              <input
                type="email"
                name="email"
                placeholder="E-mail"
                required
                className="mb-3 w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-blue-500"
              />
              <input
                type="password"
                name="senha"
                placeholder="Senha (mínimo 6 caracteres)"
                required
                minLength={6}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={pending}
                className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
              >
                {pending ? "Criando conta..." : "Criar conta grátis"}
              </button>
              {estado?.erro && (
                <p className="mt-3 text-sm text-red-400">{estado.erro}</p>
              )}
            </>
          )}

          <p className="mt-4 text-center text-sm text-zinc-500">
            Já tem conta?{" "}
            <Link href="/login" className="text-blue-500 underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
