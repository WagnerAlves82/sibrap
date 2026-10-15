"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { capturarEmailSaida } from "@/app/saida/actions";
import { WHATSAPP_NUMERO } from "@/lib/emissor";

// Pop-up de "não vá embora": no computador, quando o mouse sobe em direção à barra
// do navegador (para fechar a aba), mostra um convite para deixar o e-mail.
// Aparece no máximo uma vez a cada 3 dias (30 dias se a pessoa deixou o e-mail) e
// nunca nas áreas de login, cadastro, aluno e admin.
const CHAVE = "sibrap_saida_ate";
const OCULTAR_EM = ["/admin", "/minha-area", "/login", "/cadastro", "/certificado", "/esqueci-senha", "/redefinir-senha", "/auth", "/validar"];
const ESPERA_MINIMA_MS = 6000;

function podeMostrar(): boolean {
  try {
    const ate = Number(localStorage.getItem(CHAVE) ?? 0);
    return !(ate > Date.now());
  } catch {
    return true;
  }
}

function adiar(dias: number) {
  try {
    localStorage.setItem(CHAVE, String(Date.now() + dias * 86400000));
  } catch {
    // sem armazenamento: só não lembra
  }
}

export function PopupSaida() {
  const caminho = usePathname() ?? "";
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [armadilha, setArmadilha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState(false);
  const inicio = useRef(Date.now());
  const campo = useRef<HTMLInputElement>(null);

  const oculto = OCULTAR_EM.some((p) => caminho.startsWith(p));

  useEffect(() => {
    inicio.current = Date.now();
  }, [caminho]);

  useEffect(() => {
    if (oculto) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    function aoSair(e: MouseEvent) {
      if (e.relatedTarget || e.clientY > 0) return; // só quando o mouse sai pelo topo da janela
      if (Date.now() - inicio.current < ESPERA_MINIMA_MS || !podeMostrar()) return;
      adiar(3);
      setAberto(true);
    }
    document.documentElement.addEventListener("mouseleave", aoSair);
    return () => document.documentElement.removeEventListener("mouseleave", aoSair);
  }, [oculto]);

  useEffect(() => {
    if (!aberto) return;
    campo.current?.focus();
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const r = await capturarEmailSaida(email, caminho, armadilha);
    setEnviando(false);
    if (r.ok) {
      adiar(30);
      setFeito(true);
    } else {
      setErro(r.erro);
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4" onClick={() => setAberto(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-saida"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] border-t-4 border-accent bg-white p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-xl text-[#516278] hover:text-[#14213A]"
        >
          ×
        </button>

        {feito ? (
          <div className="py-4 text-center">
            <p className="font-display text-2xl font-extrabold text-[#14213A]">Combinado!</p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">
              Recebemos o seu e-mail e entraremos em contato. Bons estudos!
            </p>
            <button type="button" onClick={() => setAberto(false)} className="mt-5 rounded-lg bg-brand px-6 py-3 text-[14.5px] font-bold text-white">
              Continuar no site
            </button>
          </div>
        ) : (
          <>
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Espere um instante</p>
            <h2 id="titulo-saida" className="mt-1 font-display text-[1.6rem] font-extrabold leading-tight text-[#14213A]">
              Já vai? Não deixe a sua aprovação para depois.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#516278]">
              Cada dia de estudo conta. Deixe o seu e-mail e a gente entra em contato com as novidades do seu concurso e das
              nossas apostilas.
            </p>

            <form onSubmit={enviar} className="mt-5">
              <label htmlFor="email-saida" className="text-[13px] font-semibold text-[#33465E]">
                Digite seu e-mail
              </label>
              <input
                ref={campo}
                id="email-saida"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="mt-1 w-full border border-[#C4CEDA] px-3 py-3 text-[15px] text-[#14213A] outline-none focus:border-brand"
              />
              <input
                type="text"
                name="site"
                tabIndex={-1}
                autoComplete="off"
                value={armadilha}
                onChange={(e) => setArmadilha(e.target.value)}
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
                aria-hidden
              />
              {erro && <p className="mt-2 text-[13px] font-semibold text-[#B23A3A]">{erro}</p>}
              <button
                type="submit"
                disabled={enviando}
                className="btn-pulso brilho mt-4 w-full rounded-lg bg-accent px-6 py-3.5 text-[15.5px] font-extrabold text-accent-ink disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Quero ser avisado"}
              </button>
            </form>

            {WHATSAPP_NUMERO && (
              <a
                href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("Olá! Vim pelo site da SIBRAP e preciso de ajuda.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-[13.5px] font-semibold text-brand underline underline-offset-4"
              >
                Prefiro falar agora no WhatsApp
              </a>
            )}
            <p className="mt-4 text-[11.5px] leading-snug text-[#7A8797]">
              Ao enviar, você aceita receber o nosso contato por e-mail. Veja a{" "}
              <a href="/privacidade" className="underline">Política de Privacidade</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
