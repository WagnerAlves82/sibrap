"use client";

// Campo de senha com botão de mostrar/ocultar (ícone de olho), usado nos
// formulários de login, cadastro e redefinição de senha.

import { useState } from "react";
import { CLASSE_INPUT } from "@/components/auth-shell";

export function CampoSenha({
  id,
  name,
  placeholder,
  autoComplete,
  required,
  minLength,
  autoFocus,
}: {
  id: string;
  name: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visivel ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        autoFocus={autoFocus}
        className={`${CLASSE_INPUT} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#7A8AA0] transition-colors hover:text-brand"
      >
        {visivel ? <IconeOlhoFechado /> : <IconeOlho />}
      </button>
    </div>
  );
}

function IconeOlho() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeOlhoFechado() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M3.5 3.5l17 17M10.6 10.7a3 3 0 0 0 4.2 4.2M7.4 7.6C4.9 9.1 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.7 0 3.2-.5 4.4-1.2M16.8 16.9C19.3 15.4 21.5 12 21.5 12S18 5.5 12 5.5c-.8 0-1.6.1-2.3.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
