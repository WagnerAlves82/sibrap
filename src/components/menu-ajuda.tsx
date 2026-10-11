"use client";

// Menu de ajuda do simulado: no desktop é um dock flutuante na lateral da
// tela; no mobile vira uma barra fixa no rodapé da TELA (position: fixed,
// não acompanha o scroll da página — como uma tab bar de app). Os dois
// abrem o mesmo painel de conteúdo (lateral no desktop, "bottom sheet" no
// mobile).

import { useState } from "react";

type TermoGlossario = { termo: string; definicao: string };
type ItemAjuda = "dica" | "glossario" | "capitulo";

// O pai deve renderizar com `key={questao_id}` — assim o React remonta o
// componente a cada troca de questão, e o painel fecha sozinho em vez de
// ficar aberto com a dica da questão anterior.
export function MenuAjuda({
  dica,
  termosGlossario,
}: {
  dica?: string | null;
  termosGlossario?: TermoGlossario[];
}) {
  const [aberto, setAberto] = useState<ItemAjuda | null>(null);

  const temGlossario = !!termosGlossario && termosGlossario.length > 0;

  const itens: { id: ItemAjuda; rotulo: string; disponivel: boolean; icone: React.ReactNode }[] = [
    { id: "dica", rotulo: "Dica", disponivel: !!dica, icone: <IconeDica /> },
    { id: "glossario", rotulo: "Glossário", disponivel: temGlossario, icone: <IconeGlossario /> },
    { id: "capitulo", rotulo: "Capítulo", disponivel: false, icone: <IconeCapitulo /> },
  ];

  function alternar(id: ItemAjuda) {
    setAberto((atual) => (atual === id ? null : id));
  }

  return (
    <>
      {/* Desktop: dock flutuante na lateral direita da tela.
          z-[55]: acima do painel/backdrop (continua clicável com o painel aberto)
          e acima do aviso de cookies (fixed bottom, z-50), senão fica escondido
          atrás dele na primeira visita. */}
      <div className="fixed right-5 top-1/2 z-[55] hidden -translate-y-1/2 flex-col gap-2.5 md:flex">
        {itens.map((item) => (
          <BotaoDock key={item.id} item={item} ativo={aberto === item.id} onClick={() => alternar(item.id)} />
        ))}
      </div>

      {/* Mobile: barra fixa no rodapé da TELA (não da página), estilo app */}
      <nav
        aria-label="Ajuda do simulado"
        className="fixed inset-x-0 bottom-0 z-[55] flex items-stretch justify-around border-t border-[#D7DEE6] bg-white/97 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {itens.map((item) => (
          <BotaoBarra key={item.id} item={item} ativo={aberto === item.id} onClick={() => alternar(item.id)} />
        ))}
      </nav>

      {aberto && (
        <PainelAjuda
          tipo={aberto}
          dica={dica}
          termos={termosGlossario}
          onFechar={() => setAberto(null)}
        />
      )}
    </>
  );
}

function BotaoDock({
  item,
  ativo,
  onClick,
}: {
  item: { id: ItemAjuda; rotulo: string; disponivel: boolean; icone: React.ReactNode };
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={item.disponivel ? item.rotulo : `${item.rotulo} (em breve)`}
        className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors ${
          ativo
            ? "border-brand bg-brand text-white"
            : item.disponivel
              ? "border-[#D7DEE6] bg-white text-brand hover:border-brand"
              : "border-[#E3E8EE] bg-[#F4F6F9] text-[#A7B2C0]"
        }`}
      >
        {item.icone}
      </button>
      <span className="pointer-events-none absolute right-full top-1/2 mr-2.5 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#14213A] px-2.5 py-1 text-[12px] font-semibold text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {item.rotulo}
        {!item.disponivel && " · em breve"}
      </span>
    </div>
  );
}

function BotaoBarra({
  item,
  ativo,
  onClick,
}: {
  item: { id: ItemAjuda; rotulo: string; disponivel: boolean; icone: React.ReactNode };
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold transition-colors ${
        ativo ? "text-brand" : item.disponivel ? "text-[#516278]" : "text-[#A7B2C0]"
      }`}
    >
      {item.icone}
      {item.rotulo}
    </button>
  );
}

function PainelAjuda({
  tipo,
  dica,
  termos,
  onFechar,
}: {
  tipo: ItemAjuda;
  dica?: string | null;
  termos?: TermoGlossario[];
  onFechar: () => void;
}) {
  const titulos: Record<ItemAjuda, string> = {
    dica: "Dica",
    glossario: "Glossário",
    capitulo: "Ver no capítulo",
  };

  return (
    // z-40: fica ABAIXO do dock/barra (z-50), que precisam continuar clicáveis
    // com o painel aberto — é assim que dá pra trocar de aba sem fechar antes.
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onFechar}
        className="absolute inset-0 bg-[#0B1C33]/35"
      />
      <div
        role="dialog"
        aria-label={titulos[tipo]}
        className="absolute inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-[#D7DEE6] bg-white p-5 shadow-2xl sm:bottom-auto sm:left-auto sm:right-24 sm:top-1/2 sm:max-h-[70vh] sm:w-full sm:max-w-sm sm:-translate-y-1/2 sm:rounded-2xl sm:border"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-[15px] font-extrabold text-[#14213A]">{titulos[tipo]}</p>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#516278] hover:bg-surface-2"
          >
            ✕
          </button>
        </div>

        {tipo === "dica" && (
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#33465E]">
            {dica ?? "Essa questão ainda não tem dica cadastrada."}
          </p>
        )}

        {tipo === "glossario" && <ConteudoGlossario termos={termos ?? []} />}

        {tipo === "capitulo" && (
          <p className="text-[14px] leading-relaxed text-[#516278]">
            Em breve você vai poder abrir direto o trecho da apostila que explica essa questão. Por
            enquanto, use o PDF da apostila como referência.
          </p>
        )}
      </div>
    </div>
  );
}

function ConteudoGlossario({ termos }: { termos: TermoGlossario[] }) {
  const [busca, setBusca] = useState("");

  if (termos.length === 0) {
    return (
      <p className="text-[14px] leading-relaxed text-[#516278]">
        O glossário desta apostila ainda está sendo preparado.
      </p>
    );
  }

  const filtrados = termos.filter((t) => t.termo.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <div>
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar termo..."
        className="mb-3 w-full rounded-lg border border-[#D7DEE6] px-3 py-2 text-[13.5px] text-[#14213A] outline-none focus:border-brand"
      />
      <div className="flex flex-col gap-3">
        {filtrados.map((t) => (
          <div key={t.termo}>
            <p className="text-[13.5px] font-bold text-[#14213A]">{t.termo}</p>
            <p className="text-[13.5px] leading-relaxed text-[#516278]">{t.definicao}</p>
          </div>
        ))}
        {filtrados.length === 0 && (
          <p className="text-[13.5px] text-[#516278]">Nenhum termo encontrado para &ldquo;{busca}&rdquo;.</p>
        )}
      </div>
    </div>
  );
}

// Ícones simples em SVG (sem biblioteca externa), traço único, consistentes
// com a identidade "edital oficial" do site.
function IconeDica() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 18h6M10 21h4M8.5 14.5A5.5 5.5 0 1 1 15.5 14.5c-.7.8-1.5 1.7-1.5 3H10c0-1.3-.8-2.2-1.5-3Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeGlossario() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeCapitulo() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3.5h9.5L19 7v13.5a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-16a.5.5 0 0 1 .5-.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 3.5V7a.5.5 0 0 0 .5.5H19M9 12h6M9 15.5h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
