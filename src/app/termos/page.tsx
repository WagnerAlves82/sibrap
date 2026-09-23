import type { Metadata } from "next";
import Link from "next/link";
import { PaginaLegal, Secao, Lista } from "@/components/pagina-legal";
import { EMAIL_CONTATO, EMISSOR, RAZAO_SOCIAL } from "@/lib/emissor";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Regras de uso do SIBRAP: cursos livres gratuitos, certificados, apostilas e simulados.",
};

export default function TermosPage() {
  return (
    <PaginaLegal titulo="Termos de Uso" atualizadoEm="19 de setembro de 2026">
      <Secao titulo="1. Aceite">
        <p>
          Ao criar uma conta ou usar o site sibrap.tec.br, você concorda com estes Termos e com a nossa{" "}
          <Link href="/privacidade" className="font-semibold text-brand underline underline-offset-4">
            Política de Privacidade
          </Link>
          . Se não concordar, não utilize o serviço.
        </p>
        <p>
          O SIBRAP é operado por <strong>{RAZAO_SOCIAL}</strong>, CNPJ {EMISSOR.cnpj}, de Manaus/AM.
        </p>
      </Secao>

      <Secao titulo="2. O que oferecemos">
        <Lista
          itens={[
            <><strong>Cursos livres online</strong>, com aulas em vídeo gratuitas para todos.</>,
            <><strong>Certificado de conclusão</strong> dos cursos, nas condições do item 5.</>,
            <><strong>Apostilas e simulados</strong> para concursos públicos, parte gratuitos e parte pagos.</>,
          ]}
        />
      </Secao>

      <Secao titulo="3. Cadastro e conta">
        <Lista
          itens={[
            "Informe dados verdadeiros e mantenha-os atualizados. O nome do certificado é o que você digitar, por isso confira antes de emitir.",
            "A conta é pessoal e intransferível. Guarde a sua senha e não a compartilhe; você responde pelo que for feito com ela.",
            "Menores de 12 anos não podem se cadastrar. De 12 a 17 anos, é necessária a autorização de um responsável legal.",
          ]}
        />
      </Secao>

      <Secao titulo="4. Os cursos livres">
        <p>
          Os cursos do SIBRAP são <strong>cursos livres de qualificação</strong>, sem equivalência a cursos
          regulamentados pelo MEC. São conteúdos independentes, sem vínculo com a Microsoft, o Google ou outras marcas
          citadas apenas para fins educativos.
        </p>
        <p>
          Cada aula só libera a seguinte depois de concluída. A carga horária informada corresponde às aulas em
          vídeo, atividades práticas e à avaliação final.
        </p>
      </Secao>

      <Secao titulo="5. O certificado">
        <Lista
          itens={[
            "Para emitir o certificado é preciso concluir todas as aulas e obter, na prova final, a nota mínima informada no curso.",
            <><strong>Gratuito</strong> para quem envia um comprovante de inscrição no CadÚnico que seja aprovado pela nossa equipe. Podemos recusar documentos ilegíveis, incompletos ou que não comprovem a inscrição, e você pode enviar outro.</>,
            <>Para os demais participantes, o certificado custa <strong>R$ 49,90</strong>, pagos uma única vez por PIX. O curso e as aulas continuam gratuitos.</>,
            "O certificado traz um código e um QR Code de validação, e qualquer pessoa pode conferir a sua autenticidade no site.",
            "Comprovante falso ou adulterado resulta no cancelamento do certificado e pode gerar responsabilização civil e criminal.",
          ]}
        />
      </Secao>

      <Secao titulo="6. Pagamentos, reembolso e arrependimento">
        <p>
          Os pagamentos são feitos por PIX, processados pelo Mercado Pago. Você pode pedir o <strong>reembolso em até
          7 dias corridos após a compra</strong>, conforme o art. 49 do Código de Defesa do Consumidor, escrevendo para{" "}
          {EMAIL_CONTATO}. O valor é devolvido pelo mesmo meio de pagamento.
        </p>
      </Secao>

      <Secao titulo="7. Apostilas e simulados para concursos">
        <p>
          O conteúdo é elaborado a partir dos editais publicados, com questões <strong>inéditas no estilo da
          banca</strong>. O SIBRAP <strong>não tem vínculo</strong> com bancas organizadoras nem com os órgãos que
          realizam os concursos.
        </p>
        <p>
          Editais podem ser alterados. Nós nos esforçamos para manter o material atualizado, mas{" "}
          <strong>não garantimos aprovação em concursos</strong>: o resultado depende também do seu estudo e da
          concorrência.
        </p>
      </Secao>

      <Secao titulo="8. Uso adequado e propriedade intelectual">
        <p>Os textos, vídeos, questões, apostilas e a marca SIBRAP são protegidos por direitos autorais. É proibido:</p>
        <Lista
          itens={[
            "copiar, redistribuir, revender ou compartilhar os materiais e o acesso à sua conta;",
            "usar robôs ou scripts para concluir aulas, responder provas ou coletar conteúdo;",
            "tentar acessar áreas restritas ou burlar as regras do sistema;",
            "usar o serviço para fins ilegais ou para prejudicar outras pessoas.",
          ]}
        />
        <p>Você pode usar o material para o seu estudo pessoal.</p>
      </Secao>

      <Secao titulo="9. Disponibilidade">
        <p>
          Podemos ter interrupções para manutenção ou por falhas de serviços de terceiros (como hospedagem e vídeos).
          Também podemos atualizar, alterar ou encerrar conteúdos; nesse caso, respeitaremos os direitos já adquiridos
          por quem comprou algum produto.
        </p>
      </Secao>

      <Secao titulo="10. Suspensão">
        <p>
          Podemos suspender ou encerrar contas que descumpram estes Termos, com aviso quando possível. Você pode pedir
          o encerramento da sua conta e a exclusão dos seus dados a qualquer momento (veja a Política de Privacidade).
        </p>
      </Secao>

      <Secao titulo="11. Limitação de responsabilidade">
        <p>
          O conteúdo tem fim educativo. O SIBRAP não garante emprego, aprovação ou resultados específicos, e não
          responde por danos decorrentes do uso inadequado do material, nos limites permitidos pela lei.
        </p>
      </Secao>

      <Secao titulo="12. Mudanças e foro">
        <p>
          Podemos alterar estes Termos; a data da última atualização fica no topo e, em mudanças importantes,
          avisaremos você. Aplica-se a legislação brasileira. Em relações de consumo, fica eleito o foro do domicílio
          do consumidor; nos demais casos, o foro de Manaus/AM.
        </p>
      </Secao>

      <Secao titulo="13. Contato">
        <p>Dúvidas, pedidos de reembolso ou solicitações sobre seus dados: {EMAIL_CONTATO}.</p>
      </Secao>
    </PaginaLegal>
  );
}
