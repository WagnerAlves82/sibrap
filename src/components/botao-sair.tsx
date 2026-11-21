import { sairDaConta } from "@/app/login/actions";

/** "Sair" do cabeçalho: no celular só o ícone (porta com seta para fora), no resto ícone + texto. */
export function BotaoSair() {
  return (
    <form action={sairDaConta}>
      <button
        type="submit"
        aria-label="Sair da conta"
        title="Sair"
        className="flex h-9 items-center gap-1 px-2 text-[#516278] transition-colors hover:text-brand"
      >
        <svg aria-hidden width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <path d="M10 4H5v16h5" />
          <path d="M15 8l4 4-4 4" />
          <path d="M19 12H9" />
        </svg>
        <span className="hidden sm:inline">Sair</span>
      </button>
    </form>
  );
}
