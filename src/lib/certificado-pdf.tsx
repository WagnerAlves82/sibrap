// src/lib/certificado-pdf.tsx
//
// PDF do certificado gerado no servidor (@react-pdf/renderer), sempre em A4 PAISAGEM.
// Motivo: navegadores de celular ignoram o @page landscape da página HTML e salvavam o
// certificado em retrato, cortado (caso da aluna Viviane, 10/11/2026). Frente + verso,
// com as mesmas informações da página /certificado/[codigo].

import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { Document, Font, Image, Page, Path, Polygon, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { ASSINATURA_CARGO, ASSINATURA_CERTIFICADO, AVISO_CURSO_LIVRE, BASE_LEGAL_CERTIFICADO, EMISSOR, type ResponsavelTecnico } from "@/lib/emissor";
import { MAPA_BRASIL_PATH } from "@/lib/certificado-desenho";

Font.registerHyphenationCallback((palavra) => [palavra]);

const NAVY = "#0B2A4A";
const OURO = "#B9862A";
const TINTA = "#14213A";
const CINZA = "#516278";
const AZUL_MEDIO = "#2E5C8A";
const AZUL_CLARO = "#7FB2E6";

// A4 paisagem em pontos; 1 "cq" = 1% da largura, igual à página HTML
const LARGURA = 841.89;
const ALTURA = 595.28;
const cq = (n: number) => (n * LARGURA) / 100;

const L_ASSIN = cq(31.5);
const L_QR = cq(16.5);
const linhaAssin = { width: L_ASSIN, fontSize: cq(0.78), lineHeight: 1.4, color: "#2B3A52" };
const linhaQr = { width: L_QR, fontSize: cq(0.9), lineHeight: 1.4, color: CINZA };

export type DadosCertificadoPdf = {
  codigo: string;
  nome: string;
  cpfMascarado: string | null;
  curso: string;
  horas: number;
  emitidoEm: string;
  assinadoAlunoEm: string;
  assinadoInstituicaoEm: string;
  hashConferencia: string | null;
  responsavel?: ResponsavelTecnico | null;
  modulos: { titulo: string; aulas: string[] }[];
  siteUrl: string;
};

// imagens de /public: pela CDN do próprio site (na Vercel a pasta public não fica dentro da função);
// no computador ou numa VPS, lê direto do disco
async function imagemPublica(arquivo: string, siteUrl: string): Promise<Buffer | null> {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", arquivo));
  } catch {
    try {
      const r = await fetch(`${siteUrl}/${arquivo}`);
      return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
    } catch {
      return null;
    }
  }
}

type Imagens = { logo: Buffer | null; abed: Buffer | null; redonda: Buffer | null };

