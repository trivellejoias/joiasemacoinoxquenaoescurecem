# AGENTS.md

Visão geral do projeto para desenvolvedores e agentes de IA que trabalharem neste repositório.

## Visão geral

Catálogo de joias da marca **Trivelle** ("joias em aço inox que não escurecem"), construído com TanStack Start e implantado no Cloudflare Workers. Apresenta produtos por categoria (Anéis, Brincos, Colares, Pulseiras) com página de detalhe e checkout via Stripe.

### Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Estilo | Tailwind CSS 4 (utilitário, sem config file — v4 usa `@import "tailwindcss"`) |
| Pagamentos | Stripe Checkout |
| Linguagem | TypeScript 5.9 |
| Deploy | Cloudflare Workers |

## Estrutura de diretórios

```
├── public
│   ├── favicon.ico
│   ├── images/trivelle-logo.png   # Logo/identidade visual enviada pelo cliente
│   └── products/*.svg             # Imagens ilustrativas de cada peça (line-art na paleta da marca)
├── src
│   ├── components
│   │   └── BuyButton.tsx          # Botão de checkout Stripe (fica desabilitado sem STRIPE_SECRET_KEY)
│   ├── data
│   │   └── products.ts            # Catálogo de produtos: id, name, category, image, description, price
│   ├── lib
│   │   └── stripe.ts               # Server functions: getStripeEnabled, createCheckoutSession
│   ├── routes
│   │   ├── checkout/{success,cancel}.tsx
│   │   ├── products/$productId.tsx # Página de detalhe do produto
│   │   ├── __root.tsx              # Layout raiz: fontes, meta tags, título do site
│   │   └── index.tsx               # Home: hero, filtro de categoria, grid de produtos
│   ├── router.tsx
│   └── styles.css                  # Tailwind + fontes (Playfair Display / Inter) + variáveis de cor da marca
├── wrangler.jsonc                  # configuração do Cloudflare Worker
└── vite.config.ts
```

## Identidade visual

Definida em `src/styles.css` via variáveis CSS:

- `--color-brand`: `#b97a7c` (rosa terracota, cor de fundo do logo)
- `--color-brand-dark`: `#8f5254` (contraste/hover)
- `--color-brand-light`: `#f3e6e6` (bordas e fundos suaves)
- Fonte de destaque: `Playfair Display` (classe `font-display`), usada no logotipo, títulos e preços
- Fonte de texto: `Inter`

Ao adicionar novas seções, reutilize essas variáveis em vez de introduzir novas cores.

## Convenções

- Rotas por arquivo em `src/routes/` (TanStack Router)
- Alias `@/*` aponta para `src/*`
- Preços em `products.ts` são números inteiros em reais (ex.: `129` = R$ 129); `stripe.ts` multiplica por 100 para gerar centavos
- Adicionar um novo produto: incluir entrada em `src/data/products.ts` e a imagem correspondente em `public/products/`

## Variáveis de ambiente

```
STRIPE_SECRET_KEY=...   # necessária para habilitar o checkout
SITE_URL=...            # usada como base das URLs de sucesso/cancelamento do Stripe
```

## Comandos

```bash
npm run dev     # servidor de desenvolvimento (porta 3000)
npm run build   # build de produção
```
