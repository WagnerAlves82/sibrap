"use client";

import { useMemo, useState } from "react";
import type { ApostilaVitrine } from "@/lib/apostilas";
import { CardApostila } from "@/components/card-apostila";

// Vitrine com filtros (categoria, estado e busca). A lista é pequena e
// já vem completa do servidor — filtrar no navegador evita ida e volta.
export function VitrineApostilas({
  apostilas,
  comBusca = false,
  limite,
  ufInicial = "",
}: {
  apostilas: ApostilaVitrine[];
  comBusca?: boolean;
  limite?: number;
  ufInicial?: string;
}) {
  const [categoria, setCategoria] = useState("Todas");
  const [uf, setUf] = useState(ufInicial);
  const [busca, setBusca] = useState("");

  const categorias = useMemo(
    () => ["Todas", ...Array.from(new Set(apostilas.map((a) => a.categoria)))],
    [apostilas]
  );
  const ufs = useMemo(
    () => Array.from(new Set(apostilas.map((a) => a.uf))).sort(),
    [apostilas]
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = apostilas.filter(
      (a) =>
        (categoria === "Todas" || a.categoria === categoria) &&
        (!uf || a.uf === uf) &&
        (!termo ||
          `${a.titulo} ${a.orgao} ${a.cargo} ${a.cidade ?? ""} ${a.banca ?? ""}`
            .toLowerCase()
            .includes(termo))
    );
    return limite ? lista.slice(0, limite) : lista;
  }, [apostilas, categoria, uf, busca, limite]);

  const chip = (ativo: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
      ativo
        ? "border-brand bg-brand text-white"
        : "border-[#D7DEE6] bg-white text-[#516278] hover:border-brand hover:text-brand"
    }`;

  return (
    <div>
      {(categorias.length > 2 || ufs.length > 1 || comBusca) && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {categorias.map((c) => (
              <button key={c} type="button" onClick={() => setCategoria(c)} className={chip(categoria === c)} aria-pressed={categoria === c}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {ufs.length > 1 && (
              <select
                aria-label="Filtrar por estado"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="rounded-lg border border-[#D7DEE6] bg-white px-3 py-2 text-[13.5px] text-[#14213A]"
              >
                <option value="">Todos os estados</option>
                {ufs.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}
            {comBusca && (
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar órgão, cargo ou cidade"
                aria-label="Buscar apostila"
                className="w-full min-w-0 rounded-lg border border-[#D7DEE6] bg-white px-3 py-2 text-[13.5px] text-[#14213A] sm:w-64"
              />
            )}
          </div>
        </div>
      )}

      {filtradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#C4CEDA] bg-white px-6 py-12 text-center text-[15px] text-[#516278]">
          {apostilas.length === 0
            ? "As primeiras apostilas estão sendo finalizadas. Volte em breve!"
            : "Nenhuma apostila encontrada com esses filtros."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {filtradas.map((a) => (
            <CardApostila key={a.id} apostila={a} />
          ))}
        </div>
      )}
    </div>
  );
}
