# Trivelle Joias — Cloudflare

Esta versão está preparada para Cloudflare Workers + TanStack Start + Workers KV.

## Configuração necessária no Cloudflare

O Worker precisa destas configurações:

- Workers KV binding: **CATALOG_KV** apontando para o namespace KV do catálogo.
- Secret: **ADMIN_PASSWORD** com a senha usada no painel `/admin`.

## Arquitetura

- Catálogo, painel administrativo e estatísticas usam as rotas do próprio Worker.
- Os dados editáveis e as estatísticas são armazenados no Workers KV.
- O projeto usa Vite + `@cloudflare/vite-plugin` para o deploy do Worker.
- As rotas administrativas são `/admin-auth`, `/catalog-data` e `/analytics`.

## Uso

Depois de conectar o repositório ao Cloudflare Workers, faça o deploy.

Acesse `/admin` e entre com a senha definida no secret `ADMIN_PASSWORD`.
