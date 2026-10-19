import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import type { KeyCopy, KeyDepot, User } from '@/payload-types'
import { KeyStatusBadge } from '@/components/KeyStatusBadge'
import { formatDateTime } from '@/lib/labels'
import {
  DEPOT_LOCK_LABELS,
  DEPOT_TYPE_ICONS,
  DEPOT_TYPE_LABELS,
  RISK_LABELS,
  SECURITY_LEVEL_LABELS,
  codeChangeDue,
  isOverdue,
  keyCategoryIcon,
  keyOf,
  personLabel,
  userOf,
} from '@/lib/keyLabels'
import { depotOccupancy, loadKeyScreen, payloadClient, refId } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

/** Highest key exposure this depot may hold, stated in plain words. */
const ALLOWED_BY_LEVEL: Record<string, string> = {
  keine: 'nur Schlüssel der Risikoklasse «Normal»',
  s1: 'bis Risikoklasse «Erhöht»',
  s2: 'bis Risikoklasse «Hoch», aber keine Schutzzone 2 oder 3',
  grad0: 'alle Schlüssel, auch Schutzzone 2 und 3',
  grad1: 'alle Schlüssel, auch Schutzzone 2 und 3',
  grad2: 'alle Schlüssel, auch Schutzzone 2 und 3',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  )
}

export default async function KeyDepotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payload = await payloadClient()

  let depot: KeyDepot
  try {
    depot = (await payload.findByID({ collection: 'key-depots', id, depth: 1 })) as KeyDepot
  } catch {
    notFound()
  }

  const { copies } = await loadKeyScreen()
  const stored = copies.filter((copy) => refId(copy.depot) === String(depot!.id))
  const stats = depotOccupancy(copies).get(String(depot!.id)) ?? {
    total: 0,
    present: 0,
    out: 0,
    blocked: 0,
  }
  const custodian = userOf(depot!.custodian as number | User | null | undefined)
  const codeDue = codeChangeDue(depot!)
  const free = depot!.capacity && depot!.capacity > 0 ? depot!.capacity - stats.total : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/schluessel/depots"
        className="text-sm text-muted hover:text-army-red hover:underline"
      >
        ← Zurück zur Verwahrung
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl leading-none" aria-hidden>
            {DEPOT_TYPE_ICONS[depot!.type] ?? '🔑'}
          </span>
          <div>
            <p className="font-mono text-sm font-bold tracking-wider text-army-red">
              {DEPOT_TYPE_LABELS[depot!.type] ?? depot!.type}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{depot!.name}</h1>
            <p className="mt-1 text-muted">{depot!.location || 'Kein Standort erfasst'}</p>
          </div>
        </div>
        <span className="border border-line bg-mist px-3 py-1.5 text-sm font-semibold">
          {SECURITY_LEVEL_LABELS[depot!.securityLevel] ?? depot!.securityLevel}
        </span>
      </div>

      {codeDue && (
        <div className="mt-6 border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
          Codewechsel fällig
          {depot!.codeChangedAt
            ? ` — zuletzt am ${formatDateTime(depot!.codeChangedAt).slice(0, 10)}, Intervall ${depot!.codeIntervalDays} Tage.`
            : ' — es ist kein Wechsel erfasst.'}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="border border-line border-l-4 border-l-army-red bg-paper p-5">
          <p className="text-3xl font-bold tabular-nums">{stats.total}</p>
          <p className="mt-1 text-sm text-muted">zugeordnet</p>
        </div>
        <div className="border border-line bg-paper p-5">
          <p className="text-3xl font-bold tabular-nums">{stats.present}</p>
          <p className="mt-1 text-sm text-muted">vorhanden</p>
        </div>
        <div className="border border-line bg-paper p-5">
          <p className="text-3xl font-bold tabular-nums">{stats.out}</p>
          <p className="mt-1 text-sm text-muted">draussen</p>
        </div>
        <div className="border border-line bg-paper p-5">
          <p className="text-3xl font-bold tabular-nums">{free === null ? '—' : free}</p>
          <p className="mt-1 text-sm text-muted">Plätze frei</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Zugeordnete Schlüssel ({stored.length})
          </h2>
          {stored.length === 0 ? (
            <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
              Dieser Verwahrung ist noch kein Exemplar zugeordnet.
            </p>
          ) : (
            <ul className="mt-3 border border-line bg-paper">
              {(stored as KeyCopy[]).map((copy) => {
                const key = keyOf(copy.key)
                const holder = userOf(copy.currentHolder)
                return (
                  <li key={copy.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/schluessel/${copy.id}`}
                      className="flex items-center gap-3 p-4 transition hover:bg-mist"
                    >
                      <span className="text-xl leading-none" aria-hidden>
                        {keyCategoryIcon(key?.category)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold tracking-wider text-army-red">
                            {copy.label}
                          </span>
                          <span className="font-semibold">{key?.label ?? '—'}</span>
                          {copy.storageSlot && (
                            <span className="border border-line bg-mist px-1.5 py-0.5 font-mono text-[11px]">
                              {copy.storageSlot}
                            </span>
                          )}
                          {key?.risk && key.risk !== 'normal' && (
                            <span className="border border-line bg-mist px-1.5 py-0.5 text-[11px] font-semibold uppercase">
                              {RISK_LABELS[key.risk]}
                            </span>
                          )}
                        </span>
                        {holder && (
                          <span className="mt-0.5 block text-xs text-muted">
                            bei {holder.name}
                            {copy.dueAt ? ` · bis ${formatDateTime(copy.dueAt)}` : ''}
                          </span>
                        )}
                      </span>
                      <KeyStatusBadge status={copy.status} overdue={isOverdue(copy)} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="border border-line bg-paper">
              <h2 className="border-b border-line p-4 text-sm font-semibold uppercase tracking-wide text-muted">
                Merkmale
              </h2>
              <dl className="divide-y divide-line">
                <Row
                  label="Verschluss"
                  value={DEPOT_LOCK_LABELS[depot!.lockType] ?? depot!.lockType}
                />
                <Row
                  label="Zulässig"
                  value={ALLOWED_BY_LEVEL[depot!.securityLevel] ?? 'nicht bestimmt'}
                />
                <Row
                  label="Verantwortlich"
                  value={custodian ? personLabel(custodian) : 'Nicht zugewiesen'}
                />
                {depot!.systemReference && (
                  <Row label="System" value={depot!.systemReference} />
                )}
                {depot!.selfService && (
                  <Row
                    label="Ausgabe"
                    value="Selbstbedienung — das System gibt frei und protokolliert"
                  />
                )}
                {depot!.lockType === 'doppelverschluss' && (
                  <Row
                    label="Besonderheit"
                    value="Doppelverschluss: jede Ausgabe verlangt eine Zweitunterschrift"
                  />
                )}
                {depot!.externalAccess && (
                  <Row
                    label="Zugriff Dritte"
                    value="Ja — Zugriff durch Dritte ist gemeldet und überwacht"
                  />
                )}
                {depot!.tamperMonitored && <Row label="Überwachung" value="Sabotageüberwacht" />}
              </dl>
            </div>

            {depot!.notes && (
              <div className="border border-line bg-paper p-4">
                <p className="text-sm font-semibold">Bemerkungen</p>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{depot!.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
