"use client";

// Etapa final do gerador de currículos: download do PDF (grátis até 1.000 currículos gerados;
// depois, R$ 3,90 por download no PIX), cadastro na hora para quem não tem conta, e o envio
// do PDF pelo WhatsApp (compartilhar do celular) ou por e-mail (anexo, pelo servidor).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Aviso, Campo, Selecao, Titulo } from "@/components/curriculo/campos";
import { criarClienteSupabaseBrowser } from "@/lib/supabase-browser";
import { formatarTelefone, MODELOS, UFS, type Curriculo } from "@/lib/curriculo/tipos";

type Pix = { pedidoId: string; qrCode: string; qrCodeBase64: string; token?: string };
type Baixado = { blob: Blob; nome: string; curriculoId: string; token: string };

const reais = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function lerErro(resp: Response, padrao: string) {
  return ((await resp.json().catch(() => null)) as { erro?: string } | null)?.erro ?? padrao;
}

function salvarNoAparelho(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function Sucesso({ texto }: { texto: string }) {
  return <p className="border border-[#B7E1C6] bg-[#EDF8F1] p-4 text-[14.5px] font-semibold leading-relaxed text-[#1C6B3A]">{texto}</p>;
}

export function EtapaBaixar({
  curriculo, foto, curriculoId, logado, emailConta, precoCentavos, autoBaixar, aoSalvar, aoEditar, aoExcluir,
}: {
  curriculo: Curriculo;
  foto: string | null;
  curriculoId: string | null;
  logado: boolean;
  emailConta: string | null;
  /** null = download grátis; número = preço de cada download (modo pago) */
  precoCentavos: number | null;
  autoBaixar: boolean;
  aoSalvar: (id: string) => void;
  aoEditar: () => void;
  aoExcluir: () => void;
}) {
  const d = curriculo.dados;
  const pago = precoCentavos !== null;
  const preco = reais(precoCentavos ?? 0);
  const [status, setStatus] = useState<"" | "gerando" | "ok" | "conta-criada">("");
  const [erro, setErro] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [aba, setAba] = useState<"criar" | "entrar">("criar");
  const [cad, setCad] = useState({
    nome: d.nome, email: d.email, emailConfirmacao: "", whatsapp: d.telefone, cidade: d.cidade, uf: d.uf, senha: "", termos: false,
  });
  const [verSenha, setVerSenha] = useState(false);
  const [pix, setPix] = useState<Pix | null>(null);
  const [baixado, setBaixado] = useState<Baixado | null>(null);
  const [contaCriada, setContaCriada] = useState(false);
  const jaBaixou = useRef(false);
  const fotoEnviada = MODELOS[curriculo.modelo].temFoto ? foto : null;

  /** Trata a resposta do servidor: PDF (baixa) ou 402 (mostra o PIX). Devolve true se baixou. */
  const tratarResposta = useCallback(
    async (resp: Response): Promise<boolean> => {
      if (resp.status === 402) {
        const j = (await resp.json()) as { curriculoId?: string } & Partial<Pix>;
        if (j.curriculoId) aoSalvar(j.curriculoId);
        if (j.pedidoId && j.qrCode && j.qrCodeBase64) setPix({ pedidoId: j.pedidoId, qrCode: j.qrCode, qrCodeBase64: j.qrCodeBase64, token: j.token });
        return false;
      }
      if (!resp.ok) throw new Error(await lerErro(resp, "Não deu para gerar o PDF."));
      const id = resp.headers.get("x-curriculo-id") ?? "";
      if (id) aoSalvar(id);
      const blob = await resp.blob();
      const nome = /filename="([^"]+)"/.exec(resp.headers.get("content-disposition") ?? "")?.[1] ?? "curriculo.pdf";
      salvarNoAparelho(blob, nome);
      setBaixado({ blob, nome, curriculoId: id, token: resp.headers.get("x-curriculo-token") ?? "" });
      return true;
    },
    [aoSalvar]
  );

  const baixar = useCallback(
    async (pedido?: Pix) => {
      setErro("");
      setStatus("gerando");
      try {
        const resp = await fetch("/api/curriculo/pdf", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ curriculo, foto: fotoEnviada, curriculoId, aceiteMarketing: marketing, pedidoId: pedido?.pedidoId, token: pedido?.token }),
        });
        const ok = await tratarResposta(resp);
        if (ok) setPix(null);
        setStatus(ok ? "ok" : "");
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não deu para gerar o PDF.");
        setStatus("");
      }
    },
    [curriculo, fotoEnviada, curriculoId, marketing, tratarResposta]
  );

  const gerarPix = async () => {
    setErro("");
    setStatus("gerando");
    try {
      const resp = await fetch("/api/curriculo/pagamento", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ acao: "criar" }) });
      const j = (await resp.json()) as Partial<Pix> & { erro?: string };
      if (!resp.ok || !j.pedidoId || !j.qrCode || !j.qrCodeBase64) throw new Error(j.erro ?? "Não deu para gerar o PIX.");
      setPix({ pedidoId: j.pedidoId, qrCode: j.qrCode, qrCodeBase64: j.qrCodeBase64 });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para gerar o PIX.");
    }
    setStatus("");
  };

  // voltou do login com ?baixar=1: no modo grátis, baixa sozinho uma vez
  useEffect(() => {
    if (logado && autoBaixar && !pago && !jaBaixou.current) {
      jaBaixou.current = true;
      void baixar();
    }
  }, [logado, autoBaixar, pago, baixar]);

  const criarConta = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErro("");
    if (cad.email.trim().toLowerCase() !== cad.emailConfirmacao.trim().toLowerCase()) {
      setErro("Os dois e-mails não são iguais. Confira e digite de novo.");
      return;
    }
    setStatus("gerando");
    try {
      const resp = await fetch("/api/curriculo/cadastro", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ curriculo, foto: fotoEnviada, cadastro: { ...cad, aceiteTermos: cad.termos, aceiteMarketing: marketing } }),
      });
      if (resp.status === 409) setAba("entrar");
      if (resp.ok || resp.status === 402) setContaCriada(true);
      const ok = await tratarResposta(resp);
      setStatus(ok ? "conta-criada" : "");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para criar a conta.");
      setStatus("");
    }
  };

  const excluir = async () => {
    if (!window.confirm("Excluir este currículo da sua conta e deste aparelho? Isso não pode ser desfeito.")) return;
    if (logado && curriculoId) {
      const { error } = await criarClienteSupabaseBrowser().from("curriculos").delete().eq("id", curriculoId);
      if (error) {
        setErro("Não deu para excluir agora. Tente de novo.");
        return;
      }
    }
    aoExcluir();
  };

  const caixaMarketing = (
    <label className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[#33465E]">
      <input type="checkbox" checked={marketing} onChange={(ev) => setMarketing(ev.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0b2a4a]" />
      Quero receber vagas, concursos e cursos gratuitos da minha região por e-mail e WhatsApp (opcional).
    </label>
  );
  const mostrarFormulario = !pix && !baixado && !contaCriada;

  return (
    <div className="flex flex-col gap-5">
      <Titulo
        titulo="Baixar currículo em PDF"
        texto={pago ? `Cada download custa ${preco} no PIX. Confira tudo na prévia antes de pagar.` : "Arquivo A4 pronto para imprimir, anexar e enviar."}
      />

      {status === "ok" && <Sucesso texto="Pronto! O PDF foi baixado e ficou salvo na sua conta." />}
      {status === "conta-criada" && (
        <Sucesso texto={`Pronto! PDF baixado e conta criada. Enviamos um link de confirmação para ${cad.email}: confirme para entrar depois e editar o currículo.`} />
      )}
      {erro && <Aviso texto={erro} />}

      {pix && <PixCurriculo pix={pix} preco={preco} contaCriada={contaCriada} email={cad.email} aoAprovar={() => baixar(pix)} />}

      {baixado && <Compartilhar baixado={baixado} nome={d.nome} foto={fotoEnviada} aoSalvarDeNovo={() => salvarNoAparelho(baixado.blob, baixado.nome)} />}

      {mostrarFormulario && logado && (
        <div className="flex flex-col gap-4">
          {emailConta && <p className="text-[13.5px] text-[#516278]">Conectado como <strong>{emailConta}</strong>.</p>}
          {caixaMarketing}
          <button
            type="button"
            onClick={() => (pago ? gerarPix() : baixar())}
            disabled={status === "gerando"}
            className="bg-accent px-6 py-4 text-[16px] font-bold text-accent-ink transition hover:brightness-105 disabled:opacity-60"
          >
            {status === "gerando" ? "Aguarde..." : pago ? `Pagar ${preco} e baixar o PDF` : "Baixar currículo em PDF"}
          </button>
        </div>
      )}

      {mostrarFormulario && !logado && (
        <div className="border border-[#D7DEE6]">
          <div className="grid grid-cols-2 border-b border-[#D7DEE6] text-[14.5px] font-bold">
            <button type="button" onClick={() => setAba("criar")} className={`px-3 py-3 ${aba === "criar" ? "bg-white text-brand" : "bg-[#F6F9FC] text-[#516278]"}`}>
              Criar conta grátis
            </button>
            <button type="button" onClick={() => setAba("entrar")} className={`px-3 py-3 ${aba === "entrar" ? "bg-white text-brand" : "bg-[#F6F9FC] text-[#516278]"}`}>
              Já tenho conta
            </button>
          </div>
          {aba === "criar" ? (
            <form onSubmit={criarConta} className="flex flex-col gap-3 p-4 sm:p-5">
              <p className="text-[13.5px] leading-snug text-[#516278]">Crie sua conta para baixar. O currículo fica salvo nela para editar quando quiser.</p>
              <Campo rotulo="Nome completo" valor={cad.nome} aoMudar={(nome) => setCad({ ...cad, nome })} autoComplete="name" maxLength={120} />
              <Campo rotulo="E-mail" valor={cad.email} aoMudar={(email) => setCad({ ...cad, email: email.trim() })} tipo="email" autoComplete="email" maxLength={160} />
              <Campo
                rotulo="Confirme o e-mail"
                valor={cad.emailConfirmacao}
                aoMudar={(emailConfirmacao) => setCad({ ...cad, emailConfirmacao: emailConfirmacao.trim() })}
                tipo="email"
                autoComplete="off"
                maxLength={160}
                dica="Digite de novo, sem copiar: é por ele que você recupera a conta."
              />
              <Campo rotulo="WhatsApp" valor={cad.whatsapp} aoMudar={(v) => setCad({ ...cad, whatsapp: formatarTelefone(v) })} tipo="tel" inputMode="tel" autoComplete="tel" />
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <Campo rotulo="Cidade" valor={cad.cidade} aoMudar={(cidade) => setCad({ ...cad, cidade })} maxLength={120} />
                <Selecao rotulo="UF" valor={cad.uf} aoMudar={(uf) => setCad({ ...cad, uf })} opcoes={[{ valor: "", texto: "--" }, ...UFS.map((u) => ({ valor: u, texto: u }))]} />
              </div>
              <div>
                <Campo rotulo="Crie uma senha" valor={cad.senha} aoMudar={(senha) => setCad({ ...cad, senha })} tipo={verSenha ? "text" : "password"} autoComplete="new-password" dica="Mínimo de 8 caracteres." />
                <button type="button" onClick={() => setVerSenha(!verSenha)} className="mt-1 text-[13px] font-semibold text-brand">
                  {verSenha ? "Esconder senha" : "Mostrar senha"}
                </button>
              </div>
              <label className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[#33465E]">
                <input type="checkbox" checked={cad.termos} onChange={(ev) => setCad({ ...cad, termos: ev.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0b2a4a]" required />
                <span>
                  Li e concordo com os{" "}
                  <Link href="/termos" target="_blank" className="font-semibold text-brand underline">Termos de Uso</Link> e a{" "}
                  <Link href="/privacidade" target="_blank" className="font-semibold text-brand underline">Política de Privacidade</Link>.
                </span>
              </label>
              {caixaMarketing}
              <button type="submit" disabled={status === "gerando"} className="mt-1 bg-accent px-6 py-4 text-[16px] font-bold text-accent-ink transition hover:brightness-105 disabled:opacity-60">
                {status === "gerando" ? "Aguarde..." : pago ? `Criar conta e pagar ${preco}` : "Criar conta e baixar o PDF"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <p className="text-[14px] leading-relaxed text-[#516278]">Entre com seu e-mail e senha do SIBRAP. O currículo fica guardado neste aparelho e você volta direto para cá.</p>
              <Link href={`/login?next=${encodeURIComponent("/curriculo?baixar=1")}`} className="bg-brand px-6 py-4 text-center text-[16px] font-bold text-white hover:brightness-125">
                Entrar e baixar
              </Link>
            </div>
          )}
        </div>
      )}

      {baixado && pago && <p className="text-[13px] text-[#516278]">Mudou alguma coisa? Edite e baixe a versão nova (novo download, {preco}).</p>}

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#E7EDF3] pt-4 text-[14px] font-semibold">
        <button type="button" onClick={aoEditar} className="text-brand underline underline-offset-4">
          Editar currículo
        </button>
        <button type="button" onClick={excluir} className="text-[#B42318] underline underline-offset-4">
          {logado && curriculoId ? "Excluir meu currículo" : "Apagar e começar de novo"}
        </button>
      </div>
    </div>
  );
}

/** QR Code do PIX e copia e cola; consulta o pagamento a cada 4 s e baixa sozinho quando aprova. */
function PixCurriculo({ pix, preco, contaCriada, email, aoAprovar }: { pix: Pix; preco: string; contaCriada: boolean; email: string; aoAprovar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  const [recusado, setRecusado] = useState(false);
  const aprovado = useRef(false);

  useEffect(() => {
    const id = setInterval(async () => {
      if (aprovado.current) return;
      const resp = await fetch("/api/curriculo/pagamento", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ acao: "status", pedidoId: pix.pedidoId, token: pix.token }),
      }).catch(() => null);
      const j = (await resp?.json().catch(() => null)) as { status?: string } | null;
      if (j?.status === "aprovado") {
        aprovado.current = true;
        clearInterval(id);
        aoAprovar();
      } else if (j?.status === "recusado") {
        clearInterval(id);
        setRecusado(true);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [pix, aoAprovar]);

  return (
    <div className="border-2 border-accent bg-white p-5 text-center">
      {contaCriada && <p className="mb-3 text-[13.5px] text-[#1C6B3A]">Conta criada (confirmação enviada para {email}). Agora é só pagar.</p>}
      <p className="font-display text-xl font-extrabold text-[#14213A]">Pague {preco} no PIX</p>
      <p className="mt-1 text-[13.5px] text-[#516278]">Leia o QR Code no app do banco ou use o copia e cola. O download começa sozinho quando o pagamento cair.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code do PIX" className="mx-auto mt-4 h-52 w-52 border border-[#D7DEE6] bg-white p-2" />
      <div className="mt-4 break-all border border-[#D7DEE6] bg-[#F6F9FC] p-3 text-left font-data text-[11.5px] text-[#516278]">{pix.qrCode}</div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(pix.qrCode);
            setCopiado(true);
          } catch {
            setCopiado(false);
          }
        }}
        className="mt-3 w-full border-[1.5px] border-brand px-4 py-2.5 text-[14px] font-bold text-brand hover:bg-brand/5"
      >
        {copiado ? "Código copiado!" : "Copiar código PIX"}
      </button>
      <p className="mt-3 text-[13px] text-[#516278]">{recusado ? "Esse pagamento não foi aprovado. Gere outro PIX." : "Aguardando o pagamento..."}</p>
    </div>
  );
}

/** Depois do download: mandar o PDF pelo WhatsApp (compartilhar do celular) ou por e-mail (anexo). */
function Compartilhar({ baixado, nome, foto, aoSalvarDeNovo }: { baixado: Baixado; nome: string; foto: string | null; aoSalvarDeNovo: () => void }) {
  const [para, setPara] = useState("");
  const [envio, setEnvio] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  const arquivo = useMemo(() => new File([baixado.blob], baixado.nome, { type: "application/pdf" }), [baixado]);
  const compartilhaArquivo = typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [arquivo] });

  const whatsapp = async () => {
    if (compartilhaArquivo) {
      try {
        await navigator.share({ files: [arquivo], title: `Currículo de ${nome}` });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    // computador: abre o WhatsApp com a mensagem pronta; o PDF já foi baixado e a pessoa anexa pelo clipe
    window.open(`https://wa.me/?text=${encodeURIComponent(`Olá! Segue meu currículo em anexo. ${nome}`)}`, "_blank", "noopener");
  };

  const enviarEmail = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErro("");
    setEnvio("enviando");
    try {
      const resp = await fetch("/api/curriculo/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ curriculoId: baixado.curriculoId, token: baixado.token, para, foto }),
      });
      if (!resp.ok) throw new Error(await lerErro(resp, "Não deu para enviar."));
      setEnvio("ok");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu para enviar.");
      setEnvio("");
    }
  };

  return (
    <div className="flex flex-col gap-4 border border-[#D7DEE6] bg-[#F8FAFC] p-4 sm:p-5">
      <p className="font-display text-[17px] font-extrabold text-[#14213A]">Enviar o currículo</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" onClick={whatsapp} className="bg-[#1FA855] px-4 py-3 text-[15px] font-bold text-white hover:brightness-110">
          Enviar pelo WhatsApp
        </button>
        <button type="button" onClick={aoSalvarDeNovo} className="border-[1.5px] border-brand bg-white px-4 py-3 text-[15px] font-bold text-brand">
          Salvar o PDF de novo
        </button>
      </div>
      {!compartilhaArquivo && <p className="text-[12.5px] text-[#516278]">No computador, o WhatsApp abre com a mensagem pronta: anexe o PDF baixado pelo clipe.</p>}
      <form onSubmit={enviarEmail} className="flex flex-col gap-2 border-t border-[#E7EDF3] pt-4">
        <Campo
          rotulo="Enviar por e-mail para"
          valor={para}
          aoMudar={(v) => setPara(v.trim())}
          tipo="email"
          placeholder="rh@empresa.com.br ou seu e-mail"
          maxLength={160}
          dica="O PDF vai anexo. Se a empresa responder, a resposta chega no seu e-mail."
        />
        <button type="submit" disabled={envio === "enviando" || !para} className="bg-brand px-4 py-3 text-[15px] font-bold text-white hover:brightness-125 disabled:opacity-50">
          {envio === "enviando" ? "Enviando..." : "Enviar por e-mail"}
        </button>
        {envio === "ok" && <p className="text-[13.5px] font-semibold text-[#1C6B3A]">E-mail enviado para {para}.</p>}
        {erro && <p className="text-[13.5px] font-semibold text-[#B42318]">{erro}</p>}
      </form>
    </div>
  );
}
