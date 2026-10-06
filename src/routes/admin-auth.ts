import { createFileRoute } from '@tanstack/react-router'
import { getAdminPassword } from '@/lib/cloudflare-store.server'

export const Route = createFileRoute('/admin-auth')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>
          const password = body?.password
          const expected = getAdminPassword()

          if (!expected) {
            return Response.json({ ok: false, error: 'admin_password_not_configured' }, { status: 503 })
          }

          if (typeof password !== 'string' || password !== expected) {
            return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
          }

          return Response.json({ ok: true })
        } catch {
          return Response.json({ ok: false, error: 'invalid_request' }, { status: 400 })
        }
      },
    },
  },
})
