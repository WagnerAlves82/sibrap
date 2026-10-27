// src/lib/curriculo/pdf.tsx
//
// PDF A4 do currículo, gerado no servidor com @react-pdf/renderer (sem navegador/Chromium,
// leve o bastante para o plano gratuito da Vercel). Desenha o mesmo Documento da prévia
// (src/components/curriculo/folha.tsx), com as medidas convertidas (1 px = 0,75 pt).
// Helvetica embutida no PDF cobre os acentos do português; páginas extras saem sozinhas.

import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Documento, Item, Secao } from "./secoes";
import type { Modelo } from "./tipos";

// sem hifenização automática (ela é em inglês e quebrava "PROFIS-SIONAL")
Font.registerHyphenationCallback((palavra) => [palavra]);

const AZUL = "#0b2a4a";
const TEXTO = "#2b3a4d";
const CINZA = "#5b6b7e";
const OURO = "#d4a24a";
const px = (v: number) => v * 0.75;

const s = StyleSheet.create({
  pagina: { fontFamily: "Helvetica", fontSize: px(13.5), color: TEXTO, lineHeight: 1.45 },
  negrito: { fontFamily: "Helvetica-Bold" },
  tituloSecao: {
    fontFamily: "Helvetica-Bold",
    fontSize: px(14),
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: AZUL,
    paddingBottom: px(4),
    marginBottom: px(8),
  },
  linhaItem: { flexDirection: "row", justifyContent: "space-between" },
  itemTitulo: { fontFamily: "Helvetica-Bold", fontSize: px(14), color: AZUL, flexShrink: 1, paddingRight: px(12) },
  periodo: { fontSize: px(12), color: CINZA },
  sub: { fontSize: px(13), color: CINZA },
  textoItem: { fontSize: px(13), marginTop: px(3) },
});

function CorpoItem({ it, compacto }: { it: Item; compacto?: boolean }) {
  return (
    <>
      <View style={s.linhaItem}>
        <Text style={[s.itemTitulo, compacto ? { fontSize: px(13) } : {}]}>{it.titulo || it.subtitulo}</Text>
        {it.periodo ? <Text style={s.periodo}>{it.periodo}</Text> : null}
      </View>
      {it.titulo && it.subtitulo ? <Text style={s.sub}>{it.subtitulo}</Text> : null}
      {it.texto ? <Text style={s.textoItem}>{it.texto}</Text> : null}
    </>
  );
}

// dentro de um bloco que já não quebra (título + primeiro item), o item não pode ter wrap={false}
// de novo: blocos inquebráveis aninhados fazem o @react-pdf sobrepor os textos no pé da página
function Itens({ itens, compacto, dentroDeBloco }: { itens: Item[]; compacto?: boolean; dentroDeBloco?: boolean }) {
  return (
    <View>
      {itens.map((it, i) => (
        <View key={i} wrap={!!dentroDeBloco} style={{ marginBottom: compacto ? px(8) : px(11) }}>
          <CorpoItem it={it} compacto={compacto} />
        </View>
      ))}
    </View>
  );
}

function Conteudo({ sec, compacto, dentroDeBloco }: { sec: Secao; compacto?: boolean; dentroDeBloco?: boolean }) {
  if (sec.tipo === "texto") return <Text>{sec.texto}</Text>;
  if (sec.tipo === "itens") return <Itens itens={sec.itens} compacto={compacto} dentroDeBloco={dentroDeBloco} />;
  return <Text style={{ lineHeight: 1.6 }}>{sec.etiquetas.join("  ·  ")}</Text>;
}

/** Seção com o título preso ao primeiro item: o título nunca fica sozinho no pé da página. */
function SecaoComTitulo({ sec, titulo }: { sec: Secao; titulo: React.ReactNode }) {
  if (sec.tipo !== "itens") {
    return (
      <View wrap={false}>
        {titulo}
        <Conteudo sec={sec} />
      </View>
    );
  }
  // título e primeiro item no mesmo bloco, num nível só (blocos aninhados quebram o layout)
  const [primeiro, ...resto] = sec.itens;
  return (
    <>
      <View wrap={false} style={{ marginBottom: px(11) }}>
        {titulo}
        <CorpoItem it={primeiro} />
      </View>
      {resto.length > 0 && <Itens itens={resto} />}
    </>
  );
}

function Foto({ foto, largura }: { foto: string; largura: number }) {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image src={foto} style={{ width: px(largura), height: px(largura * (4 / 3)), objectFit: "cover", borderRadius: 3 }} />;
}

