import Link from 'next/link'
import React from 'react'
import type { KeyCopy } from '@/payload-types'
import { IssueForm, type IssueItem } from '@/components/IssueForm'
import { keyCategoryName, keyOf } from '@/lib/keyLabels'
import { loadKeyScreen, loadPeopleOptions, refId } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ copy?: string }>

export default async function KeyIssuePage({ searchParams }: { searchParams: SearchParams }) {
  const { copy } = await searchParams
  const { copies, bundles, copyById, memberIds } = await loadKeyScreen()
  const { users, pspValidById } = await loadPeopleOptions(copies)

  const copyItems: IssueItem[] = copies
    .filter((c) => c.status === 'am_brett' && !memberIds.has(String(c.id)))
    .map((c) => {
      const key = keyOf(c.key)
      return {
        kind: 'copy' as const,
        id: String(c.id),
        number: c.label ?? String(c.id),
        title: key?.label ?? '—',
        subtitle: [key?.opensLocation, keyCategoryName(key?.category), c.storageSlot ? `Platz ${c.storageSlot}` : null]
          .filter(Boolean)
          .join(' · '),
        risk: key?.risk ?? null,
        zone: key?.protectionZone ?? null,
        needsPsp: Boolean(key?.requiresPsp),
        needsFourEyes: Boolean(key?.requiresFourEyes),
      }
    })

  const bundleItems: IssueItem[] = bundles
    .filter((b) => !b.currentHolder)
    .map((b) => {
      const members = (b.copies ?? [])
        .map((m) => copyById.get(String(refId(m))))
        .filter(Boolean) as KeyCopy[]
      const keys = members.map((m) => keyOf(m.key))
      return {
        kind: 'bundle' as const,
        id: String(b.id),
        number: b.tagNumber ? `Marke ${b.tagNumber}` : 'Bund',
        title: b.label,
        subtitle: members
          .map((m) => m.label)
          .filter(Boolean)
          .join(', '),
        risk: keys.some((k) => k?.risk === 'hoch')
          ? 'hoch'
          : keys.some((k) => k?.risk === 'erhoeht')
            ? 'erhoeht'
            : 'normal',
        zone: keys.find((k) => k?.requiresPsp)?.protectionZone ?? null,
        needsPsp: keys.some((k) => k?.requiresPsp),
        needsFourEyes: keys.some((k) => k?.requiresFourEyes),
        count: members.length,
      }
    })

  const items = [...bundleItems, ...copyItems]
  const preselected = copy ? [`copy:${copy}`] : []

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/schluessel" className="text-sm text-muted hover:text-army-red hover:underline">
        ← Zurück zum Schlüsselbrett
      </Link>

      <div className="mt-4 border-b border-line pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Schlüsselausgabe</h1>
        <p className="mt-1 text-muted">
          Person wählen, Schlüssel ankreuzen, quittieren. Mehrere Schlüssel gehen in einem Vorgang.
        </p>
      </div>

      <div className="mt-8">
        <IssueForm
          users={users}
          items={items}
          pspValidById={pspValidById}
          preselected={preselected}
        />
      </div>
    </div>
  )
}
