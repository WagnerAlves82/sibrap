import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/minha-area", "/admin", "/certificado/"],
      },
      // Rastreadores de busca/assistentes de IA: liberados de forma explícita
      // (o ChatGPT, por exemplo, usa o OAI-SearchBot para citar sites).
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-User", "Google-Extended"],
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/minha-area", "/admin", "/certificado/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
