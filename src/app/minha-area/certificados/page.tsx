import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { CabecalhoSite } from "@/components/site-chrome";
import { ListaCertificados, dadosCertificados } from "./ListaCertificados";

export const metadata: Metadata = { title: "Meus certificados", robots: { index: false } };

// Certificados do aluno (Wagner, 21/11/2026): emitidos (ver, PDF, validar) e cursos concluídos prontos para emitir.
export default async function CertificadosPage() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fminha-area%2Fcertificados");
  const dados = await dadosCertificados();

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite aluno logado />
      <main className="mx-auto w-full max-w-[900px] flex-1 px-6 py-10">
        <h1 className="font-display text-3xl font-extrabold text-[#14213A]">Meus certificados</h1>
        <p className="mb-8 mt-1 text-[15px] text-[#516278]">Certificados com QR Code: qualquer empresa confere a autenticidade no site.</p>
        <ListaCertificados dados={dados} />
      </main>
    </div>
  );
}
