// Rolagem suave para âncoras da mesma página (Wagner, 23/11/2026: a rolagem nativa no celular
// era rápida e brusca). Começa e termina devagar (ease-in-out), com duração proporcional à
// distância (0,7 s a 1,3 s). Respeita "reduzir movimento" e o scroll-margin-top do destino.
export function rolarSuave(alvo: HTMLElement | null, topo = false) {
  const inicio = window.scrollY;
  const margem = alvo ? parseFloat(getComputedStyle(alvo).scrollMarginTop) || 0 : 0;
  const destino = topo || !alvo ? 0 : alvo.getBoundingClientRect().top + inicio - margem;
  const distancia = destino - inicio;
  if (Math.abs(distancia) < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: destino, behavior: "instant" });
    return;
  }
  const duracao = Math.min(1300, Math.max(700, Math.abs(distancia) / 4));
  const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const t0 = performance.now();
  let cancelado = false;
  const cancelar = () => (cancelado = true);
  // se a pessoa tocar/rolar no meio, a animação para e ela assume
  window.addEventListener("wheel", cancelar, { once: true, passive: true });
  window.addEventListener("touchstart", cancelar, { once: true, passive: true });
  const passo = (agora: number) => {
    if (cancelado) return;
    const p = Math.min(1, (agora - t0) / duracao);
    window.scrollTo({ top: inicio + distancia * suave(p), behavior: "instant" });
    if (p < 1) requestAnimationFrame(passo);
    else {
      window.removeEventListener("wheel", cancelar);
      window.removeEventListener("touchstart", cancelar);
    }
  };
  requestAnimationFrame(passo);
}
