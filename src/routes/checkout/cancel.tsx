import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/checkout/cancel')({
  component: CheckoutCancel,
})

function CheckoutCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-[#fffdfc]">
      <div className="rounded-2xl p-12 border border-[color:var(--color-brand-light)] text-center max-w-lg">
        <div className="text-6xl mb-6 text-[color:var(--color-brand-dark)]">
          &#10005;
        </div>
        <h1 className="font-display text-3xl font-semibold mb-4">
          Compra cancelada
        </h1>
        <p className="mb-8 text-[color:var(--color-ink)]/70">
          Seu pagamento foi cancelado. Nenhuma cobrança foi feita.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-full bg-[color:var(--color-brand)] text-white hover:bg-[color:var(--color-brand-dark)] transition-colors"
        >
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  )
}