function Classico({ doc, foto }: { doc: Documento; foto?: string | null }) {
  return (
    <Page size="A4" style={[s.pagina, { paddingVertical: px(52), paddingHorizontal: px(60) }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: foto ? "flex-start" : "center", marginBottom: px(24) }}>
        {foto ? <View style={{ marginRight: px(22) }}><Foto foto={foto} largura={96} /></View> : null}
        <View style={{ flexShrink: 1 }}>
          <Text style={[s.negrito, { fontSize: px(30), color: AZUL, textTransform: "uppercase", letterSpacing: 0.8, textAlign: foto ? "left" : "center" }]}>{doc.nome}</Text>
          <Text style={{ fontSize: px(13), color: CINZA, marginTop: px(8), textAlign: foto ? "left" : "center" }}>{doc.contatos.join("  ·  ")}</Text>
        </View>
      </View>
      {doc.secoes.map((sec) => (
        <View key={sec.chave} style={{ marginBottom: px(20) }}>
          <SecaoComTitulo sec={sec} titulo={<Text style={[s.tituloSecao, { borderBottomWidth: 1.1, borderBottomColor: AZUL }]}>{sec.titulo}</Text>} />
        </View>
      ))}
    </Page>
  );
}

function Compacto({ doc }: { doc: Documento }) {
  return (
    <Page size="A4" style={[s.pagina, { paddingVertical: px(44), paddingHorizontal: px(48) }]}>
      <Text style={[s.negrito, { fontSize: px(27), color: AZUL }]}>{doc.nome}</Text>
      <Text style={{ fontSize: px(12.5), color: CINZA, marginTop: px(6), marginBottom: px(18) }}>{doc.contatos.join("  ·  ")}</Text>
      {doc.secoes.map((sec) => {
        // título preso ao primeiro item; os demais itens seguem na mesma coluna
        const [primeiro, resto] = sec.tipo === "itens" ? [{ ...sec, itens: sec.itens.slice(0, 1) }, sec.itens.slice(1)] : [sec, []];
        return (
          <View key={sec.chave} style={{ borderTopWidth: 0.75, borderTopColor: "#d7dee6", paddingVertical: px(10) }}>
            <View wrap={false} style={{ flexDirection: "row" }}>
              <Text style={[s.negrito, { width: px(150), fontSize: px(12), textTransform: "uppercase", letterSpacing: 0.75, color: AZUL, paddingRight: px(18), marginTop: px(2) }]}>{sec.titulo}</Text>
              <View style={{ flex: 1 }}>
                <Conteudo sec={primeiro} compacto dentroDeBloco />
              </View>
            </View>
            {resto.length > 0 && (
              <View style={{ marginLeft: px(150) }}>
                <Itens itens={resto} compacto />
              </View>
            )}
          </View>
        );
      })}
    </Page>
  );
}

function Moderno({ doc, foto }: { doc: Documento; foto?: string | null }) {
  const lateral = new Set(doc.lateral.map((x) => x.chave));
  const larguraLateral = px(270);
  const tituloLateral = { fontFamily: "Helvetica-Bold", fontSize: px(13), letterSpacing: 1.5, textTransform: "uppercase" as const, color: OURO, marginBottom: px(8) };
  return (
    <Page size="A4" style={[s.pagina, { flexDirection: "row", paddingVertical: px(48) }]}>
      {/* faixa azul em todas as páginas */}
      <View fixed style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: larguraLateral, backgroundColor: AZUL }} />
      <View style={{ width: larguraLateral, paddingHorizontal: px(28), color: "#fff" }}>
        {foto ? <View style={{ marginBottom: px(26) }}><Foto foto={foto} largura={150} /></View> : null}
        <View style={{ marginBottom: px(26) }}>
          <Text style={tituloLateral}>Contato</Text>
          {doc.contatos.map((c) => (
            <Text key={c} style={{ fontSize: px(12.5), marginBottom: px(5), color: "#fff" }}>{c}</Text>
          ))}
        </View>
        {doc.lateral.map((sec) => (
          <View key={sec.chave} style={{ marginBottom: px(26) }}>
            <Text style={tituloLateral}>{sec.titulo}</Text>
            {sec.tipo === "etiquetas"
              ? sec.etiquetas.map((e) => (
                  <Text key={e} style={{ fontSize: px(12.5), marginBottom: px(5), color: "#fff" }}>• {e}</Text>
                ))
              : null}
          </View>
        ))}
      </View>
      <View style={{ flex: 1, paddingHorizontal: px(40) }}>
        <Text style={[s.negrito, { fontSize: px(32), color: AZUL, marginBottom: px(26), lineHeight: 1.1 }]}>{doc.nome}</Text>
        {doc.secoes
          .filter((sec) => !lateral.has(sec.chave))
          .map((sec) => (
            <View key={sec.chave} style={{ marginBottom: px(22) }}>
              <SecaoComTitulo sec={sec} titulo={<Text style={[s.tituloSecao, { borderBottomWidth: 1.5, borderBottomColor: OURO }]}>{sec.titulo}</Text>} />
            </View>
          ))}
      </View>
    </Page>
  );
}

export async function gerarPdfCurriculo(doc: Documento, modelo: Modelo, foto?: string | null): Promise<Buffer> {
  const pagina =
    modelo === "moderno" ? <Moderno doc={doc} foto={foto} /> : modelo === "compacto" ? <Compacto doc={doc} /> : <Classico doc={doc} foto={foto} />;
  return renderToBuffer(
    <Document title={`Currículo - ${doc.nome}`} author={doc.nome} creator="SIBRAP · sibrap.tec.br" producer="SIBRAP" language="pt-BR">
      {pagina}
    </Document>
  );
}
