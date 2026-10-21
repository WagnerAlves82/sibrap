// Backup do Supabase do SIBRAP: todas as tabelas do schema public (JSON), a lista de usuários (auth)
// e os arquivos dos buckets de Storage. Só LÊ; não altera nada no banco.
// Uso (na pasta C:\sibrap):  node scripts/backup-supabase.mjs
// Saída: C:\sibrap\backups\sibrap-backup-AAAA-MM-DD\  e o .zip ao lado, pronto para subir no Google Drive.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const raiz = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(raiz, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const chave = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local");
const sb = createClient(url, chave, { auth: { persistSession: false } });

const dia = new Date().toISOString().slice(0, 10);
const nome = `sibrap-backup-${dia}`;
const destino = path.join(raiz, "backups", nome);
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(path.join(destino, "tabelas"), { recursive: true });
fs.mkdirSync(path.join(destino, "storage"), { recursive: true });

const resumo = { data: new Date().toISOString(), tabelas: {}, usuarios: 0, storage: {}, erros: [] };

// 1) tabelas: a API REST publica a lista delas (OpenAPI)
const spec = await fetch(`${url}/rest/v1/`, { headers: { apikey: chave, Authorization: `Bearer ${chave}` } }).then((r) => r.json());
const tabelas = Object.keys(spec.paths ?? {})
  .filter((p) => p !== "/" && !p.startsWith("/rpc/"))
  .map((p) => p.slice(1));

for (const t of tabelas) {
  const linhas = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from(t).select("*").range(de, de + 999);
    if (error) {
      resumo.erros.push(`tabela ${t}: ${error.message}`);
      break;
    }
    linhas.push(...data);
    if (data.length < 1000) break;
  }
  fs.writeFileSync(path.join(destino, "tabelas", `${t}.json`), JSON.stringify(linhas));
  resumo.tabelas[t] = linhas.length;
}

// 2) usuários (e-mail, metadados, datas; senhas não são exportáveis pela API)
const usuarios = [];
for (let pagina = 1; ; pagina++) {
  const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 200 });
  if (error) {
    resumo.erros.push(`auth: ${error.message}`);
    break;
  }
  usuarios.push(...data.users);
  if (data.users.length < 200) break;
}
fs.writeFileSync(path.join(destino, "auth_usuarios.json"), JSON.stringify(usuarios, null, 1));
resumo.usuarios = usuarios.length;

// 3) Storage: todos os arquivos de todos os buckets
async function listar(bucket, prefixo = "") {
  const arquivos = [];
  for (let de = 0; ; de += 100) {
    const { data, error } = await sb.storage.from(bucket).list(prefixo, { limit: 100, offset: de });
    if (error) throw new Error(error.message);
    for (const item of data) {
      const caminho = prefixo ? `${prefixo}/${item.name}` : item.name;
      if (item.id) arquivos.push(caminho);
      else arquivos.push(...(await listar(bucket, caminho)));
    }
    if (data.length < 100) break;
  }
  return arquivos;
}
const { data: buckets, error: erroBuckets } = await sb.storage.listBuckets();
if (erroBuckets) resumo.erros.push(`buckets: ${erroBuckets.message}`);
for (const b of buckets ?? []) {
  let n = 0;
  try {
    for (const caminho of await listar(b.name)) {
      const { data, error } = await sb.storage.from(b.name).download(caminho);
      if (error) {
        resumo.erros.push(`storage ${b.name}/${caminho}: ${error.message}`);
        continue;
      }
      const saida = path.join(destino, "storage", b.name, caminho);
      fs.mkdirSync(path.dirname(saida), { recursive: true });
      fs.writeFileSync(saida, Buffer.from(await data.arrayBuffer()));
      n++;
    }
  } catch (e) {
    resumo.erros.push(`bucket ${b.name}: ${e.message}`);
  }
  resumo.storage[b.name] = n;
}

fs.writeFileSync(path.join(destino, "RESUMO.json"), JSON.stringify(resumo, null, 1));

// 4) zip (PowerShell nativo)
const zip = `${destino}.zip`;
fs.rmSync(zip, { force: true });
execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${destino}\\*' -DestinationPath '${zip}' -CompressionLevel Optimal`], { stdio: "inherit" });

console.log("Tabelas:", Object.keys(resumo.tabelas).length, "| linhas:", Object.values(resumo.tabelas).reduce((a, b) => a + b, 0));
console.log("Usuários:", resumo.usuarios, "| arquivos no Storage:", JSON.stringify(resumo.storage));
console.log("Erros:", resumo.erros.length ? resumo.erros : "nenhum");
console.log("ZIP:", zip, (fs.statSync(zip).size / 1048576).toFixed(1) + " MB");
