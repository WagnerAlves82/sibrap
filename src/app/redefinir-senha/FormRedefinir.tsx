"use client";

import { useActionState } from "react";
import { CLASSE_INPUT, CLASSE_BOTAO_PRIMARIO } from "@/components/auth-shell";
import { redefinirSenha, type EstadoRedefinir } from "./actions";

export function FormRedefinir() {
  const [estado, action, pending] = useActionState<EstadoRedefinir, FormData>(
    redefinirSenha,
    null
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="sr-only" htmlFor="senha">
        Nova senha
      </label>
      <input
        id="senha"
        type="password"
        name="senha"
        placeholder="Nova senha (mínimo 8 caracteres)"
        autoComplete="new-password"
        required
        minLength={8}
        autoFocus
        className={CLASSE_INPUT}
      />
      <label className="sr-only" htmlFor="confirmacao">
        Repita a nova senha
      </label>
      <input
        id="confirmacao"
        type="password"
        name="confirmacao"
        placeholder="Repita a nova senha"
        autoComplete="new-password"
        required
        minLength={8}
        className={CLASSE_INPUT}
      />
      <button type="submit" disabled={pending} className={`mt-2 ${CLASSE_BOTAO_PRIMARIO}`}>
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
      {estado?.erro && (
        <p role="alert" className="text-sm text-[#B3261E]">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
