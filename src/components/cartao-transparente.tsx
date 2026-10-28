"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { pagarComCartaoAction } from "@/app/minha-area/cartao-actions";
import { verificarPagamentoPixAction } from "@/app/minha-area/premium/actions";
import { formatarPreco, maxParcelas } from "@/lib/apostilas";

// Cartão de crédito sem sair do site: o número do cartão é digitado no formulário seguro do
// AbacatePay (abacatepay.js, iframe) e só o token de uso único vem para o nosso servidor.
// Parcelamento até 3x (parcela mínima de R$ 10,00).

type CheckoutAbacate = {
  mount: (alvo: string | HTMLElement) => Promise<void>;
  tokenize: (cliente: { name: string; email: string; taxId: string; cellphone?: string }) => Promise<{ token: string }>;
  destroy?: () => void;
};
declare global {
  interface Window {
    AbacatePay?: {
      create: (opcoes: {
        publicKey: string;
        amount: number;
        locale?: "pt";
        icons?: boolean;
        onCardChange?: (estado: { canTokenize: boolean }) => void;
      }) => CheckoutAbacate;
    };
  }
}

let carregando: Promise<void> | null = null;
function carregarScript(): Promise<void> {
  if (window.AbacatePay) return Promise.resolve();
  carregando ??= new Promise((ok, falha) => {
    const s = document.createElement("script");
    s.src = "https://abacatepay.com/abacatepay.js";
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => {
      carregando = null;
      falha(new Error("script"));
    };
    document.head.appendChild(s);
  });
  return carregando;
}

