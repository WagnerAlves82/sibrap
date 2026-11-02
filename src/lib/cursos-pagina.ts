// Copy de venda de cada curso (página /cursos/<slug>). Textos curtos: no máximo 3 linhas por item.
// Sem salários e sem promessas de emprego; só o que o curso realmente entrega.

export type PaginaCurso = {
  paraQuem: string[];
  ganhos: { titulo: string; texto: string }[];
  ondeTrabalhar?: string[];
  destaques?: string[];
  faq?: [string, string][];
};

export const PAGINA_CURSO: Record<string, PaginaCurso> = {
  "agente-de-portaria": {
    paraQuem: [
      "Quem quer a primeira vaga em portaria, controle de acesso ou recepção",
      "Porteiros que querem se atualizar com tecnologia e legislação",
      "Quem vai prestar processo seletivo de empresa terceirizada ou condomínio",
      "Zeladores, folguistas e recepcionistas que cobrem a portaria",
    ],
    ganhos: [
      { titulo: "Segurança para agir", texto: "Você aprende o procedimento certo para visitantes, encomendas, prestadores, golpes e emergências, sem improvisar." },
      { titulo: "Currículo mais forte", texto: "Certificado de 20, 40 ou 60 horas com QR Code, que o recrutador confere em segundos." },
      { titulo: "Lei a seu favor", texto: "Escala 12x36, desvio de função, LGPD e o que o Código Penal diz sobre a rotina da portaria." },
      { titulo: "Pronto para a tecnologia", texto: "CFTV, biometria, QR Code, tags e portaria remota: o que os condomínios já usam." },
    ],
    ondeTrabalhar: ["Condomínios residenciais", "Prédios comerciais", "Hospitais e clínicas", "Escolas e universidades", "Shoppings", "Indústrias", "Órgãos públicos", "Hotéis e clubes", "Centrais de portaria remota", "Empresas terceirizadas"],
    destaques: [
      "Simulador de sistema de portaria para cadastrar visitantes e veículos",
      "Desafios “libera ou barra?” com situações reais de golpe",
      "Vídeo de comunicação por rádio com o alfabeto fonético da OTAN",
      "Cards de lei com link para o texto oficial no Planalto",
      "Caça ao erro no livro de ocorrências",
    ],
    faq: [
      ["Posso escolher a carga horária do certificado?", "Sim. Você estuda o curso completo e, na hora de emitir, escolhe o certificado de 20, 40 ou 60 horas. Dá para aumentar depois, pagando só a diferença."],
      ["Este curso me forma vigilante?", "Não. Vigilante é outra profissão, com curso de formação em escola autorizada e registro na Polícia Federal. Este curso prepara para portaria e controle de acesso."],
    ],
  },
  "atendente-de-call-center": {
    paraQuem: [
      "Quem busca o primeiro emprego com carteira assinada",
      "Quem vai participar de processo seletivo em central de atendimento",
      "Atendentes que querem crescer para retenção, qualidade ou supervisão",
      "Quem atende clientes por telefone, chat ou WhatsApp em qualquer empresa",
    ],
    ganhos: [
      { titulo: "Porta de entrada no mercado", texto: "Centrais de atendimento contratam o ano todo e treinam quem chega com boa base." },
      { titulo: "Pronto para a simulação", texto: "Abertura, sondagem, registro, reclamação e encerramento treinados na prática." },
      { titulo: "Vendas e metas sem mistério", texto: "Venda consultiva, objeções e os indicadores TMA, FCR e NPS explicados." },
      { titulo: "Certificado do seu jeito", texto: "Escolha 20, 30 ou 40 horas, com QR Code, e aumente depois pagando a diferença." },
    ],
    ondeTrabalhar: ["Bancos e financeiras", "Operadoras de telefonia e internet", "Varejo e e-commerce", "Planos de saúde e clínicas", "Seguradoras", "Escolas e cursos", "Empresas de tecnologia", "Centrais de atendimento terceirizadas"],
    destaques: [
      "Simulador de CRM para registrar atendimentos",
      "Desafios “ativo ou receptivo?”, “resolvo ou escalo?” e “boa resposta à objeção?”",
      "Caça ao erro numa transcrição de atendimento",
      "Cards com as regras do SAC, o Código de Defesa do Consumidor, a LGPD e a NR-17",
    ],
    faq: [
      ["Posso escolher a carga horária do certificado?", "Sim. O curso completo é aberto a todos e, na hora de emitir, você escolhe o certificado de 20, 30 ou 40 horas. Dá para aumentar depois, pagando só a diferença."],
      ["Preciso ter experiência?", "Não. O curso parte do zero e prepara para as etapas mais comuns dos processos seletivos: teste de digitação e português, dinâmica e simulação de atendimento."],
    ],
  },
  "auxiliar-administrativo": {
    paraQuem: [
      "Quem busca o primeiro emprego em escritório",
      "Quem vai prestar concurso de auxiliar ou assistente administrativo",
      "Quem já trabalha no administrativo e quer organizar melhor a rotina",
      "Donos de pequenos negócios que cuidam da própria papelada",
    ],
    ganhos: [
      { titulo: "O que as vagas pedem", texto: "Documentos, arquivo, financeiro, departamento pessoal, planilhas e atendimento, do jeito que as empresas cobram." },
      { titulo: "Base para concursos", texto: "Redação oficial, arquivologia, ética no serviço público e LGPD, temas frequentes nas provas de prefeituras." },
      { titulo: "Prática de verdade", texto: "Simuladores de recado e de contas a pagar, fluxo de caixa, conciliação bancária e fórmulas de planilha." },
      { titulo: "Certificado do seu jeito", texto: "Escolha 20, 30 ou 40 horas, com QR Code de validação, e aumente depois pagando a diferença." },
    ],
    ondeTrabalhar: ["Escritórios em geral", "Contabilidades", "Clínicas e hospitais", "Escolas", "Comércio e indústria", "Prefeituras e câmaras", "Imobiliárias", "Condomínios e administradoras"],
    destaques: [
      "Simuladores: recado telefônico, lançamento de conta a pagar e planilha",
      "Caça ao erro num ofício oficial",
      "Cards de lei com link para a Constituição, a CLT e a LGPD no Planalto",
      "Tabelas práticas: fluxo de caixa, conciliação, férias e pronomes de tratamento",
    ],
    faq: [
      ["Posso escolher a carga horária do certificado?", "Sim. O curso completo é aberto a todos e, na hora de emitir, você escolhe o certificado de 20, 30 ou 40 horas. Dá para aumentar depois, pagando só a diferença."],
      ["O curso ajuda em concurso público?", "Ajuda na parte de noções de administração: redação oficial, arquivologia, atendimento, ética, LGPD e departamento pessoal, temas comuns nos editais de auxiliar e assistente administrativo."],
    ],
  },
  "atendimento-ao-cliente": {
    paraQuem: [
      "Quem quer trabalhar em loja, recepção, telemarketing ou balcão",
      "Quem já atende e quer lidar melhor com reclamações",
      "Vendedores que querem fidelizar clientes",
      "Pequenos empreendedores que atendem pelo WhatsApp",
    ],
    ganhos: [
      { titulo: "Atendimento que fideliza", texto: "Técnicas para entender o cliente, resolver o problema e fazê-lo voltar." },
      { titulo: "Calma nas reclamações", texto: "Como conduzir clientes irritados sem levar para o lado pessoal." },
      { titulo: "Todos os canais", texto: "Presencial, telefone, WhatsApp e redes sociais, cada um com a sua etiqueta." },
      { titulo: "Certificado do seu jeito", texto: "Escolha 20, 30 ou 40 horas, com QR Code, e aumente depois pagando a diferença." },
    ],
    ondeTrabalhar: ["Lojas e supermercados", "Recepções", "Call centers", "Clínicas", "Bancos e lotéricas", "Hotéis e restaurantes"],
    destaques: [
      "Simuladores de agendamento por telefone e de troca no balcão",
      "Desafios “ajuda ou atrapalha?” com frases reais de atendimento",
      "Caça ao erro numa mensagem de desculpas",
      "Roteiros prontos: ligação, reclamação e entrevista (método STAR)",
    ],
    faq: [
      ["Posso escolher a carga horária do certificado?", "Sim. O curso completo é aberto a todos e, na hora de emitir, você escolhe o certificado de 20, 30 ou 40 horas. Dá para aumentar depois, pagando só a diferença."],
    ],
  },
  "estoque-logistica-controle-de-mercadorias": {
    paraQuem: [
      "Quem quer vaga de auxiliar de estoque, almoxarife ou conferente",
      "Quem trabalha em loja e cuida da reposição",
      "Quem quer entrar na área de logística",
      "Pequenos comerciantes que perdem dinheiro com estoque parado",
    ],
    ganhos: [
      { titulo: "Controle sem perdas", texto: "Entrada, saída, inventário e as técnicas que evitam falta e excesso de mercadoria." },
      { titulo: "Linguagem do mercado", texto: "PEPS, curva ABC, giro de estoque e nota fiscal, os termos que caem na entrevista." },
      { titulo: "Área que contrata", texto: "Comércio, indústria e e-commerce precisam de quem organize mercadorias com precisão." },
      { titulo: "Certificado com QR Code", texto: "Comprovação que o recrutador confere na hora." },
    ],
    ondeTrabalhar: ["Supermercados e atacados", "Centros de distribuição", "Indústrias", "E-commerce", "Lojas de varejo", "Farmácias"],
  },
  "informatica-basica-ia": {
    paraQuem: [
      "Quem quer perder o medo do computador",
      "Quem precisa de informática básica no currículo",
      "Quem quer usar a inteligência artificial no trabalho e nos estudos",
      "Quem vai prestar concurso com prova de informática",
    ],
    ganhos: [
      { titulo: "Do zero ao uso no trabalho", texto: "Computador, pastas, internet, e-mail, gov.br, Word, Excel e PowerPoint, passo a passo." },
      { titulo: "Inteligência artificial", texto: "Como usar o Copilot e outras IAs para escrever, resumir e organizar, com segurança." },
      { titulo: "Segurança digital", texto: "Senhas, golpes e cuidados para não cair em armadilhas na internet." },
      { titulo: "Certificado do seu jeito", texto: "Escolha 20, 30 ou 40 horas, com QR Code, e aumente depois pagando a diferença." },
    ],
    destaques: [
      "Simuladores de Word e Excel: formatação, fórmulas e orçamento",
      "Desafios “golpe ou verdadeiro?” e “site oficial ou falso?”",
      "Caça ao erro num currículo",
      "Prompts prontos para usar a IA no trabalho",
    ],
    faq: [
      ["Posso escolher a carga horária do certificado?", "Sim. O curso completo é aberto a todos e, na hora de emitir, você escolhe o certificado de 20, 30 ou 40 horas. Dá para aumentar depois, pagando só a diferença."],
    ],
  },
  "conserto-e-manutencao-de-celulares": {
    paraQuem: [
      "Quem quer uma renda extra consertando celulares",
      "Quem quer abrir a própria assistência técnica",
      "Vendedores de loja de celular que querem oferecer serviço",
      "Curiosos que querem entender o aparelho por dentro",
    ],
    ganhos: [
      { titulo: "Profissão com demanda", texto: "Todo mundo tem celular, e tela, bateria e conector são consertos que aparecem todo dia." },
      { titulo: "Do diagnóstico à troca", texto: "Bancada, multímetro, fonte, diagnóstico e as trocas de tela, bateria e conector." },
      { titulo: "Negócio próprio", texto: "Orçamento, garantia e atendimento para trabalhar por conta própria." },
      { titulo: "Certificado incluso", texto: "Certificado com QR Code para mostrar aos clientes." },
    ],
  },
  "ingles-basico-atendimento-ao-publico": {
    paraQuem: [
      "Quem atende turistas em hotel, restaurante, loja ou transporte",
      "Recepcionistas e vendedores que precisam do básico em inglês",
      "Quem quer começar o inglês pelo vocabulário do trabalho",
      "Quem vai trabalhar em eventos e cidades turísticas",
    ],
    ganhos: [
      { titulo: "Inglês para usar amanhã", texto: "Frases prontas para receber, orientar, vender e resolver problemas com estrangeiros." },
      { titulo: "Ouça e repita", texto: "Áudio de cada frase e diálogos de atendimento para treinar a pronúncia." },
      { titulo: "Fale e seja corrigido", texto: "Ditados e exercícios de fala com o microfone: o navegador confere sua pronúncia." },
      { titulo: "Certificado com QR Code", texto: "Inglês para atendimento comprovado no currículo." },
    ],
    ondeTrabalhar: ["Hotéis e pousadas", "Restaurantes e bares", "Lojas", "Aeroportos e rodoviárias", "Agências de turismo", "Eventos"],
    destaques: [
      "Áudio em cada frase, com opção de ouvir devagar",
      "Ditados: ouça e escreva, com correção palavra por palavra",
      "Fale em inglês: o navegador confere a sua pronúncia",
      "Diálogos de atendimento e jogos de ordenar frases",
    ],
  },
  "libras-iniciante": {
    paraQuem: [
      "Quem atende o público e quer se comunicar com pessoas surdas",
      "Professores, profissionais da saúde e servidores públicos",
      "Familiares e amigos de pessoas surdas",
      "Quem quer começar a estudar Libras",
    ],
    ganhos: [
      { titulo: "Atendimento inclusivo", texto: "Saudações, apresentações e as frases mais usadas no atendimento." },
      { titulo: "Cultura surda", texto: "Como a comunidade surda se comunica e o que evitar ao conversar." },
      { titulo: "Sinais em vídeo", texto: "Cada sinal com link para ver o movimento no dicionário em vídeo." },
      { titulo: "Certificado com QR Code", texto: "Um diferencial no currículo de quem atende o público." },
    ],
  },
};
