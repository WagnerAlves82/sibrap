"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type Opcao = { id: string; titulo: string; temas: string[]; banca: string };

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="bg-accent px-5 py-2.5 text-[14.5px] font-bold text-accent-ink transition hover:brightness-105 disabled:opacity-60"
    >
      {pending ? "Abrindo..." : "Começar a escrever"}
    </button>
  );
}

export function NovaRedacao({ acao, apostilas }: { acao: (f: FormData) => Promise<void>; apostilas: Opcao[] }) {
  const [apostila, setApostila] = useState(apostilas[0]?.id ?? "");
  const temas = apostilas.find((a) => a.id === apostila)?.temas ?? [];
  const [livre, setLivre] = useState(false);
  const campo = "mt-1 w-full border border-[#C5CFDA] bg-white px-3 py-2 text-[14.5px] text-[#14213A] focus:border-brand focus:outline-none";
  const rotulo = "mt-4 block text-[13px] font-bold text-[#33465E]";

  return (
    <form action={acao}>
      {apostilas.length > 1 && (
        <label className={rotulo}>
          Concurso
          <select name="apostila" value={apostila} onChange={(e) => setApostila(e.target.value)} className={campo}>
            {apostilas.map((a) => (
              <option key={a.id} value={a.id}>{a.titulo} · {a.banca}</option>
            ))}
          </select>
        </label>
      )}
      {apostilas.length === 1 && <input type="hidden" name="apostila" value={apostila} />}

      <label className={rotulo}>
        Tema
        {livre ? (
          <input name="tema_livre" required minLength={8} maxLength={300} placeholder="Escreva o tema da proposta" className={campo} />
        ) : (
          <select name="tema" className={campo}>
            {temas.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}
      </label>
      <button type="button" onClick={() => setLivre(!livre)} className="mt-1 text-[12.5px] font-bold text-brand">
        {livre ? "Escolher da lista" : "Usar outro tema"}
      </button>

      <fieldset className="mt-4 flex flex-wrap gap-4 text-[14px] text-[#14213A]">
        <label className="flex items-center gap-2">
          <input type="radio" name="modo" value="treino" defaultChecked /> Treino, com dicas ao vivo
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="modo" value="simulado" /> Simulado, 60 min e sem dicas
        </label>
      </fieldset>

      <div className="mt-5">
        <Enviar />
      </div>
    </form>
  );
}
