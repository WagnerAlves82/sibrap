import type { Metadata } from "next";
import Link from "next/link";
import { PaginaLegal, Secao, Lista } from "@/components/pagina-legal";
import { EMAIL_CONTATO, EMISSOR, RAZAO_SOCIAL } from "@/lib/emissor";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o SIBRAP coleta, usa e protege os seus dados pessoais, conforme a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <PaginaLegal titulo="Política de Privacidade" atualizadoEm="19 de setembro de 2026">
      <Secao titulo="1. Quem somos">
        <p>
          O SIBRAP (Sistema Brasileiro de Aprendizagem Profissional) é operado por <strong>{RAZAO_SOCIAL}</strong>,
          CNPJ {EMISSOR.cnpj}, de Manaus/AM. Somos o <strong>controlador</strong> dos dados pessoais tratados neste
          site, nos termos da Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
        </p>
        <p>
          O encarregado pelo tratamento de dados é Wagner Alves de Souza Junior. Contato: {EMAIL_CONTATO}.
        </p>
      </Secao>

      <Secao titulo="2. Quais dados coletamos">
        <Lista
          itens={[
            <><strong>Cadastro:</strong> nome, e-mail e senha (a senha é guardada de forma criptografada; nem nós conseguimos lê-la), a data em que você aceitou estes textos e a origem do cadastro (por exemplo, a campanha em que você nos encontrou).</>,
            <><strong>Uso da plataforma:</strong> aulas concluídas, resultados de provas e simulados, e certificados emitidos.</>,
            <><strong>Comprovante do CadÚnico:</strong> somente se você escolher o certificado gratuito. É o documento que você mesmo envia.</>,
            <><strong>Pagamentos:</strong> o pagamento é feito pelo Mercado Pago. Não recebemos nem guardamos dados de cartão ou de conta bancária; guardamos apenas o número do pedido, o valor e a situação do pagamento.</>,
            <><strong>Dados técnicos:</strong> cookies essenciais para manter você logado.</>,
          ]}
        />
      </Secao>

      <Secao titulo="3. Para que usamos e em que base legal">
        <Lista
          itens={[
            <>Criar e manter a sua conta e entregar os cursos, apostilas e simulados: <em>execução de contrato</em> (LGPD, art. 7º, V).</>,
            <>Conferir o comprovante do CadÚnico para conceder o certificado gratuito: <em>seu consentimento</em> (art. 7º, I), dado ao enviar o documento.</>,
            <>Emitir certificados e permitir a sua validação: <em>execução de contrato</em> e <em>legítimo interesse</em> em garantir a autenticidade (art. 7º, IX).</>,
            <>Processar pagamentos e cumprir obrigações fiscais: <em>execução de contrato</em> e <em>obrigação legal</em> (art. 7º, II).</>,
            <>Enviar e-mails do serviço (confirmação de cadastro, recuperação de senha, resultado do comprovante, apostila): <em>execução de contrato</em>.</>,
            <>Manter a segurança e prevenir fraudes: <em>legítimo interesse</em>.</>,
          ]}
        />
        <p>Não vendemos os seus dados e não os usamos para publicidade de terceiros.</p>
      </Secao>

      <Secao titulo="4. O comprovante do CadÚnico">
        <p>
          Sabemos que esse documento traz informações pessoais e socioeconômicas, por isso o tratamos com cuidado
          redobrado: ele fica em um espaço privado, só a nossa equipe consegue abri-lo e ele é usado apenas para
          conferir a sua inscrição.
        </p>
        <p>
          <strong>Assim que a análise termina, o arquivo é apagado.</strong> Guardamos somente o resultado
          (aprovado ou recusado), a data e, se houver, o motivo da recusa.
        </p>
      </Secao>

      <Secao titulo="5. Com quem compartilhamos">
        <p>Usamos empresas que nos ajudam a operar o serviço (operadores de dados):</p>
        <Lista
          itens={[
            <><strong>Supabase</strong> — banco de dados, autenticação e arquivos (servidores no Brasil).</>,
            <><strong>Vercel</strong> — hospedagem do site.</>,
            <><strong>Resend</strong> — envio de e-mails.</>,
            <><strong>Mercado Pago</strong> — pagamentos por PIX.</>,
            <><strong>YouTube (Google)</strong> — reprodução das videoaulas. Ao assistir, o YouTube pode tratar dados segundo a política dele.</>,
          ]}
        />
        <p>
          Alguns desses serviços têm servidores fora do Brasil (como nos Estados Unidos). Nesses casos, a transferência
          segue as garantias exigidas pela LGPD (art. 33). Também podemos compartilhar dados quando a lei ou uma
          autoridade exigir.
        </p>
      </Secao>

      <Secao titulo="6. Validação pública de certificados">
        <p>
          Quem tiver o código ou o QR Code de um certificado pode conferir, na página de validação, o <strong>nome
          completo, o curso, a carga horária e a data de emissão</strong>. Nenhum outro dado é exibido. O código é longo
          e aleatório, e só é conhecido por quem recebeu o certificado.
        </p>
      </Secao>

      <Secao titulo="7. Por quanto tempo guardamos">
        <Lista
          itens={[
            <>Conta e progresso: enquanto a conta existir ou até você pedir a exclusão.</>,
            <>Comprovante do CadÚnico: apagado ao fim da análise (veja o item 4).</>,
            <>Certificados: mantidos para que possam ser validados; você pode pedir a remoção.</>,
            <>Pedidos e pagamentos: pelo prazo exigido pela legislação fiscal e de defesa do consumidor.</>,
          ]}
        />
      </Secao>

      <Secao titulo="8. Seus direitos">
        <p>Você pode, a qualquer momento e gratuitamente, pedir:</p>
        <Lista
          itens={[
            "confirmação de que tratamos seus dados e acesso a eles;",
            "correção de dados incompletos, inexatos ou desatualizados;",
            "exclusão dos dados tratados com o seu consentimento e da sua conta;",
            "portabilidade, informação sobre compartilhamento e revogação do consentimento;",
            "revisão de decisões tomadas apenas de forma automatizada.",
          ]}
        />
        <p>
          Para exercer qualquer direito, escreva para <strong>{EMAIL_CONTATO}</strong> pelo e-mail cadastrado na sua
          conta. Se achar que seus dados não foram tratados corretamente, você também pode reclamar à Autoridade
          Nacional de Proteção de Dados (ANPD).
        </p>
      </Secao>

      <Secao titulo="9. Crianças e adolescentes">
        <p>
          O SIBRAP não é destinado a menores de 12 anos. Adolescentes de 12 a 17 anos devem se cadastrar com o
          conhecimento e a autorização de um responsável legal, que pode pedir a qualquer momento o acesso e a
          exclusão dos dados.
        </p>
      </Secao>

      <Secao titulo="10. Cookies">
        <p>
          Usamos apenas cookies <strong>essenciais</strong>, que mantêm você conectado e protegem a sua sessão. Não
          usamos cookies de publicidade. Se um dia passarmos a usar ferramentas de medição de acessos, vamos atualizar
          esta política e avisar.
        </p>
      </Secao>

      <Secao titulo="11. Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados: conexão criptografada, senhas
          criptografadas, acesso restrito às áreas administrativas e regras de segurança no banco de dados. Nenhum
          sistema é totalmente imune, mas nos comprometemos a avisar você e a ANPD em caso de incidente relevante,
          como manda a lei.
        </p>
      </Secao>

      <Secao titulo="12. Mudanças nesta política">
        <p>
          Podemos atualizar este texto. A data da última atualização fica no topo da página e, em mudanças
          importantes, avisaremos por e-mail ou no site.
        </p>
      </Secao>

      <p className="text-[14px] text-[#516278]">
        Veja também os nossos{" "}
        <Link href="/termos" className="font-semibold text-brand underline underline-offset-4">
          Termos de Uso
        </Link>
        .
      </p>
    </PaginaLegal>
  );
}
