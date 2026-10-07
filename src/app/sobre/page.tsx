import type { Metadata } from "next";
import Link from "next/link";
import { PaginaLegal, Secao, Lista } from "@/components/pagina-legal";
import { EMAIL_CONTATO, EMISSOR, RAZAO_SOCIAL } from "@/lib/emissor";

export const metadata: Metadata = {
  title: "Sobre o SIBRAP",
  alternates: { canonical: "/sobre" },
  description:
    "Conheça o SIBRAP: apostilas em PDF, simulados e matérias sobre concursos públicos municipais, produzidos de forma independente em Manaus/AM.",
};

export default function SobrePage() {
  return (
    <PaginaLegal titulo="Sobre o SIBRAP" atualizadoEm="7 de outubro de 2026">
      <Secao titulo="Quem somos">
        <p>
          O <strong>{EMISSOR.nome}</strong> ajuda pessoas a se prepararem para concursos públicos, com foco em
          prefeituras e câmaras municipais. Somos mantidos por <strong>{RAZAO_SOCIAL}</strong> (CNPJ {EMISSOR.cnpj}),
          de Manaus/AM.
        </p>
      </Secao>

      <Secao titulo="O que oferecemos">
        <Lista
          itens={[
            <><strong>Apostilas em PDF</strong> feitas a partir do edital de cada concurso, com conteúdo organizado por disciplina, questões comentadas e cronograma de estudos.</>,
            <><strong>Simulados online</strong> para treinar no formato da prova.</>,
            <><strong>Cursos livres gratuitos</strong> com certificado.</>,
            <><strong>Matérias no blog</strong> com os principais editais abertos: vagas, cargos, salários, taxas, prazos de inscrição e data de prova.</>,
          ]}
        />
      </Secao>

      <Secao titulo="Como produzimos o conteúdo">
        <p>
          As matérias são escritas por nós a partir das informações do edital e de fontes oficiais, como o site da
          prefeitura, da câmara ou da banca organizadora, conferidas em mais de uma fonte. Sempre que possível,
          indicamos o link do edital. Os dados mudam: antes de se inscrever, confira o edital oficial.
        </p>
        <p>
          O SIBRAP é <strong>independente</strong> e não tem vínculo com bancas organizadoras nem com os órgãos que
          abrem os concursos. Se encontrar algum erro, avise pelo e-mail abaixo e corrigimos.
        </p>
      </Secao>

      <Secao titulo="Fale com a gente">
        <p>
          Escreva para <strong>{EMAIL_CONTATO}</strong> ou acesse a página de{" "}
          <Link href="/contato" className="font-semibold text-brand underline underline-offset-4">
            contato
          </Link>
          . Conheça também as nossas{" "}
          <Link href="/apostilas" className="font-semibold text-brand underline underline-offset-4">
            apostilas
          </Link>{" "}
          e o{" "}
          <Link href="/blog" className="font-semibold text-brand underline underline-offset-4">
            blog
          </Link>
          .
        </p>
      </Secao>
    </PaginaLegal>
  );
}
