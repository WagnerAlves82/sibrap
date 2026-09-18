"use client";

import { useActionState } from "react";
import {
  adicionarMaterialAction,
  salvarConteudoAction,
  salvarQuestaoAction,
  type Estado,
} from "./actions";

const INPUT = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";
const BOTAO =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60";

function Retorno({ estado }: { estado: Estado }) {
  if (estado?.ok) return <span className="text-sm text-emerald-700">salvo ✓</span>;
  if (estado?.erro) return <span className="text-sm text-red-600">{estado.erro}</span>;
  return null;
}

export function FormConteudo({
  aula,
}: {
  aula: { id: string; objetivo: string | null; resumo: string | null; atividade: string | null };
}) {
  const [estado, action, pending] = useActionState<Estado, FormData>(salvarConteudoAction, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={aula.id} />
      <label className="text-sm font-medium text-zinc-700" htmlFor="objetivo">
        Objetivo (1 frase: &quot;ao final você será capaz de…&quot;)
      </label>
      <textarea id="objetivo" name="objetivo" rows={2} defaultValue={aula.objetivo ?? ""} className={INPUT} />
      <label className="text-sm font-medium text-zinc-700" htmlFor="resumo">
        Resumo da aula (texto para ler depois). Use &quot;- &quot; para tópicos e **negrito**.
      </label>
      <textarea id="resumo" name="resumo" rows={8} defaultValue={aula.resumo ?? ""} className={`${INPUT} font-mono`} />
      <label className="text-sm font-medium text-zinc-700" htmlFor="atividade">
        Pratique (atividade guiada)
      </label>
      <textarea id="atividade" name="atividade" rows={4} defaultValue={aula.atividade ?? ""} className={INPUT} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className={BOTAO}>
          {pending ? "Salvando..." : "Salvar conteúdo"}
        </button>
        <Retorno estado={estado} />
      </div>
    </form>
  );
}

export function FormMaterial({ aulaId }: { aulaId: string }) {
  const [estado, action, pending] = useActionState<Estado, FormData>(adicionarMaterialAction, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="aula_id" value={aulaId} />
      <input name="titulo" placeholder="Título (ex.: Planilha modelo de orçamento)" aria-label="Título do material" className={INPUT} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-500" htmlFor="arquivo">
            Arquivo (PDF, DOCX, XLSX, PPTX, PNG, JPG · até 3,5 MB)
          </label>
          <input id="arquivo" name="arquivo" type="file" className="mt-1 block w-full text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-500" htmlFor="link">
            …ou um link (https://)
          </label>
          <input id="link" name="link" placeholder="https://" className={`${INPUT} mt-1`} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button disabled={pending} className={BOTAO}>
          {pending ? "Enviando..." : "Adicionar material"}
        </button>
        <Retorno estado={estado} />
      </div>
    </form>
  );
}

type QuestaoEdit = {
  id: string;
  ordem: number;
  enunciado: string;
  alternativas: { letra: string; texto: string }[];
  gabarito: string;
  comentario: string | null;
};

export function FormQuestao({
  aulaId,
  questao,
  proximaOrdem,
}: {
  aulaId: string;
  questao?: QuestaoEdit;
  proximaOrdem: number;
}) {
  const [estado, action, pending] = useActionState<Estado, FormData>(salvarQuestaoAction, null);
  const alt = (l: string) => questao?.alternativas.find((a) => a.letra === l)?.texto ?? "";
  return (
    <form action={action} className="flex flex-col gap-2.5">
      <input type="hidden" name="aula_id" value={aulaId} />
      <input type="hidden" name="id" value={questao?.id ?? ""} />
      <input type="hidden" name="ordem" value={questao?.ordem ?? proximaOrdem} />
      <textarea name="enunciado" rows={2} placeholder="Enunciado" aria-label="Enunciado" defaultValue={questao?.enunciado ?? ""} className={INPUT} />
      {["A", "B", "C", "D"].map((l) => (
        <div key={l} className="flex items-center gap-2">
          <span className="w-5 text-sm font-bold text-zinc-500">{l}</span>
          <input name={`alt_${l}`} defaultValue={alt(l)} placeholder={`Alternativa ${l}`} aria-label={`Alternativa ${l}`} className={INPUT} />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-600" htmlFor={`gab-${questao?.id ?? "novo"}`}>
          Correta:
        </label>
        <select id={`gab-${questao?.id ?? "novo"}`} name="gabarito" defaultValue={questao?.gabarito ?? ""} className="rounded-md border border-zinc-300 px-2 py-2 text-sm">
          <option value="">—</option>
          {["A", "B", "C", "D"].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <input name="comentario" defaultValue={questao?.comentario ?? ""} placeholder="Explicação mostrada ao aluno" aria-label="Explicação" className={`${INPUT} flex-1`} />
      </div>
      <div className="flex items-center gap-3">
        <button disabled={pending} className={BOTAO}>
          {pending ? "Salvando..." : questao ? "Salvar questão" : "Adicionar questão"}
        </button>
        <Retorno estado={estado} />
      </div>
    </form>
  );
}
