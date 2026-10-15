import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Public_Sans, IBM_Plex_Mono, Poppins } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AvisoCookies } from "@/components/cookies-consentimento";
import { MetaPixel } from "@/components/meta-pixel";
import { PopupSaida } from "@/components/popup-saida";
import { BotaoWhatsApp } from "@/components/botao-whatsapp";
import { CapturarOrigem } from "@/components/capturar-origem";
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

// Fonte do site (títulos e texto). Archivo e Public Sans continuam carregadas
// só porque o certificado em PDF/HTML usa as duas.
const poppins = Poppins({
  variable: "--font-poppins",
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
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${publicSans.variable} ${plexMono.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Script id="consentimento-padrao" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{if(localStorage.getItem('sibrap_cookies')==='aceito'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'})}}catch(e){}`}
        </Script>
        <Script id="meta-pixel" strategy="beforeInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
try{if(localStorage.getItem('sibrap_cookies')!=='aceito'){fbq('consent','revoke')}}catch(e){fbq('consent','revoke')}
fbq('init', '733506279098670');
fbq('track', 'PageView');`}
        </Script>
        {children}
        <AvisoCookies />
        <BotaoWhatsApp />
        <PopupSaida />
        <MetaPixel />
        <CapturarOrigem />
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
