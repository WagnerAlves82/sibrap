"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { gerarCodigosAction, opcoesRegistroAction, verificarRegistroAction } from "../acesso-actions";

function nomeSugerido(): string {
  const ua = navigator.userAgent;
  const so = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad/i.test(ua)
      ? "iPhone/iPad"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac/i.test(ua)
          ? "Mac"
          : "Aparelho";
  return `${so} (${new Date().toLocaleDateString("pt-BR")})`;
}

export function AdicionarAparelho({ habilitado }: { habilitado: boolean }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function adicionar() {
    setMsg(null);
    setOcupado(true);
    try {
      const preparo = await opcoesRegistroAction();
      if ("erro" in preparo) return setMsg({ tipo: "erro", texto: preparo.erro ?? "Erro." });
      const resposta = await startRegistration({ optionsJSON: preparo.opcoes });
      const r = await verificarRegistroAction(preparo.desafioId, resposta, nome || nomeSugerido());
      if ("erro" in r) return setMsg({ tipo: "erro", texto: r.erro ?? "Erro." });
      setMsg({ tipo: "ok", texto: "Aparelho cadastrado. Agora gere os códigos de recuperação abaixo." });
      setNome("");
      router.refresh();
    } catch (e) {
      const n = e instanceof Error ? e.name : "";
      setMsg({
        tipo: "erro",
        texto:
          n === "InvalidStateError"
            ? "Este aparelho já está cadastrado."
            : n === "NotAllowedError"
              ? "Cadastro cancelado. O celular precisa ter bloqueio de tela (PIN, digital ou rosto) ativo."
              : "Este navegador ou aparelho não conseguiu criar a biometria.",
      });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do aparelho (ex.: Meu Android)"
        aria-label="Nome do aparelho"
        className="w-64 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
      />
      <button
        type="button"
        onClick={adicionar}
        disabled={!habilitado || ocupado}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {ocupado ? "Aguardando o aparelho..." : "Cadastrar este aparelho"}
      </button>
      {msg && (
        <span className={`text-sm ${msg.tipo === "erro" ? "text-red-700" : "text-emerald-700"}`}>{msg.texto}</span>
      )}
    </div>
  );
}

export function GerarCodigos({ habilitado }: { habilitado: boolean }) {
  const router = useRouter();
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setErro(null);
    const r = await gerarCodigosAction();
    if ("erro" in r) return setErro(r.erro);
    setCodigos(r.codigos);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={gerar}
        disabled={!habilitado}
        className="rounded-md border border-zinc-400 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
      >
        Gerar novos códigos
      </button>
      {erro && <span className="ml-3 text-sm text-red-700">{erro}</span>}
      {codigos && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-medium text-amber-900">
            Guarde agora (não aparecem de novo): gerenciador de senhas ou papel em lugar seguro.
          </p>
          <ul className="grid grid-cols-2 gap-1 font-mono text-sm text-zinc-900 sm:grid-cols-5">
            {codigos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
