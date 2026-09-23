"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CLASSE_INPUT, CLASSE_BOTAO_PRIMARIO } from "@/components/auth-shell";
import { entrar, type EstadoLogin } from "./actions";

export function FormLogin({ next, linkInvalido }: { next: string; linkInvalido?: boolean }) {
  const [estado, action, pending] = useActionState<EstadoLogin, FormData>(
    entrar,
    null
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      {linkInvalido && (
        <p role="alert" className="rounded-lg border border-[#E6CF9C] bg-[#FBF5E4] px-3 py-2 text-sm text-[#5B4210]">
          Esse link expirou ou já foi usado. Entre com sua senha ou peça um novo link.
        </p>
      )}
      <input type="hidden" name="next" value={next} />
      <label className="sr-only" htmlFor="email">
        E-mail
      </label>
      <input
        id="email"
        type="email"
        name="email"
        placeholder="E-mail"
        autoComplete="email"
        required
        autoFocus
        defaultValue={estado?.email}
        className={CLASSE_INPUT}
      />
      <label className="sr-only" htmlFor="senha">
        Senha
      </label>
      <input
        id="senha"
        type="password"
        name="senha"
        placeholder="Senha"
        autoComplete="current-password"
        required
        className={CLASSE_INPUT}
      />
      <Link href="/esqueci-senha" className="self-end text-[13px] font-semibold text-brand underline underline-offset-4">
        Esqueci minha senha
      </Link>
      <button type="submit" disabled={pending} className={`mt-1 ${CLASSE_BOTAO_PRIMARIO}`}>
        {pending ? "Entrando..." : "Entrar"}
      </button>
      {estado?.erro && (
        <p role="alert" className="text-sm text-[#B3261E]">
          {estado.erro}
        </p>
      )}
      <p className="mt-3 text-center text-sm text-[#516278]">
        Ainda não tem conta?{" "}
        <Link
          href={next === "/minha-area" ? "/cadastro" : `/cadastro?next=${encodeURIComponent(next)}`}
          className="font-semibold text-brand underline underline-offset-4"
        >
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}
