import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { AVISO_CURSO_LIVRE, EMISSOR, formatarHoras } from "@/lib/emissor";
import { SeloAbed } from "@/components/selo-abed";
import { BotaoImprimir } from "./BotaoImprimir";

export const metadata: Metadata = {
  title: "Certificado",
  robots: { index: false, follow: false },
};

const NAVY = "#0B2A4A";
const OURO = "#B9862A";
const TINTA = "#14213A";
const AZUL_MEDIO = "#2E5C8A";
const AZUL_CLARO = "#7FB2E6";

// Contorno simplificado do Brasil (viewBox 0 0 100 100), gerado a partir de
// coordenadas geográficas reais — não é um ícone genérico desenhado à mão.
const MAPA_BRASIL_PATH =
  "M42.18,88.2 L45.37,84.94 L48.08,82.61 L49.68,81.64 L51.7,80.32 L51.75,78.41 L50.55,77.02 L49.36,77.48 L49.83,76.1 L50.16,74.68 L50.16,73.37 L49.3,72.93 L48.4,73.32 L47.5,73.21 L47.22,72.29 L47,70.1 L46.55,69.38 L44.94,68.74 L43.96,69.2 L41.43,68.74 L41.59,65.49 L40.88,64.16 L41.63,63.67 L41.4,62.3 L42.06,61.25 L42.48,59.37 L41.92,57.88 L40.61,57.21 L40.35,56.26 L40.7,54.88 L36.11,54.78 L35.19,51.99 L35.89,51.95 L35.86,50.92 L35.39,50.22 L35.29,48.84 L33.9,48.13 L32.39,48.15 L31.4,47.45 L29.78,46.98 L28.84,46.09 L26.16,45.69 L23.56,43.55 L23.75,41.94 L23.45,41.02 L23.71,39.23 L20.58,39.63 L19.31,40.53 L17.22,41.5 L16.69,42.22 L15.45,42.28 L13.67,42.07 L12.32,42.49 L11.23,42.21 L11.39,38.57 L9.43,39.99 L7.32,39.92 L6.41,38.65 L4.82,38.51 L5.33,37.48 L4,36.02 L3,33.87 L3.63,33.43 L3.63,32.42 L5.08,31.73 L4.84,30.43 L5.45,29.6 L5.62,28.48 L8.36,26.85 L10.32,26.39 L10.64,26.03 L12.8,26.14 L13.88,19.58 L13.93,18.54 L13.56,17.17 L12.5,16.29 L12.51,14.55 L13.86,14.16 L14.34,14.41 L14.42,13.49 L13.02,13.24 L12.99,11.74 L17.65,11.8 L18.44,10.97 L19.11,11.73 L19.57,13.14 L20.03,12.85 L21.35,14.12 L23.21,13.96 L23.67,13.23 L25.45,12.67 L26.44,12.28 L26.72,11.26 L28.43,10.58 L28.3,10.08 L26.27,9.87 L25.94,8.36 L26.03,6.76 L24.96,6.14 L25.41,5.92 L27.18,6.22 L29.09,6.82 L29.78,6.26 L31.5,5.88 L34.18,4.99 L35.05,4.07 L34.74,3.4 L35.98,3.29 L36.54,3.84 L36.23,4.9 L37.05,5.26 L37.6,6.37 L36.93,7.21 L36.55,9.25 L37.17,10.46 L37.34,11.57 L38.81,12.7 L39.99,12.81 L40.25,12.34 L41.01,12.24 L42.09,11.82 L42.87,11.18 L44.2,11.39 L44.78,11.3 L46.08,11.5 L46.3,11.01 L45.89,10.53 L46.13,9.84 L47.1,10.05 L48.23,9.81 L49.6,10.31 L50.65,10.81 L51.39,10.16 L51.92,10.26 L52.25,10.93 L53.4,10.76 L54.32,9.85 L55.05,8.09 L56.47,5.9 L57.28,5.79 L57.88,7.11 L59.22,11.3 L60.5,11.69 L60.56,13.35 L58.76,15.32 L59.51,16.04 L63.74,16.41 L63.83,18.81 L65.64,17.24 L68.66,18.1 L72.63,19.57 L73.8,20.97 L73.41,22.29 L76.19,21.56 L80.85,22.82 L84.43,22.73 L87.97,24.71 L91.03,27.39 L92.87,28.08 L94.92,28.18 L95.79,28.94 L96.6,31.98 L97,33.43 L96.05,37.39 L94.83,38.96 L91.45,42.29 L89.93,44.99 L88.16,47.07 L87.56,47.12 L86.89,48.88 L87.06,53.36 L86.39,57.06 L86.14,58.63 L85.38,59.58 L84.95,62.78 L82.53,65.91 L82.12,68.38 L80.18,69.42 L79.62,70.85 L77.02,70.85 L73.25,71.77 L71.57,72.83 L68.88,73.53 L66.07,75.44 L64.04,77.81 L63.69,79.6 L64.09,80.92 L63.64,83.34 L63.1,84.51 L61.42,85.83 L58.77,90.04 L56.66,91.94 L55.03,93.06 L53.94,95.34 L52.36,96.71 L51.7,95.35 L52.75,94.22 L51.37,92.59 L49.49,91.26 L47.02,89.73 L46.13,89.8 L43.73,87.95 L42.18,88.2 Z";

