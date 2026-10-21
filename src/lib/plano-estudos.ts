// Plano de estudos automático: distribui o que falta da apostila pelos dias que restam até a prova.
// Função pura (sem acesso a banco), para o mesmo cálculo valer no servidor e nos testes.

export type ItemPlano = { id: string; titulo: string; minutos: number; numero: number };

export type DiaPlano = {
  /** data local do dia, AAAA-MM-DD */
  data: string;
  tipo: "estudo" | "revisao";
  itens: ItemPlano[];
  minutos: number;
};

export type PlanoEstudos = {
  /** dias corridos até a prova, contando hoje (null = prova sem data) */
  diasRestantes: number | null;
  dias: DiaPlano[];
  /** a prova já passou ou o prazo é curto demais para o ritmo normal */
  prazoCurto: boolean;
  /** plano de 35 dias usado quando a apostila não tem data de prova */
  semData: boolean;
};

/** Duração padrão do plano quando não há data de prova cadastrada. */
export const DIAS_PLANO_PADRAO = 35;

const MS_DIA = 86_400_000;

export function hojeEmSaoPaulo(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

function utc(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

function somarDias(iso: string, n: number): string {
  return new Date(utc(iso) + n * MS_DIA).toISOString().slice(0, 10);
}

/** Minutos de estudo estimados de um capítulo, a partir do tamanho do texto (ritmo de estudo, não de leitura corrida). */
export function minutosDoCapitulo(textoLen: number): number {
  return Math.max(15, Math.round(textoLen / 350 / 5) * 5);
}

/** Quantos dias finais ficam para revisão e simulado, conforme o prazo. */
function diasDeRevisao(diasUteis: number): number {
  if (diasUteis >= 21) return Math.min(5, Math.round(diasUteis * 0.12));
  if (diasUteis >= 10) return 2;
  if (diasUteis >= 5) return 1;
  return 0;
}

/**
 * Monta o plano. `pendentes` são os itens ainda não concluídos, na ordem da apostila:
 * como só eles entram, atrasar um dia faz o plano se recalcular sozinho.
 */
export function montarPlano(pendentes: ItemPlano[], dataProva: string | null, hoje: string): PlanoEstudos {
  const semData = !dataProva;
  const diasRestantes = dataProva ? Math.round((utc(dataProva.slice(0, 10)) - utc(hoje)) / MS_DIA) + 1 : null;
  // sem data: janela padrão; com a prova já passada: tudo em um dia só
  const janela = semData ? DIAS_PLANO_PADRAO : Math.max(diasRestantes ?? 1, 1);
  const prazoCurto = !semData && (diasRestantes ?? 0) < 7;

  const revisao = semData ? 0 : diasDeRevisao(janela);
  const diasEstudo = Math.max(janela - revisao, 1);

  const total = pendentes.reduce((s, i) => s + i.minutos, 0);
  const alvoPorDia = total / diasEstudo;

  const dias: DiaPlano[] = [];
  if (pendentes.length <= diasEstudo) {
    // poucos itens para muitos dias: um item por vez, espaçados, e os dias vagos ficam para praticar
    const porDia: ItemPlano[][] = Array.from({ length: diasEstudo }, () => []);
    pendentes.forEach((item, i) => porDia[Math.floor((i * diasEstudo) / pendentes.length)].push(item));
    porDia.forEach((itens, d) =>
      dias.push({ data: somarDias(hoje, d), tipo: "estudo", itens, minutos: itens.reduce((s, i) => s + i.minutos, 0) })
    );
  } else {
    let idx = 0;
    let acumulado = 0;
    for (let d = 0; d < diasEstudo; d++) {
      const limite = alvoPorDia * (d + 1);
      const itens: ItemPlano[] = [];
      const ultimo = d === diasEstudo - 1;
      // o último dia de estudo leva o que sobrar; nos demais, enche até a meta do dia (ao menos um item)
      while (idx < pendentes.length && (ultimo || itens.length === 0 || acumulado + pendentes[idx].minutos / 2 <= limite)) {
        itens.push(pendentes[idx]);
        acumulado += pendentes[idx].minutos;
        idx++;
      }
      dias.push({ data: somarDias(hoje, d), tipo: "estudo", itens, minutos: itens.reduce((s, i) => s + i.minutos, 0) });
    }
  }
  for (let r = 0; r < revisao; r++) {
    dias.push({ data: somarDias(hoje, diasEstudo + r), tipo: "revisao", itens: [], minutos: 0 });
  }

  return { diasRestantes, dias, prazoCurto, semData };
}
