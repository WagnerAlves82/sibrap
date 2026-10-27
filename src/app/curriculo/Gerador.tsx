"use client";

// Gerador de currículos: escolha do perfil e do modelo, formulário em etapas, prévia ao vivo
// e download do PDF. O rascunho (com a foto) fica só neste aparelho (localStorage); ao baixar,
// o texto do currículo é salvo na conta. A foto nunca é guardada no servidor.

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AreaTexto, Aviso, Campo, ListaItens, Selecao, Titulo } from "@/components/curriculo/campos";
import { FolhaCurriculo } from "@/components/curriculo/folha";
import { reduzirFoto } from "@/components/curriculo/foto";
import { montarDocumento } from "@/lib/curriculo/secoes";
import { EtapaBaixar } from "./Baixar";
import {
  atividadeVazia, cursoVazio, dadosVazios, experienciaVazia, formacaoVazia, formatarTelefone, idiomaVazio,
  MAX_HABILIDADES, MAX_ITENS, MODELOS, NIVEIS_IDIOMA, normalizar, PERFIS, SITUACOES, UFS, validar,
  type Curriculo, type DadosCurriculo, type Erros, type Modelo, type Perfil,
} from "@/lib/curriculo/tipos";

const CHAVE = "sibrap_curriculo_v1";
const ETAPAS = ["Perfil e modelo", "Dados e contato", "Objetivo", "Formação", "Experiência", "Cursos e habilidades", "Revisão", "Baixar"] as const;
const ERRO_ETAPA: Record<keyof Erros, number> = {
  nome: 1, contato: 1, email: 1, telefone: 1, cidade: 1, objetivo: 2, formacao: 3, experiencia: 4,
};

type Rascunho = { perfil: Perfil | null; modelo: Modelo; dados: DadosCurriculo; foto: string | null; curriculoId: string | null; etapa: number };
export type CurriculoSalvo = { id: string; perfil: string; modelo: string; dados: unknown } | null;

const inicial = (): Rascunho => ({ perfil: null, modelo: "classico", dados: dadosVazios(), foto: null, curriculoId: null, etapa: 0 });


/** Rascunho do aparelho; sem rascunho, o currículo salvo na conta. */
function lerRascunho(salvo: CurriculoSalvo, baixar: boolean): Rascunho {
  let base: Rascunho | null = null;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const j = JSON.parse(bruto) as Partial<Rascunho>;
      const c = normalizar({ perfil: j.perfil ?? "jovem", modelo: j.modelo, dados: j.dados });
      if (c) base = { perfil: j.perfil ?? null, modelo: c.modelo, dados: c.dados, foto: typeof j.foto === "string" ? j.foto : null, curriculoId: j.curriculoId ?? null, etapa: Number(j.etapa) || 0 };
    }
  } catch {
    // sem acesso ao armazenamento: começa do zero
  }
  if (!base && salvo) {
    const c = normalizar(salvo);
    if (c) base = { perfil: c.perfil, modelo: c.modelo, dados: c.dados, foto: null, curriculoId: salvo.id, etapa: 6 };
  }
  if (!base) return inicial();
  if (baixar && base.perfil) base.etapa = 7;
  return base;
}

const semInscricao = () => () => {};

type Props = { logado: boolean; emailConta: string | null; salvo: CurriculoSalvo; precoCentavos: number | null };

export function Gerador(props: Props) {
  // o rascunho mora no localStorage: o formulário só é montado no navegador
  const noNavegador = useSyncExternalStore(semInscricao, () => true, () => false);
  if (!noNavegador) return <div className="min-h-[60vh]" />;
  return <GeradorNoNavegador {...props} />;
}

