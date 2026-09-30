import type { NextConfig } from "next";

// Cabeçalhos de segurança em todas as rotas. O CSP estrito rodou um tempo em
// modo Report-Only pra observar o que quebraria antes de bloquear de verdade
// (2026-09-29: testado num build de produção real — home, apostilas, blog,
// cursos, login/cadastro, admin, termos/privacidade — sem nenhuma violação).
const CSP_BASE = "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";
const CSP_ESTRITO = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://bdansoccbklggqqnxexn.supabase.co https://i.ytimg.com https://www.googletagmanager.com",
  "font-src 'self'",
  "connect-src 'self' https://bdansoccbklggqqnxexn.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  "media-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
