import Image from "next/image";

export function Logo({
  tamanho = 32,
  comTexto = true,
  className = "",
  textoClassName = "text-blue-400",
}: {
  tamanho?: number;
  comTexto?: boolean;
  className?: string;
  textoClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Sibrap"
        width={tamanho}
        height={tamanho}
        className="rounded-full"
        priority
      />
      {comTexto && (
        <span className={`text-lg font-bold tracking-tight ${textoClassName}`}>
          sibrap
        </span>
      )}
    </span>
  );
}
