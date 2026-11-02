"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CLASSE_INPUT, CLASSE_BOTAO_PRIMARIO } from "@/components/auth-shell";
import { CampoSenha } from "@/components/campo-senha";
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
  const form = useRef<HTMLFormElement>(null);

  // Login aceito: oferece salvar a senha no aparelho (Chrome/Android pela
  // Credential Management API; Safari e outros pelo próprio formulário) e abre a área.
  useEffect(() => {
    const destino = estado?.destino;
    if (!destino) return;
    const abrir = () => window.location.assign(destino);
    const dados = form.current ? new FormData(form.current) : null;
    const email = String(dados?.get("email") ?? "");
    const senha = String(dados?.get("senha") ?? "");
    const PC = (window as unknown as { PasswordCredential?: new (d: { id: string; password: string }) => Credential })
      .PasswordCredential;
    if (PC && email && senha && navigator.credentials?.store) {
      navigator.credentials.store(new PC({ id: email, password: senha })).catch(() => undefined).finally(abrir);
    } else {
      abrir();
    }
  }, [estado?.destino]);

  const entrando = pending || Boolean(estado?.destino);

  return (
    <form ref={form} action={action} className="flex flex-col gap-3">
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
        autoComplete="username"
        required
        autoFocus
        defaultValue={estado?.email}
        className={CLASSE_INPUT}
      />
      <label className="sr-only" htmlFor="senha">
        Senha
      </label>
      <CampoSenha id="senha" name="senha" placeholder="Senha" autoComplete="current-password" required />
      <Link href="/esqueci-senha" className="self-end text-[13px] font-semibold text-brand underline underline-offset-4">
        Esqueci minha senha
      </Link>
      <button type="submit" disabled={entrando} className={`mt-1 ${CLASSE_BOTAO_PRIMARIO}`}>
        {entrando ? "Entrando..." : "Entrar"}
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
