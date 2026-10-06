# Área administrativa da Trivelle

O painel `/admin` usa uma senha armazenada como **secret do Cloudflare Workers** e o **Cloudflare KV** para persistir as alterações.

## Configuração no Cloudflare

### 1. Criar o armazenamento

Crie um namespace Workers KV.

### 2. Vincular o KV

No Worker, adicione um binding KV com:

- **Variable name:** `CATALOG_KV`
- **KV namespace:** o namespace criado no passo anterior

### 3. Criar a senha

Em **Settings → Variables and Secrets**, crie um secret:

- **Nome:** `ADMIN_PASSWORD`
- **Valor:** sua senha forte

Depois faça um novo deploy.

## O que o painel salva

- título
- preço
- estoque
- categoria
- descrição
- fotos
- ordem dos produtos
- produtos novos
- ocultar/excluir/restaurar produtos
- Instagram
- WhatsApp
- mensagem do WhatsApp

As estatísticas também são gravadas no mesmo KV.

## Se aparecer erro ao salvar

A mensagem agora diferencia os problemas mais comuns:

- `O armazenamento do Cloudflare não está configurado.` → falta o binding `CATALOG_KV`.
- `Sua senha de administrador não foi aceita.` → `ADMIN_PASSWORD` não corresponde à senha usada no login.
- erro de servidor → veja os logs do Worker no Cloudflare.
