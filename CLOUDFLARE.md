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

## Otimizações desta versão

- As fotos enviadas pelo painel são reduzidas para no máximo 900 px e convertidas para WebP com compressão.
- As estatísticas mantêm no máximo 90 dias de detalhamento diário e 300 produtos, evitando que o registro cresça sem limite.
- O catálogo continua usando o binding `CATALOG_KV` existente. Não crie nem exclua namespace KV para publicar esta versão.
- Após o deploy, faça um teste no `/admin`: altere uma descrição, salve, aguarde a propagação do KV e abra o catálogo em uma janela privada para conferir.

Observação: imagens grandes que já estavam salvas no KV não são recompactadas automaticamente; ao editar/substituir essas fotos pelo painel, elas passam a ser otimizadas.
