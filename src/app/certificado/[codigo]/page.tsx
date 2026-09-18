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
              inset: cq(1.6),
              border: `${cq(0.5)} solid ${NAVY}`,
              padding: cq(0.7),
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                height: "100%",
                border: `${cq(0.18)} solid ${OURO}`,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: `${cq(2.4)} ${cq(5)}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: cq(1.4) }}>
                <Image src="/logo.png" alt="SIBRAP" width={160} height={160} style={{ width: cq(6.2), height: cq(6.2) }} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontFamily: "var(--font-archivo), Arial", fontWeight: 900, fontSize: cq(2.2), color: NAVY, letterSpacing: cq(0.15) }}>
                    SIBRAP
                  </div>
                  <div style={{ fontSize: cq(1.05), color: "#516278" }}>
                    Sistema Brasileiro de Aprendizagem Profissional
                  </div>
                </div>
              </div>

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
                O {EMISSOR.nome}, CNPJ {EMISSOR.cnpj}, certifica que
              </div>

              <div
                style={{
                  marginTop: cq(1.4),
                  fontFamily: "var(--font-archivo), Arial",
                  fontWeight: 800,
                  fontSize: cq(4.2),
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

              <div style={{ marginTop: cq(1.8), fontSize: cq(1.6), lineHeight: 1.55, textAlign: "center", maxWidth: cq(74), color: "#2B3A52" }}>
                concluiu com aproveitamento o curso livre de{" "}
                <strong style={{ color: NAVY }}>{cert.curso_nome}</strong>, na modalidade a distância, com carga
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
                  <div style={{ width: cq(28), borderTop: `${cq(0.12)} solid ${TINTA}`, paddingTop: cq(0.5) }}>
                    <div style={{ fontWeight: 700, color: NAVY }}>{EMISSOR.nomeCurto} — Coordenação</div>
                    <div>{EMISSOR.nome}</div>
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
              inset: cq(1.6),
              border: `${cq(0.5)} solid ${NAVY}`,
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

            <div style={{ marginTop: cq(1.6), columnCount: 2, columnGap: cq(4) }}>
              {modulos?.map((m, i) => (
                <div key={m.ordem} style={{ breakInside: "avoid", marginBottom: cq(1.3) }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: cq(1),
                      borderBottom: `${cq(0.12)} solid ${OURO}`,
                      paddingBottom: cq(0.35),
                      fontSize: cq(1.3),
                      fontWeight: 700,
                      color: NAVY,
                    }}
                  >
                    <span>
                      {i + 1}. {m.titulo}
                    </span>
                    <span style={{ fontFamily: "var(--font-plex-mono), monospace", whiteSpace: "nowrap" }}>
                      {formatarHoras(m.aulas.reduce((s, a) => s + a.carga_min, 0))}
                    </span>
                  </div>
                  <ul style={{ margin: `${cq(0.4)} 0 0`, padding: 0, listStyle: "none", fontSize: cq(1), lineHeight: 1.5, color: "#516278" }}>
                    {m.aulas.map((a) => (
                      <li key={a.ordem}>· {a.titulo}</li>
                    ))}
                  </ul>
                </div>
              ))}
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
