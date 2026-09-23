"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CLASSE_INPUT, CLASSE_BOTAO_PRIMARIO } from "@/components/auth-shell";
import { Alert } from "@/components/alert";
import { solicitarRedefinicao, type EstadoEsqueci } from "./actions";

export function FormEsqueci() {
  const [estado, action, pending] = useActionState<EstadoEsqueci, FormData>(
    solicitarRedefinicao,
    null
  );

  if (estado?.enviado) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="sucesso" claro className="text-sm">
          Pronto! Se esse e-mail tiver uma conta no SIBRAP, você vai receber
          um link para criar uma nova senha. Olhe também a caixa de spam.
        </Alert>
        <Link href="/login" className="text-center text-sm font-semibold text-brand underline underline-offset-4">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="sr-only" htmlFor="email">
        E-mail
      </label>
      <input
        id="email"
        type="email"
        name="email"
        placeholder="E-mail da sua conta"
        autoComplete="email"
        required
        autoFocus
        className={CLASSE_INPUT}
      />
      <button type="submit" disabled={pending} className={`mt-2 ${CLASSE_BOTAO_PRIMARIO}`}>
        {pending ? "Enviando..." : "Enviar link"}
      </button>
      {estado?.erro && (
        <p role="alert" className="text-sm text-[#B3261E]">
          {estado.erro}
        </p>
      )}
      <Link href="/login" className="mt-3 text-center text-sm font-semibold text-brand underline underline-offset-4">
        Voltar para o login
      </Link>
    </form>
  );
}
