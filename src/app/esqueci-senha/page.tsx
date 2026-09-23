import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { FormEsqueci } from "./FormEsqueci";

export const metadata: Metadata = { title: "Esqueci minha senha", robots: { index: false } };

export default function EsqueciSenhaPage() {
  return (
    <AuthShell
      titulo="Esqueceu a senha?"
      subtitulo="Digite o e-mail da sua conta e enviaremos um link para você criar uma nova senha."
    >
      <FormEsqueci />
    </AuthShell>
  );
}
