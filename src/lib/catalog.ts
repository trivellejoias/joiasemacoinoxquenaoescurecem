export type ProductOverride = {
  hidden?: boolean
  deleted?: boolean
  name?: string
  description?: string
  shortDescription?: string
  category?: import('@/data/products').ProductCategory
  price?: number
  stock?: number
  image?: string
  images?: string[]
}

export type CatalogOverrides = Record<string, ProductOverride>
export type CatalogAdditions = Record<string, import('@/data/products').Product>

export type CatalogSettings = {
  instagramUrl?: string
  whatsappNumber?: string
  whatsappMessage?: string
  productOrder?: number[]
}

export async function loadCatalogOverrides(): Promise<CatalogOverrides> {
  try {
    const response = await fetch('/catalog-data', { cache: 'no-store' })
    if (!response.ok) return {}
    const data = await response.json()
    return data && typeof data === 'object' ? (data as CatalogOverrides) : {}
  } catch {
    return {}
  }
}

export function applyOverride<T extends { id: number }>(product: T, overrides: CatalogOverrides): T & ProductOverride {
  return { ...product, ...(overrides[String(product.id)] ?? {}) }
}

export async function loadCatalogSettings(): Promise<CatalogSettings> {
  try {
    const response = await fetch('/catalog-data?type=settings', { cache: 'no-store' })
    if (!response.ok) return {}
    const data = await response.json()
    return data && typeof data === 'object' ? (data as CatalogSettings) : {}
  } catch {
    return {}
  }
}

export function whatsappHref(number: string, message = 'Olá! Vim pelo catálogo da Trivelle e gostaria de saber mais sobre as peças.'): string {
  const digits = number.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export async function loadCatalogAdditions(): Promise<CatalogAdditions> {
  try {
    const response = await fetch('/catalog-data?type=additions', { cache: 'no-store' })
    if (!response.ok) return {}
    const data = await response.json()
    return data && typeof data === 'object' ? (data as CatalogAdditions) : {}
  } catch {
    return {}
  }
}
