"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { verificarPagamentoPixAction } from "@/app/minha-area/premium/actions";
import type { EstadoPix } from "@/lib/pix";

type Fase = "inicio" | "gerando" | "aguardando" | "aprovado" | "erro";

// Checkout PIX com QR Code e copia-e-cola na própria página (tema claro).
// Confere o pagamento de 4 em 4 segundos e chama `aoAprovar` quando cai.
export function PixCheckoutClaro({
  criarPix,
  rotuloBotao,
  aoAprovar,
}: {
  criarPix: () => Promise<EstadoPix>;
  rotuloBotao: string;
  aoAprovar: () => void;
}) {
  const [fase, setFase] = useState<Fase>("inicio");
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
    setErro(null);
    const r = await criarPix();
    if ("erro" in r) {
      setErro(r.erro);
      setFase("erro");
      return;
    }
    setQrCode(r.qrCode);
    setQrCodeBase64(r.qrCodeBase64);
    setFase("aguardando");

    intervaloRef.current = setInterval(async () => {
      const status = await verificarPagamentoPixAction(r.pedidoId);
      if ("erro" in status) return;
      if (status.status === "aprovado") {
        if (intervaloRef.current) clearInterval(intervaloRef.current);
        setFase("aprovado");
        aoAprovar();
      } else if (status.status === "recusado") {
        if (intervaloRef.current) clearInterval(intervaloRef.current);
        setErro("Esse pagamento não foi aprovado. Gere um novo PIX para tentar de novo.");
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
      // sem permissão de clipboard — a pessoa copia manualmente
    }
  }

  const botao =
    "w-full rounded-lg bg-accent px-5 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105 disabled:opacity-60";

  if (fase === "inicio" || fase === "gerando") {
    return (
      <button onClick={gerarPix} disabled={fase === "gerando"} className={botao}>
        {fase === "gerando" ? "Gerando PIX..." : rotuloBotao}
      </button>
    );
  }

  if (fase === "erro") {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="erro" claro>
          {erro}
        </Alert>
        <button onClick={gerarPix} className={botao}>
          Gerar novo PIX
        </button>
      </div>
    );
  }

  if (fase === "aprovado") {
    return (
      <Alert variant="sucesso" claro className="text-sm">
        Pagamento confirmado! Atualizando...
      </Alert>
    );
  }

  return (
    <div className="text-center">
      <p className="text-[14px] text-[#516278]">
        Escaneie o QR Code com o app do seu banco ou copie o código PIX.
      </p>
      {qrCodeBase64 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code PIX"
          className="mx-auto mt-4 h-52 w-52 rounded-lg border border-[#D7DEE6] bg-white p-2"
        />
      )}
      <div className="mt-4 break-all rounded-lg border border-[#D7DEE6] bg-[#F6F9FC] p-3 text-left font-data text-[11.5px] text-[#516278]">
        {qrCode}
      </div>
      <button
        onClick={copiarCodigo}
        className="mt-3 w-full rounded-lg border-[1.5px] border-brand px-4 py-2.5 text-[14px] font-bold text-brand transition-colors hover:bg-brand/5"
      >
        {copiado ? "Copiado! Cole no app do banco" : "Copiar código PIX"}
      </button>
      <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-[#516278]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent-2" />
        Aguardando pagamento — confirma sozinho assim que cair
      </p>
      <Alert variant="aviso" claro className="mt-3 text-left">
        Não feche nem atualize esta página até o pagamento ser confirmado.
      </Alert>
    </div>
  );
}
