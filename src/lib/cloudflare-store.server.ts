import { env } from 'cloudflare:workers'

export type CatalogKV = {
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>
  put(key: string, value: string, options?: { expirationTtl?: number; metadata?: unknown }): Promise<void>
}

function storageError(message: string): Error {
  const error = new Error(message)
  error.name = 'CatalogStorageError'
  return error
}

export function getCatalogKV(): CatalogKV {
  const candidate = (env as unknown as Record<string, unknown>).CATALOG_KV
  if (!candidate) throw storageError('storage_not_configured')
  if (typeof candidate !== 'object' || typeof (candidate as { get?: unknown }).get !== 'function' || typeof (candidate as { put?: unknown }).put !== 'function') {
    throw storageError('storage_binding_invalid')
  }
  return candidate as CatalogKV
}

export function getAdminPassword(): string {
  return String((env as unknown as Record<string, unknown>).ADMIN_PASSWORD ?? '')
}
