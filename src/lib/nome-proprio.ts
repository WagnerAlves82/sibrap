// Ajusta maiúsculas de nome de pessoa para o certificado (Wagner, 18/11/2026: aluno recebeu certificado
// com "Tiago francisco dos santos"). "TIAGO FRANCISCO DOS SANTOS" → "Tiago Francisco dos Santos".
// Partículas (da, de, do, das, dos, e) ficam em minúscula, exceto no começo; algarismos romanos em maiúscula.

const PARTICULAS = new Set(["da", "de", "do", "das", "dos", "e", "di", "du", "del", "van", "von"]);
const ROMANO = /^(i{1,3}|iv|v|vi{1,3}|ix|x)$/;

function capitalizar(palavra: string): string {
  // trata nomes compostos com hífen ou apóstrofo: Ana-Maria, D'Ávila
  return palavra
    .split(/([-'’])/)
    .map((p) => (p.length && !/[-'’]/.test(p) ? p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1) : p))
    .join("");
}

export function nomeProprio(entrada: string): string {
  const palavras = entrada.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR").split(" ").filter(Boolean);
  return palavras
    .map((p, i) => {
      if (ROMANO.test(p) && i > 0) return p.toUpperCase();
      if (i > 0 && PARTICULAS.has(p)) return p;
      return capitalizar(p);
    })
    .join(" ");
}
