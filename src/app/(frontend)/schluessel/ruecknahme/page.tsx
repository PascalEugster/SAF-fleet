import React from 'react'
import { ReturnForm, type OutstandingItem } from '@/components/ReturnForm'
import { isOverdue, keyOf, userOf } from '@/lib/keyLabels'
import { bundleOverdue, loadKeyScreen, memberLabels } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

export default async function KeyReturnPage() {
  const { copies, bundles, copyById, memberIds } = await loadKeyScreen()

  const bundleItems: OutstandingItem[] = bundles
    .filter((b) => Boolean(b.currentHolder))
    .map((b) => ({
      kind: 'bundle' as const,
      id: String(b.id),
      number: b.tagNumber ? `Marke ${b.tagNumber}` : 'Bund',
      title: `${b.label} (${memberLabels(b, copyById).length} Schlüssel)`,
      holder: userOf(b.currentHolder)?.name ?? 'unbekannt',
      dueAt: b.dueAt ?? null,
      overdue: bundleOverdue(b),
      href: `/schluessel/bund/${b.id}`,
    }))

  const copyItems: OutstandingItem[] = copies
    .filter(
      (c) =>
        (c.status === 'ausgegeben' || c.status === 'dauerausgabe') && !memberIds.has(String(c.id)),
    )
    .map((c) => ({
      kind: 'copy' as const,
      id: String(c.id),
      number: c.label ?? String(c.id),
      title: keyOf(c.key)?.label ?? '—',
      holder: userOf(c.currentHolder)?.name ?? 'unbekannt',
      dueAt: c.dueAt ?? null,
      overdue: isOverdue(c),
      href: `/schluessel/${c.id}`,
    }))

  // Overdue first — that is what the evening check is about.
  const outstanding = [...bundleItems, ...copyItems].sort(
    (a, b) => Number(Boolean(b.overdue)) - Number(Boolean(a.overdue)),
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      <div className="border-b border-line pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Schlüsselrücknahme</h1>
        <p className="mt-1 text-muted">
          Nummer scannen oder tippen. Das Feld bleibt aktiv, damit mehrere Schlüssel in Serie
          zurückgenommen werden können.
        </p>
      </div>

      <div className="mt-8">
        <ReturnForm outstanding={outstanding} />
      </div>
    </div>
  )
}
