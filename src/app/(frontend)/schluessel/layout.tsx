import React from 'react'
import { SubNavLink, type NavItem } from '@/components/NavLink'
import { payloadClient } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

/**
 * Section navigation for the whole key domain. Every screen is one click away,
 * and the two counters that demand action are on the tab itself.
 */
export default async function KeySectionLayout({ children }: { children: React.ReactNode }) {
  const payload = await payloadClient()

  const [overdue, incidents] = await Promise.all([
    payload.find({
      collection: 'key-copies',
      where: {
        and: [{ status: { equals: 'ausgegeben' } }, { dueAt: { less_than: new Date().toISOString() } }],
      },
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: 'key-incidents',
      where: { status: { not_equals: 'erledigt' } },
      limit: 1,
      depth: 0,
    }),
  ])

  const items: NavItem[] = [
    { href: '/schluessel', label: 'Brett', exact: true },
    { href: '/schluessel/ausgabe', label: 'Ausgabe' },
    { href: '/schluessel/ruecknahme', label: 'Rücknahme' },
    { href: '/schluessel/abschluss', label: 'Abschluss', badge: overdue.totalDocs },
    { href: '/schluessel/inventur', label: 'Inventur' },
    { href: '/schluessel/vorfaelle', label: 'Vorfälle', badge: incidents.totalDocs },
    { href: '/schluessel/etiketten', label: 'Etiketten' },
  ]

  return (
    <>
      <div className="border-b border-line bg-mist print:hidden">
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          {items.map((item) => (
            <SubNavLink key={item.href} item={item} />
          ))}
        </nav>
      </div>
      {children}
    </>
  )
}
