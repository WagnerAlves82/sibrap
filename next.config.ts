import type { NextConfig } from "next";

// Cabeçalhos de segurança em todas as rotas. O CSP estrito rodou um tempo em
// modo Report-Only pra observar o que quebraria antes de bloquear de verdade
// (2026-09-29: testado num build de produção real — home, apostilas, blog,
// cursos, login/cadastro, admin, termos/privacidade — sem nenhuma violação).
const CSP_BASE = "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";
const CSP_ESTRITO = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com https://www.googletagmanager.com https://connect.facebook.net https://www.googleadservices.com https://googleads.g.doubleclick.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://bdansoccbklggqqnxexn.supabase.co https://i.ytimg.com https://www.googletagmanager.com https://www.facebook.com https://www.google.com https://www.google.com.br https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.google-analytics.com",
  "font-src 'self'",
  "connect-src 'self' https://bdansoccbklggqqnxexn.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://www.facebook.com https://connect.facebook.net https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google.com https://www.google.com.br https://stats.g.doubleclick.net",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://td.doubleclick.net https://www.googletagmanager.com",
  "media-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // O blog virou "Notícias": os links antigos (Google, Facebook, e-mails) continuam funcionando.
  async redirects() {
    return [
      { source: "/blog", destination: "/noticias", permanent: true },
      { source: "/blog/:slug", destination: "/noticias/:slug", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: `${CSP_ESTRITO}; ${CSP_BASE}` },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // capas dos posts do blog por link (Wikimedia Commons, licenças livres)
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
        pathname: "/wiki/Special:FilePath/**",
      },
      {
        // capas das apostilas (bucket público do Supabase Storage)
        protocol: "https",
        hostname: "bdansoccbklggqqnxexn.supabase.co",
        pathname: "/storage/v1/object/public/apostilas-capas/**",
      },
    ],
  },
  experimental: {
    // Envio do comprovante do CadÚnico (até ~3,5 MB). A Vercel limita o
    // corpo da requisição a 4,5 MB.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
