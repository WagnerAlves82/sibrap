# Plano de divulgação: Google Ads (Display dinâmico) + SEO orgânico

## 1. Campanha: marca + produtos (Display / Performance Max)
- **Orçamento:** R$ 15,00/dia × 15 dias = **R$ 225,00 no total**. Renovação só com aprovação do dono.
- **Feed dinâmico:** `https://sibrap.tec.br/feed/google-ads.csv` (atualiza a cada hora). Traz imagem, título, preço cheio (`price`), preço final (`sale_price`) e UF. Importar em Google Ads → Ferramentas → Feeds de dados comerciais (ou Merchant Center, se a conta aceitar produtos digitais).
- **Formato:** Anúncio Display responsivo + remarketing dinâmico. O Google monta o "de/por" e a foto da apostila a partir do feed.
- **Animação:** Google Ads **não aceita JavaScript próprio** em anúncio. Para movimento (selo pulsando, preço riscado), usar banner HTML5 feito no Google Web Designer (ZIP), ou vídeo curto.
- **Públicos:** remarketing de quem viu apostilas e não comprou; afinidade "Concurseiros / Educação"; palavras-chave de intenção (ex.: "concurso prefeitura [cidade]").
- **Conversão:** importar `purchase` e `sign_up` do GA4. Otimizar por `purchase`.

### Textos (limites do Google: título 30, título longo 90, descrição 90)
Títulos (≤30):
- `Confirmado: estude pro edital`
- `Questões no estilo da banca`
- `Apostila do seu cargo`
- `Simulado online incluso`
- `Concurso [Órgão]: apostila`
Títulos longos (≤90):
- `Confirmado o concurso? Estude com questões no estilo da banca e aumente sua nota`
- `Apostila focada no seu edital, com simulado online e questões comentadas`
Descrições (≤90):
- `Questões comentadas no estilo da banca. Pagamento único, sem mensalidade.`
- `Veja o preço de lançamento. Apostila + simulado do seu cargo.`

### Ajustes de conformidade (importante)
- **"Questões da própria banca"**: o material tem questões **originais no estilo da banca**, e o site declara não ter vínculo com bancas. Dizer "da própria banca" é propaganda enganosa e pode reprovar o anúncio. Usar **"no estilo da banca"**.
- **"Aumenta sua nota para aprovação"**: não prometer aprovação nem resultado. Usar "para treinar", "ajuda a estudar". Promessa de aprovação é reprovada pelas políticas do Google e fere o CDC.
- **"Confirmado"**: só usar quando o edital/concurso estiver de fato confirmado. Incluir o nome do órgão.
- **Preço "de/por"**: o preço anterior precisa ter sido praticado de verdade (vem de `preco_original_centavos`).

## 2. Conteúdo: 10 posts por dia
- Hoje não há gerador automático no repositório; os posts entram pelo admin/banco.
- Proposta: rotina diária (agendada) que pesquisa editais novos por estado, grava os posts como **rascunho** e você aprova em lote. Publicar direto sem revisão arrisca erro de data/vaga e conteúdo de baixa qualidade (o Google penaliza em massa).
- Cada post: estado (UF), órgão, banca, ano no título; link do edital; apostila relacionada.

## 3. Já feito no site
- Blog por **estado** (chips por UF, com contagem), do mais atual pro mais antigo.
- Propaganda orgânica no blog: faixa "de/por" com selo de desconto **a cada 6 matérias** e **no meio de cada post**, com UTM `utm_medium=organico`.
- Canonical por página (home, blog, post, apostilas), metadados de artigo, JSON-LD (Article, BreadcrumbList, Product).

## 4. Análise de SEO e melhorias
Pontos fortes: sitemap dinâmico, robots, `llms.txt`, JSON-LD de Product/Article, OG/Twitter.
Melhorias recomendadas (ordem de impacto):
1. **Páginas por estado e por órgão** (`/concursos/sp`, `/concursos/prefeitura-x`) com lista de posts + apostilas. É onde a busca "concurso [cidade/estado]" cai.
2. **Search Console + Bing Webmaster**: enviar sitemap, acompanhar consultas e cobertura.
3. **Home com `Organization` + `WebSite` (JSON-LD)** e logo para o painel de conhecimento.
4. **FAQ (FAQPage JSON-LD)** nas apostilas: "o que inclui", "como recebo", "tem simulado".
5. **Links internos**: post → apostila do órgão (já) e apostila → posts do mesmo estado.
6. **Atualização**: manter `dateModified` real nos posts quando o edital for retificado (a ficha do edital já ajuda).
7. **Velocidade**: imagens de capa em WebP e `priority` só na imagem principal.
8. **Evitar conteúdo duplicado**: posts de 10/dia precisam de título e texto únicos por concurso.

## 5. Canais de divulgação orgânica
- **Telegram/WhatsApp** de concurseiros por estado (canal próprio com cada novo edital).
- **Instagram** (conta já ligada ao Windsor): carrossel "edital saiu" + link na bio para o post.
- **YouTube Shorts / TikTok**: 30s "o que cai na prova de [cargo]".
- **Pinterest**: pins de editais com link para o blog (bom tráfego para concursos).
- **Grupos de Facebook e Reddit (r/concursospublicos)**: responder dúvidas, sem spam.
- **Parcerias**: professores e canais locais de cada concurso, com cupom.
- **Newsletter** para quem se cadastrou (já existe `leads`).

## 6. Regras da produção diária de matérias (até 10 por dia)
- **Teto:** no máximo 10 matérias por dia. Dias com menos concursos publicam menos; nunca completar com texto de enchimento.
- **Âmbito (campo "Âmbito do concurso" no admin):** Nacional, Estadual, Sociedades de economia mista (Petrobras/Transpetro, bancos públicos, Correios etc.) e Prefeituras.
- **Prioridade na hora de escolher quais entram:** Nacional > Economia mista > Estadual > Prefeituras.
- **Prefeituras:** se o dia tiver muitas matérias maiores, ignorar prefeitura muito pequena (poucas vagas). Se houver poucas matérias no dia, incluir.
- **Cada matéria:** estado (UF), âmbito, órgão, banca/organizadora, ano no título, link do edital oficial, ficha (tipo de certame, nº do edital, retificações) e apostila relacionada, se existir.
- **Revisão:** gravar como rascunho e publicar após conferência (datas e vagas erradas custam credibilidade).

## 7. Facebook automático
- Até **4 por dia**, escolhendo as mais importantes entre as publicadas nos últimos 7 dias e ainda não divulgadas. Pontuação: esfera (40/30/20/10) + destaque (15) + importância extra do admin (0 a 10).
- Horários (Brasília): 08:00, 11:30, 15:00 e 19:30, via GitHub Actions (`.github/workflows/facebook-posts.yml`). Cada execução posta no máximo 1.
- O post leva só o link da matéria (com UTM `utm_medium=organico`).
- Configuração: na Vercel `SOCIAL_SECRET`, `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_TOKEN`; no GitHub o secret `SOCIAL_SECRET`. Teste sem postar: Actions → "Facebook posts" → Run workflow com `dry = 1`.
