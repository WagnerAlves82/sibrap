"use client";

// SIBRAP IA, assistente virtual do site (Wagner, 18/11/2026; antes "Natan"). Cores da logo redonda: azul #0149AF e branco. Substitui o botão do WhatsApp: conversa com a IA (Haiku 5.5)
// e, se ela não responder, cai num funil de perguntas rápidas. Último caso: "Falar com a equipe" (formulário por e-mail).
// Só carrega dados quando a pessoa abre o balão: não pesa nas páginas.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AREAS,
  EXPERIENCIAS,
  IDADES,
  OBJETIVOS,
  motivo,
  recomendar,
  rotuloTipo,
  type ItemCatalogo,
  type Perfil,
} from "@/lib/natan";

type Msg = { role: "user" | "assistant"; texto: string; opcoes?: ItemCatalogo[]; sugestoes?: string[] };
type EtapaFunil = "objetivo" | "area" | "idade" | "experiencia" | null;

const INICIO: Msg = {
  role: "assistant",
  texto: "Oi! Eu sou o SIBRAP IA, o assistente virtual do SIBRAP. Qual curso você quer fazer?",
  sugestoes: ["Curso gratuito", "Apostila de concurso", "Curso profissionalizante", "Já sou aluno"],
};
const CHAVE = "sibrap_natan";

