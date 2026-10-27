// Prévia do currículo em HTML: uma folha A4 (794 x 1123 px) nos 3 modelos.
// O PDF (src/lib/curriculo/pdf.tsx) desenha o mesmo documento com as mesmas medidas
// (1 px aqui = 0,75 pt lá), para a prévia ficar igual ao arquivo baixado.

import type { Documento, Item, Secao } from "@/lib/curriculo/secoes";
import type { Modelo } from "@/lib/curriculo/tipos";

const AZUL = "#0b2a4a";
const TEXTO = "#2b3a4d";
const CINZA = "#5b6b7e";
const FONTE = "Helvetica, Arial, sans-serif";

function Itens({ itens, compacto }: { itens: Item[]; compacto?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compacto ? 8 : 11 }}>
      {itens.map((it, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, fontSize: compacto ? 13 : 14, color: AZUL }}>{it.titulo || it.subtitulo}</span>
            {it.periodo && <span style={{ fontSize: 12, color: CINZA, whiteSpace: "nowrap" }}>{it.periodo}</span>}
          </div>
          {it.titulo && it.subtitulo && <div style={{ fontSize: 13, color: CINZA }}>{it.subtitulo}</div>}
          {it.texto && <div style={{ fontSize: 13, marginTop: 3, whiteSpace: "pre-line", lineHeight: 1.45 }}>{it.texto}</div>}
        </div>
      ))}
    </div>
  );
}

function Conteudo({ s, compacto }: { s: Secao; compacto?: boolean }) {
  if (s.tipo === "texto") return <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0, whiteSpace: "pre-line" }}>{s.texto}</p>;
  if (s.tipo === "itens") return <Itens itens={s.itens} compacto={compacto} />;
  return <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{s.etiquetas.join("  ·  ")}</p>;
}

function Foto({ foto, largura }: { foto: string; largura: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={foto} alt="" style={{ width: largura, height: largura * (4 / 3), objectFit: "cover", display: "block" }} />;
}

export function FolhaCurriculo({ doc, modelo, foto }: { doc: Documento; modelo: Modelo; foto?: string | null }) {
  const folha: React.CSSProperties = {
    width: 794,
    minHeight: 1123,
    background: "#fff",
    color: TEXTO,
    fontFamily: FONTE,
    boxSizing: "border-box",
  };
  const nome = doc.nome || "Seu nome completo";

  if (modelo === "moderno") {
    const lateral = new Set(doc.lateral.map((s) => s.chave));
    return (
      <div style={{ ...folha, display: "flex" }}>
        <aside style={{ width: 270, background: AZUL, color: "#fff", padding: "48px 28px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 26 }}>
          {foto && <Foto foto={foto} largura={150} />}
          <div>
            <h3 style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px", color: "#d4a24a" }}>Contato</h3>
            {doc.contatos.map((c) => (
              <p key={c} style={{ fontSize: 12.5, margin: "0 0 5px", wordBreak: "break-word" }}>{c}</p>
            ))}
          </div>
          {doc.lateral.map((s) => (
            <div key={s.chave}>
              <h3 style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px", color: "#d4a24a" }}>{s.titulo}</h3>
              {s.tipo === "etiquetas" &&
                s.etiquetas.map((e) => (
                  <p key={e} style={{ fontSize: 12.5, margin: "0 0 5px" }}>• {e}</p>
                ))}
            </div>
          ))}
        </aside>
        <main style={{ flex: 1, padding: "48px 40px", boxSizing: "border-box" }}>
          <h1 style={{ fontSize: 32, color: AZUL, margin: "0 0 26px", lineHeight: 1.1 }}>{nome}</h1>
          {doc.secoes.filter((s) => !lateral.has(s.chave)).map((s) => (
            <section key={s.chave} style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase", color: AZUL, margin: "0 0 8px", paddingBottom: 4, borderBottom: "2px solid #d4a24a" }}>{s.titulo}</h2>
              <Conteudo s={s} />
            </section>
          ))}
        </main>
      </div>
    );
  }

  if (modelo === "compacto") {
    return (
      <div style={{ ...folha, padding: "44px 48px" }}>
        <h1 style={{ fontSize: 27, color: AZUL, margin: 0 }}>{nome}</h1>
        <p style={{ fontSize: 12.5, color: CINZA, margin: "6px 0 18px" }}>{doc.contatos.join("  ·  ")}</p>
        {doc.secoes.map((s) => (
          <section key={s.chave} style={{ display: "flex", gap: 18, borderTop: "1px solid #d7dee6", padding: "10px 0" }}>
            <h2 style={{ width: 150, flexShrink: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: AZUL, margin: "2px 0 0" }}>{s.titulo}</h2>
            <div style={{ flex: 1 }}>
              <Conteudo s={s} compacto />
            </div>
          </section>
        ))}
      </div>
    );
  }

  // clássico
  return (
    <div style={{ ...folha, padding: "52px 60px" }}>
      <header style={{ display: "flex", gap: 22, alignItems: "center", marginBottom: 24, justifyContent: foto ? "flex-start" : "center", textAlign: foto ? "left" : "center" }}>
        {foto && <Foto foto={foto} largura={96} />}
        <div>
          <h1 style={{ fontSize: 30, color: AZUL, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{nome}</h1>
          <p style={{ fontSize: 13, color: CINZA, margin: "8px 0 0" }}>{doc.contatos.join("  ·  ")}</p>
        </div>
      </header>
      {doc.secoes.map((s) => (
        <section key={s.chave} style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase", color: AZUL, margin: "0 0 8px", paddingBottom: 4, borderBottom: `1.5px solid ${AZUL}` }}>{s.titulo}</h2>
          <Conteudo s={s} />
        </section>
      ))}
    </div>
  );
}
