import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Alert } from "@/components/alert";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { FormRedefinir } from "./FormRedefinir";

export const metadata: Metadata = { title: "Criar nova senha", robots: { index: false } };

export default async function RedefinirSenhaPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell titulo="Link expirado" subtitulo="Esse link não vale mais.">
        <Alert variant="aviso" claro className="text-sm">
          Por segurança, os links de recuperação expiram e só podem ser usados
          uma vez. Peça um novo para continuar.
        </Alert>
        <Link
          href="/esqueci-senha"
          className="mt-5 block w-full rounded-lg bg-accent px-5 py-3.5 text-center text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105"
        >
          Pedir novo link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell titulo="Crie sua nova senha" subtitulo="Escolha uma senha que só você saiba.">
      <FormRedefinir />
    </AuthShell>
  );
}
