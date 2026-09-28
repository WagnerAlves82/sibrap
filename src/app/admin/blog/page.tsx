import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { FormPost } from "./FormPost";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const cookieStore = await cookies();
  if (!(await sessaoAdminValida(cookieStore.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const admin = criarClienteSupabaseAdmin();
  const { data } = await admin.from("posts").select("*").order("criado_em", { ascending: false });
  const posts = data ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Blog</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Divulgação de concursos, por região e estado. Um post só aparece em
          <code className="mx-1 rounded bg-zinc-200 px-1">/blog</code>
          quando estiver como &quot;Publicada&quot;.
        </p>

        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <details key={post.id} className="rounded-lg border border-zinc-200 bg-white" open={posts.length === 1}>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="font-semibold text-zinc-900">
                  {post.titulo}{" "}
                  <span className="font-normal text-zinc-500">
                    {post.uf ? `· ${post.uf}` : post.regiao ? `· ${post.regiao}` : ""}
                  </span>
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    post.status === "publicada" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {post.status === "publicada" ? "Publicada" : "Rascunho"}
                </span>
              </summary>
              <div className="border-t border-zinc-100 p-4">
                <FormPost post={post} />
              </div>
            </details>
          ))}

          <details className="rounded-lg border border-dashed border-zinc-300 bg-white" open={posts.length === 0}>
            <summary className="cursor-pointer px-4 py-3 font-semibold text-zinc-900">+ Novo post</summary>
            <div className="border-t border-zinc-100 p-4">
              <FormPost />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
