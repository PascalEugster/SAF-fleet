import Link from 'next/link'
import React from 'react'
import type { KeyCopy } from '@/payload-types'
import { KeyBoard, type BoardItem } from '@/components/KeyBoard'
import {
  isOverdue,
  keyCategoryIcon,
  keyCategoryId,
  keyCategoryName,
  keyOf,
  userOf,
} from '@/lib/keyLabels'
import { bundleOverdue, bundleStatus, loadKeyScreen, memberLabels, refId } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ category?: string; status?: string; q?: string }>

/** Which filter bucket a copy falls into — issued and on permanent issue are one. */
function statusGroup(status: string): BoardItem['statusGroup'] {
  if (status === 'ausgegeben' || status === 'dauerausgabe') return 'out'
  if (status === 'versiegelt') return 'versiegelt'
  if (status === 'am_brett') return 'am_brett'
  return 'blocked'
}

export default async function KeyBoardPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, status, q } = await searchParams
  const { copies, bundles, categories, copyById, memberIds } = await loadKeyScreen()

  const bundleItems: BoardItem[] = bundles.map((bundle) => {
    const members = (bundle.copies ?? [])
      .map((member) => copyById.get(String(refId(member))))
      .filter(Boolean) as KeyCopy[]
    const holder = userOf(bundle.currentHolder)
    const group = statusGroup(bundleStatus(bundle))
    // A bundle belongs to every category on the ring.
    const categoryIds = members
      .map((member) => keyCategoryId(keyOf(member.key)?.category))
      .filter(Boolean) as string[]
    const count = members.length

    return {
      kind: 'bundle' as const,
      categoryId: categoryIds[0] ?? null,
      statusGroup: group,
      overdue: bundleOverdue(bundle),
      search: [
        bundle.label,
        bundle.tagNumber,
        holder?.name,
        ...memberLabels(bundle, copyById),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      tile: {
        href: `/schluessel/bund/${bundle.id}`,
        icon: '🗝️',
        number: bundle.tagNumber ? `Marke ${bundle.tagNumber}` : 'Bund',
        title: bundle.label,
        subtitle: `${count} Schlüssel am Bund`,
        status: bundleStatus(bundle),
        overdue: bundleOverdue(bundle),
        holder: holder?.name ?? null,
        dueAt: bundle.dueAt ?? null,
        marker: 'BUND',
      },
    }
  })

  // Keys on a ring are shown inside their bundle, not as their own tile.
  const copyItems: BoardItem[] = copies
    .filter((copy) => !memberIds.has(String(copy.id)))
    .map((copy) => {
      const key = keyOf(copy.key)
      const holder = userOf(copy.currentHolder)
      return {
        kind: 'copy' as const,
        categoryId: keyCategoryId(key?.category),
        statusGroup: statusGroup(copy.status),
        overdue: isOverdue(copy),
        search: [
          copy.label,
          key?.label,
          key?.keyNumber,
          key?.opensLocation,
          copy.tagNumber,
          copy.storageSlot,
          holder?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
        tile: {
          href: `/schluessel/${copy.id}`,
          icon: keyCategoryIcon(key?.category),
          number: key?.keyNumber ?? '—',
          title: key?.label ?? (copy.label ?? '—'),
          subtitle: key?.opensLocation || keyCategoryName(key?.category),
          status: copy.status,
          overdue: isOverdue(copy),
          holder: holder?.name ?? null,
          dueAt: copy.dueAt ?? null,
          risk: key?.risk ?? null,
          marker: key?.hierarchy && key.hierarchy !== 'ES' ? key.hierarchy : null,
          slot: copy.storageSlot ?? null,
        },
      }
    })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schlüsselbrett</h1>
          <p className="mt-1 text-muted">
            Zimmer, Material, Anlage und Sicherheit — wer hat welchen Schlüssel.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/schluessel/ausgabe"
            className="bg-army-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-army-red-dark"
          >
            Ausgabe
          </Link>
          <Link
            href="/schluessel/ruecknahme"
            className="border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Rücknahme
          </Link>
        </div>
      </div>

      <KeyBoard
        items={[...bundleItems, ...copyItems]}
        categories={categories.map((cat) => ({
          id: String(cat.id),
          name: cat.name,
          icon: cat.icon,
        }))}
        initial={{ status, category, q }}
      />
    </div>
  )
}
