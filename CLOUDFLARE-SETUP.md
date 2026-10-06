# Configuração do Trivelle no Cloudflare

Esta versão está configurada para Cloudflare Workers + TanStack Start.

## 1. KV obrigatório

Crie ou use um namespace **Workers KV** no Cloudflare.

O Worker precisa de um binding com o nome exato:

- `CATALOG_KV`

O binding deve apontar para o namespace KV usado pelo catálogo.

## 2. Senha do painel

Em **Settings → Variables and Secrets**, crie:

- Nome: `ADMIN_PASSWORD`
- Tipo: **Secret**
- Valor: a senha usada para acessar `/admin`

Depois de alterar a senha, publique uma nova versão.

## 3. Deploy

No Cloudflare Workers:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Ou localmente:

```bash
npm install
npm run deploy
```

## 4. Teste

Abra `/admin`, entre com a senha e altere um preço. Clique em **Salvar alterações** e depois recarregue a página.

Se o KV não estiver disponível, o painel informa que o binding `CATALOG_KV` precisa ser configurado.
