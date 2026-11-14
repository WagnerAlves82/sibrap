"use client";

// Jogos das aulas de elétrica (blocos "circuito" e "bornes" da aula interativa).
// circuito: o aluno aciona disjuntor e interruptores e vê a corrente e a lâmpada (simples, three-way, four-way).
// bornes: o aluno escolhe um fio e toca no borne onde ele deve ser ligado; depois "liga o disjuntor" para testar.
import { useState } from "react";

const FASE = "#D32F2F";
const NEUTRO = "#3FA9F5";
const RETORNO = "#E0A800";
const PARALELO = "#8E24AA";
const MORTO = "#B8C2CF";
const TINTA = "#14213A";

export type ModeloCircuito = "simples" | "threeway" | "fourway";

type Estado = { dj: boolean; s1: number; s2: number; x: number };

function aceso(m: ModeloCircuito, e: Estado) {
  if (!e.dj) return false;
  if (m === "simples") return e.s1 === 1;
  if (m === "threeway") return e.s1 === e.s2;
  return (e.s1 ^ e.x) === e.s2;
}

const CONTROLES: Record<ModeloCircuito, { id: keyof Estado; nome: string }[]> = {
  simples: [
    { id: "s1", nome: "Interruptor" },
    { id: "dj", nome: "Disjuntor" },
  ],
  threeway: [
    { id: "s1", nome: "Interruptor 1" },
    { id: "s2", nome: "Interruptor 2" },
    { id: "dj", nome: "Disjuntor" },
  ],
  fourway: [
    { id: "s1", nome: "Interruptor 1" },
    { id: "x", nome: "Intermediário" },
    { id: "s2", nome: "Interruptor 2" },
    { id: "dj", nome: "Disjuntor" },
  ],
};

function Fio({ pts, cor, vivo = false }: { pts: [number, number][]; cor: string; vivo?: boolean }) {
  return (
    <polyline
      points={pts.map((p) => p.join(",")).join(" ")}
      fill="none"
      stroke={cor}
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={vivo ? "10 8" : undefined}
      className={vivo ? "fio-vivo" : undefined}
    />
  );
}

function Borne({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={5.5} fill="#fff" stroke={TINTA} strokeWidth={2} />;
}

// área clicável de um componente do desenho (interruptor ou disjuntor)
function Toque({ x, y, w, h, rotulo, onClick, children }: { x: number; y: number; w: number; h: number; rotulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={rotulo}
      onClick={onClick}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onClick();
        }
      }}
      style={{ cursor: "pointer" }}
      className="outline-none focus-visible:[&>rect]:stroke-[#E0A800]"
    >
      <rect x={x} y={y} width={w} height={h} fill="#F4F7FA" stroke={TINTA} strokeWidth={2} />
      {children}
    </g>
  );
}

