import Link from 'next/link'
import React from 'react'
import { InventoryForm, type InventoryRow } from '@/components/InventoryForm'
import { formatDateTime } from '@/lib/labels'
import { KEY_STATUS_LABELS, keyCategoryId, keyOf, userOf } from '@/lib/keyLabels'
import { loadKeyScreen, loadPeopleOptions, payloadClient } from '@/lib/keyQueries'
import type { KeyInventory } from '@/payload-types'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ category?: string }>

export default async function KeyInventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const { category } = await searchParams
  const { copies, categories } = await loadKeyScreen()
  const { users } = await loadPeopleOptions(copies)
  const payload = await payloadClient()

  const { docs: previous } = await payload.find({
    collection: 'key-inventories',
    sort: '-date',
    limit: 5,
    depth: 0,
  })

  const rows: InventoryRow[] = copies
    .filter((c) => {
      if (!category) return true
      return keyCategoryId(keyOf(c.key)?.category) === category
    })
    .map((c) => {
      const holder = userOf(c.currentHolder)
      return {
        id: String(c.id),
        number: c.label ?? String(c.id),
        title: keyOf(c.key)?.label ?? '—',
        expected: holder ? `bei ${holder.name}` : (KEY_STATUS_LABELS[c.status] ?? c.status),
        slot: c.storageSlot ?? null,
        categoryId: keyCategoryId(keyOf(c.key)?.category),
      }
    })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      <div className="border-b border-line pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Inventur / Schlüsselrapport</h1>
        <p className="mt-1 text-muted">
          Brett durchgehen und nur ankreuzen, was fehlt. Alles andere gilt als am erwarteten Ort
          angetroffen.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Umfang
        </span>
        <Link
          href="/schluessel/inventur"
          className={`border px-3 py-1.5 text-sm transition ${
            !category
              ? 'border-army-red bg-army-red text-white'
              : 'border-line bg-paper hover:border-army-red'
          }`}
        >
          Gesamter Bestand
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/schluessel/inventur?category=${cat.id}`}
            className={`border px-3 py-1.5 text-sm transition ${
              category === String(cat.id)
                ? 'border-army-red bg-army-red text-white'
                : 'border-line bg-paper hover:border-army-red'
            }`}
          >
            {cat.icon ? `${cat.icon} ` : ''}
            {cat.name}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <InventoryForm rows={rows} users={users} scopeIds={category ? [category] : []} />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Frühere Inventuren
        </h2>
        {previous.length === 0 ? (
          <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
            Noch keine Inventur erfasst.
          </p>
        ) : (
          <ol className="mt-3 border border-line bg-paper">
            {(previous as KeyInventory[]).map((inv) => (
              <li
                key={inv.id}
                className="flex flex-col gap-1 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{inv.title}</p>
                  <p className="text-sm text-muted">
                    {inv.foundCount ?? 0} von {inv.expectedCount ?? 0} angetroffen
                    {(inv.differences?.length ?? 0) > 0
                      ? ` · ${inv.differences!.length} ${
                          inv.differences!.length === 1 ? 'Differenz' : 'Differenzen'
                        }`
                      : ' · keine Differenzen'}
                  </p>
                </div>
                <p className="text-sm text-muted sm:text-right">{formatDateTime(inv.date)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
