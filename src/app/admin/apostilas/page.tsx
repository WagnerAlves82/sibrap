import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { tokenAdminValido, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { FormApostila, type ApostilaAdmin } from "./FormApostila";

export const dynamic = "force-dynamic";

export default async function AdminApostilasPage() {
  const cookieStore = await cookies();
  if (!tokenAdminValido(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin/login");
  }

  const admin = criarClienteSupabaseAdmin();
  const { data } = await admin
    .from("apostilas")
    .select("*, produtos(preco_centavos, apostila_storage_path)")
    .order("ordem")
    .order("criado_em", { ascending: false });

  const apostilas: ApostilaAdmin[] = (data ?? []).map(({ produtos, ...resto }) => ({
    ...resto,
    preco_centavos: produtos?.preco_centavos ?? 3990,
    pdf_path: produtos?.apostila_storage_path ?? null,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Apostilas</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Uma apostila só aparece na vitrine e pode ser comprada quando estiver
          como &quot;Publicada&quot; — e isso exige capa e PDF enviados.
        </p>

        <div className="flex flex-col gap-5">
          {apostilas.map((a) => (
            <details key={a.id} className="rounded-lg border border-zinc-200 bg-white" open={apostilas.length === 1}>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="font-semibold text-zinc-900">
                  {a.titulo}{" "}
                  <span className="font-normal text-zinc-500">
                    · {a.orgao}
                  </span>
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    a.status === "publicada" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {a.status === "publicada" ? "Publicada" : "Rascunho"}
                </span>
              </summary>
              <div className="border-t border-zinc-100 p-4">
                <FormApostila apostila={a} />
              </div>
            </details>
          ))}

          <details className="rounded-lg border border-dashed border-zinc-300 bg-white" open={apostilas.length === 0}>
            <summary className="cursor-pointer px-4 py-3 font-semibold text-zinc-900">
              + Nova apostila
            </summary>
            <div className="border-t border-zinc-100 p-4">
              <FormApostila />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
