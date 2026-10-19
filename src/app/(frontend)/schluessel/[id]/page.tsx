import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import type { KeyBundle, KeyCopy, KeyEvent, KeyIncident } from '@/payload-types'
import { KeyStatusBadge } from '@/components/KeyStatusBadge'
import { KeyAssignPanel } from '@/components/KeyAssignPanel'
import { formatDateTime } from '@/lib/labels'
import {
  INCIDENT_MEASURE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  HIERARCHY_LABELS,
  KEY_EVENT_LABELS,
  MEDIUM_LABELS,
  RISK_LABELS,
  ZONE_LABELS,
  isOverdue,
  keyCategoryIcon,
  keyCategoryName,
  keyOf,
  personLabel,
  userOf,
} from '@/lib/keyLabels'
import { loadKeyScreen, loadPeopleOptions, payloadClient } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`col-span-2 text-sm ${mono ? 'font-mono font-semibold text-army-red' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

export default async function KeyCopyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payload = await payloadClient()

  let copy: KeyCopy
  try {
    copy = (await payload.findByID({ collection: 'key-copies', id, depth: 2 })) as KeyCopy
  } catch {
    notFound()
  }

  const { docs: incidents } = await payload.find({
    collection: 'key-incidents',
    where: { copy: { equals: id } },
    sort: '-reportedAt',
    limit: 20,
    depth: 0,
  })

  const { docs: events } = await payload.find({
    collection: 'key-events',
    where: { copy: { equals: id } },
    sort: '-at',
    limit: 50,
    depth: 0,
  })

  const { copies } = await loadKeyScreen()
  const { users, pspValidById } = await loadPeopleOptions(copies)

  const key = keyOf(copy!.key)
  const holder = userOf(copy!.currentHolder)
  const issuedBy = userOf(copy!.issuedBy)
  const second = userOf(copy!.secondSignature)
  const bundle =
    copy!.bundle && typeof copy!.bundle === 'object' ? (copy!.bundle as KeyBundle) : null
  const overdue = isOverdue(copy!)
  const openIncident = (incidents as KeyIncident[]).find((i) => i.status !== 'erledigt') ?? null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/schluessel" className="text-sm text-muted hover:text-army-red hover:underline">
        ← Zurück zum Schlüsselbrett
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl leading-none" aria-hidden>
            {keyCategoryIcon(key?.category)}
          </span>
          <div>
            <p className="font-mono text-sm font-bold tracking-wider text-army-red">
              {copy!.label}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{key?.label ?? '—'}</h1>
            <p className="mt-1 text-muted">
              {keyCategoryName(key?.category)}
              {key?.opensLocation ? ` · ${key.opensLocation}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {key?.hierarchy && key.hierarchy !== 'ES' && (
            <span className="border border-ink bg-ink px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {key.hierarchy}
            </span>
          )}
          <KeyStatusBadge status={copy!.status} overdue={overdue} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Schlüsseldaten
            </h2>
            <dl className="mt-3 divide-y divide-line border border-line bg-paper">
              <Row label="Schlüsselnummer" value={key?.keyNumber ?? '—'} mono />
              <Row label="Exemplar" value={`Nr. ${copy!.copyNumber}`} />
              <Row label="Art" value={MEDIUM_LABELS[copy!.medium] ?? copy!.medium} />
              <Row
                label="Hierarchiestufe"
                value={key?.hierarchy ? HIERARCHY_LABELS[key.hierarchy] : '—'}
              />
              <Row label="Risikoklasse" value={key?.risk ? RISK_LABELS[key.risk] : '—'} />
              <Row
                label="Schutzzone"
                value={key?.protectionZone ? ZONE_LABELS[key.protectionZone] : '—'}
              />
              {key?.requiresPsp && <Row label="Auflage" value="Gültige PSP erforderlich" />}
              {key?.requiresFourEyes && <Row label="Auflage" value="Vier-Augen-Prinzip" />}
              {copy!.storageSlot && <Row label="Platz am Brett" value={copy!.storageSlot} />}
              {copy!.tagNumber && <Row label="Marke / Pfand" value={copy!.tagNumber} />}
              {bundle && <Row label="Teil von Bund" value={bundle.label} />}
              {copy!.seal?.sealNumber && (
                <Row
                  label="Siegel"
                  value={`Nr. ${copy!.seal.sealNumber}${copy!.seal.sealed ? ' (intakt)' : ' (gebrochen)'}`}
                />
              )}
              {key?.notes && <Row label="Bemerkungen zur Schliessung" value={key.notes} />}
              {copy!.notes && <Row label="Bemerkungen zum Exemplar" value={copy!.notes} />}
            </dl>
          </section>

          {holder && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Aktuelle Ausgabe
              </h2>
              <dl className="mt-3 divide-y divide-line border border-line bg-paper">
                <Row label="Inhaber" value={personLabel(holder)} />
                <Row label="Grund / Auftrag" value={copy!.currentReason || 'Kein Grund angegeben'} />
                <Row label="Ausgegeben am" value={formatDateTime(copy!.assignedAt)} />
                <Row
                  label="Rückgabe bis"
                  value={copy!.dueAt ? formatDateTime(copy!.dueAt) : 'Dauerausgabe (ohne Frist)'}
                />
                {issuedBy && <Row label="Ausgegeben durch" value={personLabel(issuedBy)} />}
                {second && <Row label="Zweitunterschrift" value={personLabel(second)} />}
              </dl>
            </section>
          )}

          {incidents.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Vorfälle</h2>
              <ul className="mt-3 border border-line bg-paper">
                {(incidents as KeyIncident[]).map((incident) => (
                  <li key={incident.id} className="border-b border-line p-4 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {INCIDENT_TYPE_LABELS[incident.type] ?? incident.type}
                      </span>
                      <span
                        className={`border px-1.5 py-0.5 text-[11px] font-semibold uppercase ${
                          incident.status === 'erledigt'
                            ? 'border-line bg-mist text-muted'
                            : 'border-army-red bg-army-red text-white'
                        }`}
                      >
                        {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
                      </span>
                      <span className="text-sm text-muted">
                        {formatDateTime(incident.reportedAt)}
                      </span>
                    </div>
                    {incident.description && <p className="mt-1 text-sm">{incident.description}</p>}
                    {incident.impact && (
                      <p className="mt-2 border-l-2 border-line pl-3 text-sm text-muted">
                        {incident.impact}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      Massnahme: {INCIDENT_MEASURE_LABELS[incident.measure] ?? incident.measure}
                      {incident.costNote ? ` · ${incident.costNote}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
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
          <KeyAssignPanel
            copyId={String(copy!.id)}
            status={copy!.status}
            holderName={holder?.name ?? null}
            sealNumber={copy!.seal?.sealNumber ?? null}
            tagNumber={copy!.tagNumber ?? null}
            bundle={bundle ? { id: String(bundle.id), label: bundle.label } : null}
            requiresPsp={Boolean(key?.requiresPsp)}
            requiresFourEyes={Boolean(key?.requiresFourEyes)}
            zone={key?.protectionZone ?? 'keine'}
            users={users}
            pspValidById={pspValidById}
            openIncident={
              openIncident
                ? {
                    id: String(openIncident.id),
                    impact: openIncident.impact ?? null,
                    measure: openIncident.measure,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  )
}