function GeradorNoNavegador({ logado, emailConta, salvo, precoCentavos }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [r, setR] = useState<Rascunho>(() => lerRascunho(salvo, params.get("baixar") === "1"));
  const [mostrarErros, setMostrarErros] = useState(false);
  const [previaAberta, setPreviaAberta] = useState(false);
  const topoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(r));
    } catch {
      // armazenamento cheio ou bloqueado: segue sem rascunho
    }
  }, [r]);

  const mudar = useCallback((parcial: Partial<DadosCurriculo>) => setR((x) => ({ ...x, dados: { ...x.dados, ...parcial } })), []);
  const irPara = (etapa: number) => {
    setR((x) => ({ ...x, etapa }));
    setMostrarErros(false);
    topoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const curriculo = useMemo<Curriculo | null>(() => (r.perfil ? { perfil: r.perfil, modelo: r.modelo, dados: r.dados } : null), [r.perfil, r.modelo, r.dados]);
  const erros = useMemo(() => (curriculo ? validar(curriculo) : {}), [curriculo]);
  const doc = useMemo(() => (curriculo ? montarDocumento(curriculo) : null), [curriculo]);
  const errosDaEtapa = (Object.keys(erros) as (keyof Erros)[]).filter((k) => ERRO_ETAPA[k] === r.etapa);
  const e = (k: keyof Erros) => (mostrarErros ? erros[k] : undefined);

  const continuar = () => {
    if (errosDaEtapa.length) {
      setMostrarErros(true);
      return;
    }
    irPara(r.etapa + 1);
  };

  const perfilInfo = r.perfil ? PERFIS[r.perfil] : null;
  const progresso = Math.round((r.etapa / (ETAPAS.length - 1)) * 100);

  return (
    <div ref={topoRef} className="grid scroll-mt-24 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0">
        {r.etapa > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-[13px] font-semibold text-[#516278]">
              <span>
                Etapa {r.etapa} de {ETAPAS.length - 1} · {ETAPAS[r.etapa]}
              </span>
              <button type="button" onClick={() => setPreviaAberta(true)} className="text-brand underline underline-offset-4 lg:hidden">
                Ver prévia
              </button>
            </div>
            <div className="mt-2 h-2 overflow-hidden bg-[#E6EDF4]">
              <div className="h-full bg-accent transition-all" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        )}

        <div className="border border-[#D7DEE6] bg-white p-5 sm:p-7">
          {r.etapa === 0 && (
            <EtapaInicio
              perfil={r.perfil}
              modelo={r.modelo}
              aoEscolherPerfil={(perfil) => setR((x) => ({ ...x, perfil }))}
              aoEscolherModelo={(modelo) => setR((x) => ({ ...x, modelo }))}
            />
          )}

          {r.etapa === 1 && (
            <div className="flex flex-col gap-4">
              <Titulo titulo="Seus dados e contato" texto="É assim que a empresa vai falar com você. Confira bem o telefone e o e-mail." />
              <Campo rotulo="Nome completo" valor={r.dados.nome} aoMudar={(nome) => mudar({ nome })} erro={e("nome")} autoComplete="name" maxLength={120} />
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <Campo rotulo="Cidade" valor={r.dados.cidade} aoMudar={(cidade) => mudar({ cidade })} erro={e("cidade")} autoComplete="address-level2" maxLength={120} />
                <Selecao rotulo="UF" valor={r.dados.uf} aoMudar={(uf) => mudar({ uf })} opcoes={[{ valor: "", texto: "--" }, ...UFS.map((u) => ({ valor: u, texto: u }))]} />
              </div>
              <Campo
                rotulo="Telefone / WhatsApp"
                valor={r.dados.telefone}
                aoMudar={(v) => mudar({ telefone: formatarTelefone(v) })}
                erro={e("telefone") ?? e("contato")}
                tipo="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(47) 99999-9999"
              />
              <Campo rotulo="E-mail" valor={r.dados.email} aoMudar={(email) => mudar({ email: email.trim() })} erro={e("email")} tipo="email" autoComplete="email" maxLength={120} />
              <Campo rotulo="LinkedIn ou portfólio" opcional valor={r.dados.link} aoMudar={(link) => mudar({ link })} placeholder="linkedin.com/in/seunome" maxLength={200} />
              {r.modelo !== "compacto" && <EscolherFoto foto={r.foto} aoMudar={(foto) => setR((x) => ({ ...x, foto }))} />}
            </div>
          )}

          {r.etapa === 2 && perfilInfo && (
            <div className="flex flex-col gap-4">
              <Titulo
                titulo={perfilInfo.tituloObjetivo}
                texto={r.perfil === "jovem" ? "Diga em uma ou duas frases que tipo de vaga você procura." : "Resuma sua experiência e a vaga que você procura, em duas ou três frases."}
              />
              <AreaTexto rotulo={perfilInfo.tituloObjetivo} valor={r.dados.objetivo} aoMudar={(objetivo) => mudar({ objetivo })} erro={e("objetivo")} linhas={4} maxLength={600} />
              <div>
                <p className="mb-2 text-[13.5px] font-semibold text-[#14213A]">Exemplos (toque para usar e depois ajuste com suas palavras):</p>
                <div className="flex flex-col gap-2">
                  {perfilInfo.exemplosObjetivo.map((ex) => (
                    <button key={ex} type="button" onClick={() => mudar({ objetivo: ex })} className="border border-[#D7DEE6] bg-[#F8FAFC] px-3.5 py-2.5 text-left text-[14px] leading-snug text-[#33465E] hover:border-brand">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {r.etapa === 3 && (
            <div className="flex flex-col gap-4">
              <Titulo titulo="Formação" texto="Ensino fundamental, médio, técnico ou superior. Vale também se você ainda está estudando." />
              {e("formacao") && <Aviso texto={e("formacao")!} />}
              <ListaItens
                itens={r.dados.formacoes}
                aoMudar={(formacoes) => mudar({ formacoes })}
                novo={formacaoVazia}
                max={MAX_ITENS}
                rotuloItem="Formação"
                rotuloAdicionar={r.dados.formacoes.length ? "Adicionar outra formação" : "Adicionar formação"}
                render={(f, m) => (
                  <>
                    <Campo rotulo="Nível ou curso" valor={f.curso} aoMudar={(curso) => m({ curso })} placeholder="Ensino Médio, Técnico em Administração..." maxLength={120} />
                    <Campo rotulo="Escola ou instituição" valor={f.instituicao} aoMudar={(instituicao) => m({ instituicao })} maxLength={120} />
                    <Selecao rotulo="Situação" valor={f.situacao} aoMudar={(v) => m({ situacao: v as typeof f.situacao })} opcoes={Object.entries(SITUACOES).map(([valor, texto]) => ({ valor, texto }))} />
                    {f.situacao !== "interrompido" && (
                      <Campo
                        rotulo={f.situacao === "cursando" ? "Previsão de conclusão" : "Ano de conclusão"}
                        opcional
                        valor={f.fim}
                        aoMudar={(fim) => m({ fim: fim.replace(/\D/g, "").slice(0, 4) })}
                        inputMode="numeric"
                        placeholder="2025"
                      />
                    )}
                  </>
                )}
              />
            </div>
          )}

          {r.etapa === 4 && r.perfil === "jovem" && (
            <div className="flex flex-col gap-4">
              <Titulo
                titulo="Atividades, projetos e voluntariado"
                texto="Não tem experiência com carteira assinada? Sem problema. Coloque projetos da escola, trabalho voluntário, ajuda no negócio da família ou bicos. Se não tiver nada disso, pode pular esta etapa."
              />
              <ListaItens
                itens={r.dados.atividades}
                aoMudar={(atividades) => mudar({ atividades })}
                novo={atividadeVazia}
                max={MAX_ITENS}
                rotuloItem="Atividade"
                rotuloAdicionar="Adicionar atividade"
                render={(a, m) => (
                  <>
                    <Campo rotulo="O que você fez" valor={a.titulo} aoMudar={(titulo) => m({ titulo })} placeholder="Voluntário na campanha do agasalho" maxLength={120} />
                    <Campo rotulo="Onde" opcional valor={a.local} aoMudar={(local) => m({ local })} placeholder="Escola, igreja, ONG..." maxLength={120} />
                    <Campo rotulo="Quando" opcional valor={a.periodo} aoMudar={(periodo) => m({ periodo })} placeholder="2024" maxLength={40} />
                    <AreaTexto rotulo="Conte em poucas palavras" opcional valor={a.descricao} aoMudar={(descricao) => m({ descricao })} linhas={3} maxLength={900} />
                  </>
                )}
              />
            </div>
          )}

          {r.etapa === 4 && r.perfil === "medio" && (
            <div className="flex flex-col gap-4">
              <Titulo titulo="Experiência profissional" texto="Comece pela mais recente. Experiência curta também vale: descreva o que você fazia no dia a dia." />
              {e("experiencia") && <Aviso texto={e("experiencia")!} />}
              <ListaItens
                itens={r.dados.experiencias}
                aoMudar={(experiencias) => mudar({ experiencias })}
                novo={experienciaVazia}
                max={MAX_ITENS}
                rotuloItem="Experiência"
                rotuloAdicionar={r.dados.experiencias.length ? "Adicionar outra experiência" : "Adicionar experiência"}
                render={(x, m) => (
                  <>
                    <Campo rotulo="Cargo" valor={x.cargo} aoMudar={(cargo) => m({ cargo })} placeholder="Auxiliar Administrativo" maxLength={120} />
                    <Campo rotulo="Empresa" valor={x.empresa} aoMudar={(empresa) => m({ empresa })} maxLength={120} />
                    <div className="grid grid-cols-2 gap-3">
                      <Campo rotulo="Início" valor={x.inicio} aoMudar={(inicio) => m({ inicio })} tipo="month" />
                      {!x.atual && <Campo rotulo="Saída" valor={x.fim} aoMudar={(fim) => m({ fim })} tipo="month" />}
                    </div>
                    <label className="flex items-center gap-2 text-[14px] text-[#14213A]">
                      <input type="checkbox" checked={x.atual} onChange={(ev) => m({ atual: ev.target.checked })} className="h-4 w-4 accent-[#0b2a4a]" />
                      Trabalho aqui atualmente
                    </label>
                    <AreaTexto
                      rotulo="Atividades realizadas"
                      opcional
                      valor={x.atividades}
                      aoMudar={(atividades) => m({ atividades })}
                      placeholder={"Atendimento a clientes por telefone e WhatsApp\nControle de notas fiscais e arquivo"}
                      dica="Uma atividade por linha. Escreva só o que você realmente fazia."
                      linhas={4}
                      maxLength={900}
                    />
                  </>
                )}
              />
            </div>
          )}

          {r.etapa === 5 && perfilInfo && (
            <div className="flex flex-col gap-6">
              <Titulo titulo="Cursos, habilidades e idiomas" texto="Cursos livres, técnicos e online contam. Coloque só o que você fez de verdade." />
              <ListaItens
                itens={r.dados.cursos}
                aoMudar={(cursos) => mudar({ cursos })}
                novo={cursoVazio}
                max={12}
                rotuloItem="Curso"
                rotuloAdicionar={r.dados.cursos.length ? "Adicionar outro curso" : "Adicionar curso"}
                render={(x, m) => (
                  <>
                    <Campo rotulo="Nome do curso" valor={x.nome} aoMudar={(nome) => m({ nome })} placeholder="Informática Básica" maxLength={120} />
                    <Campo rotulo="Instituição" opcional valor={x.instituicao} aoMudar={(instituicao) => m({ instituicao })} placeholder="SIBRAP, SENAI, SENAC..." maxLength={120} />
                    <div className="grid grid-cols-2 gap-3">
                      <Campo rotulo="Carga horária (h)" opcional valor={x.cargaHoraria} aoMudar={(v) => m({ cargaHoraria: v.replace(/\D/g, "").slice(0, 4) })} inputMode="numeric" placeholder="40" />
                      <Campo rotulo="Ano" opcional valor={x.ano} aoMudar={(v) => m({ ano: v.replace(/\D/g, "").slice(0, 4) })} inputMode="numeric" placeholder="2025" />
                    </div>
                  </>
                )}
              />
              <Habilidades selecionadas={r.dados.habilidades} sugeridas={perfilInfo.habilidadesSugeridas} aoMudar={(habilidades) => mudar({ habilidades })} />
              <div>
                <p className="mb-2 font-display text-[16px] font-extrabold text-[#14213A]">Idiomas <span className="text-[13px] font-normal text-[#93A0AF]">(opcional)</span></p>
                <ListaItens
                  itens={r.dados.idiomas}
                  aoMudar={(idiomas) => mudar({ idiomas })}
                  novo={idiomaVazio}
                  max={5}
                  rotuloItem="Idioma"
                  rotuloAdicionar="Adicionar idioma"
                  render={(x, m) => (
                    <div className="grid grid-cols-2 gap-3">
                      <Campo rotulo="Idioma" valor={x.idioma} aoMudar={(idioma) => m({ idioma })} placeholder="Inglês" maxLength={40} />
                      <Selecao rotulo="Nível" valor={x.nivel} aoMudar={(nivel) => m({ nivel })} opcoes={NIVEIS_IDIOMA.map((n) => ({ valor: n, texto: n }))} />
                    </div>
                  )}
                />
              </div>
              <AreaTexto
                rotulo="Informações adicionais"
                opcional
                valor={r.dados.adicionais}
                aoMudar={(adicionais) => mudar({ adicionais })}
                placeholder="Disponibilidade de horário, CNH categoria B..."
                linhas={2}
                maxLength={400}
              />
            </div>
          )}

          {r.etapa === 6 && (
            <Revisao erros={erros} aoCorrigir={(k) => { irPara(ERRO_ETAPA[k]); setMostrarErros(true); }} aoEditar={irPara} />
          )}

          {r.etapa === 7 && curriculo && (
            <EtapaBaixar
              curriculo={curriculo}
              foto={r.foto}
              curriculoId={r.curriculoId}
              logado={logado}
              emailConta={emailConta}
              precoCentavos={precoCentavos}
              autoBaixar={params.get("baixar") === "1"}
              aoSalvar={(curriculoId) => setR((x) => ({ ...x, curriculoId }))}
              aoEditar={() => irPara(1)}
              aoExcluir={() => {
                try { localStorage.removeItem(CHAVE); } catch { /* sem armazenamento */ }
                setR(inicial());
                router.replace("/curriculo");
              }}
            />
          )}

          {r.etapa < 7 && (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#E7EDF3] pt-5">
              {r.etapa > 0 ? (
                <button type="button" onClick={() => irPara(r.etapa - 1)} className="px-4 py-3 text-[15px] font-bold text-brand hover:bg-[#F0F4F8]">
                  ← Voltar
                </button>
              ) : <span />}
              {r.etapa === 6 ? (
                <button
                  type="button"
                  disabled={Object.keys(erros).length > 0}
                  onClick={() => irPara(7)}
                  className="bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tudo certo, ir para o download →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={r.etapa === 0 && !r.perfil}
                  onClick={continuar}
                  className="bg-brand px-6 py-3 text-[15px] font-bold text-white transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {r.etapa === 4 && r.perfil === "jovem" && !r.dados.atividades.length ? "Pular esta etapa →" : "Continuar →"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* prévia: ao lado no computador, em tela cheia no celular */}
      <aside className={previaAberta ? "fixed inset-0 z-[70] overflow-y-auto bg-[#0b2a4a] p-4" : "hidden lg:block"}>
        <div className={previaAberta ? "mx-auto max-w-[520px]" : "lg:sticky lg:top-6"}>
          <div className="mb-2 flex items-center justify-between">
            <p className={`font-data text-xs font-semibold uppercase tracking-wide ${previaAberta ? "text-white" : "text-[#516278]"}`}>
              Prévia {r.perfil ? `· modelo ${MODELOS[r.modelo].titulo}` : ""}
            </p>
            {previaAberta && (
              <button type="button" onClick={() => setPreviaAberta(false)} className="bg-white px-3 py-1.5 text-[13px] font-bold text-brand">
                Fechar
              </button>
            )}
          </div>
          {doc ? <Previa doc={doc} modelo={r.modelo} foto={MODELOS[r.modelo].temFoto ? r.foto : null} /> : <PreviaVazia />}
        </div>
      </aside>
    </div>
  );
}


function EtapaInicio({
  perfil, modelo, aoEscolherPerfil, aoEscolherModelo,
}: { perfil: Perfil | null; modelo: Modelo; aoEscolherPerfil: (p: Perfil) => void; aoEscolherModelo: (m: Modelo) => void }) {
  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-[#14213A]">1. Qual é o seu momento?</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(Object.keys(PERFIS) as Perfil[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => aoEscolherPerfil(p)}
              aria-pressed={perfil === p}
              className={` border-2 p-4 text-left transition-colors ${perfil === p ? "border-brand bg-[#EEF4FB]" : "border-[#D7DEE6] hover:border-[#9FB3C8]"}`}
            >
              <span className="block font-display text-[16px] font-extrabold text-[#14213A]">{PERFIS[p].titulo}</span>
              <span className="mt-1 block text-[13.5px] leading-snug text-[#516278]">{PERFIS[p].resumo}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12.5px] text-[#93A0AF]">Modelo para quem tem carreira consolidada: em breve.</p>
      </div>
      <div>
        <h2 className="font-display text-2xl font-extrabold text-[#14213A]">2. Escolha o visual</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {(Object.keys(MODELOS) as Modelo[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => aoEscolherModelo(m)}
              aria-pressed={modelo === m}
              className={` border-2 p-2.5 text-left transition-colors ${modelo === m ? "border-brand bg-[#EEF4FB]" : "border-[#D7DEE6] hover:border-[#9FB3C8]"}`}
            >
              <MiniModelo modelo={m} />
              <span className="mt-2 block font-display text-[14.5px] font-extrabold text-[#14213A]">{MODELOS[m].titulo}</span>
              <span className="block text-[12px] leading-snug text-[#516278]">{MODELOS[m].resumo}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Desenho simplificado de cada modelo, para a escolha. */
function MiniModelo({ modelo }: { modelo: Modelo }) {
  const linha = (w: string, cor = "#C9D3DE") => <span className="block h-1 " style={{ width: w, background: cor }} />;
  return (
    <span className="flex aspect-[210/297] w-full overflow-hidden border border-[#D7DEE6] bg-white">
      {modelo === "moderno" && (
        <span className="flex w-[34%] flex-col gap-1 bg-[#0b2a4a] p-1.5">
          <span className="block aspect-[3/4] w-3/4 bg-[#4a6584]" />
          {linha("80%", "#d4a24a")}
          {linha("70%", "#6d86a3")}
          {linha("60%", "#6d86a3")}
        </span>
      )}
      <span className={`flex flex-1 flex-col gap-1 p-1.5 ${modelo === "classico" ? "items-center" : ""}`}>
        {linha(modelo === "classico" ? "70%" : "75%", "#0b2a4a")}
        {linha("55%")}
        <span className="mt-1" />
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex w-full flex-col gap-0.5">
            {linha("40%", modelo === "moderno" ? "#d4a24a" : "#0b2a4a")}
            {linha("95%")}
            {linha("85%")}
            {modelo === "compacto" && linha("90%")}
          </span>
        ))}
      </span>
    </span>
  );
}

function EscolherFoto({ foto, aoMudar }: { foto: string | null; aoMudar: (f: string | null) => void }) {
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState(false);
  return (
    <div className="border border-[#D7DEE6] bg-[#F8FAFC] p-4">
      <p className="text-[13.5px] font-semibold text-[#14213A]">
        Foto <span className="font-normal text-[#93A0AF]">(opcional)</span>
      </p>
      <p className="mt-0.5 text-[12.5px] leading-snug text-[#516278]">
        Muitas empresas preferem currículo sem foto. Se usar, escolha uma de rosto, com fundo claro. A foto fica só no seu aparelho e é reduzida automaticamente.
      </p>
      <div className="mt-3 flex items-center gap-4">
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="Sua foto" className="h-24 w-[72px] object-cover" />
        )}
        <div className="flex flex-col gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center border border-brand px-4 py-2 text-[14px] font-bold text-brand hover:bg-white">
            {processando ? "Reduzindo a foto..." : foto ? "Trocar foto" : "Escolher foto"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={processando}
              onChange={async (ev) => {
                const arquivo = ev.target.files?.[0];
                ev.target.value = "";
                if (!arquivo) return;
                setErro("");
                setProcessando(true);
                try {
                  aoMudar(await reduzirFoto(arquivo));
                } catch (err) {
                  setErro(err instanceof Error ? err.message : "Não deu para usar essa foto.");
                } finally {
                  setProcessando(false);
                }
              }}
            />
          </label>
          {foto && (
            <button type="button" onClick={() => aoMudar(null)} className="text-left text-[13px] font-semibold text-[#B42318]">
              Remover foto
            </button>
          )}
        </div>
      </div>
      {erro && <p className="mt-2 text-[12.5px] font-semibold text-[#B42318]">{erro}</p>}
    </div>
  );
}

function Habilidades({ selecionadas, sugeridas, aoMudar }: { selecionadas: string[]; sugeridas: string[]; aoMudar: (h: string[]) => void }) {
  const [nova, setNova] = useState("");
  const todas = [...sugeridas, ...selecionadas.filter((h) => !sugeridas.includes(h))];
  const alternar = (h: string) =>
    aoMudar(selecionadas.includes(h) ? selecionadas.filter((x) => x !== h) : selecionadas.length < MAX_HABILIDADES ? [...selecionadas, h] : selecionadas);
  const adicionar = () => {
    const h = nova.trim().slice(0, 60);
    if (h && !selecionadas.includes(h) && selecionadas.length < MAX_HABILIDADES) aoMudar([...selecionadas, h]);
    setNova("");
  };
  return (
    <div>
      <p className="font-display text-[16px] font-extrabold text-[#14213A]">Habilidades</p>
      <p className="mb-2 text-[13px] text-[#516278]">Toque nas que você tem de verdade ou escreva outras. Até {MAX_HABILIDADES}.</p>
      <div className="flex flex-wrap gap-2">
        {todas.map((h) => {
          const ativa = selecionadas.includes(h);
          return (
            <button
              key={h}
              type="button"
              onClick={() => alternar(h)}
              aria-pressed={ativa}
              className={` border px-3 py-1.5 text-[13.5px] font-semibold transition-colors ${ativa ? "border-brand bg-brand text-white" : "border-[#C9D3DE] bg-white text-[#33465E] hover:border-brand"}`}
            >
              {ativa ? "✓ " : "+ "}
              {h}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={nova}
          onChange={(ev) => setNova(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              adicionar();
            }
          }}
          placeholder="Outra habilidade"
          maxLength={60}
          className="min-w-0 flex-1 border border-[#C9D3DE] px-3.5 py-2.5 text-[15px] outline-none focus:border-brand"
        />
        <button type="button" onClick={adicionar} className="border border-brand px-4 text-[14px] font-bold text-brand">
          Adicionar
        </button>
      </div>
    </div>
  );
}

function Revisao({ erros, aoCorrigir, aoEditar }: { erros: Erros; aoCorrigir: (k: keyof Erros) => void; aoEditar: (etapa: number) => void }) {
  const lista = Object.entries(erros) as [keyof Erros, string][];
  return (
    <div className="flex flex-col gap-5">
      <Titulo titulo="Revisão" texto="Confira o currículo na prévia. Erro no telefone ou no e-mail faz a empresa não conseguir falar com você." />
      {lista.length > 0 ? (
        <div className="border border-[#F3C9C5] bg-[#FDF0EE] p-4">
          <p className="font-bold text-[#B42318]">Falta corrigir {lista.length === 1 ? "1 item" : `${lista.length} itens`}:</p>
          <ul className="mt-2 flex flex-col gap-2">
            {lista.map(([k, msg]) => (
              <li key={k} className="flex items-center justify-between gap-3 text-[14px] text-[#33465E]">
                <span>{msg}</span>
                <button type="button" onClick={() => aoCorrigir(k)} className="shrink-0 font-bold text-brand underline underline-offset-4">
                  Corrigir
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="border border-[#B7E1C6] bg-[#EDF8F1] p-4 font-semibold text-[#1C6B3A]">Tudo certo! Confira a prévia e siga para o download.</p>
      )}
      <div>
        <p className="mb-2 text-[13.5px] font-semibold text-[#14213A]">Quer mudar alguma parte?</p>
        <div className="flex flex-wrap gap-2">
          {ETAPAS.slice(0, 6).map((nome, i) => (
            <button key={nome} type="button" onClick={() => aoEditar(i)} className="border border-[#C9D3DE] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#33465E] hover:border-brand">
              {nome}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Previa({ doc, modelo, foto }: { doc: ReturnType<typeof montarDocumento>; modelo: Modelo; foto: string | null }) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const folhaRef = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.5);
  const [altura, setAltura] = useState(1123);

  useEffect(() => {
    const caixa = caixaRef.current;
    const folha = folhaRef.current;
    if (!caixa || !folha) return;
    const medir = () => {
      setEscala(caixa.clientWidth / 794);
      setAltura(Math.max(1123, folha.scrollHeight));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caixa);
    ro.observe(folha);
    return () => ro.disconnect();
  }, []);

  const paginas = Math.ceil(altura / 1123);
  return (
    <div ref={caixaRef} className="w-full overflow-hidden border border-[#D7DEE6] shadow-[0_20px_45px_-28px_rgba(11,42,74,0.45)]" style={{ height: altura * escala }}>
      <div style={{ transform: `scale(${escala})`, transformOrigin: "top left", width: 794, position: "relative" }}>
        <div ref={folhaRef}>
          <FolhaCurriculo doc={doc} modelo={modelo} foto={foto} />
        </div>
        {Array.from({ length: paginas - 1 }, (_, i) => (
          <div key={i} className="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-[#E08A2B]" style={{ top: (i + 1) * 1123 }}>
            <span className="absolute right-2 top-1 bg-[#E08A2B] px-2 py-0.5 text-[14px] font-bold text-white">página {i + 2}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviaVazia() {
  return (
    <div className="flex aspect-[210/297] w-full items-center justify-center border-2 border-dashed border-[#C9D3DE] bg-white p-8 text-center text-[14px] text-[#93A0AF]">
      Escolha o seu momento para ver a prévia do currículo aqui.
    </div>
  );
}

