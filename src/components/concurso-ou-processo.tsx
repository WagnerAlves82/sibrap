// Explica a diferença que aparece em toda notícia do site.
export function ConcursoOuProcesso({ className = "mb-8" }: { className?: string }) {
  return (
    <aside className={`grid gap-px border border-[#D7DEE6] bg-[#D7DEE6] text-[14px] leading-relaxed text-[#33465E] sm:grid-cols-2 ${className}`}>
      <div className="bg-white p-4">
        <p className="font-display text-[15px] font-bold text-[#14213A]">Concurso público</p>
        <p className="mt-1">
          Abertura de vagas para <strong>cargos efetivos</strong>: a pessoa aprovada é nomeada
          e passa a integrar o quadro permanente do órgão.
        </p>
      </div>
      <div className="bg-white p-4">
        <p className="font-display text-[15px] font-bold text-[#14213A]">Processo seletivo</p>
        <p className="mt-1">
          Seleção para <strong>contratação temporária</strong> (por prazo determinado), em
          geral para cobrir uma necessidade específica do órgão.
        </p>
      </div>
    </aside>
  );
}

// Nota curta no topo da notícia, conforme o tipo de certame informado no post.
export function NotaCertame({ tipo }: { tipo: string | null }) {
  const t = (tipo ?? "").toLowerCase();
  const processo = t.includes("seletivo");
  const concurso = t.includes("concurso");
  if (!processo && !concurso) return null;
  return (
    <p className="mt-4 border-l-[3px] border-accent bg-[#F6F8FB] px-4 py-3 text-[14px] leading-relaxed text-[#33465E]">
      {processo ? (
        <>
          <strong className="text-[#14213A]">Processo seletivo</strong> é a seleção para{" "}
          <strong>contratação temporária</strong> (por prazo determinado), diferente do concurso público,
          que abre vagas para cargos efetivos.
        </>
      ) : (
        <>
          <strong className="text-[#14213A]">Concurso público</strong> é a abertura de vagas para{" "}
          <strong>cargos efetivos</strong>, com nomeação para o quadro permanente. Já o processo seletivo
          serve para contratações temporárias.
        </>
      )}
    </p>
  );
}
