import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