function dataExtenso(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
}
function dataHora(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}`;
}

function Triangulos() {
  // mesmos triângulos do canto superior direito da página HTML
  return (
    <Svg fixed style={{ position: "absolute", top: 0, right: 0, width: cq(30), height: cq(28) }} viewBox={`${LARGURA - cq(30)} 0 ${cq(30)} ${cq(28)}`}>
      <Polygon points={`${LARGURA},0 ${LARGURA - cq(20)},0 ${LARGURA},${cq(24)}`} fill={NAVY} fillOpacity={0.45} />
      <Polygon points={`${LARGURA},${cq(5)} ${LARGURA - cq(17)},${cq(5)} ${LARGURA},${cq(22)}`} fill={AZUL_MEDIO} fillOpacity={0.55} />
      <Polygon points={`${LARGURA - cq(9)},${cq(13)} ${LARGURA - cq(20)},${cq(13)} ${LARGURA - cq(9)},${cq(24)}`} fill={AZUL_CLARO} fillOpacity={0.65} />
      <Polygon points={`${LARGURA - cq(25)},0 ${LARGURA - cq(16)},0 ${LARGURA - cq(25)},${cq(5)}`} fill={AZUL_CLARO} fillOpacity={0.5} />
      <Polygon points={`${LARGURA - cq(1)},${cq(20)} ${LARGURA - cq(8)},${cq(20)} ${LARGURA - cq(1)},${cq(27)}`} fill={NAVY} fillOpacity={0.6} />
    </Svg>
  );
}

function Moldura({ children, ouro = true }: { children: React.ReactNode; ouro?: boolean }) {
  return (
    <View style={{ position: "absolute", top: cq(3.4), left: cq(3.4), right: cq(3.4), bottom: cq(3.4), borderWidth: cq(0.3), borderColor: NAVY, padding: ouro ? cq(0.6) : 0 }}>
      {ouro ? <View style={{ flex: 1, borderWidth: cq(0.12), borderColor: OURO }}>{children}</View> : children}
    </View>
  );
}

function Frente({ d, qr, img }: { d: DadosCertificadoPdf; qr: string; img: Imagens }) {
  const { logo, abed, redonda } = img;
  return (
    <Page size="A4" orientation="landscape" style={{ fontFamily: "Helvetica", color: TINTA }}>
      <Triangulos />
      <Moldura>
        <View style={{ flex: 1, alignItems: "center", paddingTop: cq(2.4), paddingBottom: cq(2), paddingHorizontal: cq(5) }}>
          {logo ? <Image src={logo} style={{ width: cq(17), height: cq(17) * (256 / 758) }} /> : null}
          <Text style={{ marginTop: cq(2), fontFamily: "Helvetica-Bold", fontSize: cq(5.2), letterSpacing: cq(0.6), color: NAVY }}>CERTIFICADO</Text>
          <Text style={{ marginTop: cq(0.7), fontFamily: "Helvetica-Bold", fontSize: cq(1.15), letterSpacing: cq(0.35), color: OURO }}>DE CONCLUSÃO DE CURSO</Text>
          <Text style={{ marginTop: cq(2.4), fontSize: cq(1.45), color: CINZA }}>O {EMISSOR.nome} certifica que</Text>
          <View style={{ marginTop: cq(1.3), paddingBottom: cq(0.7), borderBottomWidth: cq(0.2), borderBottomColor: OURO, maxWidth: cq(80) }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: cq(3.4), color: TINTA, textAlign: "center" }}>{d.nome}</Text>
          </View>
          {d.cpfMascarado ? <Text style={{ marginTop: cq(0.6), fontFamily: "Courier", fontSize: cq(1.1), color: CINZA }}>CPF {d.cpfMascarado}</Text> : null}
          <Text style={{ marginTop: cq(1.6), fontSize: cq(1.4), lineHeight: 1.5, textAlign: "center", maxWidth: cq(76), color: "#2B3A52" }}>
            concluiu com aproveitamento o curso de <Text style={{ fontFamily: "Helvetica-Bold", color: NAVY }}>{d.curso}</Text>, com carga horária de{" "}
            <Text style={{ fontFamily: "Helvetica-Bold", color: NAVY }}>{d.horas} horas</Text>, em {dataExtenso(d.emitidoEm)}, {BASE_LEGAL_CERTIFICADO}.
          </Text>

          <View style={{ marginTop: "auto", width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", width: cq(27) }}>
              <Image src={qr} style={{ width: cq(9), height: cq(9), flexShrink: 0 }} />
              <View style={{ marginLeft: cq(1.2), width: L_QR }}>
                <Text style={[linhaQr, { fontFamily: "Helvetica-Bold", color: NAVY }]}>Valide este certificado</Text>
                <Text style={linhaQr}>Aponte a câmera para o QR Code</Text>
                <Text style={linhaQr}>ou acesse {d.siteUrl.replace(/^https?:\/\//, "")}/validar</Text>
                <Text style={[linhaQr, { fontFamily: "Courier-Bold", color: TINTA, marginTop: cq(0.3) }]}>Código {d.codigo}</Text>
              </View>
            </View>

            {abed ? (
              <View style={{ alignItems: "center", width: cq(11) }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: cq(0.75), letterSpacing: cq(0.15), color: NAVY, marginBottom: cq(0.3) }}>SOMOS ASSOCIADOS</Text>
                <Image src={abed} style={{ height: cq(5.5), width: cq(5.5) * (180 / 156) }} />
              </View>
            ) : null}

            <View style={{ width: cq(38), flexDirection: "row", alignItems: "center", borderWidth: 0.75, borderColor: "#D5DEEA", paddingVertical: cq(0.6), paddingHorizontal: cq(0.9) }}>
              {redonda ? <Image src={redonda} style={{ width: cq(3.8), height: cq(3.8), flexShrink: 0 }} /> : null}
              {/* largura em cada linha: o @react-pdf ignorava a largura do bloco e quebrava o texto pela metade */}
              <View style={{ marginLeft: cq(1), width: L_ASSIN }}>
                <Text style={[linhaAssin, { fontFamily: "Helvetica-Bold", color: NAVY, fontSize: cq(0.9) }]}>Documento assinado eletronicamente</Text>
                <Text style={linhaAssin}>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: OURO }}>• </Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{d.nome}</Text>
                  {d.cpfMascarado ? ` · CPF ${d.cpfMascarado}` : ""} · {dataHora(d.assinadoAlunoEm)}
                </Text>
                <Text style={linhaAssin}>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: OURO }}>• </Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{ASSINATURA_CERTIFICADO}</Text> · {ASSINATURA_CARGO} · {dataHora(d.assinadoInstituicaoEm)}
                </Text>
                {d.responsavel ? (
                  <Text style={linhaAssin}>
                    Responsável técnico: <Text style={{ fontFamily: "Helvetica-Bold" }}>{d.responsavel.nome}</Text> · {d.responsavel.titulo} ·{" "}
                    {d.responsavel.registro}
                  </Text>
                ) : null}
                <Text style={[linhaAssin, { color: "#6B7A8F", fontSize: cq(0.7) }]}>
                  CNPJ {EMISSOR.cnpj}
                  {d.hashConferencia ? ` · Conferência ${d.hashConferencia.slice(0, 12).toUpperCase()}` : ""} · Lei 14.063/2020
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Moldura>
    </Page>
  );
}

function Verso({ d }: { d: DadosCertificadoPdf }) {
  // duas colunas equilibradas pelo número de linhas (título do módulo + aulas)
  const peso = (m: { aulas: string[] }) => m.aulas.length + 2;
  const total = d.modulos.reduce((s, m) => s + peso(m), 0);
  const esquerda: typeof d.modulos = [];
  const direita: typeof d.modulos = [];
  let acumulado = 0;
  for (const m of d.modulos) {
    (acumulado < total / 2 ? esquerda : direita).push(m);
    acumulado += peso(m);
  }
  const indice = (m: (typeof d.modulos)[number]) => d.modulos.indexOf(m) + 1;
  const tamanhoAula = d.modulos.reduce((s, m) => s + m.aulas.length, 0) > 30 ? cq(0.82) : cq(0.95);

  const coluna = (itens: typeof d.modulos, mapa?: boolean) => (
    <View style={{ width: "48.5%" }}>
      {itens.map((m) => (
        <View key={m.titulo} wrap={false} style={{ marginBottom: cq(1), borderWidth: 0.75, borderColor: "#000000" }}>
          <Text style={{ backgroundColor: "#000000", color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: cq(1.05), paddingVertical: cq(0.35), paddingHorizontal: cq(0.7) }}>
            {indice(m)}. {m.titulo.replace(/^Módulo \d+\s*[–-]\s*/, "")}
          </Text>
          {m.aulas.map((a, j) => (
            <Text key={j} style={{ fontSize: tamanhoAula, color: "#1A1A1A", paddingVertical: cq(0.25), paddingHorizontal: cq(0.7), borderTopWidth: j > 0 ? 0.5 : 0, borderTopColor: "#B9B9B9" }}>
              {a}
            </Text>
          ))}
        </View>
      ))}
      {mapa ? (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: cq(0.4) }}>
          <Svg viewBox="0 0 100 100" style={{ width: cq(6), height: cq(6) }}>
            <Path d={MAPA_BRASIL_PATH} fill="#000000" />
          </Svg>
          <Text style={{ marginLeft: cq(1), fontFamily: "Helvetica-Bold", fontSize: cq(1.05), color: "#000000" }}>Válido em todo{"\n"}o território nacional</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <Page size="A4" orientation="landscape" style={{ fontFamily: "Helvetica", color: TINTA }}>
      <Moldura ouro={false}>
        <View style={{ flex: 1, paddingVertical: cq(2.2), paddingHorizontal: cq(4) }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: cq(2.3), color: NAVY }}>Conteúdo programático</Text>
          <Text style={{ fontSize: cq(1.15), color: CINZA, marginTop: cq(0.4) }}>
            {d.curso} · {d.horas} horas
          </Text>
          <View style={{ marginTop: cq(1.5), flexDirection: "row", justifyContent: "space-between" }}>
            {coluna(esquerda, true)}
            {coluna(direita)}
          </View>
          <View style={{ marginTop: "auto", fontSize: cq(0.9), color: CINZA, lineHeight: 1.45 }}>
            <Text>
              A carga horária corresponde às aulas, atividades práticas e à avaliação final, com nota mínima de aprovação. A autenticidade deste certificado pode ser
              conferida a qualquer momento em {d.siteUrl.replace(/^https?:\/\//, "")}/validar, informando o código{" "}
              <Text style={{ fontFamily: "Helvetica-Bold", color: NAVY }}>{d.codigo}</Text>.
            </Text>
            <Text style={{ marginTop: cq(0.5) }}>{AVISO_CURSO_LIVRE}</Text>
          </View>
        </View>
      </Moldura>
    </Page>
  );
}

export async function gerarPdfCertificado(d: DadosCertificadoPdf): Promise<Buffer> {
  const qr = await QRCode.toDataURL(`${d.siteUrl}/validar/${d.codigo}`, {
    margin: 0,
    width: 300,
    errorCorrectionLevel: "M",
    color: { dark: NAVY, light: "#FFFFFF" },
  });
  const [logo, abed, redonda] = await Promise.all([
    imagemPublica("logo-horizontal.png", d.siteUrl),
    imagemPublica("abed.png", d.siteUrl),
    imagemPublica("logo-redonda.png", d.siteUrl),
  ]);
  return renderToBuffer(
    <Document title={`Certificado ${d.codigo}`} author={EMISSOR.nome} subject={d.curso}>
      <Frente d={d} qr={qr} img={{ logo, abed, redonda }} />
      <Verso d={d} />
    </Document>
  );
}
