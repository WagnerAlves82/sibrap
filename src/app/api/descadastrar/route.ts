import { descadastrar, emailDoToken } from "@/lib/descadastro";

// Descadastro em um clique pelo botão do Gmail/Outlook (cabeçalho List-Unsubscribe-Post, RFC 8058).
export async function POST(request: Request) {
  const email = await emailDoToken(new URL(request.url).searchParams.get("t") ?? undefined);
  if (!email) return new Response("link inválido", { status: 400 });
  await descadastrar(email, "um clique (List-Unsubscribe)");
  return new Response("ok");
}
