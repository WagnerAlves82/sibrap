"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";
import { responderPesquisaAction, type EstadoPesquisa } from "./actions";

const ESCALA = [
  { v: 1, rotulo: "Muito ruim" },
  { v: 2, rotulo: "Ruim" },
  { v: 3, rotulo: "Regular" },
  { v: 4, rotulo: "Bom" },
  { v: 5, rotulo: "Ótimo" },
];

const PERGUNTAS_1_A_5 = [
  { nome: "satisfacao", texto: "1. De modo geral, qual a sua satisfação com o curso?" },
  { nome: "clareza", texto: "2. As explicações das aulas foram claras e fáceis de entender?" },
  { nome: "material", texto: "3. O que achou do material do curso (textos, vídeos e atividades)?" },
  { nome: "exercicios", texto: "4. Os exercícios e atividades ajudaram você a fixar o conteúdo?" },
] as const;

function Escala({ nome, texto, valor, mudar }: { nome: string; texto: string; valor?: number; mudar: (v: number) => void }) {
  return (
    <fieldset className="border-t border-[#EEF2F6] pt-4">
      <legend className="text-[15px] font-semibold text-[#14213A]">{texto}</legend>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {ESCALA.map((e) => (
          <label
            key={e.v}
            className={`flex cursor-pointer flex-col items-center gap-0.5 border px-1 py-2 text-center ${valor === e.v ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"}`}
          >
            <input type="radio" name={nome} value={e.v} className="sr-only" checked={valor === e.v} onChange={() => mudar(e.v)} required />
            <span className="font-data text-[16px] font-bold leading-none" aria-hidden>
              {e.v}★
            </span>
            <span className="text-[11.5px] font-semibold leading-tight">{e.rotulo}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PesquisaSatisfacao({ cursoId, cursoNome }: { cursoId: string; cursoNome: string }) {
  const router = useRouter();
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [estado, enviar, enviando] = useActionState<EstadoPesquisa, FormData>(async (anterior, dados) => {
    const r = await responderPesquisaAction(anterior, dados);
    if (r?.ok) router.refresh();
    return r;
  }, null);
  const mudar = (k: string) => (v: number) => setNotas((n) => ({ ...n, [k]: v }));
  const respondidas = Object.keys(notas).length;
  const [pulou, setPulou] = useState(false);
  const [confirmou, setConfirmou] = useState(false);
  // notas que se contradizem (ex.: 1★ na satisfação e 10 na recomendação) costumam ser clique errado
  const baixas = (["satisfacao", "clareza", "material", "exercicios", "aplicacao"] as const).filter((k) => (notas[k] ?? 5) <= 2);
  const contraditoria = baixas.length > 0 && baixas.length <= 2 && (notas.recomendacao ?? 0) >= 8;
  const precisaConfirmar = contraditoria && !confirmou;
  if (pulou) return null;

  return (
    <section className="border-2 border-accent bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Opcional · 1 minuto</p>
        <button type="button" onClick={() => setPulou(true)} className="text-[13px] font-semibold text-[#516278] underline underline-offset-4">
          Agora não
        </button>
      </div>
      <h2 className="mt-1 font-display text-xl font-extrabold text-[#14213A]">Como foi o curso para você?</h2>
      <p className="mt-1 text-[14.5px] leading-relaxed text-[#516278]">
        Parabéns por concluir {cursoNome}! Dê notas em 7 perguntas rápidas, só com cliques. Seu certificado não depende disso.
      </p>
      <p className="mt-2 font-data text-[12.5px] text-[#93A0AF]">{respondidas} de 7 respondidas</p>

      <form action={enviar} className="mt-4 flex flex-col gap-5">
        <input type="hidden" name="curso_id" value={cursoId} />
        {PERGUNTAS_1_A_5.map((p) => (
          <Escala key={p.nome} nome={p.nome} texto={p.texto} valor={notas[p.nome]} mudar={mudar(p.nome)} />
        ))}

        <fieldset className="border-t border-[#EEF2F6] pt-4">
          <legend className="text-[15px] font-semibold text-[#14213A]">5. O que achou da duração do curso?</legend>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[
              ["curta", "Curta demais"],
              ["adequada", "Na medida certa"],
              ["longa", "Longa demais"],
            ].map(([v, r]) => (
              <label
                key={v}
                className={`cursor-pointer border px-2 py-2.5 text-center text-[13.5px] font-semibold ${notas.duracao === ["curta", "adequada", "longa"].indexOf(v) ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"}`}
              >
                <input
                  type="radio"
                  name="duracao"
                  value={v}
                  className="sr-only"
                  required
                  onChange={() => mudar("duracao")(["curta", "adequada", "longa"].indexOf(v))}
                />
                {r}
              </label>
            ))}
          </div>
        </fieldset>

        <Escala
          nome="aplicacao"
          texto="6. O que você aprendeu vai ajudar no trabalho ou no dia a dia?"
          valor={notas.aplicacao}
          mudar={mudar("aplicacao")}
        />

        <fieldset className="border-t border-[#EEF2F6] pt-4">
          <legend className="text-[15px] font-semibold text-[#14213A]">
            7. De 0 a 10, quanto você recomendaria este curso a um amigo?
          </legend>
          <div className="mt-2 grid grid-cols-6 gap-1 sm:grid-cols-11">
            {Array.from({ length: 11 }, (_, n) => (
              <label
                key={n}
                className={`cursor-pointer border py-2 text-center font-data text-[14px] font-semibold ${notas.recomendacao === n ? "border-brand bg-brand text-white" : "border-[#D7DEE6] bg-white text-[#14213A] hover:border-brand"}`}
              >
                <input type="radio" name="recomendacao" value={n} className="sr-only" required onChange={() => mudar("recomendacao")(n)} />
                {n}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1.5 border-t border-[#EEF2F6] pt-4">
          <span className="text-[15px] font-semibold text-[#14213A]">
            Quer contar o motivo das suas notas? <span className="font-normal text-[#516278]">(opcional)</span>
          </span>
          <textarea
            name="comentario"
            rows={3}
            maxLength={1000}
            placeholder="O que você mais gostou? O que podemos melhorar?"
            className="border border-[#D7DEE6] bg-white px-3 py-2 text-[14.5px] text-[#14213A] focus:border-brand focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-1.5 border-t border-[#EEF2F6] pt-4">
          <label htmlFor="depoimento" className="text-[15px] font-semibold text-[#14213A]">
            Em uma frase: o que este curso trouxe de bom para você? <span className="font-normal text-[#516278]">(opcional)</span>
          </label>
          <textarea
            id="depoimento"
            name="depoimento"
            rows={2}
            maxLength={600}
            placeholder="Ex.: Aprendi a… e agora me sinto mais preparado para…"
            className="border border-[#D7DEE6] bg-white px-3 py-2 text-[14.5px] text-[#14213A] focus:border-brand focus:outline-none"
          />
          <label className="flex cursor-pointer items-start gap-2 text-[13.5px] text-[#516278]">
            <input type="checkbox" name="autoriza_depoimento" className="mt-0.5" />
            Autorizo o SIBRAP a publicar esta frase no site e nas redes, com meu primeiro nome.
          </label>
        </div>

        {contraditoria && (
          <div className="border-l-4 border-accent bg-[#FFF8E6] px-4 py-3 text-[14px] text-[#14213A]">
            <p>
              Você deu <strong>{notas[baixas[0]]}★</strong> em uma pergunta, mas recomendaria o curso com nota{" "}
              <strong>{notas.recomendacao}</strong>. Está certo? Se foi sem querer, é só clicar na nota certa acima.
            </p>
            <label className="mt-2 flex cursor-pointer items-center gap-2 font-semibold">
              <input type="checkbox" checked={confirmou} onChange={(e) => setConfirmou(e.target.checked)} />
              Sim, minhas notas estão certas
            </label>
          </div>
        )}

        {estado?.erro && (
          <Alert variant="erro" claro>
            {estado.erro}
          </Alert>
        )}
        <button
          type="submit"
          disabled={enviando || respondidas < 7 || precisaConfirmar}
          className="bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105 disabled:opacity-50"
        >
          {enviando
            ? "Enviando…"
            : respondidas < 7
              ? `Responda as 7 perguntas (${respondidas}/7)`
              : precisaConfirmar
                ? "Confirme suas notas acima"
                : "Enviar minhas notas →"}
        </button>
      </form>
    </section>
  );
}
