import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { caminhoSeguro } from "@/lib/auth-redirect";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell titulo="Entre na sua conta" subtitulo="Continue de onde parou.">
      <FormLogin next={caminhoSeguro(next, "/minha-area")} />
    </AuthShell>
  );
}
