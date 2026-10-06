export type AnalyticsEvent = {
  type: 'visit' | 'product_view' | 'whatsapp_click' | 'instagram_click'
  productId?: number
  productName?: string
  category?: string
  path?: string
}

function visitorKey() {
  try {
    const key = 'trivelle-analytics-visitor'
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return 'anonymous'
  }
}

export function trackEvent(event: AnalyticsEvent) {
  const payload = JSON.stringify({ ...event, visitorId: visitorKey(), at: new Date().toISOString() })
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/analytics', new Blob([payload], { type: 'application/json' }))
      return
    }
  } catch {}
  void fetch('/analytics', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true,
  }).catch(() => {})
}

export function trackVisitOnce() {
  try {
    if (sessionStorage.getItem('trivelle-analytics-visit')) return
    sessionStorage.setItem('trivelle-analytics-visit', '1')
  } catch {}
  trackEvent({ type: 'visit', path: window.location.pathname })
}
