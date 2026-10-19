import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import type { KeyBundle, KeyCopy, KeyEvent } from '@/payload-types'
import { KeyStatusBadge } from '@/components/KeyStatusBadge'
import { BundleAssignPanel } from '@/components/BundleAssignPanel'
import { formatDateTime } from '@/lib/labels'
import {
  KEY_EVENT_LABELS,
  RISK_LABELS,
  ZONE_LABELS,
  keyCategoryIcon,
  keyOf,
  personLabel,
  userOf,
} from '@/lib/keyLabels'
import {
  bundleOverdue,
  bundleStatus,
  loadKeyScreen,
  loadPeopleOptions,
  payloadClient,
  refId,
} from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

export default async function KeyBundleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payload = await payloadClient()

  let bundle: KeyBundle
  try {
    bundle = (await payload.findByID({ collection: 'key-bundles', id, depth: 1 })) as KeyBundle
  } catch {
    notFound()
  }

  const { docs: events } = await payload.find({
    collection: 'key-events',
    where: { bundle: { equals: id } },
    sort: '-at',
    limit: 50,
    depth: 0,
  })

  const { copies, copyById } = await loadKeyScreen()
  const { users, pspValidById } = await loadPeopleOptions(copies)

  const members = (bundle!.copies ?? [])
    .map((member) => copyById.get(String(refId(member))))
    .filter(Boolean) as KeyCopy[]
  const keys = members.map((m) => keyOf(m.key))
  const holder = userOf(bundle!.currentHolder)
  const issuedBy = userOf(bundle!.issuedBy)
  const second = userOf(bundle!.secondSignature)
  const needsPsp = keys.some((k) => k?.requiresPsp)
  const needsFourEyes = keys.some((k) => k?.requiresFourEyes)
  const zone = keys.find((k) => k?.requiresPsp)?.protectionZone ?? 'keine'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/schluessel" className="text-sm text-muted hover:text-army-red hover:underline">
        ← Zurück zum Schlüsselbrett
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl leading-none" aria-hidden>
            🗝️
          </span>
          <div>
            <p className="font-mono text-sm font-bold tracking-wider text-army-red">
              {bundle!.tagNumber ? `Marke ${bundle!.tagNumber}` : 'Schlüsselbund'}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{bundle!.label}</h1>
            <p className="mt-1 text-muted">{members.length} Schlüssel am Bund</p>
          </div>
        </div>
        <KeyStatusBadge status={bundleStatus(bundle!)} overdue={bundleOverdue(bundle!)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Schlüssel am Bund
            </h2>
            {members.length === 0 ? (
              <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
                Dem Bund sind noch keine Exemplare zugeordnet.
              </p>
            ) : (
              <ul className="mt-3 border border-line bg-paper">
                {members.map((member) => {
                  const key = keyOf(member.key)
                  return (
                    <li key={member.id} className="border-b border-line last:border-b-0">
                      <Link
                        href={`/schluessel/${member.id}`}
                        className="flex items-center gap-3 p-4 transition hover:bg-mist"
                      >
                        <span className="text-xl leading-none" aria-hidden>
                          {keyCategoryIcon(key?.category)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold tracking-wider text-army-red">
                              {member.label}
                            </span>
                            <span className="font-semibold">{key?.label ?? '—'}</span>
                            {key?.risk && key.risk !== 'normal' && (
                              <span className="border border-line bg-mist px-1.5 py-0.5 text-[11px] font-semibold uppercase">
                                {RISK_LABELS[key.risk]}
                              </span>
                            )}
                            {key?.requiresPsp && (
                              <span className="border border-amber-400 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-amber-900">
                                {ZONE_LABELS[key.protectionZone]}
                              </span>
                            )}
                          </span>
                          {key?.opensLocation && (
                            <span className="mt-0.5 block text-xs text-muted">
                              {key.opensLocation}
                            </span>
                          )}
                        </span>
                        <KeyStatusBadge status={member.status} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {holder && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Aktuelle Ausgabe
              </h2>
              <dl className="mt-3 divide-y divide-line border border-line bg-paper">
                <div className="grid grid-cols-3 gap-2 p-4">
                  <dt className="text-sm text-muted">Inhaber</dt>
                  <dd className="col-span-2 text-sm">{personLabel(holder)}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2 p-4">
                  <dt className="text-sm text-muted">Grund / Auftrag</dt>
                  <dd className="col-span-2 text-sm">
                    {bundle!.currentReason || 'Kein Grund angegeben'}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-2 p-4">
                  <dt className="text-sm text-muted">Ausgegeben am</dt>
                  <dd className="col-span-2 text-sm">{formatDateTime(bundle!.assignedAt)}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2 p-4">
                  <dt className="text-sm text-muted">Rückgabe bis</dt>
                  <dd className="col-span-2 text-sm">
                    {bundle!.dueAt ? formatDateTime(bundle!.dueAt) : 'Dauerausgabe (ohne Frist)'}
                  </dd>
                </div>
                {issuedBy && (
                  <div className="grid grid-cols-3 gap-2 p-4">
                    <dt className="text-sm text-muted">Ausgegeben durch</dt>
                    <dd className="col-span-2 text-sm">{personLabel(issuedBy)}</dd>
                  </div>
                )}
                {second && (
                  <div className="grid grid-cols-3 gap-2 p-4">
                    <dt className="text-sm text-muted">Zweitunterschrift</dt>
                    <dd className="col-span-2 text-sm">{personLabel(second)}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Journal</h2>
            {events.length === 0 ? (
              <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
                Noch keine Bewegung erfasst.
              </p>
            ) : (
              <ol className="mt-3 border border-line bg-paper">
                {(events as KeyEvent[]).map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-col gap-1 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {KEY_EVENT_LABELS[event.type] ?? event.type}
                        {event.personName ? ` — ${event.personName}` : ''}
                      </p>
                      <p className="text-sm text-muted">
                        {event.reason || 'Kein Grund angegeben'}
                        {event.actorName ? ` · gebucht von ${event.actorName}` : ''}
                      </p>
                    </div>
                    <div className="text-sm text-muted sm:text-right">
                      <p>{formatDateTime(event.at)}</p>
                      {event.dueAt && <p>fällig {formatDateTime(event.dueAt)}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="lg:col-span-1">
          <BundleAssignPanel
            bundleId={String(bundle!.id)}
            holderName={holder?.name ?? null}
            memberCount={members.length}
            requiresPsp={needsPsp}
            requiresFourEyes={needsFourEyes}
            zone={zone}
            users={users}
            pspValidById={pspValidById}
          />
        </div>
      </div>
    </div>
  )
}
