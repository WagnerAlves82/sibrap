// /ads.txt — exigido pelo Google AdSense. Defina ADSENSE_PUB_ID (ex.: pub-1234567890123456)
// na Vercel depois que o AdSense liberar o código de editor. Sem a variável, o arquivo não existe.
export const dynamic = "force-static";

export function GET() {
  const pub = process.env.ADSENSE_PUB_ID?.trim();
  if (!pub || !/^pub-\d{10,20}$/.test(pub)) return new Response("Not found", { status: 404 });
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
