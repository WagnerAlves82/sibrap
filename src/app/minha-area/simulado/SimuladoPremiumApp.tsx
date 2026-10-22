"use client";

import { useState } from "react";
import Link from "next/link";
import { SimuladoApostilaApp } from "@/app/minha-area/apostilas/[slug]/simulado/SimuladoApostilaApp";
import type { QuestaoRetomada } from "./actions";

export type CargoSimulado = {
  id: string;
  nome: string;
  quadro: string | null;
  conteudoCompleto: boolean;
  /** quantidade de questões da prova real */
  padrao: number;
  /** questões que o banco tem para o cargo */
  totalDisponivel: number;
};

/**
 * Simulado completo (Transpetro): escolhe o cargo e usa o mesmo simulado das apostilas, com escolha da
 * quantidade de questões, respostas salvas na hora, "continuar de onde parou" e novo sorteio ao terminar.
 */
export function SimuladoPremiumApp({
  produtoId,
  cargos,
  retomada,
  cargoRetomadaId,
}: {
  produtoId: string;
  cargos: CargoSimulado[];
  retomada: QuestaoRetomada[] | null;
  cargoRetomadaId: string | null;
}) {
  const [cargoId, setCargoId] = useState<string | null>(retomada ? cargoRetomadaId : null);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [retomadaAtiva, setRetomadaAtiva] = useState<QuestaoRetomada[] | null>(retomada);
  const cargo = cargos.find((c) => c.id === cargoId) ?? null;

  if (cargo) {
    return (
      <SimuladoApostilaApp
        key={`${cargo.id}-${retomadaAtiva ? "retomada" : "novo"}`}
        produtoId={produtoId}
        cargoId={cargo.id}
        tituloApostila={`Simulado completo, ${cargo.nome}`}
        areaHref="/minha-area"
        rotuloVoltar="Voltar pra minha área"
        padrao={cargo.padrao}
        totalDisponivel={cargo.totalDisponivel}
        retomada={retomadaAtiva}
        aoTrocarCargo={() => {
          setRetomadaAtiva(null);
          setEscolhido(null);
          setCargoId(null);
        }}
      />
    );
  }

  const grupos = [
    { titulo: "Quadro Terra", lista: cargos.filter((c) => c.quadro === "Terra") },
    { titulo: "Quadro Mar", lista: cargos.filter((c) => c.quadro === "Mar") },
    { titulo: "Outros", lista: cargos.filter((c) => c.quadro !== "Terra" && c.quadro !== "Mar") },
  ].filter((g) => g.lista.length > 0);

  return (
    <div className="rounded-xl border border-[#D7DEE6] bg-white p-6 sm:p-8">
      <Link href="/minha-area" className="text-[13px] font-semibold text-brand underline underline-offset-4">
        ← Voltar pra minha área
      </Link>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-[#14213A]">Simulado completo</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">
        Escolha o cargo. Na próxima tela você define quantas questões quer fazer, as respostas ficam salvas e, ao terminar,
        dá para sortear um novo simulado.
      </p>
      {grupos.map((g) => (
        <div key={g.titulo} className="mt-5">
          <p className="mb-2 font-data text-[11.5px] font-semibold uppercase tracking-wide text-[#516278]">{g.titulo}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {g.lista.map((c) => (
              <button
                key={c.id}
                onClick={() => setEscolhido(c.id)}
                className={`rounded-lg border px-4 py-2.5 text-left text-[14px] transition-colors ${
                  escolhido === c.id
                    ? "border-brand bg-[#EEF3F8] text-[#14213A]"
                    : "border-[#D7DEE6] bg-white text-[#33465E] hover:border-[#B9CBDF]"
                }`}
              >
                {c.nome}
                {!c.conteudoCompleto && (
                  <span className="ml-2 text-[#B9862A]" title="Conhecimentos Específicos em construção">
                    ⚠
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={() => setCargoId(escolhido)}
        disabled={!escolhido}
        className="mt-6 w-full rounded-lg bg-brand px-5 py-3.5 text-[15px] font-bold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continuar
      </button>
    </div>
  );
}