// Tudo dimensionado em cqw (largura do próprio certificado): o mesmo layout
// vale na tela do celular e na folha A4 paisagem impressa.
const cq = (n: number) => `${n}cqw`;

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const supabase = await criarClienteSupabaseServer();

  const { data } = await supabase.rpc("validar_certificado", { p_codigo: codigo });
  const cert = data?.[0];
  if (!cert) notFound();

  const { data: curso } = await supabase
    .from("cursos")
    .select("id")
    .eq("slug", cert.curso_slug)
    .maybeSingle();
  const { data: modulos } = curso
    ? await supabase
        .from("modulos")
        .select("titulo, ordem, aulas(titulo, ordem, carga_min)")
        .eq("curso_id", curso.id)
        .order("ordem")
        .order("ordem", { referencedTable: "aulas" })
    : { data: [] };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
  const urlValidacao = `${siteUrl}/validar/${codigo.toUpperCase()}`;
  const qrSvg = await QRCode.toString(urlValidacao, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: NAVY, light: "#FFFFFF" },
  });

  const folha: React.CSSProperties = {
    containerType: "inline-size",
    width: "min(100%, 297mm)",
    aspectRatio: "297 / 210",
    background: "#FFFFFF",
    color: TINTA,
    position: "relative",
    boxSizing: "border-box",
    fontFamily: "var(--font-public-sans), Arial, sans-serif",
  };

  return (
    <div className="min-h-screen bg-[#E7EEF4] print:bg-white">
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .folha { box-shadow: none !important; margin: 0 !important; width: 297mm !important; height: 210mm !important; break-after: page; }
        }
      `}</style>

      <div className="mx-auto flex max-w-[297mm] flex-wrap items-center justify-between gap-3 px-4 py-4 print:hidden">
        <Link href="/minha-area" className="text-[13px] font-semibold text-brand underline underline-offset-4">
          ← Minha área
        </Link>
        <BotaoImprimir />
      </div>

      <div className="flex flex-col items-center gap-6 px-4 pb-10 print:gap-0 print:p-0">
        {/* Frente */}
        <div className="folha shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)]" style={folha}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div style={{ position: "absolute", top: cq(-8), right: cq(-12), width: cq(32), height: cq(32), background: NAVY, opacity: 0.45, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
            <div style={{ position: "absolute", top: cq(5), right: cq(-3), width: cq(20), height: cq(20), background: AZUL_MEDIO, opacity: 0.55, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
            <div style={{ position: "absolute", top: cq(13), right: cq(9), width: cq(11), height: cq(11), background: AZUL_CLARO, opacity: 0.65, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
            <div style={{ position: "absolute", top: cq(-4), right: cq(16), width: cq(9), height: cq(9), background: AZUL_CLARO, opacity: 0.5, clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div style={{ position: "absolute", top: cq(20), right: cq(1), width: cq(7), height: cq(7), background: NAVY, opacity: 0.6, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          </div>
          <div
            style={{
              position: "absolute",
              inset: cq(3.4),
              border: `${cq(0.3)} solid ${NAVY}`,
              padding: cq(0.6),
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                height: "100%",
                border: `${cq(0.12)} solid ${OURO}`,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: `${cq(2.4)} ${cq(5)}`,
              }}
            >
              <Image
                src="/logo-horizontal.png"
                alt="SIBRAP — Sistema Brasileiro de Aprendizagem Profissional"
                width={758}
                height={256}
                style={{ height: cq(5), width: "auto" }}
              />

              <div
                style={{
                  marginTop: cq(2.2),
                  fontFamily: "var(--font-archivo), Arial",
                  fontWeight: 900,
                  fontSize: cq(5.4),
                  letterSpacing: cq(0.6),
                  color: NAVY,
                  lineHeight: 1,
                }}
              >
                CERTIFICADO
              </div>
              <div style={{ marginTop: cq(0.7), fontSize: cq(1.15), letterSpacing: cq(0.35), color: OURO, fontWeight: 700 }}>
                DE CONCLUSÃO DE CURSO LIVRE
              </div>

              <div style={{ marginTop: cq(2.6), fontSize: cq(1.45), color: "#516278", textAlign: "center" }}>
                O {EMISSOR.nome} certifica que
              </div>

              <div
                style={{
                  marginTop: cq(1.4),
                  fontFamily: "var(--font-archivo), Arial",
                  fontWeight: 800,
                  fontSize: cq(3.6),
                  color: TINTA,
                  textAlign: "center",
                  lineHeight: 1.1,
                  paddingBottom: cq(0.8),
                  borderBottom: `${cq(0.2)} solid ${OURO}`,
                  maxWidth: cq(80),
                }}
              >
                {cert.nome_completo}
              </div>

              {cert.cpf_mascarado && (
                <div style={{ marginTop: cq(0.6), fontSize: cq(1.1), letterSpacing: cq(0.1), color: "#516278", fontFamily: "var(--font-plex-mono), monospace" }}>
                  CPF {cert.cpf_mascarado}
                </div>
              )}

              <div style={{ marginTop: cq(1.8), fontSize: cq(1.6), lineHeight: 1.55, textAlign: "center", maxWidth: cq(74), color: "#2B3A52" }}>
                concluiu com aproveitamento o curso livre de{" "}
                <strong style={{ color: NAVY }}>{cert.curso_nome}</strong>, com carga
                horária de <strong style={{ color: NAVY }}>{cert.carga_horaria_horas} horas</strong>, em{" "}
                {formatarData(cert.emitido_em)}.
              </div>

              <div
                style={{
                  marginTop: "auto",
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: cq(2),
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: cq(1.4) }}>
                  <div
                    style={{ width: cq(9.5), height: cq(9.5), flexShrink: 0 }}
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                  <div style={{ fontSize: cq(1.05), lineHeight: 1.5, color: "#516278" }}>
                    <div style={{ fontWeight: 700, color: NAVY }}>Valide este certificado</div>
                    <div>Aponte a câmera para o QR Code ou acesse</div>
                    <div style={{ color: NAVY }}>{siteUrl.replace(/^https?:\/\//, "")}/validar</div>
                    <div style={{ fontFamily: "var(--font-plex-mono), monospace", fontWeight: 600, color: TINTA, marginTop: cq(0.3) }}>
                      Código {codigo.toUpperCase()}
                    </div>
                  </div>
                </div>

                <SeloAbed altura={cq(8)} fonteLegenda={cq(0.95)} />

                <div style={{ textAlign: "center", fontSize: cq(1.05), color: "#516278" }}>
                  <div style={{ fontFamily: "var(--font-signature), cursive", fontSize: cq(2.9), color: NAVY, lineHeight: 1 }}>
                    Wagner Alves de S. Jr
                  </div>
                  <div style={{ width: cq(30), borderTop: `${cq(0.12)} solid ${TINTA}`, paddingTop: cq(0.5), marginTop: cq(0.3) }}>
                    <div style={{ fontWeight: 700, color: NAVY }}>Wagner Alves de S. Jr</div>
                    <div>Professor habilitado · Diretor do {EMISSOR.nomeCurto}</div>
                    <div>CNPJ {EMISSOR.cnpj}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verso: conteúdo programático */}
        <div className="folha shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)]" style={folha}>
          <div
            style={{
              position: "absolute",
              inset: cq(3.4),
              border: `${cq(0.3)} solid ${NAVY}`,
              padding: `${cq(2.4)} ${cq(4)}`,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontFamily: "var(--font-archivo), Arial", fontWeight: 900, fontSize: cq(2.4), color: NAVY }}>
              Conteúdo programático
            </div>
            <div style={{ fontSize: cq(1.2), color: "#516278", marginTop: cq(0.4) }}>
              {cert.curso_nome} · {cert.carga_horaria_horas} horas
            </div>

            <div style={{ marginTop: cq(1.6), columnCount: 2, columnGap: cq(3) }}>
              {modulos?.flatMap((m, i) => {
                const blocoModulo = (
                  <div
                    key={m.ordem}
                    style={{
                      breakInside: "avoid",
                      marginBottom: cq(1.1),
                      border: "1px solid #000000",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: cq(1),
                        background: "#000000",
                        color: "#FFFFFF",
                        padding: `${cq(0.4)} ${cq(0.7)}`,
                        fontSize: cq(1.15),
                        fontWeight: 800,
                      }}
                    >
                      <span>
                        {i + 1}. {m.titulo}
                      </span>
                      <span style={{ fontFamily: "var(--font-plex-mono), monospace", whiteSpace: "nowrap" }}>
                        {formatarHoras(m.aulas.reduce((s, a) => s + a.carga_min, 0))}
                      </span>
                    </div>
                    {m.aulas.map((a, j) => (
                      <div
                        key={a.ordem}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: cq(1),
                          padding: `${cq(0.3)} ${cq(0.7)}`,
                          borderTop: j > 0 ? "1px solid #B9B9B9" : "none",
                          fontSize: cq(0.95),
                          color: "#1A1A1A",
                        }}
                      >
                        <span>{a.titulo}</span>
                        <span style={{ fontFamily: "var(--font-plex-mono), monospace", whiteSpace: "nowrap", color: "#555555" }}>
                          {formatarHoras(a.carga_min)}
                        </span>
                      </div>
                    ))}
                  </div>
                );

                if (i !== 2) return [blocoModulo];

                return [
                  blocoModulo,
                  <div
                    key="validade-nacional"
                    style={{
                      breakInside: "avoid",
                      marginBottom: cq(1.1),
                      display: "flex",
                      alignItems: "center",
                      gap: cq(1),
                      padding: `${cq(0.4)} ${cq(0.2)}`,
                    }}
                  >
                    <svg viewBox="0 0 100 100" style={{ width: cq(6.5), height: cq(6.5), flexShrink: 0 }}>
                      <path d={MAPA_BRASIL_PATH} fill="#000000" />
                    </svg>
                    <span style={{ fontSize: cq(1.05), fontWeight: 800, letterSpacing: cq(0.06), color: "#000000", lineHeight: 1.2 }}>
                      Válido em todo
                      <br />o território nacional
                    </span>
                  </div>,
                ];
              })}
            </div>

            <div style={{ marginTop: "auto", fontSize: cq(1.05), lineHeight: 1.6, color: "#516278" }}>
              <p>
                A carga horária corresponde às aulas em vídeo, atividades práticas e à avaliação final, com nota
                mínima de aprovação. A autenticidade deste certificado pode ser conferida a qualquer momento em{" "}
                {siteUrl.replace(/^https?:\/\//, "")}/validar, informando o código{" "}
                <strong style={{ color: NAVY }}>{codigo.toUpperCase()}</strong>.
              </p>
              <p style={{ marginTop: cq(0.6) }}>{AVISO_CURSO_LIVRE}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
