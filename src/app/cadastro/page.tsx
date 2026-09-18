import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { caminhoSeguro, veioDeCurso } from "@/lib/auth-redirect";
import { FormCadastro } from "./FormCadastro";

export const metadata: Metadata = { title: "Criar conta grátis" };

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; utm_source?: string }>;
}) {
  const { next: nextParam, utm_source } = await searchParams;
  const next = caminhoSeguro(nextParam, "");
  const paraCurso = veioDeCurso(next);

  return (
    <AuthShell
      titulo="Crie sua conta grátis"
      subtitulo={
        paraCurso
          ? "Cadastre-se para fazer o curso gratuito de Informática Básica com Inteligência Artificial."
          : "Responda 10 questões de amostra (5 de Português + 5 de Matemática) no estilo da banca Cesgranrio e receba a apostila grátis."
      }
    >
      <FormCadastro next={next} utmSource={utm_source ?? ""} />
    </AuthShell>
  );
}
