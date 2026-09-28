// src/lib/vigia.ts
//
// Vigia da conta de pagamentos (AbacatePay). Roda de fora do site (GitHub
// Actions, de hora em hora) e confere:
//  1. a chave configurada pertence à SUA loja (id esperado guardado fora da
//     Vercel — quem troca a chave lá para desviar pagamentos é pego aqui);
//  2. a chave continua aceita pelo AbacatePay;
//  3. o saldo disponível não caiu sem você saber (saque);
//  4. os pagamentos continuam sendo confirmados (webhook/conta desviados).
// Ao achar algo crítico, PAUSA AS VENDAS (o site segue no ar) e avisa por
// e-mail. Não trava o app inteiro: um alarme falso não pode te derrubar.

import { criarClienteSupabaseAdmin } from "@/lib/supabase-admin";
import { abacatePayAtivo } from "@/lib/abacatepay";
import { enviarAlertaAdmin, esc } from "@/lib/resend";

const db = () => criarClienteSupabaseAdmin();
const REPETIR_ALERTA_MS = 6 * 60 * 60 * 1000;
const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sibrap.tec.br";
const reais = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ---------- pausa de vendas ----------

let cachePausa: { valor: { pausada: boolean; motivo: string | null }; ate: number } | null = null;

export async function vendasPausadas(): Promise<{ pausada: boolean; motivo: string | null }> {
  if (cachePausa && cachePausa.ate > Date.now()) return cachePausa.valor;
  try {
    const { data } = await db()
      .from("admin_config")
      .select("vendas_pausadas, vendas_pausadas_motivo")
      .eq("id", true)
      .maybeSingle();
    const valor = { pausada: !!data?.vendas_pausadas, motivo: data?.vendas_pausadas_motivo ?? null };
    cachePausa = { valor, ate: Date.now() + 5_000 };
    return valor;
  } catch {
    return { pausada: false, motivo: null }; // sem banco a venda também não acontece
  }
}

export async function pausarVendas(motivo: string): Promise<void> {
  await db()
    .from("admin_config")
    .update({ vendas_pausadas: true, vendas_pausadas_motivo: motivo.slice(0, 500), vendas_pausadas_em: new Date().toISOString() })
    .eq("id", true);
  cachePausa = null;
}

export async function reativarVendas(): Promise<void> {
  await db()
    .from("admin_config")
    .update({ vendas_pausadas: false, vendas_pausadas_motivo: null, vendas_pausadas_em: null, vigia_falhas_seguidas: 0 })
    .eq("id", true);
  cachePausa = null;
}

// ---------- consulta à loja ----------

type Loja = { id: string; name: string; balance: { available: number; pending: number; blocked: number } };
type LeituraLoja = { loja: Loja } | { recusada: true; status: number } | { indisponivel: true; motivo: string };

