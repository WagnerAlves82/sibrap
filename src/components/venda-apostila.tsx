import Image from "next/image";
import Link from "next/link";
import { IconeSolido, type NomeIconeSolido } from "@/components/icones-solidos";
import { Reveal } from "@/components/reveal";
import { descontoPercentual, formatarPreco } from "@/lib/apostilas";

export type DadosVenda = {
  cargo: string;
  orgao: string;
  cidade: string | null;
  banca: string | null;
  prova: string | null;
  dias: number | null;
  paginas: number | null;
  questoes: number | null;
  simulados: number | null;
  incluiSimulado: boolean;
  imagem: string | null;
  precoCentavos: number;
  precoOriginalCentavos: number | null;
  jaTem: boolean;
  ctaHref: string;
  ctaRotulo: string;
};

const TITULO = "font-display text-[1.6rem] font-extrabold leading-tight text-[#14213A] sm:text-[2.1rem]";
const BOTAO =
  "btn-pulso brilho inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 text-[16px] font-extrabold text-accent-ink";

export function perguntasVenda(d: DadosVenda): [string, string][] {
  return [
    [
      "Como eu recebo a apostila?",
      "Assim que o PIX é confirmado, o download é liberado na sua área, no próprio site. Você pode baixar o PDF quando quiser, quantas vezes precisar, e estudar no celular, no tablet ou no computador.",
    ],
    [
      "Preciso esperar alguma entrega ou e-mail?",
      "Não. O acesso é imediato depois da confirmação do pagamento. Enviamos também um e-mail com o link para a sua área.",
    ],
    [
      "Tem validade? Pago mensalidade?",
      "Não. O pagamento é único, sem mensalidade e sem assinatura. O arquivo é seu.",
    ],
    [
      "A apostila serve para o edital do meu concurso?",
      `Ela foi montada a partir do conteúdo programático oficial do cargo de ${d.cargo} (${d.orgao}), na mesma ordem do edital. O que não cai na sua prova, não entra.`,
    ],
    [
      "Ela garante a minha aprovação?",
      "Nenhum material garante aprovação, e desconfie de quem promete isso. O que a apostila faz é organizar o seu estudo, mostrar o que a prova cobra e dar treino com questões, para você chegar mais preparado.",
    ],
    [
      "E se eu não gostar?",
      "Você tem 7 dias corridos para pedir o reembolso, conforme o Código de Defesa do Consumidor. É só escrever para o nosso contato e o valor volta pelo mesmo meio de pagamento.",
    ],
  ];
}

function BotaoCta({ d, className = "" }: { d: DadosVenda; className?: string }) {
  return (
    <Link href={d.ctaHref} prefetch={false} className={`${BOTAO} ${className}`}>
      {d.ctaRotulo} <span aria-hidden>→</span>
    </Link>
  );
}

