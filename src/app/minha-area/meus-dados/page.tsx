import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { FormMeusDados } from "./FormMeusDados";

export const metadata: Metadata = { title: "Meus dados", robots: { index: false } };

export default async function MeusDadosPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fminha-area%2Fmeus-dados");
  const { data: perfil } = await supabase.from("profiles").select("nome, profissao, foto_url").eq("id", user.id).maybeSingle();
  const nome = perfil?.nome ?? (user.user_metadata?.nome as string | undefined) ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite aluno logado />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-10">
        <h1 className="font-display text-3xl font-extrabold text-[#14213A]">Meus dados</h1>
        <p className="mt-1 text-[15px] text-[#516278]">Mantenha seu nome certo: é ele que sai nos certificados.</p>
        <div className="mt-6 border border-[#D7DEE6] bg-white p-6">
          <FormMeusDados nome={/\d/.test(nome) ? "" : nome} profissao={perfil?.profissao ?? ""} foto={perfil?.foto_url ?? null} email={user.email ?? ""} />
        </div>
      </main>
    </div>
  );
}
