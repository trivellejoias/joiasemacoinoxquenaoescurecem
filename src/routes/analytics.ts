import { createFileRoute } from '@tanstack/react-router'
import { getAdminPassword, getCatalogKV } from '@/lib/cloudflare-store.server'

type Summary = {
  visits: number
  productViews: number
  whatsappClicks: number
  instagramClicks: number
  products: Record<string, { name: string; views: number; whatsappClicks: number }>
  days: Record<string, { visits: number; productViews: number; whatsappClicks: number; instagramClicks: number }>
}

const emptySummary = (): Summary => ({
  visits: 0,
  productViews: 0,
  whatsappClicks: 0,
  instagramClicks: 0,
  products: {},
  days: {},
})

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export const Route = createFileRoute('/analytics')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>
          const store = getCatalogKV()

          if (body?.action === 'stats') {
            const expected = getAdminPassword()
            if (!expected || body.password !== expected) {
              return json({ error: 'unauthorized' }, 401)
            }
            const summary = await store.get<Summary>('analytics:summary', 'json')
            return json(summary ?? emptySummary())
          }

          const allowed = new Set(['visit', 'product_view', 'whatsapp_click', 'instagram_click'])
          if (!allowed.has(String(body?.type ?? ''))) return json({ error: 'invalid_event' }, 400)

          const day = new Date().toISOString().slice(0, 10)
          const storedSummary = await store.get<Summary>('analytics:summary', 'json')
          const current: Summary = storedSummary ? (storedSummary as Summary) : emptySummary()
          const daily = current.days[day] ?? { visits: 0, productViews: 0, whatsappClicks: 0, instagramClicks: 0 }

          if (body.type === 'visit') { current.visits++; daily.visits++ }
          if (body.type === 'product_view') {
            current.productViews++; daily.productViews++
            const id = String(body.productId ?? '')
            if (id) {
              const item = current.products[id] ?? { name: String(body.productName ?? 'Produto'), views: 0, whatsappClicks: 0 }
              item.views++
              if (body.productName) item.name = String(body.productName)
              current.products[id] = item
            }
          }
          if (body.type === 'whatsapp_click') {
            current.whatsappClicks++; daily.whatsappClicks++
            const id = String(body.productId ?? '')
            if (id) {
              const item = current.products[id] ?? { name: String(body.productName ?? 'Produto'), views: 0, whatsappClicks: 0 }
              item.whatsappClicks++
              if (body.productName) item.name = String(body.productName)
              current.products[id] = item
            }
          }
          if (body.type === 'instagram_click') { current.instagramClicks++; daily.instagramClicks++ }

          current.days[day] = daily

          // Keep the summary bounded so each event does not parse/write an ever-growing KV value.
          const cutoff = new Date()
          cutoff.setUTCDate(cutoff.getUTCDate() - 90)
          const cutoffDay = cutoff.toISOString().slice(0, 10)
          for (const savedDay of Object.keys(current.days)) {
            if (savedDay < cutoffDay) delete current.days[savedDay]
          }
          const productIds = Object.keys(current.products)
          if (productIds.length > 300) {
            productIds.sort((a, b) => (current.products[b]?.views ?? 0) - (current.products[a]?.views ?? 0))
            for (const oldId of productIds.slice(300)) delete current.products[oldId]
          }

          await store.put('analytics:summary', JSON.stringify(current), { metadata: { updatedAt: new Date().toISOString() } })
          return json({ ok: true })
        } catch (error) {
          console.error('analytics error', error)
          if (error instanceof Error && error.message === 'storage_not_configured') {
            return json({ error: 'storage_not_configured' }, 503)
          }
          if (error instanceof Error && error.message === 'storage_binding_invalid') {
            return json({ error: 'storage_binding_invalid' }, 503)
          }
          return json({ error: 'server_error' }, 500)
        }
      },
    },
  },
})
