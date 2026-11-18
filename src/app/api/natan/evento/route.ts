// Registro anônimo das conversas do Natan (perfil escolhido, cursos sugeridos e cliques), sem nome, e-mail ou IP.
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { dentroDoLimite, identificarCliente } from "@/lib/limite";

const TIPOS = new Set(["abriu", "perfil", "clique-curso", "clique-apostila", "aluno", "whatsapp", "cadastro"]);
const curto = (v: unknown, n = 80) => (typeof v === "string" ? v.slice(0, n) : null);

export async function POST(req: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }
  const tipo = curto(corpo.tipo, 30);
  if (!tipo || !TIPOS.has(tipo)) return new Response(null, { status: 400 });
  if (!(await dentroDoLimite(`natan:${await identificarCliente()}`, 60, 3600))) return new Response(null, { status: 429 });

  const p = (corpo.perfil ?? {}) as Record<string, unknown>;
  const perfil = { objetivo: curto(p.objetivo, 30), area: curto(p.area, 60), idade: curto(p.idade, 30), experiencia: curto(p.experiencia, 30) };
  const admin = criarClienteSupabaseAdmin() as unknown as SupabaseClient;
  await admin.from("natan_eventos").insert({ tipo, perfil, alvo: curto(corpo.alvo, 120), pagina: curto(corpo.pagina, 120) });
  return new Response(null, { status: 204 });
}
