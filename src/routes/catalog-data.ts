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

export const Route = createFileRoute('/catalog-data')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const store = getCatalogKV()
          const type = new URL(request.url).searchParams.get('type')
          if (type === 'settings') return json((await store.get('settings', 'json')) ?? {})
          if (type === 'additions') return json((await store.get('additions', 'json')) ?? {})
          return json((await store.get(KEY, 'json')) ?? {})
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

          await store.put(KEY, JSON.stringify(overrides), { metadata: { updatedAt } })

          if (body?.additions && typeof body.additions === 'object' && !Array.isArray(body.additions)) {
            await store.put('additions', JSON.stringify(body.additions), { metadata: { updatedAt } })
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