async function lerLoja(): Promise<LeituraLoja> {
  const chave = process.env.ABACATEPAY_API_KEY;
  if (!chave) return { recusada: true, status: 0 };
  try {
    const r = await fetch("https://api.abacatepay.com/v2/stores/get", {
      headers: { Authorization: `Bearer ${chave}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const corpo = (await r.json().catch(() => null)) as { success?: boolean; data?: Loja } | null;
    if (r.status === 401 || r.status === 403) return { recusada: true, status: r.status };
    if (!r.ok || !corpo?.success || !corpo.data?.id) return { indisponivel: true, motivo: `HTTP ${r.status}` };
    return { loja: corpo.data };
  } catch (e) {
    return { indisponivel: true, motivo: e instanceof Error ? e.name : "erro" };
  }
}

/** Só descobre qual loja a chave do site enxerga (sem alertar nem pausar). */
export async function descobrirLoja(): Promise<{ lojaId: string; nome: string } | { erro: string }> {
  const leitura = await lerLoja();
  if ("loja" in leitura) return { lojaId: leitura.loja.id, nome: leitura.loja.name };
  return { erro: "recusada" in leitura ? "chave recusada" : leitura.motivo };
}

// ---------- verificação ----------

export type ResultadoVigia = {
  ok: boolean;
  lojaId: string | null;
  pausada: boolean;
  criticos: string[];
  avisos: string[];
};

export async function executarVigia(lojaEsperada: string): Promise<ResultadoVigia> {
  const criticos: string[] = [];
  const avisos: string[] = [];
  let alertaUnico = false;

  const { data: cfg } = await db().from("admin_config").select("*").eq("id", true).maybeSingle();
  const agora = Date.now();

  if (!abacatePayAtivo()) {
    await db().from("admin_config").update({ vigia_ultimo_ok: new Date().toISOString() }).eq("id", true);
    return { ok: true, lojaId: null, pausada: !!cfg?.vendas_pausadas, criticos, avisos: ["AbacatePay não está ativo neste ambiente (gateway em uso: Mercado Pago)."] };
  }

  const leitura = await lerLoja();
  let lojaId: string | null = null;
  let falhas = cfg?.vigia_falhas_seguidas ?? 0;
  let saldoNovo: number | null = cfg?.vigia_saldo_disponivel ?? null;

  if ("recusada" in leitura) {
    criticos.push(
      `O AbacatePay RECUSOU a chave usada pelo site (HTTP ${leitura.status || "sem chave"}): ela foi revogada, trocada ou removida. Os PIX não estão sendo gerados.`
    );
  } else if ("indisponivel" in leitura) {
    falhas += 1;
    avisos.push(`Não foi possível consultar o AbacatePay (${leitura.motivo}). Falhas seguidas: ${falhas}.`);
    if (falhas >= 3) criticos.push("O AbacatePay ficou inacessível por 3 verificações seguidas (3 horas ou mais).");
  } else {
    falhas = 0;
    lojaId = leitura.loja.id;

    if (lojaId !== lojaEsperada) {
      criticos.push(
        `A chave do site pertence a OUTRA loja do AbacatePay. Esperado: ${esc(lojaEsperada)} · encontrado: ${esc(lojaId)} (${esc(leitura.loja.name)}). Os pagamentos podem estar caindo em outra conta.`
      );
    }

    const disponivel = leitura.loja.balance.available;
    if (saldoNovo !== null && disponivel < saldoNovo) {
      avisos.push(
        `O saldo disponível caiu de ${reais(saldoNovo)} para ${reais(disponivel)}. Se você não fez um saque, revogue a chave agora.`
      );
      alertaUnico = true;
    }
    saldoNovo = disponivel;
  }

  // pagamentos que não estão sendo confirmados (webhook parado ou dinheiro desviado)
  const vinteMin = new Date(agora - 20 * 60_000).toISOString();
  const umDia = new Date(agora - 24 * 3600_000).toISOString();
  const [{ count: pendentes }, { count: pagos }] = await Promise.all([
    db().from("pedidos").select("id", { count: "exact", head: true }).eq("gateway", "abacatepay").eq("status", "pendente").lt("criado_em", vinteMin).gt("criado_em", umDia),
    db().from("pedidos").select("id", { count: "exact", head: true }).eq("gateway", "abacatepay").eq("status", "aprovado").gt("atualizado_em", umDia),
  ]);
  if ((pendentes ?? 0) >= 3 && (pagos ?? 0) === 0) {
    avisos.push(
      `${pendentes} PIX gerados nas últimas 24 h e nenhum confirmado. Verifique o webhook e se os pagamentos estão entrando na sua conta.`
    );
  }

  // pausa de vendas em caso crítico (a reativação é manual, com biometria)
  const jaPausada = !!cfg?.vendas_pausadas;
  if (criticos.length && !jaPausada) {
    await pausarVendas(criticos[0].replace(/<[^>]*>/g, "").slice(0, 300));
  }

  const ultimoAlerta = cfg?.vigia_ultimo_alerta_em ? new Date(cfg.vigia_ultimo_alerta_em).getTime() : 0;
  const novoCritico = criticos.length > 0 && !jaPausada;
  const decorreu = agora - ultimoAlerta > REPETIR_ALERTA_MS;
  const enviar = novoCritico || alertaUnico || ((criticos.length > 0 || avisos.length > 0) && decorreu);

  if (enviar) {
    const itens = [...criticos.map((c) => `<li><strong style="color:#B42318;">CRÍTICO:</strong> ${c}</li>`), ...avisos.map((a) => `<li>${a}</li>`)].join("");
    await enviarAlertaAdmin({
      assunto: criticos.length ? "ALERTA CRÍTICO: vigia da conta de pagamentos do SIBRAP" : "Aviso do vigia da conta de pagamentos do SIBRAP",
      titulo: criticos.length ? "Vendas pausadas por segurança" : "Aviso do vigia",
      corpoHtml: `<ul style="margin:0 0 12px 18px;padding:0;">${itens}</ul>
${criticos.length ? `<p style="margin:0 0 8px 0;"><strong>O que fazer agora:</strong></p><ol style="margin:0 0 12px 18px;padding:0;"><li>Entre no painel do AbacatePay e <strong>revogue a chave de API</strong>; gere outra.</li><li>Troque a chave na Vercel, e também o segredo do webhook, e faça redeploy.</li><li>Confira o extrato do AbacatePay e o histórico de deploys da Vercel e commits do GitHub.</li><li>Só depois reative as vendas em Painel &rarr; Segurança (exige biometria).</li></ol>` : ""}`,
      botao: { texto: "Abrir a segurança do painel &rarr;", url: `${siteUrl()}/admin/seguranca` },
    }).catch(() => undefined);
  }

  await db()
    .from("admin_config")
    .update({
      vigia_falhas_seguidas: falhas,
      vigia_saldo_disponivel: saldoNovo,
      vigia_ultima_loja: lojaId ?? cfg?.vigia_ultima_loja ?? null,
      ...(criticos.length === 0 ? { vigia_ultimo_ok: new Date().toISOString() } : {}),
      ...(enviar ? { vigia_ultimo_alerta_em: new Date().toISOString() } : {}),
    })
    .eq("id", true);

  return { ok: criticos.length === 0, lojaId, pausada: jaPausada || criticos.length > 0, criticos: criticos.map((c) => c.replace(/<[^>]*>/g, "")), avisos };
}

/** Confere se o próprio vigia continua rodando (chamado uma vez por dia pelo cron da Vercel). */
export async function conferirBatidaDoVigia(): Promise<{ parado: boolean; horas: number | null }> {
  const { data: cfg } = await db().from("admin_config").select("vigia_ultimo_ok, vigia_ultimo_alerta_em").eq("id", true).maybeSingle();
  const ultimo = cfg?.vigia_ultimo_ok ? new Date(cfg.vigia_ultimo_ok).getTime() : null;
  const horas = ultimo ? (Date.now() - ultimo) / 3600_000 : null;
  const parado = horas === null || horas > 6;
  if (parado && abacatePayAtivo()) {
    await enviarAlertaAdmin({
      assunto: "O vigia da conta de pagamentos do SIBRAP parou",
      titulo: "Vigia sem resposta",
      corpoHtml: `<p style="margin:0 0 12px 0;">${horas === null ? "O vigia nunca registrou uma verificação bem-sucedida." : `A última verificação bem-sucedida foi há ${Math.floor(horas)} horas.`} Ele deveria rodar de hora em hora.</p>
<p style="margin:0;">Confira a aba <strong>Actions</strong> do repositório no GitHub (o workflow pode ter sido desativado ou estar falhando) e os secrets <code>VIGIA_SECRET</code> e a variável <code>ABACATEPAY_LOJA_ESPERADA</code>.</p>`,
      botao: { texto: "Abrir a segurança do painel &rarr;", url: `${siteUrl()}/admin/seguranca` },
    }).catch(() => undefined);
  }
  return { parado, horas };
}
