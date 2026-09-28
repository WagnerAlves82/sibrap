import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, sessaoRecente } from "@/lib/admin-auth";
import { sessaoAdminValida } from "@/lib/admin-sessao";
import { RECUPERACAO_ESPERA_MIN, contarCodigosRestantes, listarPasskeys } from "@/lib/admin-seguranca";
import { encerrarSessoesAction, removerPasskeyAction, sairDoAdminAction } from "../acesso-actions";
import { AdicionarAparelho, GerarCodigos } from "./Controles";

export const dynamic = "force-dynamic";

const AVISOS: Record<string, { cor: string; texto: string }> = {
  cadastrar: {
    cor: "bg-amber-50 text-amber-900 border-amber-200",
    texto:
      "Primeiro acesso: cadastre agora a biometria do seu celular. Depois disso a senha deixa de dar entrada no painel.",
  },
  codigo: {
    cor: "bg-amber-50 text-amber-900 border-amber-200",
    texto:
      "Você entrou com um código de recuperação (já foi consumido). Cadastre um aparelho novo e gere códigos novos.",
  },
  recuperado: {
    cor: "bg-amber-50 text-amber-900 border-amber-200",
    texto:
      "Você entrou por recuperação por e-mail. Cadastre agora o aparelho novo e gere códigos de recuperação novos.",
  },
  removido: { cor: "bg-emerald-50 text-emerald-900 border-emerald-200", texto: "Aparelho removido." },
};

export default async function SegurancaPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!(await sessaoAdminValida(token))) redirect("/admin/login");
  const { aviso } = await searchParams;

  const [passkeys, codigosRestantes] = await Promise.all([listarPasskeys(), contarCodigosRestantes()]);
  const recente = sessaoRecente(token);
  const alerta = aviso ? AVISOS[aviso] : null;

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          ← Painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Segurança do painel</h1>
        <p className="mb-6 text-sm text-zinc-500">
          A biometria fica no seu aparelho; o site guarda só uma chave pública. Se o rosto ou a digital falhar, o
          celular pede o PIN/padrão dele.
        </p>

        {process.env.ADMIN_PERMITE_SENHA === "1" && (
          <p className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Atenção: o modo de emergência da senha (ADMIN_PERMITE_SENHA=1) está LIGADO na Vercel. Remova a variável e
            faça redeploy assim que recuperar o acesso.
          </p>
        )}
        {alerta && <p className={`mb-6 rounded-md border px-4 py-3 text-sm ${alerta.cor}`}>{alerta.texto}</p>}
        {!recente && passkeys.length > 0 && (
          <p className="mb-6 rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            Sua sessão tem mais de 10 minutos. Para adicionar ou remover aparelhos e gerar códigos, entre de novo com
            a biometria (Sair e Entrar).
          </p>
        )}

        <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-zinc-900">Aparelhos com biometria ({passkeys.length})</h2>
          {passkeys.length === 0 ? (
            <p className="mt-2 text-sm text-amber-700">
              Nenhum aparelho cadastrado: o painel ainda entra só com senha.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {passkeys.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span>
                    <strong className="text-zinc-900">{p.nome}</strong>
                    <span className="ml-2 text-xs text-zinc-500">
                      {p.sincronizada ? "sincronizada na conta (Google)" : "só neste aparelho"} · cadastrado em{" "}
                      {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                      {p.ultimo_uso_em
                        ? ` · último uso ${new Date(p.ultimo_uso_em).toLocaleDateString("pt-BR")}`
                        : ""}
                    </span>
                  </span>
                  <form action={removerPasskeyAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      disabled={!recente}
                      className="text-xs text-red-700 underline disabled:text-zinc-400 disabled:no-underline"
                    >
                      Remover
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          {passkeys.length === 1 && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Só há um aparelho. Se ele for sincronizado na conta Google, um celular novo com a mesma conta já
              recupera a passkey. Ainda assim, guarde os códigos de recuperação.
            </p>
          )}
          <AdicionarAparelho habilitado={recente} />
        </section>

        <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-zinc-900">Códigos de recuperação</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {codigosRestantes > 0
              ? `${codigosRestantes} de 10 códigos ainda válidos.`
              : "Nenhum código válido. Gere um conjunto e guarde num gerenciador de senhas ou impresso."}{" "}
            Cada código entra uma vez, mesmo sem a biometria. Gerar novos invalida os anteriores.
          </p>
          <GerarCodigos habilitado={recente} />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-zinc-900">Sessões</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Cada acesso ao painel gera um e-mail de aviso. Se algo parecer estranho, encerre todas as sessões.
          </p>
          <div className="mt-3 flex gap-3">
            <form action={encerrarSessoesAction}>
              <button className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
                Encerrar todas as sessões
              </button>
            </form>
            <form action={sairDoAdminAction}>
              <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
                Sair
              </button>
            </form>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-zinc-600">
          <h2 className="font-semibold text-zinc-800">Plano de emergência (se tudo falhar)</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>PIN ou padrão do celular no lugar da biometria.</li>
            <li>Código de recuperação (tela de entrada, &quot;Não consigo usar a biometria&quot;).</li>
            <li>Link por e-mail (libera {RECUPERACAO_ESPERA_MIN} minutos depois e avisa você).</li>
            <li>
              Você é dono da infraestrutura: apague as linhas de <code>admin_passkeys</code> no Supabase (a senha
              volta a valer) ou defina <code>ADMIN_PERMITE_SENHA=1</code> na Vercel e faça redeploy.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
