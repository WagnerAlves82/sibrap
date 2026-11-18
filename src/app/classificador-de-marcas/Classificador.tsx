"use client";

import { useMemo, useState } from "react";
import dados from "@/lib/classificador-marcas.json";

// Classificador de classes de Nice para registro de marca (curso Registre Sua Marca no INPI).
// Busca local, sem API: o texto digitado é comparado com o nome e as palavras-chave de cada tipo de negócio.

type ClasseNegocio = { n: number; principal?: boolean; motivo: string; buscar: string[] };
type Negocio = { negocio: string; palavras: string[]; classes: ClasseNegocio[] };

const CLASSES = dados.classes as Record<string, string>;
const NEGOCIOS = dados.negocios as Negocio[];

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // plural simples: "marmitas" = "marmita", "bolos" = "bolo"
    .split(" ")
    .map((w) => (w.length > 3 ? w.replace(/s$/, "") : w))
    .join(" ");

const INDICE = NEGOCIOS.map((n) => ({
  n,
  nome: normalizar(n.negocio),
  palavras: n.palavras.map(normalizar),
}));

function buscar(texto: string): Negocio[] {
  const q = normalizar(texto);
  if (q.length < 3) return [];
  const termos = q.split(" ").filter((t) => t.length >= 3);
  return INDICE.map((item) => {
    let pontos = 0;
    for (const p of item.palavras) {
      if (` ${q} `.includes(` ${p} `)) pontos += 3 + p.length;
      else if (p.includes(q)) pontos += 2 + q.length;
    }
    for (const t of termos) {
      // radical simples: "doces" acha "doce", "costureira" acha "costura"
      const raiz = t.length > 5 ? t.slice(0, t.length - 2) : t;
      if (item.nome.includes(raiz)) pontos += 2;
      if (item.palavras.some((p) => p.includes(raiz))) pontos += 1;
    }
    return { item, pontos };
  })
    .filter((r) => r.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    // esconde resultados fracos perto do primeiro (ex.: "pet shop" puxando restaurante por "espetinho")
    .filter((r, _i, lista) => r.pontos >= lista[0].pontos * 0.4)
    .slice(0, 3)
    .map((r) => r.item.n);
}

export function Classificador() {
  const [texto, setTexto] = useState("");
  const resultados = useMemo(() => buscar(texto), [texto]);
  const pesquisou = normalizar(texto).length >= 3;
  // sem WhatsApp no site (Wagner, 18/11/2026): dúvida vira solicitação por e-mail
  const zap = "/solicitacao?tipo=outro&origem=classificador-marcas";

  return (
    <div>
      <label htmlFor="negocio" className="font-display text-[1.1rem] font-extrabold text-[#14213A]">
        O que o seu negócio faz ou vende?
      </label>
      <input
        id="negocio"
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ex.: doceria, loja de roupas, salão de beleza, curso online"
        autoComplete="off"
        className="mt-2 w-full border-2 border-[#C9D3DF] bg-white px-4 py-3.5 text-[16px] text-[#14213A] outline-none focus:border-brand"
      />

      {pesquisou && resultados.length === 0 && (
        <div className="mt-5 border-l-4 border-accent bg-[#FFF8E6] p-4 text-[15px] text-[#33465E]">
          Não encontramos esse negócio na lista. Tente outra palavra (o que você vende ou o serviço que presta) ou fale com o professor.
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {resultados.map((r) => (
          <article key={r.negocio} className="border border-[#D7DEE6] bg-white p-5">
            <h3 className="font-display text-[1.15rem] font-extrabold text-[#14213A]">{r.negocio}</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {r.classes.map((c) => (
                <li key={c.n} className={`border-l-4 p-3 ${c.principal ? "border-accent bg-[#F6F8FB]" : "border-[#D7DEE6]"}`}>
                  <p className="font-data text-[13px] font-bold text-[#14213A]">
                    Classe {c.n}
                    {c.principal && <span className="ml-2 bg-accent px-2 py-0.5 text-[11px] uppercase text-accent-ink">Registre primeiro</span>}
                  </p>
                  <p className="mt-0.5 text-[13.5px] text-[#516278]">{CLASSES[String(c.n)]}</p>
                  <p className="mt-1.5 text-[14.5px] text-[#33465E]">
                    <strong>Quando:</strong> {c.motivo}
                  </p>
                  <p className="mt-1 text-[13.5px] text-[#516278]">
                    <strong>Busque na lista do e-Marcas:</strong> {c.buscar.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14.5px] text-[#516278]">
        <span>Ficou em dúvida?</span>
        <a href={zap} className="bg-brand px-5 py-2.5 font-bold text-white transition-all hover:brightness-125">
          Falar com o professor
        </a>
      </div>
    </div>
  );
}