export function VendaApostila({ d }: { d: DadosVenda }) {
  const preco = formatarPreco(d.precoCentavos);
  const pct = descontoPercentual(d.precoOriginalCentavos, d.precoCentavos);
  const porDia = d.dias !== null && d.dias > 0 ? formatarPreco(Math.max(1, Math.round(d.precoCentavos / d.dias))) : null;
  const onde = d.cidade ? `de ${d.cidade}` : `do ${d.orgao}`;

  const numeros: [string, string][] = [
    [d.paginas ? String(d.paginas) : "PDF", d.paginas ? "páginas de conteúdo" : "completo"],
    [d.questoes ? String(d.questoes) : "+", "questões comentadas"],
    ["1.800+", "questões no banco de provas"],
    ["7 dias", "de garantia"],
  ];

  const cartoes: [NomeIconeSolido, string, string][] = [
    ["livro", d.paginas ? `${d.paginas} páginas em PDF` : "Apostila completa em PDF", "Conteúdo na ordem do edital, com dicas, exemplos resolvidos e resumo de cada capítulo."],
    ["questoes", d.questoes ? `${d.questoes} questões comentadas` : "Questões comentadas", "Exercícios no estilo da banca. Cada resposta vem explicada, inclusive por que as outras alternativas estão erradas."],
    ["questoes", "Banco de provas com mais de 1.800 questões", "Questões de provas reais e no estilo das bancas, reunidas na plataforma para você treinar sem fim."],
    ...(d.incluiSimulado
      ? ([["tela", "Simulado online", "Pratique no site, pelo celular ou computador, com questões sorteadas do banco do seu cargo."]] as [NomeIconeSolido, string, string][])
      : []),
    ["video", "Videoaulas", "Videoaulas em cursos selecionados da plataforma, direto na sua área, para ver o conteúdo explicado."],
    ["calendario", "Cronograma de estudos", "O edital transformado em checklist, com o percentual concluído em cada matéria."],
    ["raio", "Acesso imediato", "PIX confirmado, download liberado na sua área. Sem espera e sem assinatura."],
  ];

  return (
    <div className="overflow-x-clip bg-white">
      {/* Faixa de números */}
      <section className="bg-brand-deep py-8 text-white sm:py-10">
        <div className="mx-auto grid max-w-[1080px] grid-cols-2 gap-y-6 px-4 sm:px-6 md:grid-cols-4">
          {numeros.map(([n, rotulo], i) => (
            <Reveal key={rotulo} delay={i * 90} variante="zoom" className="text-center">
              <p className="font-display text-[2.2rem] font-extrabold leading-none text-accent sm:text-[2.8rem]">{n}</p>
              <p className="mt-1.5 text-[13px] font-semibold text-[#B9CBDF]">{rotulo}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Abertura persuasiva */}
      <section className="mx-auto max-w-[1080px] overflow-hidden px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_300px]">
          <Reveal variante="esquerda">
            <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
              Para quem vai fazer a prova {onde}
            </p>
            <h2 className={`${TITULO} mt-2 max-w-[24ch]`}>
              Na hora da prova, quem estudou o conteúdo certo sai na frente.
            </h2>
            <p className="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-[#33465E]">
              Muita gente se inscreve, abre vários PDFs soltos, assiste a vídeos sobre o que não cai e chega à prova sem saber
              por onde começar. Quando o cargo é o de <strong>{d.cargo}</strong>, cada questão faz diferença na classificação.
            </p>
            <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-[#33465E]">
              Esta apostila foi feita para estudar com direção: conteúdo do edital organizado, questões no estilo da banca
              {d.banca ? ` ${d.banca}` : ""} com gabarito comentado e treino no simulado online. Menos tempo procurando
              material, mais tempo aprendendo o que vale ponto.
            </p>
            <div className="mt-7">
              <BotaoCta d={d} />
            </div>
          </Reveal>
          {d.imagem && (
            <Reveal variante="direita" delay={150}>
              <div className="relative mx-auto aspect-[2/3] w-full max-w-[250px] md:max-w-none">
                <span aria-hidden className="absolute inset-6 rounded-full bg-accent/25 blur-3xl" />
                <Image
                  src={d.imagem}
                  alt={`Apostila ${d.cargo}`}
                  fill
                  sizes="300px"
                  className="flutuar object-contain drop-shadow-[0_26px_28px_rgba(11,42,74,0.4)]"
                />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* O que você leva */}
      <section className="border-y border-[#D7DEE6] bg-[#F6F8FB] py-14 sm:py-16">
        <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
          <Reveal>
            <h2 className={TITULO}>Tudo o que você leva ao comprar</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cartoes.map(([icone, t, x], i) => (
              <Reveal key={t} delay={(i % 3) * 90}>
                <div className="h-full border border-[#D7DEE6] bg-white p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(11,42,74,0.4)] sm:p-6">
                  <IconeSolido nome={icone} atraso={i * 300} />
                  <h3 className="mt-4 font-display text-[1.08rem] font-bold text-[#14213A]">{t}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#516278]">{x}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <BotaoCta d={d} />
          </div>
        </div>
      </section>

      {/* Simulado online */}
      {d.incluiSimulado && (
        <section className="overflow-hidden bg-brand py-14 text-white sm:py-20">
          <div className="mx-auto grid max-w-[1080px] items-center gap-10 px-4 sm:px-6 md:grid-cols-2">
            <Reveal variante="esquerda">
              <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent">Simulado online incluído</p>
              <h2 className="mt-2 font-display text-[1.6rem] font-extrabold leading-tight sm:text-[2.1rem]">
                Estudar é uma coisa. Saber se aprendeu é outra.
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-[#B9CBDF]">
                Com o simulado online você coloca o que estudou à prova, descobre as matérias em que ainda erra e volta ao
                conteúdo certo. É a diferença entre achar que sabe e ter certeza.
              </p>
              <ul className="mt-5 flex flex-col gap-2.5 text-[15px] leading-relaxed text-white/90">
                {[
                  "Questões sorteadas do banco do seu cargo, na proporção da prova",
                  "Escolha quantas quer fazer, de uma rodada rápida à prova completa",
                  "Respostas salvas: pare quando quiser e continue de onde parou",
                  "Missões com pontos (XP) para criar o hábito de estudar todo dia",
                ].map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 text-accent" aria-hidden>✓</span>
                    {i}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal variante="direita" delay={150}>
              {/* Ilustração do resultado por disciplina (exemplo, não é dado real) */}
              <div className="rounded-xl border border-white/15 bg-white p-5 text-[#14213A] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] sm:p-6">
                <p className="font-display text-[1.05rem] font-extrabold">Desempenho por disciplina</p>
                <p className="text-[12px] text-[#516278]">Exemplo ilustrativo do resultado do simulado</p>
                <div className="mt-4 flex flex-col gap-3.5">
                  {[
                    ["Língua Portuguesa", 82],
                    ["Raciocínio Lógico", 55],
                    ["Conhecimentos Gerais", 68],
                    ["Conhecimentos Específicos", 74],
                  ].map(([nome, v]) => (
                    <div key={nome}>
                      <div className="flex justify-between text-[13px] font-semibold text-[#33465E]">
                        <span>{nome}</span>
                        <span>{v}%</span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#E3EAF2]">
                        <div className="h-full rounded-full bg-accent-2" style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-md bg-[#F6F8FB] px-3 py-2 text-[12.5px] font-semibold text-[#33465E]">
                  Foque em Raciocínio Lógico na próxima rodada.
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Bônus */}
      <section className="overflow-hidden bg-surface-2 py-14 sm:py-16">
        <div className="mx-auto grid max-w-[1080px] items-center gap-8 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_220px]">
          <Reveal variante="esquerda">
            <span className="inline-block rounded bg-accent px-2.5 py-1 font-data text-[11px] font-bold uppercase tracking-wide text-accent-ink">
              Bônus grátis
            </span>
            <h2 className={`${TITULO} mt-3`}>Curso de Informática Básica com IA, com videoaulas e certificado</h2>
            <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-[#33465E]">
              Informática cai em quase toda prova administrativa. Na plataforma você encontra o curso livre de Informática
              Básica com IA, de 40 horas, em videoaulas e com certificado validável. É gratuito para quem tem conta no site, e
              você pode fazer junto com a apostila.
            </p>
          </Reveal>
          <Reveal variante="direita" delay={120}>
            <Image
              src="/alunos.png"
              alt="Alunos aprendendo juntos"
              width={1122}
              height={1402}
              sizes="220px"
              className="flutuar mx-auto h-auto w-full max-w-[170px] md:max-w-none"
            />
          </Reveal>
        </div>
      </section>

      {/* Antes e depois */}
      <section className="mx-auto max-w-[1080px] px-4 py-14 sm:px-6 sm:py-16">
        <Reveal>
          <h2 className={TITULO}>Estudar por conta própria × estudar com método</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Reveal variante="esquerda">
            <div className="h-full border border-[#E3C9C9] bg-[#FFF8F8] p-6">
              <p className="font-display text-[1.08rem] font-bold text-[#8A2E2E]">Sem um material focado</p>
              <ul className="mt-3 flex flex-col gap-2.5 text-[14.5px] leading-relaxed text-[#5B4343]">
                {[
                  "Horas procurando o que estudar e em que ordem",
                  "Conteúdo que não cai na sua prova",
                  "Leis desatualizadas e resumos sem fonte",
                  "Nenhuma noção de como a banca cobra",
                  "Chega ao dia da prova sem nunca ter feito um simulado",
                ].map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-[#B23A3A]" aria-hidden>✕</span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal variante="direita">
            <div className="h-full border-2 border-accent-2 bg-[#F2FBF8] p-6">
              <p className="font-display text-[1.08rem] font-bold text-[#0a6151]">Com a apostila e o simulado online</p>
              <ul className="mt-3 flex flex-col gap-2.5 text-[14.5px] leading-relaxed text-[#27413B]">
                {[
                  "Caminho claro, na ordem do edital",
                  `Foco no que a prova do cargo de ${d.cargo} cobra`,
                  "Legislação conferida em texto oficial",
                  "Questões no estilo da banca, todas comentadas",
                  "Treino de prova completo antes do dia",
                ].map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-accent-2" aria-hidden>✓</span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Oferta */}
      <section className="overflow-hidden bg-brand-deep py-14 text-white sm:py-20">
        <div className="mx-auto grid max-w-[1080px] items-center gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_240px]">
          <Reveal variante="esquerda">
            {d.dias !== null && d.dias >= 0 && (
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-data text-[12.5px] font-bold text-accent">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                {d.dias === 0 ? "A prova é hoje" : d.dias === 1 ? "Falta 1 dia para a prova" : `Faltam ${d.dias} dias para a prova`}
              </p>
            )}
            <h2 className="font-display text-[1.7rem] font-extrabold leading-tight sm:text-[2.3rem]">
              Comece a estudar hoje, com acesso imediato.
            </h2>
            <p className="mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-[#B9CBDF]">
              {pct !== null && d.precoOriginalCentavos ? (
                <>
                  De <span className="line-through">{formatarPreco(d.precoOriginalCentavos)}</span> por{" "}
                </>
              ) : (
                "Por "
              )}
              <strong className="text-[1.6rem] text-white">{preco}</strong> no PIX, pagamento único e sem mensalidade.
              {porDia ? ` Até a prova${d.prova ? ` (${d.prova})` : ""}, isso dá cerca de ${porDia} por dia de estudo.` : ""} Se
              não for o que você esperava, você tem 7 dias para pedir o reembolso.
            </p>
            <div className="mt-7">
              <BotaoCta d={d} />
            </div>
          </Reveal>
          {d.imagem && (
            <Reveal variante="direita" delay={120}>
              <div className="relative mx-auto aspect-[2/3] w-full max-w-[190px] md:max-w-none">
                <span aria-hidden className="absolute inset-4 rounded-full bg-accent/30 blur-3xl" />
                <Image src={d.imagem} alt="" fill sizes="240px" className="flutuar object-contain drop-shadow-[0_26px_28px_rgba(0,0,0,0.5)]" />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Perguntas frequentes */}
      <section className="mx-auto max-w-[800px] px-4 py-14 sm:px-6 sm:py-16">
        <h2 className={TITULO}>Perguntas frequentes</h2>
        <div className="mt-6 divide-y divide-[#D7DEE6] border-y border-[#D7DEE6]">
          {perguntasVenda(d).map(([p, r]) => (
            <details key={p} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.02rem] font-bold text-[#14213A]">
                {p}
                <span aria-hidden className="text-accent-2 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-[15px] leading-relaxed text-[#516278]">{r}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <BotaoCta d={d} />
        </div>
      </section>
    </div>
  );
}
