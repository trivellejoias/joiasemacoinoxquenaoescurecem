Correções aplicadas nesta versão

1. A página pública renderiza inicialmente 60 produtos e permite carregar mais em lotes de 60, reduzindo o trabalho de renderização do Worker e o risco de erro 1102 em catálogos grandes.
2. Corrigida a tipagem do resumo de analytics que fazia o build TypeScript falhar em src/routes/analytics.ts.
3. O painel só mostra confirmação de salvamento depois de receber uma resposta JSON { ok: true }; erros HTTP agora exibem o código e informam que o salvamento não foi confirmado.

IMPORTANTE: esta versão usa Cloudflare KV, com binding CATALOG_KV. O wrangler.jsonc referencia um ID de namespace KV. No painel Cloudflare, confirme que o Worker que atende o endereço do catálogo tem um binding KV chamado exatamente CATALOG_KV apontando para o namespace certo. A variável secreta ADMIN_PASSWORD também precisa existir. Não apague nem recrie banco/namespace antes de confirmar onde estão os dados atuais.

Limitação de validação: o ambiente de trabalho não conseguiu concluir a instalação das dependências dentro do tempo disponível; portanto, o build desta versão não pôde ser executado aqui. O erro TypeScript identificado no log foi corrigido no código, mas a publicação ainda precisa confirmar o build e o binding no Cloudflare.
