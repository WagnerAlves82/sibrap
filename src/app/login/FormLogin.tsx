"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { CampoSenha } from "@/components/campo-senha";
import { CLASSE_INPUT, CLASSE_BOTAO_PRIMARIO } from "@/components/auth-shell";
import { entrar, reenviarConfirmacaoAction, type EstadoLogin } from "./actions";

export function FormLogin({
  next,
  linkInvalido,
  emailConfirmado,
}: {
  next: string;
  linkInvalido?: boolean;
  emailConfirmado?: boolean;
}) {
  const [estado, action, pending] = useActionState<EstadoLogin, FormData>(
    entrar,
    null
  );
  const [reenviando, iniciarReenvio] = useTransition();
  const [reenviado, setReenviado] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-3">
      {emailConfirmado && (
        <p role="status" className="rounded-lg border border-[#BFE0D8] bg-[#EAF6F3] px-3 py-2 text-sm text-[#0E5A4D]">
          E-mail confirmado! Agora é só entrar com o seu e-mail e a senha que você criou.
        </p>
      )}
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
      <CampoSenha
        id="senha"
        name="senha"
        placeholder="Senha"
        autoComplete="current-password"
        required
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
      {estado?.emailNaoConfirmado && (
        reenviado ? (
          <p className="text-sm text-[#1E6B45]">E-mail reenviado. Confira sua caixa de entrada (e o spam).</p>
        ) : (
          <button
            type="button"
            disabled={reenviando}
            onClick={() =>
              iniciarReenvio(async () => {
                await reenviarConfirmacaoAction(estado.email ?? "");
                setReenviado(true);
              })
            }
            className="self-start text-[13px] font-semibold text-brand underline underline-offset-4 disabled:opacity-60"
          >
            {reenviando ? "Reenviando..." : "Reenviar e-mail de confirmação"}
          </button>
        )
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
