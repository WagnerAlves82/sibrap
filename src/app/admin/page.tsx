import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { tokenAdminValido, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { logoutAdmin } from "./actions";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!tokenAdminValido(token)) {
    redirect("/admin/login");
  }

  let leads: { email: string; criado_em: string; concursos: { nome: string } | null }[] | null = null;
  let error: { message: string } | null = null;

  try {
    const supabase = criarClienteSupabaseAdmin();
    const resultado = await supabase
      .from("leads")
      .select("email, criado_em, concursos(nome)")
      .order("criado_em", { ascending: false });
    leads = resultado.data;
    error = resultado.error;
  } catch {
    error = {
      message:
        "SUPABASE_SERVICE_ROLE_KEY não está configurada em .env.local (e no Vercel, em produção). Pegue a chave em Project Settings > API no painel do Supabase.",
    };
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Lista de espera</h1>
            <p className="text-sm text-zinc-500">
              Cadastros feitos na home do sibrap.tec.br
            </p>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="text-sm text-zinc-500 underline hover:text-zinc-700"
            >
              Sair
            </button>
          </form>
        </div>

        <nav className="mb-6 flex gap-2 text-sm">
          <Link href="/admin/comprovantes" className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100">
            Comprovantes CadÚnico
          </Link>
          <Link href="/admin/cursos" className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100">
            Aulas dos cursos
          </Link>
        </nav>

        {error && (
          <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            Erro ao carregar os cadastros: {error.message}
          </p>
        )}

        {!error && (
          <>
            <p className="mb-4 text-sm text-zinc-500">
              {leads?.length ?? 0} cadastro(s)
            </p>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Concurso</th>
                    <th className="px-4 py-3">Cadastrado em</th>
                  </tr>
                </thead>
                <tbody>
                  {leads?.map((lead, i) => (
                    <tr key={i} className="border-t border-zinc-100">
                      <td className="px-4 py-3 text-zinc-900">{lead.email}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {lead.concursos?.nome ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {new Date(lead.criado_em).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                  {leads?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-zinc-400">
                        Nenhum cadastro ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
