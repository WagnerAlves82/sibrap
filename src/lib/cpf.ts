// Validação e formatação de CPF — sem dependências externas.

export function normalizarCpf(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(valor: string): string {
  const d = normalizarCpf(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// Algoritmo padrão dos dígitos verificadores do CPF.
export function cpfValido(valor: string): boolean {
  const d = normalizarCpf(valor);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // todos os dígitos iguais

  const digitos = d.split("").map(Number);
  for (const posicao of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < posicao; i++) soma += digitos[i] * (posicao + 1 - i);
    const resto = (soma * 10) % 11;
    const dv = resto === 10 ? 0 : resto;
    if (dv !== digitos[posicao]) return false;
  }
  return true;
}
