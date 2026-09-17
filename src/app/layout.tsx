import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Public_Sans, IBM_Plex_Mono } from "next/font/google";
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
  "Apostilas digitais e simulados com questões no estilo da banca — comece grátis e destrave o material completo do Concurso Transpetro 2026 (Cesgranrio) por um pagamento único.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: titulo,
    template: "%s | SIBRAP",
  },
  description: descricao,
  keywords: [
    "concurso público",
    "concurso Transpetro 2026",
    "apostila digital concurso",
    "simulado Cesgranrio",
    "apostila PDF concurso",
    "banca Cesgranrio",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
