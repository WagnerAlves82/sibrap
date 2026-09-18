import Image from "next/image";
import Link from "next/link";
import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { Logo } from "@/components/logo";
import { SeloAbed } from "@/components/selo-abed";
import { Reveal } from "@/components/reveal";

export default async function Home() {
  const supabase = await criarClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: concurso } = await supabase
    .from("concursos")
    .select("id, nome, edital_numero, bancas(nome)")
    .eq("slug", "transpetro")
    .maybeSingle();

  const { data: cargos } = await supabase
    .from("cargos")
    .select("vagas")
    .eq("concurso_id", concurso?.id ?? "")
    .eq("quadro", "Terra");

  const nomeBanca = concurso?.bancas?.nome ?? "Cesgranrio";
  const nomeConcurso = concurso?.nome ?? "Transpetro";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sibrap.tec.br";
  const mensagemCompartilhamento = `Já confirmou sua inscrição no concurso ${nomeConcurso} 2026? Então agora é hora de se preparar. Nesse link você encontra uma apostila atual baseada no edital, gratuita.\n\n${siteUrl}`;
  const linkCompartilhamento = `https://wa.me/?text=${encodeURIComponent(mensagemCompartilhamento)}`;
  const editalNumero = concurso?.edital_numero ?? "3/2026";
  const totalVagas = cargos?.reduce((soma, c) => soma + (c.vagas ?? 0), 0) ?? 614;
  const totalEnfases = cargos?.length ?? 18;

  return (
    <div className="flex flex-1 flex-col bg-white font-body">
      {/* Barra "concurso em destaque" */}
      <div className="bg-brand-deep text-[#C9D6E6]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-2 text-[12.5px]">
          <span>
            <span className="mr-2 rounded bg-accent px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-accent-ink">
              Concurso em destaque
            </span>
            {nomeConcurso} 2026 · Banca {nomeBanca}
            <span className="mx-1.5 opacity-40">·</span>
            Inscrições até 21/09/2026
          </span>
          <span>{totalVagas} vagas + cadastro de reserva</span>
        </div>
      </div>

      {/* Header / nav */}
      <header className="border-b-[3px] border-accent bg-brand">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 py-3.5">
          <Logo tamanho={42} comTexto={false} className="[&_img]:shadow-[inset_0_0_0_2px_var(--color-accent)]" />
          <div className="hidden items-center gap-1 leading-tight sm:block">
            <p className="text-lg font-extrabold tracking-wide text-white">SIBRAP</p>
            <p className="text-[10.5px] uppercase tracking-wide text-[#AEC2D8]">
              Sistema Brasileiro de Aprendizagem Profissional
            </p>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#D7E3EF] md:flex">
            <a href="#inicio" className="border-b-2 border-accent text-white">
              Home
            </a>
            <a href="#sobre" className="border-b-2 border-transparent hover:text-white">
              Sobre Nós
            </a>
            <a href="#recursos" className="border-b-2 border-transparent hover:text-white">
              Material
            </a>
            <Link href="/cursos" className="border-b-2 border-transparent hover:text-white">
              Cursos gratuitos
            </Link>
            <a href="#planos" className="border-b-2 border-transparent hover:text-white">
              Planos
            </a>
            <a href="#concurso" className="border-b-2 border-transparent hover:text-white">
              Concursos
            </a>
          </nav>

          <Link
            href={user ? "/minha-area" : "/login"}
            className="rounded-md border-[1.5px] border-white/40 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Minha Área
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        id="inicio"
        className="relative overflow-hidden bg-gradient-to-b from-[#F2F5F8] to-white py-16"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 900px 500px at 78% 30%, rgba(11,42,74,0.05), transparent 72%), linear-gradient(#D7DEE6 1px, transparent 1px), linear-gradient(90deg, #D7DEE6 1px, transparent 1px)",
          backgroundSize: "auto, 34px 34px, 34px 34px",
        }}
      >
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-start gap-14 px-6 md:grid-cols-2">
          <div className="entrar entrar-esquerda">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-surface-2 px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Preparação orientada pelo edital oficial
            </span>

            <h1 className="mt-5 mb-4 font-display text-[2.4rem] leading-[1.04] font-extrabold tracking-tight text-[#14213A] sm:text-[3.4rem]">
              Estude o edital
              <br />
              como quem já <span className="text-brand">decorou</span> ele.
            </h1>

            <p className="mb-7 max-w-[46ch] text-[17px] leading-relaxed text-[#516278]">
              Apostila organizada capítulo por capítulo na mesma ordem do edital, e
              um banco de questões inéditas no estilo da banca — pra você chegar
              na prova sem se surpreender com nada. Hoje, em destaque:{" "}
              {nomeConcurso} 2026.
            </p>

            <div className="mb-2.5 flex flex-wrap items-center gap-4">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-4 text-base font-bold text-accent-ink shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)] transition-colors hover:brightness-105"
              >
                Fazer simulado grátis <span aria-hidden>→</span>
              </Link>
              <a
                href="#planos"
                className="text-sm font-semibold text-brand underline underline-offset-4"
              >
                Ver o que vem no Premium
              </a>
              <a
                href={linkCompartilhamento}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#93A0AF] transition-colors hover:text-brand"
              >
                <IconeWhatsapp />
                Compartilhar
              </a>
            </div>
            <p className="text-[13px] text-[#516278]">
              5 questões de Língua Portuguesa + 5 de Matemática, no estilo da
              banca.
            </p>
          </div>

          <div className="entrar entrar-direita" style={{ animationDelay: "200ms" }}>
          <div className="relative pb-16">
            <div className="relative overflow-hidden rounded-2xl border border-[#D7DEE6] bg-white shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)]">
              <div className="flex items-baseline justify-between gap-3 border-b-[3px] border-accent bg-brand px-5 py-4">
                <span className="font-data text-[11.5px] uppercase tracking-wide text-[#B9CBDF]">
                  Concurso em destaque
                </span>
                <span className="text-[15px] font-bold text-white">
                  {nomeConcurso} 2026
                </span>
              </div>
              <div className="flex flex-col px-5 py-2 pb-4">
                <FatoRow label="Edital" valor={`Nº ${editalNumero}`} />
                <FatoRow label="Banca organizadora" valor={nomeBanca} />
                <FatoRow label="Vagas + cadastro reserva" valor={String(totalVagas)} />
                <FatoRow label="Ênfases · nível técnico" valor={String(totalEnfases)} />
                <FatoRow label="Remuneração inicial" valor="R$ 6.539,54" destaque />
                <FatoRow label="Inscrições até" valor="21/09/2026" />
                <FatoRow label="Data da prova" valor="06/12/2026" ultimo />
              </div>
            </div>

            <div className="absolute -bottom-8 -left-13 hidden w-48 rotate-[-4deg] drop-shadow-[0_22px_30px_rgba(11,42,74,0.4)] sm:block">
              <Image
                src="/apostila.png"
                alt="Apostila Conhecimentos Básicos"
                width={400}
                height={520}
                className="w-full"
              />
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Faixa de estatísticas */}
      <div className="border-y border-[#D7DEE6] bg-surface-2">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 px-6 sm:grid-cols-4">
          <Reveal><Estatistica numero="600+" label="Questões inéditas" /></Reveal>
          <Reveal delay={90}><Estatistica numero="3" label="Disciplinas cobertas" /></Reveal>
          <Reveal delay={180}><Estatistica numero={String(totalEnfases)} label="Ênfases · Quadro Terra" /></Reveal>
          <Reveal delay={270}><Estatistica numero="1x" label="Tentativa grátis por conta" ultimo /></Reveal>
        </div>
      </div>

      {/* O que vem no material */}
      <section id="recursos" className="py-18">
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal className="mb-10 max-w-[60ch]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-surface-2 px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              O que vem no material
            </span>
            <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.3rem]">
              Construído a partir do edital, não de achismo.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
              Cada capítulo e cada questão remete a um item específico do
              conteúdo programático oficial — nada de matéria genérica de
              concurso.
            </p>
          </Reveal>

          <Reveal delay={120}>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-[#D7DEE6] bg-[#D7DEE6] sm:grid-cols-2">
            <ItemManifesto
              icone={<IconeLivro />}
              titulo="Apostila na ordem do edital"
              descricao="Capítulos seguem exatamente a sequência do Anexo IV — sem pular de assunto, sem enrolação."
            />
            <ItemManifesto
              icone={<IconeChecklist />}
              titulo="Mais de 600 questões inéditas"
              descricao={`Escritas do zero no estilo ${nomeBanca} — nunca copiadas de prova antiga, com gabarito comentado.`}
            />
            <ItemManifesto
              icone={<IconeBalanca />}
              titulo="Simulado na proporção real"
              descricao="A mesma distribuição de Português, Matemática e Conhecimentos Específicos da prova oficial — não é sorteio aleatório."
            />
            <ItemManifesto
              icone={<IconeGrafico />}
              titulo="Desempenho por disciplina"
              descricao="Depois de cada simulado, veja exatamente em qual matéria focar — sem achismo."
            />
          </div>
          </Reveal>
        </div>
      </section>

      {/* Cursos gratuitos */}
      <section id="cursos" className="overflow-hidden border-y border-[#D7DEE6] bg-white py-14">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Reveal variante="esquerda" className="max-w-[58ch]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-surface-2 px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Cursos gratuitos
            </span>
            <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.1rem]">
              Informática Básica com Inteligência Artificial.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
              Curso livre de 40 horas, 100% online, gratuito para quem precisa.
              Aprenda computador, internet, Word, Excel e a usar a IA (Copilot)
              para trabalhar melhor — com certificado e QR Code de validação.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <Link
                href="/cursos/informatica-basica-ia"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-4 text-base font-bold text-white transition-colors hover:brightness-125"
              >
                Conhecer o curso <span aria-hidden>→</span>
              </Link>
              <SeloAbed altura={72} />
            </div>
          </Reveal>
          <Reveal variante="direita" delay={200}>
          <Image
            src="/alunos.png"
            alt="Alunos aprendendo juntos com os aplicativos do Office e o Copilot"
            width={1122}
            height={1402}
            sizes="(min-width: 1024px) 340px, 70vw"
            className="flutuar mx-auto h-auto w-full max-w-[280px] lg:max-w-none"
          />
          </Reveal>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="bg-surface-2 py-18">
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal className="mb-10 max-w-[60ch]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D7DEE6] bg-white px-3 py-1.5 font-data text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
              Planos
            </span>
            <h2 className="mt-3.5 font-display text-[1.7rem] font-extrabold text-[#14213A] sm:text-[2.3rem]">
              Pagamento único. Sem mensalidade.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#516278]">
              Escolha o nível de preparação que faz sentido pra você — o
              acesso é seu pra sempre, não expira.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Reveal className="h-full">
            <PlanoCard
              nome="Básico"
              preco="29,90"
              itens={[
                "Banco completo de questões de Português e Matemática (o teste grátis é só uma amostra de 10)",
                "Simulados ilimitados, no formato oficial da prova",
                "Relatório de desempenho por disciplina",
              ]}
            />
            </Reveal>
            <Reveal className="h-full" delay={120}>
            <PlanoCard
              nome="Intermediário"
              preco="44,90"
              destaque
              itens={[
                "Tudo do plano Básico",
                "Apostila completa de Conhecimentos Específicos da sua ênfase",
                "Simulado com questões de Conhecimentos Específicos",
              ]}
            />
            </Reveal>
            <Reveal className="h-full" delay={240}>
            <PlanoCard
              nome="Completo"
              preco="59,90"
              itens={[
                "Tudo do plano Intermediário",
                "Vídeo-aulas de todo o conteúdo",
                "Matrícula nos cursos de Gramática, Raciocínio Lógico, Direitos Humanos e Primeiros Socorros, com certificado ao concluir",
              ]}
            />
            </Reveal>
          </div>

          <p className="mt-4 text-center text-[13px] text-[#93A0AF]">
            A apostila de Conhecimentos Básicos é gratuita pra quem se
            cadastra, em qualquer plano. No plano Completo, o valor dá
            direito à matrícula nos cursos extras — o certificado é emitido
            após a conclusão.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/cadastro"
              className="rounded-lg bg-accent px-8 py-3.5 text-center text-sm font-bold text-accent-ink transition-colors hover:brightness-105"
            >
              Comece sua preparação agora!
            </Link>
          </div>
        </div>
      </section>

      {/* Por que vale a pena */}
      <section id="sobre" className="relative overflow-hidden bg-brand py-20 text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
          <Reveal variante="esquerda">
          <div className="relative h-72 w-full overflow-hidden rounded-xl md:h-96">
            <Image
              src="https://images.unsplash.com/photo-1726111262949-e22631a8c376?fm=jpg&q=80&w=1600&auto=format&fit=crop"
              alt="Instalação industrial iluminada à noite"
              fill
              className="object-cover"
            />
          </div>
          </Reveal>
          <Reveal variante="direita" delay={150} className="flex flex-col gap-4 text-left">
            <span className="text-sm font-semibold uppercase tracking-wide text-accent-2">
              Por que vale a pena
            </span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">
              Não é só um cargo. É uma carreira.
            </h2>
            <p className="text-[#B9CBDF]">
              A {nomeConcurso} garante remuneração mínima de{" "}
              <strong className="text-white">R$ 6.539,54</strong> pro cargo de
              nível técnico — bem acima da média do mercado pra quem tá
              começando. Fora o salário, tem Programa de Formação, plano de
              carreira estruturado e a estabilidade de uma empresa do Sistema
              Petrobras.
            </p>
            <p className="text-[#B9CBDF]">
              E pra quem sonha em embarcar: o Quadro Mar da {nomeConcurso} é
              uma porta de entrada real pra quem quer viver essa rotina —
              viajar, ganhar adicional de embarque e construir uma carreira
              diferente de tudo que existe em terra.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Faixa final de CTA */}
      <div id="concurso" className="relative overflow-hidden bg-brand py-13 text-white">
        <Reveal className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-6">
          <div>
            <h2 className="max-w-[32ch] font-display text-2xl font-extrabold text-white sm:text-3xl">
              Pronto pra começar hoje?
            </h2>
            <p className="mt-2 max-w-[44ch] text-sm text-[#B9CBDF]">
              Simulado grátis agora. Apostila, banco de questões e
              vídeo-aulas a partir de R$ 29,90, pagamento único.
            </p>
          </div>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-4 text-base font-bold text-accent-ink shadow-lg transition-colors hover:brightness-105"
          >
            Comece sua preparação agora! <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>

      <footer className="border-t border-[#D7DEE6] bg-white py-8">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 text-[12.5px] text-[#516278]">
          <span>
            <strong className="text-[#14213A]">SIBRAP</strong> — Sistema
            Brasileiro de Aprendizagem Profissional
          </span>
          <span className="flex items-center gap-5">
            <SeloAbed altura={64} />
            sibrap.tec.br
          </span>
        </div>
      </footer>
    </div>
  );
}

