# Trivelle — Catálogo de Joias

Catálogo online da Trivelle com painel administrativo em `/admin`, preparado para **Cloudflare Workers**.

## Tecnologias

- TanStack Start + React
- Vite
- Tailwind CSS
- Cloudflare Workers
- Cloudflare KV para os dados editados pelo painel

## Instalação

```bash
npm install
npm run dev
```

## Deploy no Cloudflare

1. Crie um namespace **Workers KV** no Cloudflare.
2. No Worker, crie o binding com o nome exato **`CATALOG_KV`** apontando para esse namespace.
3. Crie o secret **`ADMIN_PASSWORD`** com a senha que será usada em `/admin`.
4. Execute:

```bash
npm run deploy
```

O painel administrativo fica em `/admin`.

### Importante

O painel salva produtos, fotos, estoque, configurações e ordem no KV. O Worker precisa ter um binding KV chamado `CATALOG_KV`; depois de alterar bindings ou secrets, publique uma nova versão. O projeto não depende de hospedagem externa para o catálogo ou para o painel.

As fotos escolhidas no painel são redimensionadas para WebP antes de serem armazenadas. O projeto devolve uma mensagem específica quando o KV ou a senha ainda não foram configurados.
