import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { ASSINATURA_CARGO, ASSINATURA_CERTIFICADO, AVISO_CURSO_LIVRE, EMISSOR } from "@/lib/emissor";
import { SeloAbed } from "@/components/selo-abed";
import { BotaoImprimir } from "./BotaoImprimir";
import { MAPA_BRASIL_PATH } from "@/lib/certificado-desenho";

export const metadata: Metadata = {
  title: "Certificado",
  robots: { index: false, follow: false },
};

const NAVY = "#0B2A4A";
const OURO = "#B9862A";
const TINTA = "#14213A";
const AZUL_MEDIO = "#2E5C8A";
const AZUL_CLARO = "#7FB2E6";



// Tudo dimensionado em cqw (largura do próprio certificado): o mesmo layout
// vale na tela do celular e na folha A4 paisagem impressa.
const cq = (n: number) => `${n}cqw`;

function formatarDataHora(iso: string) {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return `${data} ${hora}`;
}

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
        <div className="flex flex-wrap items-center gap-3">
          {/* PDF pronto em A4 paisagem, gerado no servidor: no celular o "imprimir" saía em retrato e cortado */}
          <a
            href={`/certificado/${codigo.toUpperCase()}/pdf`}
            className="bg-accent px-5 py-2.5 text-[14px] font-bold text-accent-ink transition-colors hover:brightness-105"
          >
            Baixar certificado em PDF
          </a>
          <BotaoImprimir />
        </div>
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
                style={{ height: cq(6.9), width: "auto" }}
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
                DE CONCLUSÃO DE CURSO
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
                concluiu com aproveitamento o curso de{" "}
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

                <SeloAbed altura={cq(6.8)} fonteLegenda={cq(0.95)} />

                <div
                  style={{
                    width: cq(42),
                    display: "flex",
                    alignItems: "center",
                    gap: cq(1.1),
                    border: `${cq(0.1)} solid #D5DEEA`,
                    background: "#FFFFFF",
                    padding: `${cq(0.8)} ${cq(1.1)}`,
                    fontSize: cq(0.86),
                    lineHeight: 1.5,
                    color: "#2B3A52",
                    boxSizing: "border-box",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-redonda.webp" alt={EMISSOR.nomeCurto} style={{ width: cq(4.6), height: "auto", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: NAVY, fontSize: cq(1.0) }}>Documento assinado eletronicamente</div>
                  <div>
                    <span style={{ color: OURO, fontWeight: 900 }}>✓</span> <strong>{cert.nome_completo}</strong>
                    {cert.cpf_mascarado ? ` · CPF ${cert.cpf_mascarado}` : ""} ·{" "}
                    <span style={{ whiteSpace: "nowrap" }}>{formatarDataHora(cert.assinado_aluno_em)}</span>
                  </div>
                  <div>
                    <span style={{ color: OURO, fontWeight: 900 }}>✓</span> <strong>{ASSINATURA_CERTIFICADO}</strong> · {ASSINATURA_CARGO} ·{" "}
                    <span style={{ whiteSpace: "nowrap" }}>{formatarDataHora(cert.assinado_instituicao_em)}</span>
                  </div>
                  <div style={{ color: "#6B7A8F", fontSize: cq(0.8) }}>
                    CNPJ {EMISSOR.cnpj}
                    {cert.hash_conferencia ? ` · Conferência ${cert.hash_conferencia.slice(0, 12).toUpperCase()}` : ""} · Lei 14.063/2020
                  </div>
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
