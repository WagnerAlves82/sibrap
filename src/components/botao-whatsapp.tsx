"use client";

import { usePathname } from "next/navigation";
import { WHATSAPP_NUMERO } from "@/lib/emissor";

// Botão fixo "Posso ajudar?" que abre uma conversa no WhatsApp. Fica fora das
// áreas logada e administrativa e sobe um pouco nas páginas de apostila (celular),
// para não ficar em cima da barra de compra.
export function BotaoWhatsApp() {
  const caminho = usePathname() ?? "";
  if (!WHATSAPP_NUMERO) return null;
  if (caminho.startsWith("/admin") || caminho.startsWith("/minha-area") || caminho.startsWith("/certificado")) return null;

  const texto = encodeURIComponent("Olá! Vim pelo site da SIBRAP e preciso de ajuda.");
  const comBarraDeCompra = caminho.startsWith("/apostilas/");

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMERO}?text=${texto}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Posso ajudar? Falar no WhatsApp"
      className={`group fixed right-3 z-50 flex items-center gap-2 rounded-full bg-[#25D366] py-2 pl-2 pr-4 text-[13.5px] font-extrabold text-white shadow-[0_14px_30px_-10px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5 hover:brightness-105 sm:right-5 sm:bottom-5 ${
        comBarraDeCompra ? "bottom-20" : "bottom-4"
      }`}
    >
      <span className="icone-balanca flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#25D366]">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden>
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z" />
        </svg>
      </span>
      <span>Posso ajudar?</span>
    </a>
  );
}
