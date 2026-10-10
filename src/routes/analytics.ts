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

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export const Route = createFileRoute('/analytics')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>
          const store = getCatalogKV()

          if (body.action === 'stats') {
            const expected = getAdminPassword()

            if (!expected || body.password !== expected) {
              return jsonResponse({ error: 'unauthorized' }, 401)
            }

            const raw = await store.get('analytics:summary', 'text')
            const summary: Summary = raw
              ? JSON.parse(raw) as Summary
              : emptySummary()

            return jsonResponse(summary)
          }

          const allowed = [
            'visit',
            'product_view',
            'whatsapp_click',
            'instagram_click',
          ]

          if (!allowed.includes(String(body.type ?? ''))) {
            return jsonResponse({ error: 'invalid_event' }, 400)
          }

          const raw = await store.get('analytics:summary', 'text')
          const current: Summary = raw
            ? JSON.parse(raw) as Summary
            : emptySummary()

          const day = new Date().toISOString().slice(0, 10)
          const daily = current.days[day] ?? {
            visits: 0,
            productViews: 0,
            whatsappClicks: 0,
            instagramClicks: 0,
          }

          if (body.type === 'visit') {
            current.visits++
            daily.visits++
          }

          if (body.type === 'product_view') {
            current.productViews++
            daily.productViews++

            const id = String(body.productId ?? '')
            if (id) {
              const item = current.products[id] ?? {
                name: String(body.productName ?? 'Produto'),
                views: 0,
                whatsappClicks: 0,
              }

              item.views++
              if (body.productName) item.name = String(body.productName)
              current.products[id] = item
            }
          }

          if (body.type === 'whatsapp_click') {
            current.whatsappClicks++
            daily.whatsappClicks++

            const id = String(body.productId ?? '')
            if (id) {
              const item = current.products[id] ?? {
                name: String(body.productName ?? 'Produto'),
                views: 0,
                whatsappClicks: 0,
              }

              item.whatsappClicks++
              if (body.productName) item.name = String(body.productName)
              current.products[id] = item
            }
          }

          if (body.type === 'instagram_click') {
            current.instagramClicks++
            daily.instagramClicks++
          }

          current.days[day] = daily

          const cutoff = new Date()
          cutoff.setUTCDate(cutoff.getUTCDate() - 90)
          const cutoffDay = cutoff.toISOString().slice(0, 10)

          for (const savedDay of Object.keys(current.days)) {
            if (savedDay < cutoffDay) delete current.days[savedDay]
          }

          const productIds = Object.keys(current.products)
          if (productIds.length > 300) {
            productIds.sort(
              (a, b) =>
                (current.products[b]?.views ?? 0) -
                (current.products[a]?.views ?? 0),
            )

            for (const oldId of productIds.slice(300)) {
              delete current.products[oldId]
            }
          }

          await store.put(
            'analytics:summary',
            JSON.stringify(current),
            { metadata: { updatedAt: new Date().toISOString() } },
          )

          return jsonResponse({ ok: true })
        } catch (error) {
          console.error('analytics error', error)

          if (error instanceof Error && error.message === 'storage_not_configured') {
            return jsonResponse({ error: 'storage_not_configured' }, 503)
          }

          if (error instanceof Error && error.message === 'storage_binding_invalid') {
            return jsonResponse({ error: 'storage_binding_invalid' }, 503)
          }

          return jsonResponse({ error: 'server_error' }, 500)
        }
      },
    },
  },
})
