"use client";

import { startTransition, useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";
import { PixCheckoutClaro } from "@/components/pix-checkout-claro";
import { CLASSE_INPUT } from "@/components/auth-shell";
import { formatarCpf } from "@/lib/cpf";
import {
  criarPagamentoCertificadoAction,
  emitirCertificadoAction,
  enviarComprovanteAction,
  type EstadoComprovante,
  type EstadoEmissao,
} from "./actions";

const BOTAO =
  "w-full rounded-lg bg-accent px-5 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105 disabled:opacity-60";

// Reduz fotos de celular (muitas passam de 4 MB) antes de enviar
async function comprimirImagem(arquivo: File): Promise<File> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) return arquivo;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.8));
  if (!blob) return arquivo;
  return new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function FormComprovante() {
  const [estado, action, pending] = useActionState<EstadoComprovante, FormData>(
    enviarComprovanteAction,
    null
  );
  const [preparando, setPreparando] = useState(false);

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("arquivo") as HTMLInputElement;
    let arquivo = input.files?.[0];
    if (!arquivo) return;
    setPreparando(true);
    try {
      if (arquivo.type.startsWith("image/")) arquivo = await comprimirImagem(arquivo);
    } catch {
      // segue com o arquivo original
    }
    setPreparando(false);
    const dados = new FormData();
    dados.set("arquivo", arquivo);
    startTransition(() => action(dados));
  }

  if (estado?.ok) {
    return (
      <Alert variant="sucesso" claro className="text-sm">
        Comprovante enviado! Nossa equipe vai conferir e o resultado aparece
        aqui nesta página.
      </Alert>
    );
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3">
      <label htmlFor="arquivo" className="text-[13.5px] font-semibold text-[#14213A]">
        Comprovante de inscrição no CadÚnico (PDF, JPG ou PNG)
      </label>
      <input
        id="arquivo"
        name="arquivo"
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        required
        className="block w-full text-[13.5px] text-[#516278] file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2.5 file:text-[13.5px] file:font-bold file:text-white hover:file:brightness-110"
      />
      <button type="submit" disabled={pending || preparando} className={BOTAO}>
        {preparando ? "Preparando arquivo..." : pending ? "Enviando..." : "Enviar comprovante"}
      </button>
      {estado?.erro && (
        <p role="alert" className="text-sm text-[#B3261E]">
          {estado.erro}
        </p>
      )}
      <p className="text-[12px] leading-relaxed text-[#93A0AF]">
        Usamos o documento apenas para confirmar sua inscrição e o apagamos
        assim que a análise termina.
      </p>
    </form>
  );
}

export function PagamentoCertificado({
  cursoSlug,
  formato = "online",
}: {
  cursoSlug: string;
  formato?: "online" | "impresso";
}) {
  const router = useRouter();
  return (
    <PixCheckoutClaro
      rotuloBotao="Pagar com PIX"
      criarPix={() => criarPagamentoCertificadoAction(cursoSlug, formato)}
      aoAprovar={() => router.refresh()}
    />
  );
}

// Só dígitos, formatado como 00000-000.
function formatarCep(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

export function FormEmitir({
  cursoId,
  nomeSugerido,
  formato = "online",
}: {
  cursoId: string;
  nomeSugerido: string;
  formato?: "online" | "impresso";
}) {
  const [estado, action, pending] = useActionState<EstadoEmissao, FormData>(
    emitirCertificadoAction,
    null
  );
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="curso_id" value={cursoId} />
      <input type="hidden" name="formato" value={formato} />
      <label htmlFor="nome" className="text-[13.5px] font-semibold text-[#14213A]">
        Seu nome completo, como deve aparecer no certificado
      </label>
      <input
        id="nome"
        name="nome"
        type="text"
        defaultValue={nomeSugerido}
        required
        minLength={5}
        autoComplete="name"
        className={CLASSE_INPUT}
      />
      <label htmlFor="cpf" className="text-[13.5px] font-semibold text-[#14213A]">
        Seu CPF
      </label>
      <input
        id="cpf"
        name="cpf"
        type="text"
        inputMode="numeric"
        value={cpf}
        onChange={(e) => setCpf(formatarCpf(e.target.value))}
        placeholder="000.000.000-00"
        required
        minLength={14}
        maxLength={14}
        autoComplete="off"
        className={CLASSE_INPUT}
      />

      {formato === "impresso" && (
        <>
          <p className="mt-2 text-[13.5px] font-semibold text-[#14213A]">
            Endereço de entrega
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="cep"
              type="text"
              inputMode="numeric"
              value={cep}
              onChange={(e) => setCep(formatarCep(e.target.value))}
              placeholder="CEP"
              required
              minLength={9}
              maxLength={9}
              className={CLASSE_INPUT}
            />
            <input name="telefone" type="tel" placeholder="Telefone p/ contato" required className={CLASSE_INPUT} />
          </div>
          <input name="logradouro" type="text" placeholder="Rua / Avenida" required className={CLASSE_INPUT} />
          <div className="grid grid-cols-2 gap-3">
            <input name="numero" type="text" placeholder="Número" required className={CLASSE_INPUT} />
            <input name="complemento" type="text" placeholder="Complemento (opcional)" className={CLASSE_INPUT} />
          </div>
          <input name="bairro" type="text" placeholder="Bairro" required className={CLASSE_INPUT} />
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <input name="cidade" type="text" placeholder="Cidade" required className={CLASSE_INPUT} />
            <input name="uf" type="text" placeholder="UF" required maxLength={2} className={CLASSE_INPUT} />
          </div>
        </>
      )}

      <p className="text-[12px] text-[#93A0AF]">
        Usamos o CPF só para identificação no certificado — ele aparece parcialmente oculto na versão pública.
        Confira com atenção: depois de emitido, o certificado não pode ser alterado.
      </p>
      <button type="submit" disabled={pending} className={BOTAO}>
        {pending ? "Emitindo..." : "Emitir meu certificado"}
      </button>
      {estado?.erro && (
        <p role="alert" className="text-sm text-[#B3261E]">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
