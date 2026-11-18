// Natan, o assistente virtual do site (Wagner, 18/11/2026): perguntas rápidas de perfil e recomendação de cursos.
// Fase 1: só botões, sem IA (custo zero). A ordem de recomendação por área e por experiência fica aqui.

// Item do catálogo que o Natan mostra como opção. "curso-gratis": curso grátis com certificado opcional (sem valor, como no
// resto do site); "curso-pago", "formacao" e "apostila": pagos, com o preço.
export type ItemCatalogo = {
  id: string;
  tipo: "curso-gratis" | "curso-pago" | "formacao" | "apostila";
  nome: string;
  area: string;
  horas: number | null;
  detalhe: string;
  preco: string | null;
  url: string;
};

export function rotuloTipo(i: ItemCatalogo): string {
  if (i.tipo === "curso-gratis") return "Curso gratuito · certificado opcional";
  if (i.tipo === "apostila") return `Apostila (paga)${i.preco ? ` · ${i.preco}` : ""}`;
  return `Pago${i.preco ? ` · ${i.preco}` : ""}`;
}

export const OBJETIVOS = [
  { valor: "primeiro", rotulo: "Conseguir o primeiro emprego" },
  { valor: "trocar", rotulo: "Mudar de área" },
  { valor: "crescer", rotulo: "Crescer onde já trabalho" },
  { valor: "curriculo", rotulo: "Ter certificado para o currículo" },
  { valor: "conta-propria", rotulo: "Trabalhar por conta própria" },
] as const;

export const AREAS = [
  { valor: "Administração e escritório", rotulo: "Administração e escritório", icone: "🗂️" },
  { valor: "Atendimento e comunicação", rotulo: "Atendimento e comunicação", icone: "💬" },
  { valor: "Construção e manutenção", rotulo: "Elétrica e manutenção", icone: "⚡" },
  { valor: "Tecnologia", rotulo: "Tecnologia", icone: "💻" },
  { valor: "Indústria e logística", rotulo: "Indústria e logística", icone: "🏭" },
  { valor: "Serviços e hotelaria", rotulo: "Serviços e hotelaria", icone: "🏨" },
  { valor: "Educação: formação continuada", rotulo: "Educação (professores)", icone: "🎓" },
  { valor: "nao-sei", rotulo: "Ainda não sei", icone: "🤔" },
] as const;

export const IDADES = ["Até 17 anos", "18 a 24 anos", "25 a 39 anos", "40 a 59 anos", "60 anos ou mais", "Prefiro não dizer"] as const;

export const EXPERIENCIAS = [
  { valor: "nunca", rotulo: "Ainda não trabalhei com carteira" },
  { valor: "outra", rotulo: "Já trabalhei, mas em outra área" },
  { valor: "mesma", rotulo: "Já trabalho nessa área" },
] as const;

// ordem sugerida por área: "entrada" para quem está começando; "avanco" para quem já trabalha na área
const ORDEM: Record<string, { entrada: string[]; avanco: string[] }> = {
  "Administração e escritório": {
    entrada: ["auxiliar-administrativo", "excel-basico-ao-intermediario", "secretariado", "auxiliar-de-recursos-humanos"],
    avanco: ["assistente-administrativo", "auxiliar-de-departamento-pessoal", "inteligencia-artificial-trabalho-administrativo", "auxiliar-de-recursos-humanos"],
  },
  "Atendimento e comunicação": {
    entrada: ["atendimento-ao-cliente", "atendente-de-call-center", "ingles-basico-atendimento-ao-publico"],
    avanco: ["ingles-basico-atendimento-ao-publico", "libras-iniciante", "atendimento-ao-cliente"],
  },
  "Construção e manutenção": {
    entrada: ["eletricista-residencial-basico", "nr-10-basico", "bombeiro-hidraulico"],
    avanco: ["automacao-residencial-inteligente", "nr-10-basico", "seguranca-trabalho-em-altura"],
  },
  Tecnologia: {
    entrada: ["informatica-basica-ia", "conserto-e-manutencao-de-celulares"],
    avanco: ["conserto-e-manutencao-de-celulares", "informatica-basica-ia"],
  },
  "Indústria e logística": {
    entrada: ["tbo-treinamento-basico-operacional", "estoque-logistica-controle-de-mercadorias"],
    avanco: ["estoque-logistica-controle-de-mercadorias", "tbo-treinamento-basico-operacional"],
  },
  "Serviços e hotelaria": { entrada: ["camareira", "agente-de-portaria"], avanco: ["agente-de-portaria", "camareira"] },
  "Educação: formação continuada": {
    entrada: ["metodologia-educacao-fisica-educacao-infantil", "treinador-de-futsal-criancas-e-adolescentes", "metodologia-ensino-voleibol"],
    avanco: ["metodologia-educacao-fisica-educacao-infantil", "treinador-de-basquetebol-criancas-e-adolescentes", "treinador-de-atletismo-criancas-e-adolescentes"],
  },
};

