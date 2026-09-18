"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CLASSE_INPUT, CLASSE_BOTAO_PRIMARIO } from "@/components/auth-shell";
import { Alert } from "@/components/alert";
import { cadastrar, type EstadoCadastro } from "./actions";

export function FormCadastro({
  next,
  utmSource,
}: {
  next: string;
  utmSource: string;
}) {
  const [estado, action, pending] = useActionState<EstadoCadastro, FormData>(
    cadastrar,
    null
  );

  if (estado?.precisaConfirmarEmail) {
    return (
      <Alert variant="sucesso" claro className="text-sm">
        Quase lá! Enviamos um link de confirmação para o seu e-mail. Confirme
        para continuar. Se não chegar em alguns minutos, olhe a caixa de spam.
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="utm_source" value={utmSource} />
      <label className="sr-only" htmlFor="nome">
        Nome
      </label>
      <input
        id="nome"
        type="text"
        name="nome"
        placeholder="Nome completo"
        autoComplete="name"
        required
        autoFocus
        className={CLASSE_INPUT}
      />
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
        className={CLASSE_INPUT}
      />
      <label className="sr-only" htmlFor="senha">
        Senha
      </label>
      <input
        id="senha"
        type="password"
        name="senha"
        placeholder="Senha (mínimo 6 caracteres)"
        autoComplete="new-password"
        required
        minLength={6}
        className={CLASSE_INPUT}
      />
      <button type="submit" disabled={pending} className={`mt-2 ${CLASSE_BOTAO_PRIMARIO}`}>
        {pending ? "Criando conta..." : "Criar conta grátis"}
      </button>
      {estado?.erro && (
        <p role="alert" className="text-sm text-[#B3261E]">
          {estado.erro}
        </p>
      )}
      <p className="text-center text-xs leading-relaxed text-[#93A0AF]">
        Ao criar a conta você concorda em receber mensagens sobre o seu
        cadastro e os cursos do SIBRAP. Seus dados são usados só para isso.
      </p>
      <p className="mt-2 text-center text-sm text-[#516278]">
        Já tem conta?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-semibold text-brand underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
