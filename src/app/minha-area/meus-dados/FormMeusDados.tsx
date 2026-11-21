"use client";

import { useActionState, useRef, useState } from "react";
import { salvarMeusDados, type EstadoDados } from "./actions";

const MAX_KB = 50;

export function FormMeusDados({ nome, profissao, foto, email }: { nome: string; profissao: string; foto: string | null; email: string }) {
  const [estado, acao, salvando] = useActionState<EstadoDados, FormData>(salvarMeusDados, {});
  const [previa, setPrevia] = useState<string | null>(foto);
  const [avisoFoto, setAvisoFoto] = useState("");
  const [remover, setRemover] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const campo = "mt-1 w-full border border-[#C5CFDA] bg-white px-3 py-2.5 text-[15px] text-[#14213A] focus:border-brand focus:outline-none";
  const rotulo = "block text-[13.5px] font-bold text-[#33465E]";

  function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setAvisoFoto("");
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setAvisoFoto("Use uma foto JPG, PNG ou WEBP.");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_KB * 1024) {
      setAvisoFoto(`Esta foto tem ${Math.ceil(f.size / 1024)} KB. O máximo é ${MAX_KB} KB: diminua ou recorte a imagem e tente de novo.`);
      e.target.value = "";
      return;
    }
    setRemover(false);
    setPrevia(URL.createObjectURL(f));
  }

  return (
    <form action={acao} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        {previa && !remover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previa} alt="Sua foto" className="h-20 w-20 rounded-full border-[3px] border-accent object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand font-display text-3xl font-extrabold text-white">
            {(nome || "A")[0]}
          </span>
        )}
        <div>
          <label className="inline-block cursor-pointer border-2 border-brand px-3 py-1.5 text-[14px] font-bold text-brand hover:bg-[#EEF3F8]">
            {previa && !remover ? "Trocar foto" : "Incluir foto"}
            <input ref={arquivo} type="file" name="foto" accept="image/jpeg,image/png,image/webp" onChange={escolher} className="sr-only" />
          </label>
          {previa && !remover && (
            <button
              type="button"
              onClick={() => {
                setRemover(true);
                if (arquivo.current) arquivo.current.value = "";
              }}
              className="ml-3 text-[13.5px] font-semibold text-[#8A97A8] underline underline-offset-2 hover:text-[#C0392B]"
            >
              Remover
            </button>
          )}
          <p className="mt-1.5 text-[12.5px] text-[#8A97A8]">JPG, PNG ou WEBP, até {MAX_KB} KB. Opcional.</p>
          {avisoFoto && <p className="mt-1 text-[13px] font-semibold text-[#C0392B]">{avisoFoto}</p>}
          <input type="hidden" name="remover_foto" value={remover ? "1" : "0"} />
        </div>
      </div>

      <label className={rotulo}>
        Nome completo
        <input name="nome" required minLength={5} maxLength={80} defaultValue={nome} autoComplete="name" className={campo} />
        <span className="mt-1 block text-[12.5px] font-normal text-[#8A97A8]">É o nome que sai nos seus certificados.</span>
      </label>

      <label className={rotulo}>
        Profissão <span className="font-normal text-[#8A97A8]">(opcional)</span>
        <input name="profissao" maxLength={60} defaultValue={profissao} placeholder="Ex.: auxiliar administrativo, estudante, professora" className={campo} />
      </label>

      <label className={rotulo}>
        E-mail
        <input value={email} readOnly className={`${campo} bg-[#F6F8FB] text-[#516278]`} />
      </label>

      {estado.erro && <p className="border-l-4 border-[#C0392B] bg-[#FDECEA] px-3 py-2 text-[14px] text-[#8E2A20]">{estado.erro}</p>}
      {estado.ok && <p className="border-l-4 border-accent-2 bg-[#E6F4F1] px-3 py-2 text-[14px] font-semibold text-[#0B5A4E]">Dados salvos!</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={salvando} className="bg-accent px-6 py-3 text-[15px] font-extrabold text-accent-ink hover:brightness-105 disabled:opacity-60">
          {salvando ? "Salvando…" : "Salvar meus dados"}
        </button>
        <a href="/esqueci-senha" className="text-[14px] font-semibold text-brand underline underline-offset-4">
          Alterar minha senha
        </a>
      </div>
    </form>
  );
}
