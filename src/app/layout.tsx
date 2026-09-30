import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Usadas na home (identidade "edital oficial") — não afetam o resto do
// app, que continua no tema escuro com a fonte padrão.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
const titulo = "SIBRAP — Apostilas e simulados para concursos públicos";
const descricao =
  "Apostilas em PDF para concursos públicos municipais, a partir de R$17,90: questões comentadas, simulado online, cronograma de estudos e cursos gratuitos.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: titulo,
    template: "%s | SIBRAP",
  },
  description: descricao,
  keywords: [
    "concurso público",
    "concurso municipal",
    "apostila digital concurso",
    "apostila PDF concurso",
    "simulado online concurso",
    "edital concurso público",
    "cursos gratuitos concurso",
  ],
  authors: [{ name: "SIBRAP" }],
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
  openGraph: {
    title: titulo,
    description: descricao,
    url: siteUrl,
    siteName: "SIBRAP",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: descricao,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${publicSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
