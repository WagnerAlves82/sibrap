// Regras de senha do site (o Supabase só exige 6 caracteres e a checagem de
// senhas vazadas depende de plano pago). Segue a linha do NIST 800-63B:
// tamanho mínimo, sem senhas óbvias, sem exigir símbolos.

const COMUNS = new Set([
  "12345678", "123456789", "1234567890", "12345678910", "87654321", "11111111", "00000000",
  "password", "password1", "password123", "senha123", "senha1234", "senha12345", "minhasenha",
  "qwerty123", "qwertyuiop", "qwerty12", "abc12345", "abcd1234", "iloveyou", "admin123",
  "brasil123", "brasil2026", "brasileiro", "corinthians", "flamengo1", "flamengo123",
  "palmeiras", "saopaulo1", "gremio123", "internacional", "mudar123", "concurso123",
  "sibrap123", "sibrap2026", "estudar123", "aprovado123", "123mudar", "1q2w3e4r", "1qaz2wsx",
]);

export const SENHA_MINIMA = 8;

export function validarSenha(senha: string, email = ""): string | null {
  if (senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (senha.length > 72) return "A senha pode ter no máximo 72 caracteres.";
  const minuscula = senha.toLowerCase();
  const usuario = email.split("@")[0]?.toLowerCase();
  if (COMUNS.has(minuscula) || /^(.)\1+$/.test(senha) || (usuario && usuario.length >= 4 && minuscula.includes(usuario))) {
    return "Essa senha é fácil de adivinhar. Escolha outra, misturando letras e números.";
  }
  if (/^\d+$/.test(senha)) return "Use também letras na senha, não só números.";
  return null;
}
