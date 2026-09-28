"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { loginAdmin, type EstadoLoginAdmin } from "../actions";
import {
  entrarComCodigoAction,
  opcoesLoginAction,
  verificarLoginAction,
  type EstadoCodigo,
} from "../acesso-actions";

const CAMPO =
  "w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-amber-500";
const BOTAO =
  "w-full rounded-md bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-60";

export function LoginAdmin({
  temPasskeys,
  senhaLiberada,
  revogado,
}: {
  temPasskeys: boolean;
  senhaLiberada: boolean;
  revogado: boolean;
}) {
  const [estadoSenha, acaoSenha, pendenteSenha] = useActionState<EstadoLoginAdmin, FormData>(loginAdmin, null);
  const [estadoCodigo, acaoCodigo, pendenteCodigo] = useActionState<EstadoCodigo, FormData>(entrarComCodigoAction, null);
  const [msg, setMsg] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  async function entrarComBiometria() {
    setMsg(null);
    setVerificando(true);
    try {
      const preparo = await opcoesLoginAction();
      if ("erro" in preparo) return setMsg(preparo.erro ?? "Erro.");
      // o navegador abre a biometria do aparelho (rosto, digital ou PIN do celular)
      const resposta = await startAuthentication({ optionsJSON: preparo.opcoes });
      const r = await verificarLoginAction(preparo.desafioId, resposta);
      if ("erro" in r) return setMsg(r.erro ?? "Erro.");
      window.location.href = "/admin";
    } catch (e) {
      const nome = e instanceof Error ? e.name : "";
      setMsg(
        nome === "NotAllowedError" || nome === "AbortError"
          ? "Verificação cancelada ou não reconhecida. Se o rosto ou a digital falhar, use o PIN/padrão do celular quando ele pedir, ou entre com um código de recuperação abaixo."
          : "Não foi possível usar a biometria neste aparelho. Use um código de recuperação abaixo."
      );
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-1 text-lg font-bold text-white">sibrap</h1>
        <p className="mb-6 text-sm text-zinc-400">Painel administrativo</p>

        {revogado && (
          <p className="mb-4 rounded-md bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Todas as sessões foram encerradas.
          </p>
        )}

        {temPasskeys && (
          <>
            <button type="button" onClick={entrarComBiometria} disabled={verificando} className={BOTAO}>
              {verificando ? "Aguardando o aparelho..." : "Entrar com biometria"}
            </button>
            <p className="mt-2 text-xs text-zinc-500">
              Rosto, digital ou o PIN/padrão do celular. Em outro computador, escolha &quot;usar um telefone&quot; e
              leia o QR Code.
            </p>
            {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}

            <details className="mt-6 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
              <summary className="cursor-pointer text-zinc-300">Não consigo usar a biometria</summary>
              <form action={acaoCodigo} className="mt-3 flex flex-col gap-2">
                <label htmlFor="codigo" className="text-xs">
                  Código de recuperação (uso único)
                </label>
                <input
                  id="codigo"
                  name="codigo"
                  placeholder="XXXX-XXXX-XXXX"
                  autoComplete="off"
                  className={CAMPO}
                />
                <button disabled={pendenteCodigo} className={BOTAO}>
                  {pendenteCodigo ? "Verificando..." : "Entrar com o código"}
                </button>
                {estadoCodigo?.erro && <p className="text-red-400">{estadoCodigo.erro}</p>}
              </form>
              <p className="mt-3">
                Sem os códigos?{" "}
                <Link href="/admin/recuperar" className="text-amber-500 underline">
                  Receber um link de recuperação por e-mail
                </Link>
                .
              </p>
            </details>
          </>
        )}

        {senhaLiberada && (
          <form
            action={acaoSenha}
            className={temPasskeys ? "mt-6 border-t border-zinc-800 pt-4" : ""}
          >
            {temPasskeys && <p className="mb-2 text-xs text-amber-500">Modo de emergência: senha liberada.</p>}
            {!temPasskeys && (
              <p className="mb-3 text-xs text-zinc-500">
                Entre com a senha e cadastre a biometria do seu celular na tela seguinte.
              </p>
            )}
            <input
              type="password"
              name="senha"
              placeholder="Senha"
              required
              autoFocus={!temPasskeys}
              autoComplete="current-password"
              className={CAMPO}
            />
            <button type="submit" disabled={pendenteSenha} className={`mt-4 ${BOTAO}`}>
              {pendenteSenha ? "Entrando..." : "Entrar"}
            </button>
            {estadoSenha?.erro && <p className="mt-3 text-sm text-red-400">{estadoSenha.erro}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