// quem ainda não sabe a área: sugestão pelo objetivo
const SEM_AREA: Record<string, string[]> = {
  primeiro: ["atendimento-ao-cliente", "auxiliar-administrativo", "informatica-basica-ia"],
  trocar: ["auxiliar-administrativo", "eletricista-residencial-basico", "atendimento-ao-cliente"],
  crescer: ["excel-basico-ao-intermediario", "inteligencia-artificial-trabalho-administrativo", "assistente-administrativo"],
  curriculo: ["informatica-basica-ia", "excel-basico-ao-intermediario", "atendimento-ao-cliente"],
  "conta-propria": ["eletricista-residencial-basico", "conserto-e-manutencao-de-celulares", "bombeiro-hidraulico"],
};

// cursos que pedem 18 anos para trabalhar na função (NR-10 e trabalho em altura): não sugerir a menores
const SO_ADULTOS = new Set(["nr-10-basico", "seguranca-trabalho-em-altura", "eletricista-residencial-basico", "automacao-residencial-inteligente"]);

export type Perfil = { objetivo?: string; area?: string; idade?: string; experiencia?: string };

export function recomendar(perfil: Perfil, itens: ItemCatalogo[], quantos = 1): ItemCatalogo[] {
  const cursos = itens.filter((i) => i.tipo === "curso-gratis" || i.tipo === "curso-pago");
  const ativos = new Map(cursos.map((c) => [c.id, c]));
  const menor = perfil.idade === "Até 17 anos";
  let ordem: string[];
  if (!perfil.area || perfil.area === "nao-sei") {
    ordem = SEM_AREA[perfil.objetivo ?? "primeiro"] ?? SEM_AREA.primeiro;
  } else {
    const o = ORDEM[perfil.area];
    const avancar = perfil.experiencia === "mesma" || perfil.objetivo === "crescer";
    ordem = o ? (avancar ? o.avanco : o.entrada) : [];
    // completa com os outros cursos da mesma área
    ordem = [...ordem, ...cursos.filter((c) => c.area === perfil.area).map((c) => c.id)];
  }
  const vistos = new Set<string>();
  const lista: ItemCatalogo[] = [];
  for (const id of ordem) {
    if (vistos.has(id) || (menor && SO_ADULTOS.has(id))) continue;
    vistos.add(id);
    const c = ativos.get(id);
    if (c) lista.push(c);
    if (lista.length >= quantos) break;
  }
  return lista;
}

// frase curta de motivo, conforme o perfil
export function motivo(perfil: Perfil): string {
  if (perfil.experiencia === "mesma" || perfil.objetivo === "crescer") return "Para quem já está na área e quer subir de nível:";
  if (perfil.objetivo === "conta-propria") return "Para começar a atender por conta própria:";
  if (perfil.experiencia === "nunca" || perfil.objetivo === "primeiro") return "Para começar do zero e chegar pronto na primeira vaga:";
  if (perfil.objetivo === "trocar" || perfil.experiencia === "outra") return "Para entrar numa área nova com base sólida:";
  return "Separei estes para você:";
}
