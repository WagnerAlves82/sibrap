import "bootstrap-icons/font/bootstrap-icons.min.css";
import { EMOJI_ICONE } from "@/lib/emoji-icones";

// Emojis das aulas viram ícones do Bootstrap Icons (Wagner, 20/11/2026): mesmo tamanho do emoji
// (o ícone herda o font-size), com cores alegres da paleta do SIBRAP alternando pela posição.
// A tabela emoji -> ícone é gerada por scripts/emoji-icones-mapa.py.

export const CORES_ICONE = ["#0149AF", "#0E7C6B", "#D9930F", "#7048E8"] as const;

const FALLBACK = "check2-circle";

export function nomeIcone(emoji: string): string {
  const chave = emoji.replace(/️|⃣/g, "").trim();
  return EMOJI_ICONE[chave] ?? EMOJI_ICONE[[...chave][0] ?? ""] ?? FALLBACK;
}

type Props = {
  /** o emoji original (ex.: "🎯") ou, direto, o nome do ícone com prefixo "bi:" (ex.: "bi:trophy-fill") */
  emoji: string;
  /** posição na lista, para alternar a cor */
  indice?: number;
  /** cor fixa; sem ela, alterna pela paleta */
  cor?: string;
  className?: string;
  rotulo?: string;
};

export function IconeEmoji({ emoji, indice = 0, cor, className = "", rotulo }: Props) {
  const nome = emoji.startsWith("bi:") ? emoji.slice(3) : nomeIcone(emoji);
  return (
    <i
      className={`bi bi-${nome} inline-block leading-none ${className}`}
      style={{ color: cor ?? CORES_ICONE[indice % CORES_ICONE.length] }}
      aria-hidden={rotulo ? undefined : true}
      aria-label={rotulo}
      role={rotulo ? "img" : undefined}
    />
  );
}
