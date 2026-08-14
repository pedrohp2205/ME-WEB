# Deploy no Cloudflare Pages

Projeto é uma SPA Vite + React (build estático). O Pages serve a pasta `dist`.

## Configuração do projeto no painel do Cloudflare

Workers & Pages → Create → Pages → Connect to Git → selecione este repositório.

| Campo                      | Valor           |
| -------------------------- | --------------- |
| Framework preset           | Vite            |
| Build command              | `npm run build` |
| Build output directory     | `dist`          |
| Root directory             | `/`             |

O `wrangler.toml` na raiz já declara `pages_build_output_dir = "dist"`, e o
`.nvmrc` fixa o Node em 22.11.0 (o mesmo usado localmente).

## Variáveis de ambiente (obrigatório)

Settings → Environment variables → **Production** e **Preview**:

```
VITE_API_BASE_URL = https://api.seu-dominio.com.br
```

⚠️ Vite injeta isso **em tempo de build**, não em runtime. Se a variável não
estiver definida, `src/lib/api/http.ts` cai no default `http://localhost:8080`
e o painel publicado não vai conseguir falar com a API. Depois de alterar a
variável é preciso **refazer o deploy** para o novo valor valer.

## O que já está no repositório

- **`public/_redirects`** — `/* /index.html 200`. Sem isso, recarregar em
  `/agenda`, `/consultas/:id` ou cair em `/oauth2/redirect` devolve 404, porque
  o roteamento é client-side (`BrowserRouter`).
- **`public/_headers`** — cache imutável para `/assets/*` (nomes com hash),
  `no-cache` no `index.html` e headers de segurança básicos.
- **`wrangler.toml`** — nome do projeto e diretório de saída.
- **`.nvmrc`** — versão do Node usada no build.

## Ajustes necessários no backend (M.E-API)

O front deixa de rodar em `http://localhost:3000`, então no backend é preciso
atualizar:

1. **CORS** — liberar a origem do Pages (`https://<projeto>.pages.dev` e o
   domínio customizado, se houver).
2. **OAuth Google** — a URL de retorno `http://localhost:3000/oauth2/redirect`
   passa a ser `https://<seu-domínio>/oauth2/redirect` (também no console do
   Google Cloud, nas *Authorized redirect URIs*).
3. **Callback de assinatura** — `http://localhost:3000/document-signature/callback`
   vira `https://<seu-domínio>/document-signature/callback`.

A API precisa estar em HTTPS: a página servida pelo Pages é HTTPS e o browser
bloqueia chamadas para `http://` (mixed content).

## Deploy manual (opcional)

Com o Wrangler já instalado como devDependency:

```bash
npx wrangler login
npm run cf:deploy      # build + wrangler pages deploy
npm run cf:preview     # build + servidor local do Pages (testa _redirects/_headers)
```

## Domínio customizado

Custom domains → Set up a domain. Se o DNS está na Hostinger, aponte um `CNAME`
do subdomínio para `<projeto>.pages.dev` (ou migre a zona para o Cloudflare).
