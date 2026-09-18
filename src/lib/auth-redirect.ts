// Só aceita caminhos internos do próprio site em parâmetros `next`
// (evita redirecionamento aberto pra outro domínio).
export function caminhoSeguro(valor: unknown, padrao: string): string {
  if (typeof valor !== "string") return padrao;
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) {
    return padrao;
  }
  return valor;
}

export function veioDeCurso(next: string): boolean {
  return next.startsWith("/minha-area/cursos");
}
