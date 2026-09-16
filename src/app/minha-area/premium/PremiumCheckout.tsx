"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";
import {
  criarPagamentoPixAction,
  verificarPagamentoPixAction,
} from "./actions";

type Fase = "inicio" | "gerando" | "aguardando" | "aprovado" | "erro";

export function PremiumCheckout() {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("inicio");
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, []);

  async function gerarPix() {
    setFase("gerando");
    const r = await criarPagamentoPixAction();
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    setPedidoId(r.pedidoId);
    setQrCode(r.qrCode);
    setQrCodeBase64(r.qrCodeBase64);
    setFase("aguardando");

    intervaloRef.current = setInterval(async () => {
      const status = await verificarPagamentoPixAction(r.pedidoId);
      if ("erro" in status) return;
      if (status.status === "aprovado") {
        if (intervaloRef.current) clearInterval(intervaloRef.current);
        setFase("aprovado");
        router.push("/minha-area/premium/sucesso");
      } else if (status.status === "recusado") {
        if (intervaloRef.current) clearInterval(intervaloRef.current);
        setErro("Esse pagamento não foi aprovado. Gere um novo PIX pra tentar de novo.");
        setFase("erro");
      }
    }, 4000);
  }

  async function copiarCodigo() {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // navegador sem permissão de clipboard — usuário copia manualmente
    }
  }

  if (fase === "inicio" || fase === "gerando") {
    return (
      <button
        onClick={gerarPix}
        disabled={fase === "gerando"}
        className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
      >
        {fase === "gerando" ? "Gerando PIX..." : "Assinar Premium"}
      </button>
    );
  }

  if (fase === "erro") {
    return (
      <div>
        <Alert variant="erro">{erro}</Alert>
        <button
          onClick={gerarPix}
          className="mt-3 w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-500"
        >
          Gerar novo PIX
        </button>
      </div>
    );
  }

  // fase: "aguardando" ou "aprovado"
  return (
    <div className="text-center">
      <p className="text-sm text-zinc-300">
        Escaneie o QR Code com o app do seu banco ou copie o código PIX
        abaixo.
      </p>

      {qrCodeBase64 && (
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code PIX"
          className="mx-auto mt-4 h-56 w-56 rounded-md bg-white p-2"
        />
      )}

      <div className="mt-4 break-all rounded-md border border-zinc-700 bg-zinc-800 p-3 text-left text-xs text-zinc-300">
        {qrCode}
      </div>

      <button
        onClick={copiarCodigo}
        className="mt-3 w-full rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-950/40"
      >
        {copiado ? "Copiado!" : "Copiar código PIX"}
      </button>

      {copiado && (
        <Alert variant="sucesso" className="mt-3 justify-center text-center">
          Código copiado — agora é só colar no app do seu banco.
        </Alert>
      )}

      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        Aguardando pagamento — confirma automaticamente assim que cair
      </p>

      <Alert variant="aviso" className="mt-3">
        Não feche nem atualize esta página até o pagamento ser confirmado.
      </Alert>

      {pedidoId && (
        <p className="mt-1 text-xs text-zinc-600">Pedido {pedidoId.slice(0, 8)}</p>
      )}
    </div>
  );
}
