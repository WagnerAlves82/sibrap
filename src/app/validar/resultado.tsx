import { criarClienteSupabaseServer } from "@/lib/supabase-server";
import { EMISSOR } from "@/lib/emissor";

export async function ResultadoValidacao({ codigo }: { codigo: string }) {
  const supabase = await criarClienteSupabaseServer();
  const { data } = await supabase.rpc("validar_certificado", { p_codigo: codigo });
  const cert = data?.[0];

  if (!cert) {
    return (
      <div className="rounded-xl border border-[#E8B4B4] bg-[#FBEDED] p-6">
        <p className="font-display text-xl font-extrabold text-[#8A1F1F]">
          Certificado não encontrado
        </p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-[#8A1F1F]">
          Não existe certificado com o código <strong>{codigo}</strong>.
          Confira se o código foi digitado corretamente (ex.: SIB-A1B2-C3D4-E5F6).
        </p>
      </div>
    );
  }

  const data_emissao = new Date(cert.emitido_em).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <div className="rounded-xl border-2 border-accent-2 bg-white p-6 sm:p-8">
      <p className="flex items-center gap-2 font-data text-xs font-semibold uppercase tracking-wide text-accent-2">
        <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-2 text-[11px] text-white">
          ✓
        </span>
        Certificado válido
      </p>
      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome" valor={cert.nome_completo} destaque />
        <Campo rotulo="Curso" valor={cert.curso_nome} />
        <Campo rotulo="Carga horária" valor={`${cert.carga_horaria_horas} horas`} />
        <Campo rotulo="Emitido em" valor={data_emissao} />
        <Campo rotulo="Código" valor={codigo.toUpperCase()} mono />
        <Campo rotulo="Emitido por" valor={`${EMISSOR.nome} · CNPJ ${EMISSOR.cnpj}`} />
      </dl>
    </div>
  );
}

function Campo({
  rotulo,
  valor,
  destaque,
  mono,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={destaque ? "sm:col-span-2" : ""}>
      <dt className="text-[12px] uppercase tracking-wide text-[#93A0AF]">{rotulo}</dt>
      <dd
        className={`mt-0.5 text-[#14213A] ${destaque ? "font-display text-2xl font-extrabold" : "text-[15px] font-semibold"} ${mono ? "font-data" : ""}`}
      >
        {valor}
      </dd>
    </div>
  );
}
