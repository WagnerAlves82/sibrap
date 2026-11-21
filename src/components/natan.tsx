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

type Msg = {
  role: "user" | "assistant";
  texto: string;
  opcoes?: ItemCatalogo[];
  sugestoes?: string[];
  links?: { rotulo: string; href: string; principal?: boolean }[];
};
type EtapaFunil = "objetivo" | "area" | "idade" | "experiencia" | null;

const INICIO: Msg = {
  role: "assistant",
  texto: "Oi! Eu sou o SIBRAP IA, o assistente virtual do SIBRAP. Qual curso você quer fazer?",
  sugestoes: ["Curso gratuito", "Apostila de concurso", "Curso profissionalizante", "Já sou aluno"],
};
const VOLTAR_AREAS = "← Voltar às áreas";
const LIMPAR = "🧹 Limpar conversa";
const ESCREVER = "✍️ Escrever minha dúvida";
const AREAS_LISTA = AREAS.filter((a) => a.valor !== "nao-sei");
const rotuloArea = (a: (typeof AREAS)[number]) => `${a.icone} ${a.rotulo}`;
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

    if (t === "Recomeçar" || t === LIMPAR) {
      setPerfil({});
      setFunil(null);
      setMsgs([INICIO]);
      return;
    }
    if (funil) {
      await responderFunil(t);
      return;
    }

    // filtros sem IA: listam TODOS os itens da escolha, para a pessoa rolar e tocar no dela (Wagner, 18/11/2026)
    if (t === "Curso gratuito" || t === VOLTAR_AREAS || t === "Ver cursos por área") {
      setMsgs((m) => [
        ...m,
        { role: "assistant", texto: "Escolha a área e eu mostro todos os cursos dela:", sugestoes: [...AREAS_LISTA.map(rotuloArea), ESCREVER] },
      ]);
      return;
    }
    if (t === ESCREVER) {
      setMsgs((m) => [...m, { role: "assistant", texto: "Pode escrever: conte o que você procura e eu indico o melhor curso para você." }]);
      return;
    }
    // aluno que já tem conta: atalho direto para o login e para a área do aluno (Wagner, 21/11/2026)
    if (t === "Já sou aluno") {
      registrar("aluno", { alvo: "ja-sou-aluno" });
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          texto: "Que bom ter você de volta! Entre na sua conta para continuar seus cursos, abrir suas apostilas e emitir seus certificados.",
          links: [
            { rotulo: "Entrar na minha conta", href: "/login?next=%2Fminha-area", principal: true },
            { rotulo: "Ir para meus cursos", href: "/minha-area" },
          ],
          sugestoes: [ESCREVER, LIMPAR],
        },
      ]);
      return;
    }
    const area = AREAS_LISTA.find((a) => rotuloArea(a) === t || a.rotulo === t || a.valor === t);
    if (area || t === "Apostila de concurso" || t === "Curso profissionalizante") {
      const itens = await carregarCatalogo();
      let lista: ItemCatalogo[];
      let titulo: string;
      if (t === "Apostila de concurso") {
        lista = itens.filter((i) => i.tipo === "apostila");
        titulo = `Apostilas de concurso (${lista.length}). Role a lista e toque na sua:`;
      } else if (t === "Curso profissionalizante") {
        lista = itens.filter((i) => i.tipo === "formacao" || i.area === "Construção e manutenção" || i.id === "conserto-e-manutencao-de-celulares");
        titulo = `Cursos profissionalizantes (${lista.length}). Role a lista e toque no seu:`;
      } else {
        lista = itens.filter((i) => (i.tipo === "curso-gratis" || i.tipo === "curso-pago" || i.tipo === "formacao") && i.area === area!.valor);
        lista.sort((a, b) => Number(a.tipo !== "curso-gratis") - Number(b.tipo !== "curso-gratis"));
        titulo = `${area!.rotulo}: ${lista.length} cursos. Role a lista e toque no seu:`;
      }
      registrar("perfil", { perfil: { area: area?.valor ?? t }, alvo: `lista:${lista.length}` });
      setMsgs((m) => [
        ...m,
        lista.length
          ? { role: "assistant", texto: titulo, opcoes: lista, sugestoes: [VOLTAR_AREAS, LIMPAR] }
          : { role: "assistant", texto: "Ainda não temos itens nessa opção. Escreva o que procura que eu te ajudo.", sugestoes: [VOLTAR_AREAS] },
      ]);
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

  // o balão abre em cima do robô, como a fala dele; o robô continua à vista (Wagner, 18/11/2026)
  const posBalao = comBarraSempre
    ? "bottom-[222px] sm:bottom-[262px]"
    : comBarraCelular
      ? "bottom-[222px] sm:bottom-[186px]"
      : "bottom-[138px] sm:bottom-[186px]";
  const altBalao = comBarraSempre || comBarraCelular ? "calc(100dvh - 250px)" : "calc(100dvh - 170px)";

  return (
    <>
      {aberto && (
        <div
          role="dialog"
          aria-label="SIBRAP IA, assistente virtual"
          className={`fixed right-3 z-[60] flex h-[420px] w-[calc(100vw-56px)] max-w-[330px] flex-col border-2 border-[#0149AF] bg-[#F4F6F9] shadow-[0_18px_40px_-12px_rgba(1,73,175,0.45)] sm:right-4 sm:h-[540px] sm:w-[380px] sm:max-w-none ${posBalao}`}
          style={{ maxHeight: altBalao }}
        >
          <div className="flex items-center justify-between bg-[#0149AF] px-4 py-2.5 text-white">
            <span>
              <span className="block font-display text-[15px] font-extrabold leading-tight">SIBRAP IA</span>
              <span className="block text-[12px] text-[#D6E4FA]">Assistente virtual · responde na hora</span>
            </span>
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => void enviar(LIMPAR)} className="px-2 py-1 text-[12px] font-semibold text-[#D6E4FA] underline underline-offset-2 hover:text-white">
                Limpar
              </button>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="px-2 text-[22px] leading-none text-[#D6E4FA] hover:text-white">
                ×
              </button>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {msgs.map((m, i) => (
              <div key={i} className={`mb-2.5 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] ${m.role === "user" ? "bg-[#0149AF] text-white" : "border border-[#D7DEE6] bg-white text-[#14213A]"} px-3 py-2 text-[14px] leading-snug`}>
                  {m.texto}
                  {m.opcoes?.map((o) => <Cartao key={o.id} item={o} perfil={perfil} />)}
                  {m.links?.length ? (
                    <span className="mt-2.5 flex flex-col gap-1.5">
                      {m.links.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          onClick={() => registrar("aluno", { alvo: l.href })}
                          className={`block px-3 py-2 text-center text-[14px] font-bold ${
                            l.principal ? "bg-[#0149AF] text-white hover:brightness-110" : "border-2 border-[#0149AF] bg-white text-[#0149AF] hover:bg-[#EEF3FC]"
                          }`}
                        >
                          {l.rotulo} →
                        </a>
                      ))}
                    </span>
                  ) : null}
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
          <span aria-hidden className="absolute -bottom-[10px] right-[34px] h-4 w-4 rotate-45 border-b-2 border-r-2 border-[#0149AF] bg-white sm:right-[54px]" />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!aberto) registrar("abriu");
          setAberto((a) => !a);
        }}
        aria-label={aberto ? "Fechar o SIBRAP IA" : "Abrir o SIBRAP IA, assistente virtual"}
        aria-expanded={aberto}
        className={`robo-brilho fixed right-2 z-50 outline-none transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0149AF] sm:right-4 ${baixo}`}
      >
        {/* ilustração 3D do SIBRAP IA feita pelo Wagner (adesivo "Posso ajudar?") */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sibrap-ia/adesivo.webp" alt="SIBRAP IA: posso ajudar?" width={340} height={405} className="h-[118px] w-auto sm:h-[158px]" />
      </button>
    </>
  );
}
