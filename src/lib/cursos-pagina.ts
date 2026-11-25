// Copy de venda de cada curso (página /cursos/<slug>). Textos curtos: no máximo 3 linhas por item.
// Sem promessas de emprego. Salário só nos cursos profissionalizantes, com fonte oficial (campo salario).

export type PaginaCurso = {
  paraQuem: string[];
  ganhos: { titulo: string; texto: string }[];
  ondeTrabalhar?: string[];
  /** Faixa salarial inicial (cursos profissionalizantes), sempre com a fonte */
  salario?: { faixa: string; fonte: string };
  destaques?: string[];
  faq?: [string, string][];
  /** ID do vídeo de apresentação no YouTube (até 90 s), exibido logo abaixo do topo da página */
  video?: string;
};

export const PAGINA_CURSO: Record<string, PaginaCurso> = {
  // Pitch aprovado pelo Wagner (25/11/2026): termos suaves, sem nomear os sites; suporte é serviço à parte
  "seguranca-digital-na-pratica": {
    paraQuem: [
      "Quem liga o computador e vê sites impróprios abrindo sozinhos",
      "Quem tem medo de abrir o notebook na frente da família, dos clientes ou na igreja",
      "Quem já rodou antivírus, reinstalou o Chrome e o site voltou",
      "Quem preza pela família e pelos seus valores e quer o computador de casa protegido",
    ],
    ganhos: [
      { titulo: "Não é culpa sua", texto: "Você entende o vírus que abre os sites sozinho e por que o endereço muda a cada vez." },
      { titulo: "Ache a linha escondida", texto: "Gerenciador de Tarefas, Autoruns e registro do Windows, com prints reais de cada tela." },
      { titulo: "Remova sem formatar", texto: "Backup, remoção segura e varredura com ferramentas gratuitas e oficiais, sem perder arquivos." },
      { titulo: "Família protegida", texto: "Filtros gratuitos, hábitos e checklist para isso não voltar. Certificado de 20 h incluso." },
    ],
    destaques: [
      "Prints reais da limpeza, tela por tela",
      "A pegadinha que engana quase todo mundo no Gerenciador de Tarefas",
      "Chrome limpo: extensões falsas, notificações e página inicial",
      "Suporte Especializado opcional, por acesso remoto (pago à parte)",
    ],
    faq: [
      ["Preciso saber informática?", "Não. Se você usa o Windows, consegue: cada passo tem o print da tela e o que clicar."],
      ["Vou perder meus arquivos?", "Não. O curso ensina a remover o vírus sem formatar e mostra como fazer uma cópia de segurança antes."],
      ["E se eu não conseguir sozinho?", "Existe o Suporte Especializado (R$ 89,90): fazemos a limpeza com você por acesso remoto. É um serviço extra e opcional, pago à parte, que não está incluso no curso."],
      ["Funciona no Mac ou no celular?", "Não. O curso é para computadores com Windows 10 ou 11."],
    ],
  },
  "registro-de-marca-inpi": {
    paraQuem: [
      "MEI e pequenas empresas que querem registrar a própria marca",
      "Quem vai abrir um negócio e quer proteger o nome antes de investir",
      "Quem recebeu orçamento de R$ 800 a R$ 2.000 para registrar e quer fazer sozinho",
      "Artesãos, prestadores de serviço e lojas virtuais",
    ],
    ganhos: [
      { titulo: "Tela por tela no e-INPI", texto: "Cadastro, GRU com desconto de MEI, formulário do e-Marcas e protocolo, no registro real de uma marca." },
      { titulo: "Classificador de classes", texto: "Digite o seu negócio e veja a classe principal e o que buscar na lista do INPI." },
      { titulo: "Depois do protocolo", texto: "RPI, oposição, exigência, concessão e renovação, com os prazos que não podem ser perdidos." },
      { titulo: "Certificado de 20 horas", texto: "Com QR Code de validação, incluso no valor do curso." },
    ],
    destaques: [
      "Busca de marcas parecidas antes de pagar a taxa",
      "Nominativa ou mista: qual protege mais o seu caso",
      "Checklist da imagem do logotipo e Classificação de Viena",
      "Modelo de notificação para quem copiar a sua marca",
    ],
    faq: [
      ["Preciso de advogado ou despachante?", "Não. A lei permite que o próprio titular faça o pedido no INPI, e o curso mostra cada tela. Para casos complexos, como oposição de empresa grande, vale consultar um profissional."],
      ["As taxas do INPI estão incluídas?", "Não. As taxas (GRU) são pagas à União, direto ao INPI. MEI, ME e pessoa física têm redução de até 60%, e o curso mostra como pedir."],
      ["E se eu travar no pedido?", "Você pode tirar dúvidas com o professor. Se mesmo assim não conseguir, existe o Suporte Especializado (R$ 59,90): fazemos o pedido com você por acesso remoto, em até 24 horas corridas."],
      ["O curso garante o registro?", "Não. Quem decide é o INPI. O curso ensina a escolher um nome registrável, a classe certa e a preencher o pedido sem erros, o que aumenta muito as chances."],
    ],
  },
  "agente-de-portaria": {
    video: "fc2JnU9UlV4",
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
  camareira: {
    paraQuem: [
      "Quem quer a primeira vaga em hotel, pousada, resort ou motel",
      "Quem já faz faxina e quer entrar na hotelaria com carteira assinada",
      "Camareiras que querem crescer para supervisora ou governanta",
      "Donos e equipes de pousadas e casas de temporada",
    ],
    ganhos: [
      { titulo: "O padrão dos hotéis", texto: "Sequência de arrumação, cama com canto de envelope e banheiro impecável, do jeito que a governança cobra." },
      { titulo: "Pronta para o teste prático", texto: "Você chega à seleção sabendo arrumar, limpar, repor e inspecionar o quarto sem esquecer nada." },
      { titulo: "Segurança e saúde", texto: "Produtos sem misturas perigosas, EPI, ergonomia e o que fazer com sangue, seringas e objetos achados." },
      { titulo: "Certificado do seu jeito", texto: "Escolha 20, 40 ou 60 horas, com QR Code, e aumente depois pagando a diferença." },
    ],
    ondeTrabalhar: ["Hotéis e redes hoteleiras", "Pousadas", "Resorts", "Hotéis-fazenda", "Motéis", "Hostels", "Apart-hotéis e flats", "Navios de cruzeiro", "Casas de temporada", "Hospitais e clínicas (hotelaria hospitalar)"],
    destaques: [
      "Infográfico da profissão e relatório de governança com as siglas dos quartos",
      "Simuladores de ordem de manutenção, minibar, achados e perdidos e liberação de quarto",
      "Desafios “entrar ou não entrar?” e “trocar ou manter o enxoval?”",
      "Caça ao erro na arrumação, no banheiro e no relatório de inspeção",
      "Cards de lei com link para o Planalto: Lei Geral do Turismo, ECA, Código Civil e NRs",
    ],
    faq: [
      ["Posso escolher a carga horária do certificado?", "Sim. Você estuda o curso completo e, na hora de emitir, escolhe o certificado de 20, 40 ou 60 horas. Dá para aumentar depois, pagando só a diferença."],
      ["Preciso ter experiência?", "Não. O curso parte do zero e prepara para o teste prático das seleções: arrumar a cama, limpar o banheiro e inspecionar o quarto no padrão."],
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
      { titulo: "Certificado do seu jeito", texto: "Escolha 20, 40 ou 60 horas, com QR Code, e aumente depois pagando a diferença." },
    ],
    destaques: [
      "Simuladores de Word e Excel: formatação, fórmulas e orçamento",
      "Desafios “golpe ou verdadeiro?” e “site oficial ou falso?”",
      "Caça ao erro num currículo",
      "Prompts prontos para usar a IA no trabalho",
    ],
    faq: [
      ["Posso escolher a carga horária do certificado?", "Sim. O curso completo é aberto a todos e, na hora de emitir, você escolhe o certificado de 20, 40 ou 60 horas. Dá para aumentar depois, pagando só a diferença."],
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
  "eletricista-residencial-basico": {
    paraQuem: [
      "Quem nunca mexeu com elétrica e quer começar na profissão",
      "Quem já faz pequenos reparos e quer um certificado para mostrar",
      "Ajudantes de obra e de manutenção que querem subir de função",
      "Quem quer atender casas e comércios por conta própria",
    ],
    ganhos: [
      { titulo: "Curso completo", texto: "16 aulas no celular ou no computador, da Lei de Ohm ao quadro de distribuição, com segurança em primeiro lugar." },
      { titulo: "Apostila prática em PDF", texto: "O passo a passo dos serviços, os diagramas e os checklists de segurança, para consultar no trabalho." },
      { titulo: "Certificado de 40 horas", texto: "Com QR Code de validação e o nome do instrutor, técnico em eletrotécnica com registro no CRT." },
      { titulo: "Pronto para o primeiro serviço", texto: "Tomadas, interruptores, three-way, ponto de luz e diagnóstico de defeitos comuns." },
    ],
    ondeTrabalhar: ["Construtoras e obras", "Empresas de instalação elétrica", "Manutenção predial", "Condomínios", "Hotéis e hospitais", "Shoppings e lojas", "Indústrias", "Por conta própria"],
    salario: {
      faixa: "R$ 2.100 a R$ 2.700",
      fonte: "Do piso de eletricista auxiliar à média de eletricista de instalações, com carteira assinada (Novo CAGED 2026). Varia conforme a cidade e a experiência.",
    },
    destaques: [
      "Jogos de ligação: acione os interruptores e veja a corrente acender a lâmpada",
      "Ligue os fios nos bornes da tomada, do interruptor e do quadro, e teste",
      "Three-way e four-way funcionando na tela, passo a passo",
      "Simuladores de multímetro, de dimensionamento e de diagnóstico de defeitos",
      "11 diagramas de ligação para consultar sempre que precisar",
    ],
    faq: [
      ["O curso vem com apostila?", "Sim. A apostila prática em PDF vem junto com o certificado e você baixa na área do aluno. Traz o passo a passo dos serviços, os diagramas de ligação e os checklists de segurança."],
      ["Quem é o instrutor?", "O curso tem como instrutor um técnico em eletrotécnica com registro no CRT (Conselho Regional dos Técnicos Industriais). O nome dele aparece no certificado."],
      ["Este curso substitui a NR-10?", "Não. É um curso de entrada na profissão. O treinamento de segurança da NR-10 é outro curso, exigido de quem trabalha com eletricidade em empresas, e a aula final mostra como seguir."],
      ["Depois do curso já posso trabalhar?", "Sim. Você conclui sabendo fazer os serviços básicos com segurança e pode buscar vaga ou atender clientes. Serviços maiores vêm com a prática e novas qualificações."],
    ],
  },
  "automacao-residencial-inteligente": {
    paraQuem: [
      "Quem gosta de tecnologia e quer trabalhar com casas inteligentes",
      "Eletricistas e técnicos que querem oferecer um serviço a mais",
      "Vendedores de lojas de eletrônicos e material elétrico",
      "Quem quer automatizar a própria casa com segurança e economia",
    ],
    ganhos: [
      { titulo: "Curso completo", texto: "16 aulas: protocolos, dispositivos, pareamento, aplicativos, Alexa, centrais, cenas e rotinas." },
      { titulo: "Apostila prática em PDF", texto: "Fichas passo a passo de vistoria, pareamento, rotinas e entrega ao cliente." },
      { titulo: "Certificado de 60 horas", texto: "Com QR Code de validação e o nome do instrutor, técnico em eletrotécnica com registro no CRT." },
      { titulo: "Projeto final", texto: "Você monta o projeto completo de uma casa inteligente, com orçamento." },
    ],
    ondeTrabalhar: ["Empresas de automação", "Segurança eletrônica", "Lojas de casa inteligente", "Lojas de material elétrico", "Construtoras de alto padrão", "Por conta própria"],
    salario: {
      faixa: "R$ 1.500 a R$ 2.600",
      fonte: "Estimativa de sites de vagas para técnico instalador; ainda não há dado oficial só desta função. Serviços por projeto podem render mais.",
    },
    destaques: [
      "Simuladores de rede, pareamento e diagnóstico de falhas",
      "Monte rotinas QUANDO, SE, ENTÃO e cenas de iluminação",
      "Jogo de demonstração da ligação do relé inteligente",
      "Projeto final de uma casa inteligente com orçamento",
    ],
    faq: [
      ["O curso vem com apostila?", "Sim. A apostila prática em PDF vem junto com o certificado: você baixa na área do aluno, com as fichas passo a passo de cada tarefa."],
      ["Preciso saber elétrica?", "Não. O curso começa pelo que não exige obra (lâmpadas, tomadas, sensores, Alexa). As ligações em 127/220 V são mostradas como demonstração e ficam com o eletricista."],
      ["Quais marcas o curso usa?", "As explicações valem para qualquer marca e usam como referência a documentação pública de fabricantes conhecidos e do Home Assistant."],
    ],
  },
  "bombeiro-hidraulico": {
    paraQuem: [
      "Quem nunca trabalhou na área e quer começar na profissão",
      "Quem já faz pequenos reparos e quer um certificado para mostrar",
      "Ajudantes de obra e de manutenção que querem subir de função",
      "Quem quer atender casas e comércios por conta própria",
    ],
    ganhos: [
      { titulo: "Curso completo", texto: "16 aulas: hidráulica básica, tubos e conexões, água fria e quente, ralos, louças, metais e vazamentos." },
      { titulo: "Apostila prática em PDF", texto: "Fichas passo a passo de soldas, testes, reparos, vaso, chuveiro, desentupimento e vazamentos." },
      { titulo: "Certificado de 80 horas", texto: "Com QR Code de validação, para mostrar no currículo e aos clientes." },
      { titulo: "Pronto para o primeiro serviço", texto: "Os reparos mais pedidos do dia a dia, com método e segurança." },
    ],
    ondeTrabalhar: ["Construtoras e obras", "Manutenção predial", "Condomínios", "Hotéis e hospitais", "Indústrias", "Lojas de material de construção", "Por conta própria"],
    salario: {
      faixa: "R$ 2.400 a R$ 2.800",
      fonte: "Do piso à média de encanador / bombeiro hidráulico, com carteira assinada (Novo CAGED 2026). Varia conforme a cidade e a experiência.",
    },
    destaques: [
      "Simuladores de pressão, hidrômetro, declividade e orçamento",
      "Diagnósticos de caixa acoplada, entupimento e vazamento oculto",
      "Passo a passo de solda de PVC, veda-rosca e teste de estanqueidade",
      "Diagramas de caixa-d'água, sifão, aquecimento solar e banheiro",
    ],
    faq: [
      ["O curso vem com apostila?", "Sim. A apostila prática em PDF vem junto com o certificado: você baixa na área do aluno, com 11 fichas passo a passo dos serviços mais comuns."],
      ["Preciso ter experiência?", "Não. O curso começa do zero, com linguagem simples, e você estuda no celular ou no computador."],
      ["Depois do curso já posso trabalhar?", "Sim. Você conclui sabendo fazer os serviços básicos com segurança e pode buscar vaga ou atender clientes. Serviços maiores vêm com a prática e novas qualificações."],
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
