import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "SIBRAP — Sistema Brasileiro de Aprendizagem Profissional. Apostilas e simulados para concursos públicos.";

async function carregarFonteGoogle(
  familia: string,
  peso: number,
  texto: string
) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${familia}:wght@${peso}&text=${encodeURIComponent(
      texto
    )}`
  ).then((res) => res.text());

  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error(`Não achei a fonte ${familia} no CSS do Google Fonts`);

  return fetch(match[1]).then((res) => res.arrayBuffer());
}

export default async function Image() {
  const titulo = "Apostilas e simulados para concursos públicos";
  const subtitulo =
    "Estude o edital como quem já decorou ele — questões no estilo da banca.";
  const eyebrow = "CONCURSO EM DESTAQUE";
  const destaque = "Transpetro 2026 · Cesgranrio";
  const dominio = "sibrap.tec.br";

  const [logoBuffer, capaBuffer, archivoBlack, publicSansSemiBold] =
    await Promise.all([
      readFile(join(process.cwd(), "public", "logo.png")),
      readFile(join(process.cwd(), "public", "apostila.png")),
      carregarFonteGoogle(
        "Archivo",
        800,
        `${titulo}SIBRAP${destaque}`
      ),
      carregarFonteGoogle(
        "Public+Sans",
        600,
        `${subtitulo}${eyebrow}${dominio}`
      ),
    ]);

  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  const capaSrc = `data:image/png;base64,${capaBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0B2A4A",
          fontFamily: "Public Sans",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
            padding: "0 40px 0 72px",
            width: 660,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src={logoSrc}
              width={56}
              height={56}
              style={{ borderRadius: 28 }}
            />
            <span
              style={{
                fontFamily: "Archivo",
                fontSize: 30,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: 1,
              }}
            >
              SIBRAP
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              alignSelf: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#B9862A",
                letterSpacing: 1.5,
              }}
            >
              {eyebrow}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#B9CBDF" }}>
              {destaque}
            </span>
          </div>

          <span
            style={{
              fontFamily: "Archivo",
              fontSize: 46,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#FFFFFF",
            }}
          >
            {titulo}
          </span>

          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.4,
              color: "#B9CBDF",
              maxWidth: 540,
            }}
          >
            {subtitulo}
          </span>

          <span
            style={{
              fontSize: 19,
              fontWeight: 600,
              color: "#B9862A",
            }}
          >
            {dominio}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <img
            src={capaSrc}
            height={520}
            style={{
              borderRadius: 10,
              boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 10,
            display: "flex",
            background: "#B9862A",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: archivoBlack, weight: 800, style: "normal" },
        {
          name: "Public Sans",
          data: publicSansSemiBold,
          weight: 600,
          style: "normal",
        },
      ],
    }
  );
}
