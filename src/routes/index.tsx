import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import products, { type Product } from '@/data/products'
import { BuyButton } from '@/components/BuyButton'
import { InstagramIcon, WhatsAppIcon } from '@/components/SocialIcons'
import { applyOverride, loadCatalogAdditions, loadCatalogOverrides, loadCatalogSettings, type CatalogAdditions, type CatalogOverrides, type CatalogSettings, whatsappHref } from '@/lib/catalog'
import { trackEvent, trackVisitOnce } from '@/lib/analytics'

export const Route = createFileRoute('/')({
  component: ProductsIndex,
})

const categories: Array<Product['category'] | 'Todos'> = [
  'Todos',
  'Anéis',
  'Brincos',
  'Colares',
  'Pulseiras',
  'Tornozeleiras',
  'Conjuntos',
  'Outros',
]

function ProductsIndex() {
  const [overrides, setOverrides] = useState<CatalogOverrides>({})
  const [additions, setAdditions] = useState<CatalogAdditions>({})
  const [settings, setSettings] = useState<CatalogSettings>({ instagramUrl: 'https://www.instagram.com/trivellejoias/', whatsappNumber: '5519982124939', whatsappMessage: 'Olá! Vim pelo catálogo da Trivelle e gostaria de saber mais sobre as peças.' })
  useEffect(() => { trackVisitOnce(); loadCatalogOverrides().then(setOverrides); loadCatalogAdditions().then(setAdditions); loadCatalogSettings().then((s) => setSettings((prev) => ({ ...prev, ...s }))) }, [])

  const [activeCategory, setActiveCategory] = useState<
    (typeof categories)[number]
  >('Todos')

  const filtered = useMemo(() => {
    const baseProducts = [...products, ...Object.values(additions)]
    const order = settings.productOrder ?? []
    const rank = new Map(order.map((id, index) => [id, index]))
    const available = baseProducts
      .map((p) => applyOverride(p, overrides))
      .filter((p) => (p.stock ?? 0) > 0)
      .filter((p) => !p.hidden && !p.deleted)
      .sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    return activeCategory === 'Todos' ? available : available.filter((p) => p.category === activeCategory)
  }, [activeCategory, overrides, additions, settings.productOrder])

  return (
    <div className="min-h-screen bg-[#fffdfc]">
      <header className="bg-[color:var(--color-brand)]">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
          <img
            src="/images/trivelle-logo-mark.png"
            alt="Trivelle"
            className="h-32 md:h-52 w-auto mx-auto"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-14">
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm tracking-wide border transition-colors ${
                activeCategory === category
                  ? 'bg-[color:var(--color-brand-dark)] text-white border-[color:var(--color-brand-dark)]'
                  : 'border-[color:var(--color-brand)]/40 text-[color:var(--color-brand-dark)] hover:bg-[color:var(--color-brand-light)]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="group rounded-2xl border border-[color:var(--color-brand-light)] overflow-hidden bg-white hover:shadow-xl transition-shadow"
            >
              <Link
                to="/products/$productId"
                params={{ productId: product.id.toString() }}
                className="block"
              >
                <div className="w-full aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-brand-dark)]/70 mb-1">
                  {product.category}
                </p>
                <Link
                  to="/products/$productId"
                  params={{ productId: product.id.toString() }}
                >
                  <h2 className="font-display text-xl mb-2">{product.name}</h2>
                </Link>
                <p className="text-sm text-[color:var(--color-ink)]/70 mb-4 leading-relaxed">
                  {product.shortDescription}
                </p>
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg font-semibold text-[color:var(--color-brand-dark)]">
                    {product.priceFrom ? 'A partir de ' : ''}R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <BuyButton
                    productId={product.id}
                    className="bg-[color:var(--color-brand)] text-white border-transparent hover:bg-[color:var(--color-brand-dark)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <section className="max-w-5xl mx-auto px-6 pb-10" aria-label="Entre em contato com a Trivelle">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {settings.whatsappNumber && (
            <a
              onClick={() => trackEvent({ type: 'whatsapp_click', path: window.location.pathname })}
              href={whatsappHref(settings.whatsappNumber, settings.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-[color:var(--color-brand-light)] border border-[color:var(--color-brand)]/20 p-5 transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand-dark)]"
              aria-label="Dúvidas? Nos chame no WhatsApp"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--color-brand-dark)]" aria-hidden="true"><WhatsAppIcon className="h-6 w-6" /></span>
              <span className="flex-1">
                <span className="block font-display text-xl text-[color:var(--color-brand-dark)]">Dúvidas?</span>
                <span className="mt-1 block text-sm text-[color:var(--color-ink)]/75">Nos chame no WhatsApp</span>
              </span>
              <span className="text-lg text-[color:var(--color-brand-dark)]" aria-hidden="true">↗</span>
            </a>
          )}
          {settings.instagramUrl && (
            <a
              onClick={() => trackEvent({ type: 'instagram_click', path: window.location.pathname })}
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-[color:var(--color-brand-light)] border border-[color:var(--color-brand)]/20 p-5 transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand-dark)]"
              aria-label="Nos siga no Instagram"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--color-brand-dark)]" aria-hidden="true"><InstagramIcon className="h-6 w-6" /></span>
              <span className="flex-1">
                <span className="block font-display text-xl text-[color:var(--color-brand-dark)]">Nos siga no Instagram</span>
                <span className="mt-1 block text-sm text-[color:var(--color-ink)]/75">Acompanhe a Trivelle</span>
              </span>
              <span className="text-lg text-[color:var(--color-brand-dark)]" aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </section>
      <footer className="border-t border-[color:var(--color-brand-light)] py-10 text-center text-sm text-[color:var(--color-ink)]/60">
        © {new Date().getFullYear()} Trivelle — joias em aço inox que não escurecem.
      </footer>
    </div>
  )
}
