import Link from 'next/link'
import React from 'react'
import { returnBundle, returnCopy } from '@/app/(frontend)/keyActions'
import { HandoverPanel } from '@/components/HandoverPanel'
import { formatDateTime } from '@/lib/labels'
import { isOverdue, keyOf, personLabel, userOf } from '@/lib/keyLabels'
import {
  bundleOverdue,
  keyStats,
  loadKeyScreen,
  loadPeopleOptions,
  memberLabels,
  payloadClient,
} from '@/lib/keyQueries'
import type { KeyEvent } from '@/payload-types'

export const dynamic = 'force-dynamic'

type Row = {
  key: string
  id: string
  kind: 'copy' | 'bundle'
  number: string
  title: string
  holder: string
  dueAt?: string | null
  overdue: boolean
  href: string
}

export default async function KeyHandoverPage() {
  const { copies, bundles, copyById, memberIds } = await loadKeyScreen()
  const { users } = await loadPeopleOptions(copies)
  const stats = keyStats(copies)
  const payload = await payloadClient()

  const { docs: handovers } = await payload.find({
    collection: 'key-events',
    where: { type: { equals: 'uebergabe' } },
    sort: '-at',
    limit: 5,
    depth: 0,
  })

  const rows: Row[] = [
    ...bundles
      .filter((b) => Boolean(b.currentHolder))
      .map((b) => ({
        key: `bundle:${b.id}`,
        id: String(b.id),
        kind: 'bundle' as const,
        number: b.tagNumber ? `Marke ${b.tagNumber}` : 'Bund',
        title: `${b.label} (${memberLabels(b, copyById).length} Schlüssel)`,
        holder: personLabel(userOf(b.currentHolder)),
        dueAt: b.dueAt ?? null,
        overdue: bundleOverdue(b),
        href: `/schluessel/bund/${b.id}`,
      })),
    ...copies
      .filter(
        (c) =>
          (c.status === 'ausgegeben' || c.status === 'dauerausgabe') &&
          !memberIds.has(String(c.id)),
      )
      .map((c) => ({
        key: `copy:${c.id}`,
        id: String(c.id),
        kind: 'copy' as const,
        number: c.label ?? String(c.id),
        title: keyOf(c.key)?.label ?? '—',
        holder: personLabel(userOf(c.currentHolder)),
        dueAt: c.dueAt ?? null,
        overdue: isOverdue(c),
        href: `/schluessel/${c.id}`,
      })),
  ].sort((a, b) => Number(b.overdue) - Number(a.overdue))

  const overdueCount = rows.filter((r) => r.overdue).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/schluessel" className="text-sm text-muted hover:text-army-red hover:underline">
        ← Zurück zum Schlüsselbrett
      </Link>

      <div className="mt-4 border-b border-line pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tagesabschluss und Wachübergabe</h1>
        <p className="mt-1 text-muted">
          Alles was draussen ist, überfällige zuoberst. Zurücknehmen oder übergeben.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="border border-line border-l-4 border-l-army-red bg-paper p-5">
          <p className="text-3xl font-bold tabular-nums">{stats.total}</p>
          <p className="mt-1 text-sm text-muted">Soll (Exemplare)</p>
        </div>
        <div className="border border-line bg-paper p-5">
          <p className="text-3xl font-bold tabular-nums">{stats.onBoard}</p>
          <p className="mt-1 text-sm text-muted">Ist am Brett</p>
        </div>
        <div className="border border-line bg-paper p-5">
          <p className="text-3xl font-bold tabular-nums">{stats.out}</p>
          <p className="mt-1 text-sm text-muted">Draussen</p>
        </div>
        <div
          className={`border border-line bg-paper p-5 ${
            overdueCount > 0 ? 'border-l-4 border-l-amber-400 bg-amber-50' : ''
          }`}
        >
          <p className="text-3xl font-bold tabular-nums">{overdueCount}</p>
          <p className="mt-1 text-sm text-muted">Überfällig</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Offene Ausgaben ({rows.length})
            </h2>
            {rows.length === 0 ? (
              <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
                Alle Schlüssel sind am Brett. Sauberer Abschluss.
              </p>
            ) : (
              <ul className="mt-3 border border-line bg-paper">
                {rows.map((row) => (
                  <li
                    key={row.key}
                    className={`flex flex-col gap-2 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between ${
                      row.overdue ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold tracking-wider text-army-red">
                          {row.number}
                        </span>
                        <Link
                          href={row.href}
                          className="font-semibold hover:text-army-red hover:underline"
                        >
                          {row.title}
                        </Link>
                        {row.kind === 'bundle' && (
                          <span className="border border-ink bg-ink px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">
                            Bund
                          </span>
                        )}
                        {row.overdue && (
                          <span className="border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-amber-900">
                            Überfällig
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        bei <span className="font-semibold text-ink">{row.holder}</span>
                        {row.dueAt ? ` · bis ${formatDateTime(row.dueAt)}` : ' · Dauerausgabe'}
                      </p>
                    </div>
                    <form action={row.kind === 'bundle' ? returnBundle : returnCopy}>
                      <input
                        type="hidden"
                        name={row.kind === 'bundle' ? 'bundleId' : 'copyId'}
                        value={row.id}
                      />
                      <button
                        type="submit"
                        className="shrink-0 border border-line bg-paper px-3 py-1.5 text-sm font-semibold transition hover:border-army-red"
                      >
                        Zurücknehmen
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Letzte Übergaben
            </h2>
            {handovers.length === 0 ? (
              <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
                Noch keine Übergabe quittiert.
              </p>
            ) : (
              <ol className="mt-3 border border-line bg-paper">
                {(handovers as KeyEvent[]).map((event) => {
                  const meta = (event.meta ?? {}) as { out?: number; overdue?: number }
                  return (
                    <li
                      key={event.id}
                      className="flex flex-col gap-1 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {meta.out ?? 0} draussen, {meta.overdue ?? 0} überfällig
                        </p>
                        <p className="text-sm text-muted">
                          {event.reason || 'Keine Bemerkung'}
                          {event.personName ? ` · übernommen von ${event.personName}` : ''}
                        </p>
                      </div>
                      <p className="text-sm text-muted sm:text-right">{formatDateTime(event.at)}</p>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <HandoverPanel users={users} out={stats.out} overdue={stats.overdue} />
          </div>
        </div>
      </div>
    </div>
  )
}
