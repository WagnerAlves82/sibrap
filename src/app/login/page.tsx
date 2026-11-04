import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { caminhoSeguro } from "@/lib/auth-redirect";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = { title: "Entrar", alternates: { canonical: "/login" } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;

  // já logado (ex.: veio do botão de uma página em cache): segue direto para o destino
  const {
    data: { user },
  } = await (await criarClienteSupabaseServer()).auth.getUser();
  if (user) redirect(caminhoSeguro(next, "/minha-area"));

  return (
    <AuthShell titulo="Entre na sua conta" subtitulo="Continue de onde parou.">
      <FormLogin next={caminhoSeguro(next, "/minha-area")} linkInvalido={erro === "link"} emailConfirmado={erro === "confirmado"} />
    </AuthShell>
  );
}
