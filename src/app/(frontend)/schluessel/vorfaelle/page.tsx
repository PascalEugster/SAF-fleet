import Link from 'next/link'
import React from 'react'
import type { KeyCopy, KeyIncident, User } from '@/payload-types'
import { formatDateTime } from '@/lib/labels'
import {
  INCIDENT_MEASURE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
} from '@/lib/keyLabels'
import { payloadClient } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

export default async function KeyIncidentsPage() {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'key-incidents',
    sort: '-reportedAt',
    limit: 200,
    depth: 1,
  })

  const incidents = docs as KeyIncident[]
  const open = incidents.filter((i) => i.status !== 'erledigt')
  const closed = incidents.filter((i) => i.status === 'erledigt')

  const Card = ({ incident }: { incident: KeyIncident }) => {
    const copy = typeof incident.copy === 'object' ? (incident.copy as KeyCopy) : null
    const heldBy = typeof incident.heldBy === 'object' ? (incident.heldBy as User) : null
    return (
      <li className="border-b border-line p-4 last:border-b-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold tracking-wider text-army-red">
            {copy?.label ?? '—'}
          </span>
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
          <span className="text-sm text-muted">{formatDateTime(incident.reportedAt)}</span>
          {copy && (
            <Link
              href={`/schluessel/${copy.id}`}
              className="ml-auto text-sm text-army-red hover:underline"
            >
              Zum Exemplar →
            </Link>
          )}
        </div>
        {incident.description && <p className="mt-1 text-sm">{incident.description}</p>}
        {incident.impact && (
          <p className="mt-2 border-l-2 border-line pl-3 text-sm text-muted">{incident.impact}</p>
        )}
        <p className="mt-2 text-xs text-muted">
          Massnahme: {INCIDENT_MEASURE_LABELS[incident.measure] ?? incident.measure}
          {incident.costNote ? ` · ${incident.costNote}` : ''}
          {heldBy ? ` · war bei ${heldBy.name}` : ''}
        </p>
      </li>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      <div className="border-b border-line pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Vorfälle</h1>
        <p className="mt-1 text-muted">
          Verlust, Diebstahl und Defekt. Die Folgenabschätzung ergibt sich aus der Hierarchiestufe
          des Schlüssels; abgeschlossen wird ein Vorfall auf der Seite des Exemplars.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Offen ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
            Kein offener Vorfall.
          </p>
        ) : (
          <ul className="mt-3 border border-line bg-paper">
            {open.map((incident) => (
              <Card key={incident.id} incident={incident} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Erledigt ({closed.length})
        </h2>
        {closed.length === 0 ? (
          <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
            Noch nichts abgeschlossen.
          </p>
        ) : (
          <ul className="mt-3 border border-line bg-paper">
            {closed.map((incident) => (
              <Card key={incident.id} incident={incident} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
