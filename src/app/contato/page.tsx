import type { Metadata } from "next";
import Link from "next/link";
import { PaginaLegal, Secao, Lista } from "@/components/pagina-legal";
import { EMAIL_CONTATO, EMISSOR, RAZAO_SOCIAL } from "@/lib/emissor";

export const metadata: Metadata = {
  title: "Contato",
  alternates: { canonical: "/contato" },
  description: "Fale com o SIBRAP: dúvidas sobre apostilas, simulados, pagamentos, correções de matérias e privacidade.",
};

export default function ContatoPage() {
  return (
    <PaginaLegal titulo="Contato" atualizadoEm="7 de outubro de 2026">
      <Secao titulo="E-mail">
        <p>
          O canal oficial de atendimento é o e-mail{" "}
          <a href={`mailto:${EMAIL_CONTATO}`} className="font-semibold text-brand underline underline-offset-4">
            {EMAIL_CONTATO}
          </a>
          . Respondemos em dias úteis.
        </p>
      </Secao>

      <Secao titulo="Sobre o que você pode escrever">
        <Lista
          itens={[
            "dúvidas sobre apostilas, simulados e acesso à sua conta;",
            "pagamento e entrega da apostila (informe o e-mail usado na compra);",
            "correção ou atualização de uma matéria do blog (informe o link da página);",
            "pedidos relacionados aos seus dados pessoais, conforme a nossa Política de Privacidade.",
          ]}
        />
      </Secao>

      <Secao titulo="Dados da empresa">
        <p>
          {EMISSOR.nome}
          <br />
          {RAZAO_SOCIAL} · CNPJ {EMISSOR.cnpj}
          <br />
          Manaus/AM
        </p>
        <p>
          Veja também os{" "}
          <Link href="/termos" className="font-semibold text-brand underline underline-offset-4">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="font-semibold text-brand underline underline-offset-4">
            Política de Privacidade
          </Link>
          .
        </p>
      </Secao>
    </PaginaLegal>
  );
}
