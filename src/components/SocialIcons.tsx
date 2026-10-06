export function InstagramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.6" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M20.2 11.5a8.2 8.2 0 0 1-12.1 7.2L4 20l1.3-4a8.2 8.2 0 1 1 14.9-4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.1 8.3c.2-.3.4-.3.7-.3h.4c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.5.6c.5 1 1.3 1.8 2.3 2.3l.6-.5c.2-.2.4-.2.7-.1l1.7.7c.3.1.4.3.4.5v.4c0 .3-.1.5-.3.7-.4.4-1 .6-1.6.5-2.1-.3-4.9-3.1-5.2-5.2-.1-.6.1-1.2.5-1.7Z" fill="currentColor" />
    </svg>
  )
}
