import { createFileRoute } from '@tanstack/react-router'
import { getAdminPassword, getCatalogKV } from '@/lib/cloudflare-store.server'

const KEY = 'overrides'
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers })
}

function rawJson(value: string | null, status = 200) {
  return new Response(value ?? '{}', { status, headers })
}

async function externalizeImages(store: ReturnType<typeof getCatalogKV>, value: unknown, refs = new Map<string, string>()): Promise<unknown> {
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    const existing = refs.get(value)
    if (existing) return existing
    const match = /^data:(image\/(?:webp|jpeg|png|gif));base64,([A-Za-z0-9+/=]+)$/.exec(value)
    if (!match) return value
    const imageId = crypto.randomUUID()
    await store.put(`image:${imageId}`, value)
    const ref = `/catalog-data?image=${imageId}`
    refs.set(value, ref)
    return ref
  }
  if (Array.isArray(value)) {
    const output: unknown[] = []
    for (const item of value) output.push(await externalizeImages(store, item, refs))
    return output
  }
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) output[key] = await externalizeImages(store, item, refs)
    return output
  }
  return value
}

export const Route = createFileRoute('/catalog-data')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const store = getCatalogKV()
          const url = new URL(request.url)
          const imageId = url.searchParams.get('image')
          if (imageId) {
            if (!/^[a-zA-Z0-9-]{10,80}$/.test(imageId)) return json({ error: 'invalid_image_id' }, 400)
            const savedImage = await store.get(`image:${imageId}`, 'text')
            if (!savedImage) return json({ error: 'image_not_found' }, 404)
            const match = /^data:(image\/(?:webp|jpeg|png|gif));base64,([A-Za-z0-9+/=]+)$/.exec(savedImage)
            if (!match) return json({ error: 'invalid_image_data' }, 500)
            const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0))
            return new Response(bytes, { headers: { 'Content-Type': match[1], 'Cache-Control': 'public, max-age=31536000, immutable' } })
          }
          const type = url.searchParams.get('type')
          if (type === 'settings') return json((await store.get('settings', 'json')) ?? {})
          if (type === 'additions') {
            const rawAdditions = await store.get('additions', 'text')
            if (!rawAdditions) return json({})
            if (rawAdditions.includes('\"data:image/')) {
              const parsed = JSON.parse(rawAdditions) as unknown
              const migrated = await externalizeImages(store, parsed)
              await store.put('additions', JSON.stringify(migrated), { metadata: { updatedAt: new Date().toISOString() } })
              return json(migrated)
            }
            return rawJson(rawAdditions)
          }
          const rawOverrides = await store.get(KEY, 'text')
          if (rawOverrides?.includes('\"data:image/')) {
            const parsed = JSON.parse(rawOverrides) as unknown
            const migrated = await externalizeImages(store, parsed)
            await store.put(KEY, JSON.stringify(migrated), { metadata: { updatedAt: new Date().toISOString() } })
            return json(migrated)
          }
          return rawJson(rawOverrides)
        } catch (error) {
          console.error('catalog-data GET error', error)
          if (error instanceof Error && error.message === 'storage_binding_invalid') {
            return json({ error: 'storage_binding_invalid' }, 503)
          }
          return json({ error: 'storage_not_configured' }, 503)
        }
      },

      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>
          const expected = getAdminPassword()
          if (!expected) return json({ ok: false, error: 'admin_password_not_configured' }, 503)
          if (typeof body?.password !== 'string' || body.password !== expected) {
            return json({ ok: false, error: 'unauthorized' }, 401)
          }

          const overrides = body?.overrides
          if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
            return json({ ok: false, error: 'invalid_overrides' }, 400)
          }

          const store = getCatalogKV()
          const updatedAt = new Date().toISOString()
          const storedOverrides = await externalizeImages(store, overrides)
          await store.put(KEY, JSON.stringify(storedOverrides), { metadata: { updatedAt } })

          if (body?.additions && typeof body.additions === 'object' && !Array.isArray(body.additions)) {
            const storedAdditions = await externalizeImages(store, body.additions)
            await store.put('additions', JSON.stringify(storedAdditions), { metadata: { updatedAt } })
          }

          if (body?.settings && typeof body.settings === 'object' && !Array.isArray(body.settings)) {
            await store.put('settings', JSON.stringify(body.settings), { metadata: { updatedAt } })
          }

          return json({ ok: true, savedAt: updatedAt })
        } catch (error) {
          console.error('catalog-data POST error', error)
          if (error instanceof Error && error.message === 'storage_binding_invalid') {
            return json({ ok: false, error: 'storage_binding_invalid' }, 503)
          }
          if (error instanceof Error && error.message === 'storage_not_configured') {
            return json({ ok: false, error: 'storage_not_configured' }, 503)
          }
          return json({ ok: false, error: 'server_error' }, 500)
        }
      },
    },
  },
})
