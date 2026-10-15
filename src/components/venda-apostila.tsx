import Link from "next/link";
import { formatarPreco } from "@/lib/apostilas";

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
  precoCentavos: number;
  jaTem: boolean;
  ctaHref: string;
  ctaRotulo: string;
};

const TITULO = "font-display text-[1.5rem] font-extrabold leading-tight text-[#14213A] sm:text-[2rem]";
const BOTAO =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-7 py-4 text-[15.5px] font-bold text-accent-ink shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)] transition-colors hover:brightness-105";

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

export function VendaApostila({ d }: { d: DadosVenda }) {
  const preco = formatarPreco(d.precoCentavos);
  const porDia = d.dias !== null && d.dias > 0 ? formatarPreco(Math.max(1, Math.round(d.precoCentavos / d.dias))) : null;
  const onde = d.cidade ? `de ${d.cidade}` : `do ${d.orgao}`;

  return (
    <div className="bg-white">
      {/* Abertura persuasiva */}
      <section className="mx-auto max-w-[1080px] px-4 py-14 sm:px-6 sm:py-16">
        <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
          Para quem vai fazer a prova {onde}
        </p>
        <h2 className={`${TITULO} mt-2 max-w-[24ch]`}>
          Na hora da prova, quem estudou o conteúdo certo sai na frente.
        </h2>
        <div className="mt-5 grid gap-8 text-[16px] leading-relaxed text-[#33465E] md:grid-cols-2">
          <p>
            Muita gente se inscreve, abre vários PDFs soltos, assiste a vídeos sobre o que não cai e chega à prova sem saber
            por onde começar. O resultado é tempo perdido e insegurança. Quando o cargo é o de <strong>{d.cargo}</strong>, cada
            questão faz diferença na classificação.
          </p>
          <p>
            Esta apostila foi feita para quem quer estudar com direção. Você recebe o conteúdo do edital organizado, com
            teoria direta, exemplos, questões no estilo da banca{d.banca ? ` ${d.banca}` : ""} e gabarito comentado, e ainda treina
            no simulado online. É menos tempo procurando material e mais tempo aprendendo o que vale ponto.
          </p>
        </div>
        <div className="mt-8">
          <Link href={d.ctaHref} prefetch={false} className={BOTAO}>
            {d.ctaRotulo} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Números do que você leva */}
      <section className="border-y border-[#D7DEE6] bg-[#F6F8FB] py-12 sm:py-14">
        <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
          <h2 className={TITULO}>Tudo o que você leva ao comprar</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-[#D7DEE6] bg-[#D7DEE6] sm:grid-cols-2 lg:grid-cols-3">
            {[
              [d.paginas ? `${d.paginas} páginas em PDF` : "Apostila completa em PDF", "Conteúdo na ordem do edital, com dicas, exemplos resolvidos e resumo de cada capítulo."],
              [d.questoes ? `${d.questoes} questões comentadas` : "Questões comentadas", "Exercícios no estilo da banca. Cada resposta vem explicada, inclusive por que as outras alternativas estão erradas."],
              [d.simulados ? `${d.simulados} simulado${d.simulados === 1 ? "" : "s"} final${d.simulados === 1 ? "" : "is"}` : "Simulados finais", "Prova completa no formato do concurso para você treinar tempo e resistência antes do grande dia."],
              ...(d.incluiSimulado
                ? ([["Simulado online", "Pratique no site, direto do celular ou do computador, com questões sorteadas do banco do seu cargo."]] as [string, string][])
                : []),
              ["Cronograma de estudos", "O edital transformado em checklist, com o percentual concluído em cada matéria."],
              ["Acesso imediato", "PIX confirmado, download liberado na sua área. Sem espera e sem assinatura."],
            ].map(([t, x]) => (
              <div key={t} className="bg-white p-5 sm:p-6">
                <h3 className="font-display text-[1.05rem] font-bold text-[#14213A]">{t}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#516278]">{x}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simulado online */}
      {d.incluiSimulado && (
        <section className="mx-auto max-w-[1080px] px-4 py-14 sm:px-6 sm:py-16">
          <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">Simulado online incluído</p>
          <h2 className={`${TITULO} mt-2 max-w-[26ch]`}>Estudar é uma coisa. Saber se aprendeu é outra.</h2>
          <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-[#33465E]">
            Com o simulado online você coloca o que estudou à prova, descobre as matérias em que ainda erra e volta ao
            conteúdo certo. É a diferença entre achar que sabe e ter certeza.
          </p>
          <ul className="mt-6 grid gap-3 text-[15px] leading-relaxed text-[#33465E] sm:grid-cols-2">
            {[
              "Questões do banco do seu cargo, sorteadas a cada tentativa na proporção da prova",
              "Você escolhe quantas questões quer fazer, de uma rodada rápida até a prova completa",
              "Suas respostas ficam salvas: pare quando quiser e continue de onde parou",
              "Resultado com seus acertos por disciplina, para saber onde focar",
              "Missões com pontos (XP) que ajudam a criar o hábito de estudar todo dia",
              "Cronograma e minigame de Verdadeiro ou Falso para revisar de forma leve",
            ].map((i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 text-accent-2" aria-hidden>✓</span>
                {i}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Bônus */}
      <section className="border-y border-[#D7DEE6] bg-[#F6F8FB] py-12 sm:py-14">
        <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
          <p className="font-data text-xs font-semibold uppercase tracking-wide text-accent-2">De presente</p>
          <h2 className={`${TITULO} mt-2`}>Curso de Informática Básica com IA, com videoaulas e certificado</h2>
          <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-[#33465E]">
            Informática cai em quase toda prova administrativa. Na plataforma você encontra o curso livre de Informática
            Básica com IA, de 40 horas, em videoaulas e com certificado validável. Ele é gratuito para quem tem conta no
            site, e você pode fazer junto com a apostila.
          </p>
        </div>
      </section>

      {/* Antes e depois */}
      <section className="mx-auto max-w-[1080px] px-4 py-14 sm:px-6 sm:py-16">
        <h2 className={TITULO}>Estudar por conta própria × estudar com método</h2>
        <div className="mt-8 grid gap-px border border-[#D7DEE6] bg-[#D7DEE6] md:grid-cols-2">
          <div className="bg-white p-6">
            <p className="font-display text-[1.05rem] font-bold text-[#516278]">Sem um material focado</p>
            <ul className="mt-3 flex flex-col gap-2 text-[14.5px] leading-relaxed text-[#516278]">
              <li>• Horas procurando o que estudar e em que ordem</li>
              <li>• Conteúdo que não cai na sua prova</li>
              <li>• Leis desatualizadas e resumos sem fonte</li>
              <li>• Nenhuma noção de como a banca cobra</li>
              <li>• Chega ao dia da prova sem nunca ter feito um simulado</li>
            </ul>
          </div>
          <div className="bg-white p-6">
            <p className="font-display text-[1.05rem] font-bold text-[#14213A]">Com a apostila e o simulado online</p>
            <ul className="mt-3 flex flex-col gap-2 text-[14.5px] leading-relaxed text-[#33465E]">
              <li><span className="text-accent-2" aria-hidden>✓</span> Caminho claro, na ordem do edital</li>
              <li><span className="text-accent-2" aria-hidden>✓</span> Foco no que a prova do cargo de {d.cargo} cobra</li>
              <li><span className="text-accent-2" aria-hidden>✓</span> Legislação conferida em texto oficial</li>
              <li><span className="text-accent-2" aria-hidden>✓</span> Questões no estilo da banca, todas comentadas</li>
              <li><span className="text-accent-2" aria-hidden>✓</span> Treino de prova completo antes do dia</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Oferta */}
      <section className="bg-brand-deep py-14 text-white sm:py-16">
        <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
          <h2 className="max-w-[26ch] font-display text-[1.6rem] font-extrabold leading-tight sm:text-[2.2rem]">
            Comece a estudar hoje, com acesso imediato.
          </h2>
          <p className="mt-3 max-w-[60ch] text-[15.5px] leading-relaxed text-[#B9CBDF]">
            Pagamento único de <strong className="text-white">{preco}</strong> por PIX, sem mensalidade.
            {porDia ? ` Até a prova${d.prova ? ` (${d.prova})` : ""}, isso dá cerca de ${porDia} por dia de estudo.` : ""} Se não
            for o que você esperava, você tem 7 dias para pedir o reembolso.
          </p>
          <div className="mt-7">
            <Link href={d.ctaHref} prefetch={false} className={BOTAO}>
              {d.ctaRotulo} <span aria-hidden>→</span>
            </Link>
          </div>
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
      </section>
    </div>
  );
}
