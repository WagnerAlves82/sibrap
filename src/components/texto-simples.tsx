import { Fragment } from "react";

// Renderiza o texto de apoio das aulas: parágrafos, listas com "- " ou
// "1. " e **negrito**. Sem HTML livre (nada de dangerouslySetInnerHTML).
function inline(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") ? (
      <strong key={i} className="font-bold text-[#14213A]">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{parte}</Fragment>
    )
  );
}

type Bloco =
  | { tipo: "p"; texto: string }
  | { tipo: "ul" | "ol"; itens: string[] };

function interpretar(texto: string): Bloco[] {
  const blocos: Bloco[] = [];
  for (const linha of texto.trim().split("\n")) {
    const l = linha.trim();
    if (!l) continue;
    const marcador = l.match(/^- (.*)/);
    const numerado = l.match(/^\d+\.\s+(.*)/);
    const ultimo = blocos[blocos.length - 1];
    if (marcador) {
      if (ultimo?.tipo === "ul") ultimo.itens.push(marcador[1]);
      else blocos.push({ tipo: "ul", itens: [marcador[1]] });
    } else if (numerado) {
      if (ultimo?.tipo === "ol") ultimo.itens.push(numerado[1]);
      else blocos.push({ tipo: "ol", itens: [numerado[1]] });
    } else {
      blocos.push({ tipo: "p", texto: l });
    }
  }
  return blocos;
}

export function TextoSimples({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 text-[15.5px] leading-relaxed text-[#3A4A63] ${className}`}>
      {interpretar(texto).map((b, i) =>
        b.tipo === "p" ? (
          <p key={i}>{inline(b.texto)}</p>
        ) : b.tipo === "ul" ? (
          <ul key={i} className="flex flex-col gap-1.5 pl-1">
            {b.itens.map((item, j) => (
              <li key={j} className="flex gap-2.5">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{inline(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ol key={i} className="flex list-decimal flex-col gap-1.5 pl-6 marker:font-bold marker:text-accent">
            {b.itens.map((item, j) => (
              <li key={j}>{inline(item)}</li>
            ))}
          </ol>
        )
      )}
    </div>
  );
}