function FatoRow({
  label,
  valor,
  destaque,
  ultimo,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
  ultimo?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-2.5 ${
        ultimo ? "" : "border-b border-[#D7DEE6]"
      }`}
    >
      <span className="text-[13px] text-[#516278]">{label}</span>
      <span
        className={
          destaque
            ? "font-data text-xl font-semibold text-accent-2"
            : "font-data text-[14.5px] font-semibold text-[#14213A]"
        }
      >
        {valor}
      </span>
    </div>
  );
}

function Estatistica({
  numero,
  label,
  ultimo,
}: {
  numero: string;
  label: string;
  ultimo?: boolean;
}) {
  return (
    <div className={`py-5.5 px-5 ${ultimo ? "" : "border-r border-[#D7DEE6]"}`}>
      <div className="font-data text-[26px] font-semibold text-brand">{numero}</div>
      <div className="mt-0.5 text-[12.5px] text-[#516278]">{label}</div>
    </div>
  );
}

function PlanoCard({
  nome,
  preco,
  itens,
  destaque,
}: {
  nome: string;
  preco: string;
  itens: string[];
  destaque?: boolean;
}) {
  return (
    <Link
      href="/cadastro"
      className={`group relative flex h-full flex-col rounded-xl bg-white p-7 transition-shadow ${
        destaque
          ? "border-2 border-accent shadow-[0_20px_45px_-20px_rgba(11,42,74,0.35)]"
          : "border border-[#D7DEE6] hover:shadow-[0_20px_45px_-24px_rgba(11,42,74,0.3)]"
      }`}
    >
      {destaque && (
        <span className="absolute -top-3 left-7 rounded bg-accent px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-accent-ink">
          Mais escolhido
        </span>
      )}
      <p className="font-body text-sm font-bold uppercase tracking-wide text-[#516278]">
        {nome}
      </p>
      <p className="mt-2 mb-1 font-data text-4xl font-semibold text-[#14213A]">
        R$ {preco}
      </p>
      <p className="mb-6 text-[13px] text-[#516278]">Pagamento único</p>

      <ul className="flex flex-1 flex-col gap-3">
        {itens.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-[#516278]">
            <span className="mt-0.5 shrink-0 text-accent-2" aria-hidden>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>

      <span
        aria-hidden
        className={`mt-6 flex justify-end text-lg transition-transform group-hover:translate-x-1 ${
          destaque ? "text-accent" : "text-[#93A0AF]"
        }`}
      >
        →
      </span>
    </Link>
  );
}

function ItemManifesto({
  icone,
  titulo,
  descricao,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex gap-4 bg-white px-7 py-6.5">
      <div className="mt-0.5 shrink-0 text-accent-2">{icone}</div>
      <div>
        <h3 className="mb-1 font-body text-base font-bold text-[#14213A]">{titulo}</h3>
        <p className="text-sm leading-relaxed text-[#516278]">{descricao}</p>
      </div>
    </div>
  );
}

function IconeWhatsapp() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.4 1.26 4.83L2 22l5.36-1.4a9.9 9.9 0 0 0 4.68 1.19h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm0 18.2h-.01a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.18.83.85-3.1-.2-.32a8.24 8.24 0 0 1-1.26-4.32c0-4.55 3.7-8.25 8.31-8.25 2.22 0 4.3.87 5.87 2.44a8.24 8.24 0 0 1 2.43 5.85c0 4.55-3.71 8.2-8.31 8.2Zm4.53-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.65.31-.23.24-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}

function IconeLivro() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M4 5.2c0-.7.5-1.2 1.2-1.2H11v16H5.2A1.2 1.2 0 0 1 4 18.8V5.2Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 5.2c0-.7-.5-1.2-1.2-1.2H13v16h5.8c.7 0 1.2-.5 1.2-1.2V5.2Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconeChecklist() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconeBalanca() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v18M6 7l-3 5 3 5M18 7l3 5-3 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeGrafico() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V4M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7" y="13" width="2.6" height="7" fill="currentColor" />
      <rect x="12" y="9" width="2.6" height="11" fill="currentColor" />
      <rect x="17" y="6" width="2.6" height="14" fill="currentColor" />
    </svg>
  );
}
