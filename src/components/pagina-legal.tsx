import { CabecalhoSite, RodapeSite } from "@/components/site-chrome";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";

export async function PaginaLegal({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
}) {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 font-body">
      <CabecalhoSite logado={!!user} />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-12">
        <h1 className="font-display text-3xl font-extrabold text-[#14213A] sm:text-4xl">{titulo}</h1>
        <p className="mt-2 text-[13px] text-[#93A0AF]">Última atualização: {atualizadoEm}</p>
        <article className="mt-8 flex flex-col gap-7 rounded-xl border border-[#D7DEE6] bg-white p-6 sm:p-9">
          {children}
        </article>
      </main>
      <RodapeSite />
    </div>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 font-display text-xl font-extrabold text-[#14213A]">{titulo}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-[#3A4A63]">{children}</div>
    </section>
  );
}

export function Lista({ itens }: { itens: React.ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-1.5 pl-1">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
