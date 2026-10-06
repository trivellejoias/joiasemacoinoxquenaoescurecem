import { useEffect, useState } from 'react'
import products from '@/data/products'
import { applyOverride, loadCatalogAdditions, loadCatalogOverrides, loadCatalogSettings, type ProductOverride } from '@/lib/catalog'
import type { Product } from '@/data/products'
import { trackEvent } from '@/lib/analytics'

const DEFAULT_WHATSAPP_NUMBER = '5519982124939'

export function BuyButton({
  productId,
  className = '',
}: {
  productId: number
  className?: string
}) {
  const [baseProduct, setBaseProduct] = useState<Product | null>(products.find((item) => item.id === productId) ?? null)
  const [override, setOverride] = useState<ProductOverride>({})
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER)

  useEffect(() => {
    let active = true
    Promise.all([loadCatalogOverrides(), loadCatalogAdditions(), loadCatalogSettings()]).then(([overrides, additions, settings]) => {
      if (!active) return
      const found = products.find((item) => item.id === productId) ?? additions[String(productId)] ?? null
      setBaseProduct(found)
      setOverride(overrides[String(productId)] ?? {})
      const configuredNumber = settings.whatsappNumber?.replace(/\D/g, '')
      if (configuredNumber) setWhatsappNumber(configuredNumber)
    }).catch(() => {})
    return () => { active = false }
  }, [productId])

  if (!baseProduct) return null

  const product = applyOverride(baseProduct, { [String(productId)]: override })
  const priceLabel = `${product.priceFrom ? 'a partir de ' : ''}R$ ${product.price.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })}`
  const message = [
    'Olá! 💎',
    '',
    `Tenho interesse na peça: ${product.name}`,
    `Valor: ${priceLabel}`,
    '',
    'Gostaria de saber como posso comprar.',
  ].join('\n')
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappUrl}
      onClick={() => trackEvent({ type: 'whatsapp_click', productId, productName: product.name })}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center px-6 py-2 rounded-full border text-sm font-medium transition-colors ${className}`}
      aria-label={`Comprar ${product.name} pelo WhatsApp`}
    >
      Comprar pelo WhatsApp
    </a>
  )
}
