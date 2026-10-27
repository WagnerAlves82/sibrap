"use client";

// Campos do formulário do gerador de currículos (rótulo, dica e erro no mesmo padrão).

import { useId } from "react";

const caixa =
  "w-full rounded-lg border border-[#C9D3DE] bg-white px-3.5 py-2.5 text-[15px] text-[#14213A] outline-none transition-colors placeholder:text-[#93A0AF] focus:border-brand focus:ring-2 focus:ring-brand/15";

type Base = { rotulo: string; dica?: string; erro?: string; opcional?: boolean };

function Rotulo({ id, rotulo, opcional }: { id: string; rotulo: string; opcional?: boolean }) {
  return (
    <label htmlFor={id} className="mb-1 block text-[13.5px] font-semibold text-[#14213A]">
      {rotulo} {opcional && <span className="font-normal text-[#93A0AF]">(opcional)</span>}
    </label>
  );
}

function Rodape({ dica, erro }: { dica?: string; erro?: string }) {
  if (erro) return <p className="mt-1 text-[12.5px] font-semibold text-[#B42318]">{erro}</p>;
  if (dica) return <p className="mt-1 text-[12.5px] text-[#516278]">{dica}</p>;
  return null;
}

export function Campo({
  rotulo, dica, erro, opcional, valor, aoMudar, tipo = "text", placeholder, autoComplete, maxLength, inputMode,
}: Base & {
  valor: string;
  aoMudar: (v: string) => void;
  tipo?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const id = useId();
  return (
    <div>
      <Rotulo id={id} rotulo={rotulo} opcional={opcional} />
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        inputMode={inputMode}
        aria-invalid={!!erro}
        className={`${caixa} ${erro ? "border-[#B42318]" : ""}`}
      />
      <Rodape dica={dica} erro={erro} />
    </div>
  );
}

export function AreaTexto({
  rotulo, dica, erro, opcional, valor, aoMudar, placeholder, linhas = 4, maxLength,
}: Base & { valor: string; aoMudar: (v: string) => void; placeholder?: string; linhas?: number; maxLength?: number }) {
  const id = useId();
  return (
    <div>
      <Rotulo id={id} rotulo={rotulo} opcional={opcional} />
      <textarea
        id={id}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        rows={linhas}
        maxLength={maxLength}
        aria-invalid={!!erro}
        className={`${caixa} resize-y leading-relaxed ${erro ? "border-[#B42318]" : ""}`}
      />
      <Rodape dica={dica} erro={erro} />
    </div>
  );
}

export function Selecao({
  rotulo, dica, erro, opcional, valor, aoMudar, opcoes,
}: Base & { valor: string; aoMudar: (v: string) => void; opcoes: { valor: string; texto: string }[] }) {
  const id = useId();
  return (
    <div>
      <Rotulo id={id} rotulo={rotulo} opcional={opcional} />
      <select id={id} value={valor} onChange={(e) => aoMudar(e.target.value)} aria-invalid={!!erro} className={`${caixa} ${erro ? "border-[#B42318]" : ""}`}>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      <Rodape dica={dica} erro={erro} />
    </div>
  );
}

/** Lista de itens repetíveis (formações, experiências, cursos...) com adicionar e remover. */
export function ListaItens<T>({
  itens, aoMudar, novo, max, rotuloItem, rotuloAdicionar, render,
}: {
  itens: T[];
  aoMudar: (itens: T[]) => void;
  novo: () => T;
  max: number;
  rotuloItem: string;
  rotuloAdicionar: string;
  render: (item: T, mudar: (parcial: Partial<T>) => void, indice: number) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {itens.map((item, i) => (
        <fieldset key={i} className="rounded-xl border border-[#D7DEE6] bg-[#F8FAFC] p-4">
          <div className="mb-3 flex items-center justify-between">
            <legend className="font-display text-[15px] font-extrabold text-[#14213A]">
              {rotuloItem} {i + 1}
            </legend>
            <button
              type="button"
              onClick={() => aoMudar(itens.filter((_, j) => j !== i))}
              className="text-[13px] font-semibold text-[#B42318] underline-offset-4 hover:underline"
            >
              Remover
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {render(item, (parcial) => aoMudar(itens.map((x, j) => (j === i ? { ...x, ...parcial } : x))), i)}
          </div>
        </fieldset>
      ))}
      {itens.length < max && (
        <button
          type="button"
          onClick={() => aoMudar([...itens, novo()])}
          className="rounded-xl border-2 border-dashed border-[#C9D3DE] px-4 py-3 text-[14.5px] font-bold text-brand transition-colors hover:border-brand hover:bg-white"
        >
          + {rotuloAdicionar}
        </button>
      )}
    </div>
  );
}
