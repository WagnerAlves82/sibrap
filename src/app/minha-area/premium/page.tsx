import { PremiumCheckout } from "./PremiumCheckout";

export default function PremiumPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-blue-700/50 bg-blue-950/20 p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
          Sibrap Premium
        </p>
        <p className="mt-2 text-3xl font-bold text-white">R$ 29,90</p>
        <p className="text-sm text-zinc-400">Pagamento único, sem mensalidade</p>

        <ul className="mt-6 space-y-2 text-sm text-zinc-300">
          <li>✓ Apostila completa, incluindo Conhecimentos Específicos</li>
          <li>✓ Vídeo-aulas</li>
          <li>
            ✓ Simulado completo — banco de questões com simulação de acordo
            com o perfil da banca Cesgranrio
          </li>
        </ul>

        <div className="mt-8">
          <PremiumCheckout />
        </div>
      </div>
    </div>
  );
}