function registrar(tipo: string, extra: Record<string, unknown> = {}) {
  try {
    fetch("/api/natan/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, pagina: location.pathname, ...extra }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // sem registro: não atrapalha a conversa
  }
}

function Cartao({ item, perfil }: { item: ItemCatalogo; perfil?: Perfil }) {
  const gratis = item.tipo === "curso-gratis";
  return (
    <a
      href={item.url}
      onClick={() => registrar(item.tipo === "apostila" ? "clique-apostila" : "clique-curso", { alvo: item.id, perfil })}
      className="mt-2 block border border-[#D7DEE6] border-l-4 bg-white p-3 hover:border-[#0149AF]"
      style={{ borderLeftColor: gratis ? "#1F9D55" : "#0149AF" }}
    >
      <span className={`font-data text-[11.5px] font-bold uppercase tracking-wide ${gratis ? "text-[#1F9D55]" : "text-[#0149AF]"}`}>
        {rotuloTipo(item)}
      </span>
      <span className="mt-0.5 block font-display text-[15px] font-extrabold leading-snug text-[#14213A]">{item.nome}</span>
      {(item.horas || item.detalhe) && (
        <span className="mt-0.5 block text-[12.5px] leading-snug text-[#516278]">
          {item.horas ? `${item.horas} h · ` : ""}
          {item.detalhe.slice(0, 110)}
        </span>
      )}
      <span className="mt-1.5 inline-block text-[13px] font-bold text-[#0149AF]">{gratis ? "Começar grátis →" : "Ver detalhes →"}</span>
    </a>
  );
}

export function Natan() {
  const caminho = usePathname() ?? "";
  const [aberto, setAberto] = useState(false);
  // conversa da aba atual (sessionStorage); o painel começa fechado, então não há diferença visível na hidratação
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [INICIO];
    try {
      const salvo = sessionStorage.getItem(CHAVE);
      return salvo ? (JSON.parse(salvo) as Msg[]) : [INICIO];
    } catch {
      return [INICIO];
    }
  });
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [funil, setFunil] = useState<EtapaFunil>(null);
  const [perfil, setPerfil] = useState<Perfil>({});
  const catalogo = useRef<ItemCatalogo[] | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(msgs.slice(-30)));
    } catch {
      // ignora
    }
    fim.current?.scrollIntoView({ block: "end" });
  }, [msgs, aberto]);

  if (
    caminho.startsWith("/admin") ||
    caminho.startsWith("/minha-area") ||
    caminho.startsWith("/certificado") ||
    caminho.startsWith("/solicitacao")
  ) {
    return null;
  }

  const comBarraCelular = caminho.startsWith("/apostilas/") || caminho.startsWith("/combos/");
  const comBarraSempre = /^\/cursos\/(?!profissionalizantes\/?$)[^/]+\/?$/.test(caminho);
  const baixo = comBarraSempre ? "bottom-24" : comBarraCelular ? "bottom-24 sm:bottom-5" : "bottom-3 sm:bottom-5";

  async function carregarCatalogo(): Promise<ItemCatalogo[]> {
    if (catalogo.current) return catalogo.current;
    const r = await fetch("/api/natan/catalogo");
    catalogo.current = r.ok ? ((await r.json()) as ItemCatalogo[]) : [];
    return catalogo.current;
  }

  function perguntaFunil(etapa: Exclude<EtapaFunil, null>): Msg {
    if (etapa === "objetivo") return { role: "assistant", texto: "Vou te ajudar a escolher. Qual é o seu objetivo agora?", sugestoes: OBJETIVOS.map((o) => o.rotulo) };
    if (etapa === "area") return { role: "assistant", texto: "Qual área você pretende estudar?", sugestoes: AREAS.map((a) => `${a.icone} ${a.rotulo}`) };
    if (etapa === "idade") return { role: "assistant", texto: "Qual a sua faixa de idade?", sugestoes: [...IDADES] };
    return { role: "assistant", texto: "Você já tem experiência de trabalho?", sugestoes: EXPERIENCIAS.map((e) => e.rotulo) };
  }

  async function responderFunil(resposta: string) {
    const novo = { ...perfil };
    let proxima: EtapaFunil = null;
    if (funil === "objetivo") {
      novo.objetivo = OBJETIVOS.find((o) => o.rotulo === resposta)?.valor ?? "primeiro";
      proxima = "area";
    } else if (funil === "area") {
      novo.area = AREAS.find((a) => resposta.endsWith(a.rotulo))?.valor ?? "nao-sei";
      proxima = "idade";
    } else if (funil === "idade") {
      novo.idade = resposta;
      proxima = "experiencia";
    } else if (funil === "experiencia") {
      novo.experiencia = EXPERIENCIAS.find((e) => e.rotulo === resposta)?.valor ?? "nunca";
    }
    setPerfil(novo);
    setFunil(proxima);
    if (proxima) {
      setMsgs((m) => [...m, perguntaFunil(proxima)]);
      return;
    }
    const itens = await carregarCatalogo();
    const sugeridos = recomendar(novo, itens, novo.area === "nao-sei" ? 2 : 1);
    registrar("perfil", { perfil: novo, alvo: sugeridos.map((s) => s.id).join(",") });
    setMsgs((m) => [
      ...m,
      sugeridos.length
        ? { role: "assistant", texto: motivo(novo), opcoes: sugeridos, sugestoes: ["Ver outra opção", "Recomeçar"] }
        : { role: "assistant", texto: "Não achei um curso certinho para esse perfil. Toque em Falar com a equipe e conte o que procura.", sugestoes: ["Recomeçar"] },
    ]);
  }

  async function enviar(entrada: string) {
    const t = entrada.trim();
    if (!t || pensando) return;
    setTexto("");
    const comUsuario: Msg[] = [...msgs, { role: "user", texto: t }];
    setMsgs(comUsuario);

    if (t === "Recomeçar") {
      setPerfil({});
      setFunil(null);
      setMsgs([INICIO]);
      return;
    }
    if (funil) {
      await responderFunil(t);
      return;
    }

    setPensando(true);
    try {
      const r = await fetch("/api/natan/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: comUsuario.map((m) => ({ role: m.role, texto: m.texto })) }),
      });
      const d = (await r.json()) as { fallback?: boolean; resposta?: string; opcoes?: ItemCatalogo[]; sugestoes?: string[] };
      if (d.fallback || !d.resposta) {
        setFunil("objetivo");
        setMsgs((m) => [...m, perguntaFunil("objetivo")]);
      } else {
        setMsgs((m) => [...m, { role: "assistant", texto: d.resposta!, opcoes: d.opcoes, sugestoes: d.sugestoes }]);
      }
    } catch {
      setFunil("objetivo");
      setMsgs((m) => [...m, perguntaFunil("objetivo")]);
    } finally {
      setPensando(false);
    }
  }

  const ultima = msgs[msgs.length - 1];

  return (
    <>
      {aberto && (
        <div
          role="dialog"
          aria-label="SIBRAP IA, assistente virtual"
          className={`fixed right-0 z-[60] flex h-[78vh] max-h-[620px] w-full flex-col border border-[#D7DEE6] bg-[#F4F6F9] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] sm:right-5 sm:w-[370px] ${
            comBarraSempre ? "bottom-0 sm:bottom-24" : "bottom-0 sm:bottom-5"
          }`}
        >
          <div className="flex items-center justify-between bg-[#0149AF] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-redonda.webp" alt="" width={36} height={36} className="h-9 w-9 rounded-full bg-white" />
              <span>
                <span className="block font-display text-[15px] font-extrabold leading-tight">SIBRAP IA</span>
                <span className="block text-[12px] text-[#D6E4FA]">Assistente virtual · responde na hora</span>
              </span>
            </div>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="px-2 text-[22px] leading-none text-[#C9D6E5] hover:text-white">
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {msgs.map((m, i) => (
              <div key={i} className={`mb-2.5 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] ${m.role === "user" ? "bg-[#0149AF] text-white" : "border border-[#D7DEE6] bg-white text-[#14213A]"} px-3 py-2 text-[14px] leading-snug`}>
                  {m.texto}
                  {m.opcoes?.map((o) => <Cartao key={o.id} item={o} perfil={perfil} />)}
                </div>
              </div>
            ))}
            {pensando && <p className="text-[13px] text-[#8A97A8]">SIBRAP IA está digitando…</p>}
            {!pensando && ultima?.role === "assistant" && ultima.sugestoes?.length ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {ultima.sugestoes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (s === "Ver outra opção") {
                        setFunil("area");
                        setMsgs((m) => [...m, { role: "user", texto: s }, perguntaFunil("area")]);
                        return;
                      }
                      void enviar(s);
                    }}
                    className="border border-[#0149AF] bg-white px-2.5 py-1.5 text-[13px] font-semibold text-[#0149AF] hover:bg-[#0149AF] hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={fim} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enviar(texto);
            }}
            className="flex border-t border-[#D7DEE6] bg-white"
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={500}
              placeholder={funil ? "Escolha uma opção acima" : "Escreva sua pergunta…"}
              disabled={Boolean(funil) || pensando}
              className="min-w-0 flex-1 px-3 py-3 text-[14px] text-[#14213A] outline-none placeholder:text-[#93A0AF]"
            />
            <button type="submit" disabled={!texto.trim() || pensando} className="bg-[#0149AF] px-4 text-[14px] font-extrabold text-white disabled:opacity-50">
              Enviar
            </button>
          </form>
          <a
            href="/solicitacao?origem=natan"
            onClick={() => registrar("cadastro", { alvo: "falar-com-equipe" })}
            className="bg-white pb-2 text-center text-[12.5px] font-semibold text-[#516278] underline underline-offset-2 hover:text-[#0149AF]"
          >
            Falar com a equipe (resposta por e-mail)
          </a>
        </div>
      )}

      {!aberto && (
        <button
          type="button"
          onClick={() => {
            setAberto(true);
            registrar("abriu");
          }}
          aria-label="Abrir o SIBRAP IA, assistente virtual"
          className={`fixed right-3 z-50 flex items-center gap-2 bg-[#0149AF] p-1.5 pr-3 text-[13.5px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5 sm:right-5 ${baixo}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-redonda.webp" alt="" width={32} height={32} className="h-8 w-8 rounded-full bg-white" />
          <span>
            SIBRAP IA<span className="hidden font-semibold text-[#D6E4FA] sm:inline"> · Posso ajudar?</span>
          </span>
        </button>
      )}
    </>
  );
}