const soDigitos = (v: string) => v.replace(/\D/g, "");
const mascaraCpf = (v: string) =>
  soDigitos(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const mascaraCelular = (v: string) =>
  soDigitos(v)
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");

/** O que a página (servidor) passa para habilitar o cartão; null = só PIX. */
export type DadosCartaoCompra = { chavePublica: string; produtoSlug: string; email: string; nome?: string };

const campo = "w-full border border-[#D7DEE6] bg-white px-3 py-2.5 text-[15px] text-[#14213A] outline-none focus:border-brand";

export function CartaoTransparente({
  produtoSlug,
  valorCentavos,
  chavePublica,
  emailCliente,
  nomeInicial = "",
  aoAprovar,
  abertoInicial = false,
  embutido = false,
}: {
  produtoSlug: string;
  valorCentavos: number;
  chavePublica: string;
  emailCliente: string;
  nomeInicial?: string;
  aoAprovar: (pedidoId: string, valorCentavos: number) => void;
  /** já abre o formulário (quando a pessoa escolheu cartão no modal de pagamento) */
  abertoInicial?: boolean;
  /** dentro do modal de pagamento: sem título nem moldura própria */
  embutido?: boolean;
}) {
  const idAlvo = `cartao-${useId().replace(/:/g, "")}`;
  const max = maxParcelas(valorCentavos);
  const [aberto, setAberto] = useState(abertoInicial);
  const [pronto, setPronto] = useState(false);
  const [podePagar, setPodePagar] = useState(false);
  const [nome, setNome] = useState(nomeInicial);
  const [cpf, setCpf] = useState("");
  const [celular, setCelular] = useState("");
  const [parcelas, setParcelas] = useState(max);
  const [fase, setFase] = useState<"form" | "pagando" | "aguardando" | "aprovado">("form");
  const [erro, setErro] = useState<string | null>(null);
  const checkout = useRef<CheckoutAbacate | null>(null);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!aberto) return;
    let cancelado = false;
    carregarScript()
      .then(async () => {
        if (cancelado || !window.AbacatePay) return;
        checkout.current = window.AbacatePay.create({
          publicKey: chavePublica,
          amount: valorCentavos,
          locale: "pt",
          icons: true,
          onCardChange: ({ canTokenize }) => setPodePagar(canTokenize),
        });
        await checkout.current.mount(`#${idAlvo}`);
        if (!cancelado) setPronto(true);
      })
      .catch(() => !cancelado && setErro("Não foi possível carregar o formulário do cartão. Atualize a página ou pague no PIX."));
    return () => {
      cancelado = true;
      checkout.current?.destroy?.();
      checkout.current = null;
      if (intervalo.current) clearInterval(intervalo.current);
    };
  }, [aberto, chavePublica, valorCentavos, idAlvo]);

  const valorParcela = Math.ceil(valorCentavos / parcelas);

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    if (!checkout.current) return;
    setErro(null);
    if (soDigitos(cpf).length !== 11) return setErro("Digite o seu CPF.");
    if (soDigitos(celular).length < 10) return setErro("Digite um celular com DDD.");
    setFase("pagando");
    let token: string;
    try {
      ({ token } = await checkout.current.tokenize({
        name: nome.trim(),
        email: emailCliente,
        taxId: soDigitos(cpf),
        cellphone: soDigitos(celular),
      }));
    } catch (err) {
      setFase("form");
      setErro(err instanceof Error && err.message ? err.message : "Confira os dados do cartão.");
      return;
    }
    const r = await pagarComCartaoAction(produtoSlug, { token, parcelas, nome, cpf, celular });
    if ("erro" in r) {
      setFase("form");
      setErro(r.erro);
      return;
    }
    if (r.status === "aprovado") {
      setFase("aprovado");
      aoAprovar(r.pedidoId, r.valorCentavos);
      return;
    }
    // em análise: confere de 4 em 4 segundos por até 3 minutos
    setFase("aguardando");
    let tentativas = 0;
    intervalo.current = setInterval(async () => {
      tentativas++;
      const s = await verificarPagamentoPixAction(r.pedidoId);
      if (!("erro" in s) && s.status === "aprovado") {
        if (intervalo.current) clearInterval(intervalo.current);
        setFase("aprovado");
        aoAprovar(r.pedidoId, r.valorCentavos);
      } else if ((!("erro" in s) && s.status === "recusado") || tentativas > 45) {
        if (intervalo.current) clearInterval(intervalo.current);
        setFase("form");
        setErro(
          tentativas > 45
            ? "O pagamento ainda está em análise. Assim que for aprovado, o acesso é liberado e você recebe um e-mail."
            : "O banco recusou o pagamento. Tente outro cartão ou pague no PIX."
        );
      }
    }, 4000);
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full border-[1.5px] border-brand px-5 py-3 text-[15px] font-bold text-brand transition-colors hover:bg-brand/5"
      >
        {max > 1
          ? `Pagar no cartão em até ${max}x de ${formatarPreco(Math.ceil(valorCentavos / max))}`
          : `Pagar ${formatarPreco(valorCentavos)} no cartão`}
      </button>
    );
  }

  if (fase === "aprovado") {
    return (
      <Alert variant="sucesso" claro>
        Pagamento aprovado! Seu acesso já está liberado e o recibo foi enviado para o seu e-mail.
      </Alert>
    );
  }

  return (
    <form onSubmit={pagar} className={`flex flex-col gap-3 bg-white ${embutido ? "" : "border border-[#D7DEE6] p-4"}`}>
      {!embutido && <p className="font-display text-[16px] font-extrabold text-[#14213A]">Pagar no cartão de crédito</p>}
      {/* o nome do comprador vem do cadastro; só pergunta se a conta não tiver nome */}
      {nomeInicial.trim().length < 3 && (
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-[#516278]">
          Seu nome
          <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required minLength={3} />
        </label>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-[#516278]">
          Seu CPF
          <input className={campo} value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" required />
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-[#516278]">
          Celular com DDD
          <input className={campo} value={celular} onChange={(e) => setCelular(mascaraCelular(e.target.value))} inputMode="tel" autoComplete="tel-national" placeholder="(00) 00000-0000" required />
        </label>
      </div>

      <div className="flex flex-col gap-1 text-[13px] font-semibold text-[#516278]">
        Dados do cartão
        {/* a caixa do AbacatePay fica vazia para o React: o abacatepay.js substitui o conteúdo dela */}
        <div id={idAlvo} className="min-h-[120px]" />
        {!pronto && !erro && <p className="text-center text-[13px] font-normal text-[#93A0AF]">Carregando o formulário seguro…</p>}
        <p className="text-[11.5px] font-normal text-[#93A0AF]">🔒 Os dados do cartão são criptografados. O SIBRAP não vê nem guarda o número.</p>
      </div>

      {max > 1 && (
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-[#516278]">
          Parcelas
          <select className={campo} value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>
            {Array.from({ length: max }, (_, i) => max - i).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? `À vista: ${formatarPreco(valorCentavos)}` : `${n}x de ${formatarPreco(Math.ceil(valorCentavos / n))}`}
              </option>
            ))}
          </select>
        </label>
      )}

      {erro && (
        <Alert variant="erro" claro>
          {erro}
        </Alert>
      )}
      {fase === "aguardando" && (
        <Alert variant="info" claro>
          Pagamento em análise pelo banco. Não feche esta página…
        </Alert>
      )}

      <button
        type="submit"
        disabled={!pronto || !podePagar || fase !== "form"}
        className="bg-accent px-5 py-3 text-[15px] font-bold text-accent-ink transition-colors hover:brightness-105 disabled:opacity-50"
      >
        {fase === "pagando"
          ? "Processando…"
          : parcelas > 1
            ? `Pagar ${parcelas}x de ${formatarPreco(valorParcela)}`
            : `Pagar ${formatarPreco(valorCentavos)}`}
      </button>
    </form>
  );
}

