import { BotaoGoogle, DivisorOuEmail } from "@/components/botao-google";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { caminhoSeguro, veioDeCurso } from "@/lib/auth-redirect";
import { FormCadastro } from "./FormCadastro";

export const metadata: Metadata = { title: "Criar conta grátis", alternates: { canonical: "/cadastro" } };

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; utm_source?: string }>;
}) {
  const { next: nextParam, utm_source } = await searchParams;
  const next = caminhoSeguro(nextParam, "");
  const paraCurso = veioDeCurso(next);

  // já logado (ex.: veio do botão de uma página em cache): segue direto para o destino
  const {
    data: { user },
  } = await (await criarClienteSupabaseServer()).auth.getUser();
  if (user) redirect(next || "/minha-area");

  return (
    <AuthShell
      titulo="Crie sua conta grátis"
      subtitulo={
        paraCurso
          ? "Cadastre-se para fazer o curso gratuito de Informática Básica com Inteligência Artificial."
          : "Responda 10 questões de amostra (5 de Português + 5 de Matemática) no estilo da banca Cesgranrio e receba a apostila grátis."
      }
    >
      <BotaoGoogle next={next || "/minha-area"} rotulo="Cadastrar com Google" />
      <p className="mt-2 text-center text-[12px] leading-snug text-[#8A97A8]">
        Ao continuar com o Google, você concorda com os <a href="/termos" target="_blank" className="underline">Termos de Uso</a> e a{" "}
        <a href="/privacidade" target="_blank" className="underline">Política de Privacidade</a>.
      </p>
      <DivisorOuEmail />
      <FormCadastro next={next} utmSource={utm_source ?? ""} />
    </AuthShell>
  );
}
