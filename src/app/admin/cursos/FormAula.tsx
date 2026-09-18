"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvarAulaAction, type EstadoSalvarAula } from "./actions";

const INPUT = "rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm";

export function FormAula({
  aula,
}: {
  aula: {
    id: string;
    titulo: string;
    carga_min: number;
    duracao_video_min: number | null;
    youtube_id: string | null;
  };
}) {
  const [estado, action, pending] = useActionState<EstadoSalvarAula, FormData>(
    salvarAulaAction,
    null
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-4 py-3">
      <input type="hidden" name="id" value={aula.id} />
      <input name="titulo" defaultValue={aula.titulo} aria-label="Título" className={`${INPUT} w-full sm:w-80`} />
      <input
        name="youtube"
        defaultValue={aula.youtube_id ? `https://youtu.be/${aula.youtube_id}` : ""}
        placeholder="Link do YouTube (vazio = não publicada)"
        aria-label="Link do YouTube"
        className={`${INPUT} w-full sm:w-72`}
      />
      <input
        name="carga_min"
        type="number"
        min={1}
        defaultValue={aula.carga_min}
        aria-label="Carga em minutos"
        title="Carga horária da aula (vídeo + prática), em minutos"
        className={`${INPUT} w-20`}
      />
      <input
        name="duracao_video_min"
        type="number"
        min={1}
        defaultValue={aula.duracao_video_min ?? ""}
        placeholder="vídeo"
        aria-label="Duração do vídeo em minutos"
        title="Duração do vídeo em minutos (o aluno só conclui após 60% desse tempo)"
        className={`${INPUT} w-20`}
      />
      <button
        disabled={pending}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "..." : "Salvar"}
      </button>
      <Link href={`/admin/cursos/aula/${aula.id}`} className="text-sm text-blue-700 underline">
        conteúdo →
      </Link>
      {estado?.ok && <span className="text-sm text-emerald-700">salvo ✓</span>}
      {estado?.erro && <span className="text-sm text-red-600">{estado.erro}</span>}
    </form>
  );
}
