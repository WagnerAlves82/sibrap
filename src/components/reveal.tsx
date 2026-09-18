"use client";

import { useEffect, useRef, useState } from "react";

// Entrada suave ao rolar a página (fade + subida). Só CSS + um
// IntersectionObserver — leve pra celular simples. Respeita
// prefers-reduced-motion e, sem JavaScript, o conteúdo aparece normal
// (regra `.reveal` no <noscript> do layout).
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setVisivel(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal transition duration-700 ease-out motion-reduce:transition-none ${
        visivel ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Barra de progresso que "enche" de 0 até o valor atual ao aparecer.
export function BarraProgresso({
  percentual,
  className = "",
}: {
  percentual: number;
  className?: string;
}) {
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLargura(percentual));
    return () => cancelAnimationFrame(id);
  }, [percentual]);

  return (
    <div
      className={`h-2.5 overflow-hidden rounded-full bg-[#D7DEE6] ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(percentual)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out motion-reduce:transition-none"
        style={{ width: `${largura}%` }}
      />
    </div>
  );
}
