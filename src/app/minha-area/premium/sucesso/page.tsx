import Link from "next/link";

export default function PremiumSucessoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-center">
      <div className="w-full max-w-md rounded-lg border border-emerald-700/50 bg-emerald-950/20 p-8">
        <p className="text-2xl font-bold text-white">Pagamento recebido!</p>
        <p className="mt-3 text-sm text-zinc-300">
          Estamos confirmando seu pagamento com o Mercado Pago. Assim que a
          confirmação chegar (geralmente em segundos), seu acesso Premium é
          liberado automaticamente.
        </p>
        <Link
          href="/minha-area"
          className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Ir para minha área
        </Link>
      </div>
    </div>
  );
}
