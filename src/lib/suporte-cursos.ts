// Suporte Especializado por curso: serviço EXTRA, opcional e pago à parte (não incluso no curso).
// O aluno contrata na área do curso (/minha-area/cursos/<slug>/suporte), paga pelo AbacatePay (PIX ou cartão) e o
// Wagner recebe o aviso "Suporte contratado" por e-mail (src/lib/entrega.ts → enviarAvisoVenda, tipo "servico").
// Depois ele entra em contato com o aluno. Registro de Marca desde 16/11/2026; Segurança Digital desde 25/11/2026.
import { CURSO_MARCA, PRODUTO_SUPORTE_MARCA, TERMOS_SUPORTE as TERMOS_MARCA } from "@/lib/suporte-marca";

export const ANYDESK_DOWNLOAD = "https://anydesk.com/pt/downloads";

export type ConfigSuporte = {
  produto: string;
  precoPadraoCentavos: number;
  cursoNome: string;
  /** chamada no fim do curso e nas aulas */
  pergunta: string;
  /** o que o suporte faz, numa frase */
  promessa: string;
  termos: { titulo: string; itens: string[] }[];
  /** o que separar antes da sessão (mostrado depois do pagamento) */
  separar: string[];
  /** campo extra do e-mail de agendamento */
  campoAgendamento: string;
};

const TERMOS_SEGURANCA: ConfigSuporte["termos"] = [
  {
    titulo: "Serviço à parte",
    itens: [
      "O Suporte Especializado é um serviço extra e opcional. Ele não está incluso no curso e é pago à parte.",
      "Quem comprou só o curso tem acesso às aulas e ao certificado; o atendimento remoto só existe para quem contrata o suporte.",
    ],
  },
  {
    titulo: "O que está incluído",
    itens: [
      "1 sessão por acesso remoto em 1 computador com Windows.",
      "Busca e remoção do que faz o computador abrir sites sozinho (inicialização, tarefas agendadas, atalhos, extensões e notificações do navegador).",
      "Varredura com ferramentas gratuitas e oficiais e conferência final com você.",
    ],
  },
  {
    titulo: "O que não está incluído",
    itens: [
      "Formatação, reinstalação do Windows, backup ou recuperação de arquivos.",
      "Conserto de peças, lentidão por hardware, celulares, Mac ou Linux.",
      "Licenças de programas pagos.",
      "Garantia contra novas infecções causadas por novos downloads depois do atendimento.",
    ],
  },
  {
    titulo: "Prazo e acesso remoto",
    itens: [
      "Depois do pagamento, entramos em contato pelo seu e-mail para combinar o horário.",
      "O atendimento usa o AnyDesk, gratuito. A conexão só acontece com você presente, aceitando na sua tela, e você pode encerrar a qualquer momento.",
      "Não pedimos nem guardamos senhas. A sessão não é gravada.",
    ],
  },
  {
    titulo: "Reembolso",
    itens: [
      "Arrependimento: até 7 dias da compra, se o atendimento ainda não tiver sido realizado (CDC, art. 49).",
      "Depois da sessão realizada, não há reembolso.",
      "Os dados vistos na sessão são usados só para o atendimento, conforme a LGPD (Lei 13.709/2018).",
    ],
  },
];

export const SUPORTES: Record<string, ConfigSuporte> = {
  [CURSO_MARCA]: {
    produto: PRODUTO_SUPORTE_MARCA,
    precoPadraoCentavos: 5990,
    cursoNome: "Registre Sua Marca no INPI",
    pergunta: "Não conseguiu fazer o pedido sozinho?",
    promessa: "Um especialista faz o pedido da sua marca com você, por acesso remoto, em até 24 horas corridas após o pagamento.",
    termos: TERMOS_MARCA,
    separar: ["Login e senha do e-INPI (ou CPF/CNPJ para criar o cadastro)", "O JPG do logotipo, se a marca for mista", "O que o seu negócio faz ou vende", "Acesso ao banco ou app para pagar a GRU por PIX"],
    campoAgendamento: "Marca",
  },
  "seguranca-digital-na-pratica": {
    produto: "suporte-seguranca-digital",
    precoPadraoCentavos: 8990,
    cursoNome: "Segurança Digital na Prática",
    pergunta: "Não conseguiu fazer a limpeza sozinho?",
    promessa: "Um técnico do SIBRAP faz a limpeza com você, por acesso remoto: encontramos a causa, removemos e conferimos juntos. Serviço extra, pago à parte, não incluso no curso.",
    termos: TERMOS_SEGURANCA,
    separar: ["O computador ligado na internet, com o Windows aberto", "Um tempo livre de cerca de 1 hora", "Se puder, o endereço do site que costuma abrir sozinho"],
    campoAgendamento: "O que acontece no computador",
  },
};

export const areaSuporte = (slug: string) => `/minha-area/cursos/${slug}/suporte`;
export const suporteDoCurso = (slug: string): ConfigSuporte | null => SUPORTES[slug] ?? null;
