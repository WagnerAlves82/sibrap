import Link from "next/link";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { aprovarComprovanteAction, recusarComprovanteAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminComprovantesPage() {
  const admin = criarClienteSupabaseAdmin();

  const { data: pendentes } = await admin
    .from("comprovantes_cadunico")
    .select("id, user_id, storage_path, nome_arquivo, enviado_em")
    .eq("status", "pendente")
    .order("enviado_em");

  const { data: recentes } = await admin
    .from("comprovantes_cadunico")
    .select("id, user_id, status, motivo_recusa, analisado_em")
    .neq("status", "pendente")
    .order("analisado_em", { ascending: false })
    .limit(15);

  const ids = [...new Set([...(pendentes ?? []), ...(recentes ?? [])].map((c) => c.user_id))];
  const usuarios = new Map<string, { nome: string; email: string }>();
  await Promise.all(
    ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      usuarios.set(id, {
        nome: (data.user?.user_metadata as { nome?: string } | undefined)?.nome ?? "—",
        email: data.user?.email ?? "—",
      });
    })
  );

  const links = new Map<string, string>();
  await Promise.all(
    (pendentes ?? []).map(async (c) => {
      if (!c.storage_path) return;
      const { data } = await admin.storage.from("cadunico").createSignedUrl(c.storage_path, 300);
      if (data?.signedUrl) links.set(c.id, data.signedUrl);
    })
  );

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Comprovantes do CadÚnico</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Confira o documento (o link abre por 5 minutos), o nome e aprove ou
          recuse. O arquivo é apagado assim que você decide.
        </p>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Pendentes ({pendentes?.length ?? 0})
        </h2>
        <div className="flex flex-col gap-4">
          {pendentes?.map((c) => {
            const u = usuarios.get(c.user_id);
            return (
              <div key={c.id} className="rounded-lg border border-zinc-200 bg-white p-5">
                <p className="font-semibold text-zinc-900">{u?.nome}</p>
                <p className="text-sm text-zinc-500">
                  {u?.email} · enviado em {new Date(c.enviado_em).toLocaleString("pt-BR")}
                </p>
                {links.get(c.id) ? (
                  <a
                    href={links.get(c.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-blue-700 underline"
                  >
                    Abrir documento ({c.nome_arquivo ?? "arquivo"})
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-red-600">Arquivo indisponível.</p>
                )}
                <div className="mt-4 flex flex-wrap items-start gap-3">
                  <form action={aprovarComprovanteAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
                      Aprovar
                    </button>
                  </form>
                  <form action={recusarComprovanteAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input
                      name="motivo"
                      placeholder="Motivo (aparece pro aluno)"
                      className="w-64 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
                      Recusar
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
          {pendentes?.length === 0 && (
            <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400">
              Nenhum comprovante pendente.
            </p>
          )}
        </div>

        <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Últimas decisões
        </h2>
        <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white text-sm">
          {recentes?.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
              <span className="text-zinc-800">
                {usuarios.get(c.user_id)?.nome} · {usuarios.get(c.user_id)?.email}
              </span>
              <span className={c.status === "aprovado" ? "text-emerald-700" : "text-red-700"}>
                {c.status}
                {c.motivo_recusa ? ` — ${c.motivo_recusa}` : ""}
              </span>
            </li>
          ))}
          {recentes?.length === 0 && (
            <li className="px-4 py-6 text-center text-zinc-400">Nada ainda.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
