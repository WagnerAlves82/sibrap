import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { sairDaConta } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { Alert } from "@/components/alert";
import { enviarApostilaGratisPorEmail } from "@/lib/resend";

export default async function MinhaAreaPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: acessos } = await supabase
    .from("acessos")
    .select("produtos(slug, nome)")
    .eq("user_id", user!.id);

  const temPremium = acessos?.some((a) => a.produtos?.slug === "premium") ?? false;
  const nome = (user?.user_metadata as { nome?: string } | undefined)?.nome;

  // Primeira visita depois de confirmar o e-mail: manda a apostila
  // grátis (ver src/lib/resend.ts) e marca que já foi enviada, pra não
  // mandar de novo nas próximas visitas.
  let apostilaAcabouDeSerEnviada = false;
  const { data: perfil } = await supabase
    .from("profiles")
    .select("apostila_enviada_em")
    .eq("id", user!.id)
    .maybeSingle();

  if (perfil && !perfil.apostila_enviada_em && user?.email) {
    const resultado = await enviarApostilaGratisPorEmail({ email: user.email, nome });
    if (resultado.ok) {
      await supabase.rpc("marcar_apostila_enviada");
      apostilaAcabouDeSerEnviada = true;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <form action={sairDaConta}>
            <button
              type="submit"
              className="text-sm text-zinc-500 underline hover:text-zinc-300"
            >
              Sair
            </button>
          </form>
        </div>

        <div className="mb-6">
          <p className="text-sm text-zinc-400">Olá{nome ? `, ${nome}` : ""}</p>
          <h1 className="text-2xl font-bold">Minha área</h1>
        </div>

        {apostilaAcabouDeSerEnviada && (
          <Alert variant="sucesso" className="mb-6">
            Sua apostila grátis de Conhecimentos Básicos foi enviada pra{" "}
            {user?.email}. Se não chegar em alguns minutos, confere a caixa de
            spam.
          </Alert>
        )}

        {temPremium ? (
          <div className="rounded-lg border border-blue-700/50 bg-blue-950/30 p-6">
            <p className="font-semibold text-blue-400">Você já é Premium 🎉</p>
            <p className="mt-2 text-sm text-zinc-300">
              Seu acesso ao simulado completo está liberado. A apostila em
              PDF e as vídeo-aulas chegam em breve por e-mail.
            </p>
            <Link
              href="/minha-area/simulado"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              Fazer simulado completo
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <p className="font-semibold text-white">Simulado grátis</p>
            <p className="mt-2 text-sm text-zinc-400">
              Responda 5 questões de Língua Portuguesa + 5 de Matemática e
              Raciocínio Lógico, no estilo da banca Cesgranrio. É de graça e
              só pode ser feito uma vez.
            </p>
            <Link
              href="/minha-area/simulado-gratis"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              Começar amostra grátis
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