export function JogoCircuito({ modelo, onConcluir }: { modelo: ModeloCircuito; onConcluir: () => void }) {
  // começa com a lâmpada apagada e o disjuntor ligado
  const [e, setE] = useState<Estado>({ dj: true, s1: 0, s2: modelo === "simples" ? 0 : 1, x: 0 });
  const [usados, setUsados] = useState<Set<string>>(new Set());
  const controles = CONTROLES[modelo];
  const luz = aceso(modelo, e);

  const acionar = (id: keyof Estado) => {
    const novo: Estado = id === "dj" ? { ...e, dj: !e.dj } : { ...e, [id]: e[id] ? 0 : 1 };
    setE(novo);
    // só conta quando o comando realmente acendeu ou apagou a lâmpada
    if (aceso(modelo, novo) !== luz && !usados.has(id)) {
      const n = new Set(usados).add(id);
      setUsados(n);
      if (n.size === controles.length) onConcluir();
    }
  };

  // geometria
  const paralelo1 = modelo === "simples" ? null : modelo === "threeway" ? { c: 200, o: 250 } : { c: 170, o: 215 };
  const paralelo2 = modelo === "simples" ? null : modelo === "threeway" ? { o: 400, c: 450 } : { o: 425, c: 470 };
  const yC = 180;
  const yA = 165;
  const yB = 195;
  const xLamp = 580;
  const faseAte = modelo === "simples" ? 280 : paralelo1!.c;
  const retornoDe = modelo === "simples" ? 340 : paralelo2!.c;
  const faseViva = e.dj;
  // qual dos dois fios paralelos está com tensão em cada trecho (0 = de cima, 1 = de baixo)
  const vivo1 = e.s1;
  const vivo2 = modelo === "fourway" ? e.s1 ^ e.x : e.s1;

  return (
    <div>
      <style>{`@keyframes fio-corre { to { stroke-dashoffset: -36; } } .fio-vivo { animation: fio-corre 0.9s linear infinite; } @media (prefers-reduced-motion: reduce) { .fio-vivo { animation: none; } }`}</style>
      <div className="border border-[#D7DEE6] bg-white p-2">
        <svg viewBox="0 0 640 250" className="h-auto w-full" role="img" aria-label={`Circuito ${luz ? "com a lâmpada acesa" : "com a lâmpada apagada"}`}>
          {/* neutro */}
          <Fio pts={[[90, 105], [115, 105], [115, 40], [xLamp, 40], [xLamp, 78]]} cor={NEUTRO} vivo={luz} />
          {/* fase até o primeiro comando */}
          <Fio pts={[[90, 140], [140, 140], [140, yC], [faseAte, yC]]} cor={faseViva ? FASE : MORTO} vivo={luz} />

          {modelo !== "simples" && (
            <>
              {/* paralelos entre o 1º interruptor e o 2º (ou o intermediário) */}
              <Fio pts={[[paralelo1!.o, yA], [modelo === "fourway" ? 290 : paralelo2!.o, yA]]} cor={faseViva && vivo1 === 0 ? PARALELO : MORTO} vivo={luz && vivo1 === 0} />
              <Fio pts={[[paralelo1!.o, yB], [modelo === "fourway" ? 290 : paralelo2!.o, yB]]} cor={faseViva && vivo1 === 1 ? PARALELO : MORTO} vivo={luz && vivo1 === 1} />
              {modelo === "fourway" && (
                <>
                  <Fio pts={[[350, yA], [paralelo2!.o, yA]]} cor={faseViva && vivo2 === 0 ? PARALELO : MORTO} vivo={luz && vivo2 === 0} />
                  <Fio pts={[[350, yB], [paralelo2!.o, yB]]} cor={faseViva && vivo2 === 1 ? PARALELO : MORTO} vivo={luz && vivo2 === 1} />
                </>
              )}
            </>
          )}

          {/* retorno até a lâmpada */}
          <Fio pts={[[retornoDe, yC], [xLamp, yC], [xLamp, 122]]} cor={luz ? RETORNO : MORTO} vivo={luz} />

          {/* disjuntor */}
          <Toque x={20} y={85} w={70} h={75} rotulo={`Disjuntor ${e.dj ? "ligado" : "desligado"}`} onClick={() => acionar("dj")}>
            <rect x={42} y={e.dj ? 97 : 123} width={26} height={26} fill={e.dj ? "#2E7D32" : "#9AA6B4"} />
            <text x={55} y={e.dj ? 115 : 141} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
              {e.dj ? "ON" : "OFF"}
            </text>
          </Toque>
          <text x={55} y={177} textAnchor="middle" fontSize={12} fill="#516278">
            Disjuntor
          </text>

          {/* interruptor simples */}
          {modelo === "simples" && (
            <>
              <Toque x={262} y={150} w={96} h={56} rotulo={`Interruptor ${e.s1 ? "ligado" : "desligado"}`} onClick={() => acionar("s1")}>
                <line x1={280} y1={yC} x2={e.s1 ? 340 : 334} y2={e.s1 ? yC : yC - 22} stroke={TINTA} strokeWidth={4} strokeLinecap="round" />
                <Borne x={280} y={yC} />
                <Borne x={340} y={yC} />
              </Toque>
              <text x={310} y={224} textAnchor="middle" fontSize={12} fill="#516278">
                Interruptor (toque)
              </text>
            </>
          )}

          {/* paralelos */}
          {paralelo1 && paralelo2 && (
            <>
              <Toque x={paralelo1.c - 18} y={145} w={paralelo1.o - paralelo1.c + 36} h={70} rotulo="Interruptor 1" onClick={() => acionar("s1")}>
                <line x1={paralelo1.c} y1={yC} x2={paralelo1.o} y2={e.s1 ? yB : yA} stroke={TINTA} strokeWidth={4} strokeLinecap="round" />
                <Borne x={paralelo1.c} y={yC} />
                <Borne x={paralelo1.o} y={yA} />
                <Borne x={paralelo1.o} y={yB} />
              </Toque>
              <text x={(paralelo1.c + paralelo1.o) / 2} y={232} textAnchor="middle" fontSize={12} fill="#516278">
                Interruptor 1
              </text>
              <Toque x={paralelo2.o - 18} y={145} w={paralelo2.c - paralelo2.o + 36} h={70} rotulo="Interruptor 2" onClick={() => acionar("s2")}>
                <line x1={paralelo2.c} y1={yC} x2={paralelo2.o} y2={e.s2 ? yB : yA} stroke={TINTA} strokeWidth={4} strokeLinecap="round" />
                <Borne x={paralelo2.c} y={yC} />
                <Borne x={paralelo2.o} y={yA} />
                <Borne x={paralelo2.o} y={yB} />
              </Toque>
              <text x={(paralelo2.c + paralelo2.o) / 2} y={232} textAnchor="middle" fontSize={12} fill="#516278">
                Interruptor 2
              </text>
            </>
          )}

          {/* intermediário */}
          {modelo === "fourway" && (
            <>
              <Toque x={272} y={145} w={96} h={70} rotulo={`Intermediário ${e.x ? "cruzado" : "reto"}`} onClick={() => acionar("x")}>
                <line x1={290} y1={yA} x2={350} y2={e.x ? yB : yA} stroke={TINTA} strokeWidth={4} strokeLinecap="round" />
                <line x1={290} y1={yB} x2={350} y2={e.x ? yA : yB} stroke={TINTA} strokeWidth={4} strokeLinecap="round" />
                <Borne x={290} y={yA} />
                <Borne x={290} y={yB} />
                <Borne x={350} y={yA} />
                <Borne x={350} y={yB} />
              </Toque>
              <text x={320} y={232} textAnchor="middle" fontSize={12} fill="#516278">
                Intermediário
              </text>
            </>
          )}

          {/* lâmpada */}
          <circle cx={xLamp} cy={100} r={22} fill={luz ? "#FFD54A" : "#F4F7FA"} stroke={TINTA} strokeWidth={2} style={luz ? { filter: "drop-shadow(0 0 12px rgba(255,200,40,0.95))" } : undefined} />
          <line x1={xLamp - 13} y1={87} x2={xLamp + 13} y2={113} stroke={TINTA} strokeWidth={2} />
          <line x1={xLamp - 13} y1={113} x2={xLamp + 13} y2={87} stroke={TINTA} strokeWidth={2} />
          <text x={xLamp} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill={luz ? "#9A6B00" : "#516278"}>
            {luz ? "ACESA" : "apagada"}
          </text>
        </svg>
      </div>

      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {controles.map((c) => {
          const ok = usados.has(c.id);
          return (
            <li key={c.id} className={`flex items-center gap-2 border px-3 py-2 text-[15px] ${ok ? "border-accent-2 bg-[#E6F4F1] text-accent-2" : "border-[#D7DEE6] bg-white text-[#516278]"}`}>
              <span aria-hidden className="font-bold">
                {ok ? "✓" : "○"}
              </span>
              <span>
                Acenda ou apague usando: <strong>{c.nome}</strong>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[13.5px] text-[#516278]">
        Toque nas peças do desenho. Fio tracejado em movimento = corrente passando. Fio cinza = sem tensão.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------

const CORES: Record<string, string> = {
  vermelho: FASE,
  preto: "#222",
  azul: NEUTRO,
  "azul-claro": NEUTRO,
  amarelo: RETORNO,
  branco: "#FFFFFF",
  verde: "#2E7D32",
  "verde-amarelo": "#2E7D32",
  roxo: PARALELO,
};

export type FioJogo = { id: string; nome: string; cor: string };
export type BorneJogo = { id: string; nome: string; certo: string; dica: string };

export function JogoBornes({ fios, bornes, sucesso, onConcluir }: { fios: FioJogo[]; bornes: BorneJogo[]; sucesso: string; onConcluir: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [lig, setLig] = useState<Record<string, string>>({});
  const [res, setRes] = useState<{ ok: boolean; msg: string } | null>(null);
  const fioPor = (id: string) => fios.find((f) => f.id === id);
  const usado = (fioId: string) => Object.values(lig).includes(fioId);
  const completos = bornes.every((b) => lig[b.id]);

  const ligar = (borneId: string) => {
    if (res?.ok) return;
    setRes(null);
    if (!sel) {
      // sem fio escolhido: tocar no borne solta o fio que estava nele
      if (lig[borneId]) setLig((l) => Object.fromEntries(Object.entries(l).filter(([k]) => k !== borneId)));
      return;
    }
    setLig((l) => ({ ...Object.fromEntries(Object.entries(l).filter(([, v]) => v !== sel)), [borneId]: sel }));
    setSel(null);
  };

  const testar = () => {
    const errado = bornes.find((b) => lig[b.id] !== b.certo);
    if (errado) {
      setRes({ ok: false, msg: `Não funcionou. Confira "${errado.nome}": ${errado.dica}` });
    } else {
      setRes({ ok: true, msg: sucesso });
      onConcluir();
    }
  };

  const Amostra = ({ cor }: { cor: string }) => (
    <span
      aria-hidden
      className="inline-block h-3.5 w-9 shrink-0 border border-[#14213A]/40"
      style={
        cor === "verde-amarelo"
          ? { background: "repeating-linear-gradient(90deg, #2E7D32 0 7px, #F2C200 7px 14px)" }
          : { background: CORES[cor] ?? cor }
      }
    />
  );

  return (
    <div>
      <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">1. Escolha um fio</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {fios.map((f) => (
          <button
            key={f.id}
            type="button"
            disabled={res?.ok}
            onClick={() => setSel(sel === f.id ? null : f.id)}
            aria-pressed={sel === f.id}
            className={`flex items-center gap-2 border-2 px-3 py-2 text-[15px] font-semibold transition-colors ${
              sel === f.id ? "border-accent bg-[#FFF8EB] text-[#14213A]" : usado(f.id) ? "border-[#D7DEE6] bg-surface-2 text-[#93A0AF]" : "border-[#D7DEE6] bg-white text-[#14213A]"
            }`}
          >
            <Amostra cor={f.cor} />
            {f.nome}
          </button>
        ))}
      </div>

      <p className="mt-5 font-data text-xs font-semibold uppercase tracking-wide text-accent-2">2. Toque no borne onde ele vai</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {bornes.map((b) => {
          const f = lig[b.id] ? fioPor(lig[b.id]) : null;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => ligar(b.id)}
              className={`flex min-h-[64px] items-center gap-3 border-2 border-dashed px-4 py-3 text-left ${f ? "border-[#14213A] bg-white" : sel ? "border-accent bg-[#FFF8EB]" : "border-[#C4CEDA] bg-white"}`}
            >
              <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[#14213A] bg-[#F4F7FA] font-data text-[11px] font-bold text-[#14213A]">
                ⊕
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15.5px] font-bold text-[#14213A]">{b.nome}</span>
                {f ? (
                  <span className="mt-0.5 flex items-center gap-2 text-[14px] text-[#516278]">
                    <Amostra cor={f.cor} /> {f.nome}
                  </span>
                ) : (
                  <span className="text-[13.5px] text-[#93A0AF]">vazio</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {!res?.ok && (
        <button
          type="button"
          onClick={testar}
          disabled={!completos}
          className="mt-4 bg-accent px-5 py-3 text-[15.5px] font-bold text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          3. Ligar o disjuntor e testar
        </button>
      )}
      {res && (
        <p role="status" className={`mt-3 border-l-4 px-4 py-3 text-[15.5px] ${res.ok ? "border-accent-2 bg-[#E6F4F1] text-[#14213A]" : "border-[#D32F2F] bg-[#FDECEC] text-[#14213A]"}`}>
          {res.ok ? "✓ " : "✕ "}
          {res.msg}
        </p>
      )}
      <p className="mt-2 text-[13.5px] text-[#516278]">No jogo você testa ligando o disjuntor. No serviço real, as ligações são feitas sempre com o circuito desligado e testado.</p>
    </div>
  );
}
