"use client";

import { useActionState } from "react";
import { enviarSolicitacao, type EstadoSolicitacao } from "./actions";
import { TIPOS_SOLICITACAO } from "./tipos";

const INPUT =
  "w-full border border-[#C4CEDA] bg-white px-4 py-3 text-[15px] text-[#14213A] outline-none placeholder:text-[#93A0AF] focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";
const ROTULO = "mb-1 block text-[14px] font-semibold text-[#14213A]";

export function FormSolicitacao({ tipoInicial, origem }: { tipoInicial?: string; origem?: string }) {
  const [estado, action, pending] = useActionState<EstadoSolicitacao, FormData>(enviarSolicitacao, null);

  if (estado?.enviado) {
    return (
      <div className="border border-[#D7DEE6] border-l-4 border-l-zinc-900 bg-white p-6">
        <p className="font-display text-xl font-extrabold text-[#14213A]">Pedido recebido!</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">
          Vamos analisar e responder no seu e-mail (ou WhatsApp, se você informou) em até 2 dias úteis.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 border border-[#D7DEE6] bg-white p-6">
      {origem && <input type="hidden" name="origem" value={origem} />}
      <div aria-hidden className="hidden">
        <label>
          Site <input name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        <label htmlFor="nome" className={ROTULO}>Nome</label>
        <input id="nome" name="nome" required minLength={2} maxLength={120} autoComplete="name" className={INPUT} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={ROTULO}>E-mail</label>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className={INPUT} />
        </div>
        <div>
          <label htmlFor="whatsapp" className={ROTULO}>WhatsApp (opcional)</label>
          <input id="whatsapp" name="whatsapp" inputMode="tel" maxLength={30} placeholder="(00) 00000-0000" autoComplete="tel" className={INPUT} />
        </div>
      </div>
      <div>
        <label htmlFor="tipo" className={ROTULO}>O que você precisa?</label>
        <select id="tipo" name="tipo" required defaultValue={tipoInicial ?? ""} className={INPUT}>
          <option value="" disabled>Escolha uma opção</option>
          {TIPOS_SOLICITACAO.map((t) => (
            <option key={t.valor} value={t.valor}>{t.rotulo}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="descricao" className={ROTULO}>Descreva o seu pedido</label>
        <textarea
          id="descricao"
          name="descricao"
          required
          minLength={20}
          maxLength={3000}
          rows={7}
          placeholder="Ex.: quero os certificados de Redação Oficial e Arquivo num pacote só, com 20 horas cada. Já fiz os dois cursos."
          className={INPUT}
        />
        <p className="mt-1 text-[13px] text-[#8A97A8]">Quanto mais detalhes (cursos, cargas horárias, prazos), mais rápida a resposta.</p>
      </div>
      <label className="flex gap-3 text-[14px] leading-snug text-[#2B3A52]">
        <input type="checkbox" name="aceite" required className="mt-0.5 h-4 w-4 shrink-0 accent-zinc-900" />
        Autorizo o uso destes dados só para responder a este pedido.
      </label>
      <button
        type="submit"
        disabled={pending}
        className="bg-zinc-900 px-6 py-3.5 text-[15px] font-bold text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar pedido"}
      </button>
      {estado?.erro && (
        <p role="alert" className="text-sm text-[#B3261E]">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
