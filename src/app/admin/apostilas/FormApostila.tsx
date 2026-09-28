"use client";

import { useActionState, useRef, useState } from "react";
import { criarClienteSupabaseBrowser } from "@/lib/supabase-browser";
import { BUCKET_PDFS, CATEGORIAS, UFS, urlCapa, type ApostilaRow } from "@/lib/apostilas";
import {
  confirmarUploadPdfAction,
  prepararUploadPdfAction,
  salvarApostilaAction,
  type EstadoApostila,
} from "./actions";

const INPUT = "w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm";
const ROTULO = "flex flex-col gap-1 text-xs font-medium text-zinc-600";

export type ApostilaAdmin = ApostilaRow & {
  preco_centavos: number;
  pdf_path: string | null;
};

export function FormApostila({ apostila }: { apostila?: ApostilaAdmin }) {
  const [estado, action, pending] = useActionState<EstadoApostila, FormData>(
    salvarApostilaAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const a = apostila;

  return (
    <div>
      <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
        {a && <input type="hidden" name="id" value={a.id} />}

        <label className={ROTULO}>
          Slug (endereço)
          <input
            name="slug"
            defaultValue={a?.slug}
            readOnly={!!a}
            required={!a}
            placeholder="cidade-cargo"
            className={`${INPUT} ${a ? "bg-zinc-100 text-zinc-500" : ""}`}
          />
        </label>
        <label className={ROTULO}>
          Título
          <input name="titulo" defaultValue={a?.titulo} required className={INPUT} />
        </label>
        <label className={ROTULO}>
          Órgão
          <input name="orgao" defaultValue={a?.orgao} required className={INPUT} />
        </label>
        <label className={ROTULO}>
          Cargo
          <input name="cargo" defaultValue={a?.cargo} required className={INPUT} />
        </label>
        <label className={ROTULO}>
          Cidade
          <input name="cidade" defaultValue={a?.cidade ?? ""} className={INPUT} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={ROTULO}>
            UF
            <select name="uf" defaultValue={a?.uf ?? "SC"} className={INPUT}>
              {UFS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className={ROTULO}>
            Categoria
            <select name="categoria" defaultValue={a?.categoria ?? "Educação"} className={INPUT}>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={ROTULO}>
          Banca
          <input name="banca" defaultValue={a?.banca ?? ""} className={INPUT} />
        </label>
        <label className={ROTULO}>
          Remuneração
          <input name="salario" defaultValue={a?.salario ?? ""} placeholder="R$ 3.500,00" className={INPUT} />
        </label>
        <label className={ROTULO}>
          Vagas
          <input name="vagas" defaultValue={a?.vagas ?? ""} placeholder="10 + CR" className={INPUT} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={ROTULO}>
            Inscrições até
            <input type="date" name="inscricoes_ate" defaultValue={a?.inscricoes_ate ?? ""} className={INPUT} />
          </label>
          <label className={ROTULO}>
            Data da prova
            <input type="date" name="data_prova" defaultValue={a?.data_prova ?? ""} className={INPUT} />
          </label>
        </div>
        <label className={`${ROTULO} sm:col-span-2`}>
          Descrição (aparece na página da apostila)
          <textarea name="descricao" defaultValue={a?.descricao ?? ""} rows={4} className={INPUT} />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className={ROTULO}>
            Páginas
            <input type="number" min={0} name="paginas" defaultValue={a?.paginas ?? ""} className={INPUT} />
          </label>
          <label className={ROTULO}>
            Questões
            <input type="number" min={0} name="questoes" defaultValue={a?.questoes ?? ""} className={INPUT} />
          </label>
          <label className={ROTULO}>
            Simulados
            <input type="number" min={0} name="simulados" defaultValue={a?.simulados ?? ""} className={INPUT} />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className={ROTULO}>
            Preço (R$)
            <input
              name="preco"
              required
              defaultValue={((a?.preco_centavos ?? 3990) / 100).toFixed(2).replace(".", ",")}
              className={INPUT}
            />
          </label>
          <label className={ROTULO}>
            Ordem
            <input type="number" min={0} name="ordem" defaultValue={a?.ordem ?? 0} className={INPUT} />
          </label>
          <label className={`${ROTULO} justify-end`}>
            <span className="flex items-center gap-2 pb-1.5 text-sm text-zinc-700">
              <input type="checkbox" name="destaque" defaultChecked={a?.destaque} /> Destaque
            </span>
          </label>
        </div>

        <label className={ROTULO}>
          Capa (JPG, PNG ou WebP, até 3,5 MB — proporção 2:3)
          <input type="file" name="capa" accept="image/jpeg,image/png,image/webp" className={INPUT} />
          {a?.capa_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlCapa(a.capa_path) ?? ""} alt="Capa atual" className="mt-1 h-24 w-16 rounded border border-zinc-200 object-cover" />
          )}
        </label>
        <label className={ROTULO}>
          Mockups do livro (até 4 imagens; enviar substitui as atuais — a 1ª aparece no card)
          <input type="file" name="mockups" multiple accept="image/jpeg,image/png,image/webp" className={INPUT} />
          {(a?.imagens?.length ?? 0) > 0 && (
            <span className="mt-1 flex gap-1">
              {a!.imagens.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p} src={urlCapa(p) ?? ""} alt="Mockup atual" className="h-24 w-16 rounded border border-zinc-200 bg-zinc-100 object-contain" />
              ))}
            </span>
          )}
        </label>
        <label className={ROTULO}>
          Selos (um por linha, até 5 — ex.: Edital 01/2026, Lançamento)
          <textarea name="selos" defaultValue={a?.selos?.join("\n") ?? ""} rows={3} className={INPUT} />
        </label>
        <label className={ROTULO}>
          Preço de referência (R$) — opcional
          <input name="preco_original" defaultValue={a?.preco_original_centavos ? (a.preco_original_centavos / 100).toFixed(2).replace(".", ",") : ""} placeholder="vazio = sem desconto" className={INPUT} />
          <span className="font-normal text-zinc-500">
            Gera o &quot;de R$ X&quot; e o selo de % (ex.: -27%). Use só para preço realmente praticado antes, ou promoção com data para acabar — desconto fictício é prática enganosa (CDC art. 37).
          </span>
        </label>
        <label className={ROTULO}>
          Situação
          <select name="status" defaultValue={a?.status ?? "rascunho"} className={INPUT}>
            <option value="rascunho">Rascunho (fora da vitrine)</option>
            <option value="publicada">Publicada (à venda)</option>
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : a ? "Salvar alterações" : "Criar apostila"}
          </button>
          {estado?.erro && <span className="text-sm text-red-700">{estado.erro}</span>}
          {estado?.ok && <span className="text-sm text-emerald-700">Salvo.</span>}
        </div>
      </form>

      {a && <EnvioPdf apostilaId={a.id} pdfAtual={a.pdf_path} />}
    </div>
  );
}

