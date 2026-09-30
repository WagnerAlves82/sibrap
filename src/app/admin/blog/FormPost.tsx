"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UFS } from "@/lib/apostilas";
import { CATEGORIAS_POST, REGIAO_POR_UF, REGIOES, urlCapa, type PostRow } from "@/lib/blog";
import { excluirPostAction, salvarPostAction, type EstadoPost } from "./actions";

const INPUT = "w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm";
const ROTULO = "flex flex-col gap-1 text-xs font-medium text-zinc-600";

export function FormPost({ post }: { post?: PostRow }) {
  const [estado, action, pending] = useActionState<EstadoPost, FormData>(salvarPostAction, null);
  const [uf, setUf] = useState(post?.uf ?? "");
  const [regiao, setRegiao] = useState(post?.regiao ?? "");
  const [excluindo, iniciarExclusao] = useTransition();
  const router = useRouter();
  const p = post;

  return (
    <div>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        {p && <input type="hidden" name="id" value={p.id} />}

        <label className={ROTULO}>
          Título
          <input name="titulo" defaultValue={p?.titulo} required className={INPUT} />
        </label>
        <label className={ROTULO}>
          Slug (endereço — deixe em branco pra gerar do título)
          <input name="slug" defaultValue={p?.slug} placeholder="ex.: concurso-sc-abre-300-vagas" className={INPUT} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={ROTULO}>
            UF (opcional — post pode ser nacional)
            <select
              name="uf"
              value={uf}
              onChange={(e) => {
                setUf(e.target.value);
                if (e.target.value) setRegiao(REGIAO_POR_UF[e.target.value] ?? "");
              }}
              className={INPUT}
            >
              <option value="">— nenhuma —</option>
              {UFS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className={ROTULO}>
            Região
            <select name="regiao" value={regiao} onChange={(e) => setRegiao(e.target.value)} className={INPUT}>
              <option value="">— nenhuma —</option>
              {REGIOES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>

        <label className={ROTULO}>
          Categoria
          <select name="categoria" defaultValue={p?.categoria ?? "Concursos"} className={INPUT}>
            {CATEGORIAS_POST.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className={ROTULO}>
          Autor
          <input name="autor" defaultValue={p?.autor ?? "SIBRAP"} className={INPUT} />
        </label>

        <label className={`${ROTULO} sm:col-span-2`}>
          Resumo (aparece no card da listagem — deixe em branco pra gerar automático)
          <textarea name="resumo" defaultValue={p?.resumo ?? ""} rows={2} className={INPUT} />
        </label>

        <label className={ROTULO}>
          Tipo de certame (aparece em destaque no topo do post)
          <input name="certame_tipo" defaultValue={p?.certame_tipo ?? ""} placeholder="Concurso Público / Processo Seletivo" className={INPUT} />
        </label>
        <label className={ROTULO}>
          Número do edital (aparece em destaque no topo do post)
          <input name="edital_numero" defaultValue={p?.edital_numero ?? ""} placeholder="Edital nº 001/2026" className={INPUT} />
        </label>
        <label className={`${ROTULO} sm:col-span-2`}>
          Retificações conhecidas (deixe em branco = "nenhuma até o momento")
          <input name="retificacoes" defaultValue={p?.retificacoes ?? ""} placeholder="ex.: Retificação nº 1, de 05/10/2026, altera o cronograma" className={INPUT} />
        </label>
        <label className={ROTULO}>
          Link do edital oficial (https://...) — aparece no fim do post
          <input name="edital_url" type="url" defaultValue={p?.edital_url ?? ""} placeholder="https://..." className={INPUT} />
        </label>
        <label className={ROTULO}>
          Apostilas indicadas (slugs separados por vírgula — vazio = automático)
          <input name="apostilas_slugs" defaultValue={(p?.apostilas_slugs ?? []).join(", ")} className={INPUT} />
        </label>

        <label className={`${ROTULO} sm:col-span-2`}>
          Conteúdo (Markdown simples: ## título, **negrito**, *itálico*, listas com - , [link](https://...))
          <textarea name="conteudo" defaultValue={p?.conteudo ?? ""} required rows={14} className={`${INPUT} font-mono`} />
        </label>

        <label className={ROTULO}>
          Capa (JPG, PNG ou WebP, até 3,5 MB)
          <input type="file" name="capa" accept="image/jpeg,image/png,image/webp" className={INPUT} />
          {p?.capa_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlCapa(p.capa_path) ?? ""} alt="Capa atual" className="mt-1 h-20 w-32 rounded border border-zinc-200 object-cover" />
          )}
        </label>

        <label className={`${ROTULO} justify-end`}>
          <span className="flex items-center gap-2 pb-1.5 text-sm text-zinc-700">
            <input type="checkbox" name="destaque" defaultChecked={p?.destaque} /> Destaque na listagem
          </span>
        </label>

        <label className={ROTULO}>
          Situação
          <select name="status" defaultValue={p?.status ?? "rascunho"} className={INPUT}>
            <option value="rascunho">Rascunho (fora do blog)</option>
            <option value="publicada">Publicada</option>
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : p ? "Salvar alterações" : "Criar post"}
          </button>
          {p && (
            <button
              type="button"
              disabled={excluindo}
              onClick={() => {
                if (!confirm(`Excluir "${p.titulo}" definitivamente?`)) return;
                iniciarExclusao(async () => {
                  await excluirPostAction(p.id);
                  router.refresh();
                });
              }}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {excluindo ? "Excluindo..." : "Excluir"}
            </button>
          )}
          {estado?.erro && <span className="text-sm text-red-700">{estado.erro}</span>}
          {estado?.ok && <span className="text-sm text-emerald-700">Salvo.</span>}
        </div>
      </form>
    </div>
  );
}
