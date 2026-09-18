import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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