function EnvioPdf({ apostilaId, pdfAtual }: { apostilaId: string; pdfAtual: string | null }) {
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok" | "info"; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function enviar() {
    const arquivo = inputRef.current?.files?.[0];
    if (!arquivo) return setMsg({ tipo: "erro", texto: "Escolha o arquivo PDF." });
    if (arquivo.type !== "application/pdf" && !arquivo.name.toLowerCase().endsWith(".pdf")) {
      return setMsg({ tipo: "erro", texto: "O arquivo precisa ser um PDF." });
    }
    setEnviando(true);
    setMsg({ tipo: "info", texto: `Enviando ${(arquivo.size / 1024 / 1024).toFixed(1)} MB...` });

    const preparo = await prepararUploadPdfAction(apostilaId);
    if ("erro" in preparo) {
      setEnviando(false);
      return setMsg({ tipo: "erro", texto: preparo.erro });
    }
    const supabase = criarClienteSupabaseBrowser();
    const { error } = await supabase.storage
      .from(BUCKET_PDFS)
      .uploadToSignedUrl(preparo.path, preparo.token, arquivo, { contentType: "application/pdf" });
    if (error) {
      setEnviando(false);
      return setMsg({ tipo: "erro", texto: `Falha no envio: ${error.message}` });
    }
    const confirmacao = await confirmarUploadPdfAction(apostilaId, preparo.path);
    setEnviando(false);
    if ("erro" in confirmacao) return setMsg({ tipo: "erro", texto: confirmacao.erro });
    setMsg({ tipo: "ok", texto: "PDF enviado e vinculado à apostila." });
    if (inputRef.current) inputRef.current.value = "";
  }

  const cor = msg?.tipo === "erro" ? "text-red-700" : msg?.tipo === "ok" ? "text-emerald-700" : "text-zinc-600";

  return (
    <div className="mt-4 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3">
      <p className="mb-2 text-xs font-medium text-zinc-600">
        PDF da apostila (arquivo privado, só quem comprou baixa) ·{" "}
        {pdfAtual ? <span className="text-emerald-700">enviado: {pdfAtual}</span> : <span className="text-amber-700">ainda não enviado</span>}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept="application/pdf" className="text-sm" />
        <button
          type="button"
          onClick={enviar}
          disabled={enviando}
          className="rounded-md border border-zinc-400 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60"
        >
          {enviando ? "Enviando..." : pdfAtual ? "Substituir PDF" : "Enviar PDF"}
        </button>
        {msg && <span className={`text-sm ${cor}`}>{msg.texto}</span>}
      </div>
    </div>
  );
}
