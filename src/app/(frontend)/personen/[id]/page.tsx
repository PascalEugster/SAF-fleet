import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { User, Vehicle } from '@/payload-types'
import { releaseVehicle } from '@/app/(frontend)/actions'
import { SubmitButton } from '@/components/SubmitButton'
import { categoryIcon, categoryName, formatDateTime } from '@/lib/labels'

export const dynamic = 'force-dynamic'

const idOf = (v: unknown): string | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') return String((v as { id: number | string }).id)
  return String(v)
}

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payload = await getPayload({ config: await config })

  let person: User
  try {
    person = (await payload.findByID({ collection: 'users', id, depth: 0 })) as User
  } catch {
    notFound()
  }

  const { docs: vehicles } = await payload.find({
    collection: 'vehicles',
    limit: 500,
    depth: 1,
    sort: 'mNumber',
  })

  const activeVehicles = (vehicles as Vehicle[]).filter((v) => idOf(v.currentUser) === id)

  // Aggregate this person's usage history across the whole fleet.
  type HistoryRow = {
    vehicle: Vehicle
    reason?: string | null
    assignedAt?: string | null
    returnedAt?: string | null
  }
  const history: HistoryRow[] = []
  for (const v of vehicles as Vehicle[]) {
    for (const h of v.usageHistory ?? []) {
      if (idOf(h.user) === id) {
        history.push({ vehicle: v, reason: h.reason, assignedAt: h.assignedAt, returnedAt: h.returnedAt })
      }
    }
  }
  history.sort((a, b) => (b.assignedAt ?? '').localeCompare(a.assignedAt ?? ''))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/personen" className="text-sm text-muted hover:text-army-red hover:underline">
        ← Zurück zu Personen
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {person!.rank ? <span className="text-muted">{person!.rank} </span> : null}
            {person!.name}
          </h1>
          <p className="mt-1 text-muted">
            {person!.email}
            {person!.unit ? ` · ${person!.unit}` : ''}
          </p>
        </div>
        <div className="border border-line bg-paper px-4 py-3 text-center">
          <p className="text-3xl font-bold tabular-nums text-army-red">{activeVehicles.length}</p>
          <p className="text-xs text-muted">
            {activeVehicles.length === 1 ? 'aktives Fahrzeug' : 'aktive Fahrzeuge'}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Active vehicles */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Aktuell im Einsatz
          </h2>
          {activeVehicles.length === 0 ? (
            <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
              Diese Person ist aktuell keinem Fahrzeug zugewiesen.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {activeVehicles.map((v) => (
                <div key={v.id} className="border border-line bg-paper p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/fahrzeuge/${v.id}`} className="flex items-start gap-3 hover:text-army-red">
                      <span className="text-2xl leading-none" aria-hidden>
                        {categoryIcon(v.category)}
                      </span>
                      <span>
                        <span className="block font-mono text-sm font-bold text-army-red">
                          {v.mNumber}
                        </span>
                        <span className="block font-semibold">{v.name}</span>
                        <span className="block text-sm text-muted">{categoryName(v.category)}</span>
                      </span>
                    </Link>
                    <form action={releaseVehicle} className="w-32 shrink-0">
                      <input type="hidden" name="vehicleId" value={String(v.id)} />
                      <SubmitButton variant="outline" pendingText="…">
                        Freigeben
                      </SubmitButton>
                    </form>
                  </div>
                  {v.currentReason && (
                    <p className="mt-2 border-t border-line pt-2 text-sm">
                      <span className="text-muted">Grund: </span>
                      {v.currentReason}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted">Seit {formatDateTime(v.assignedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History across fleet */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Nutzungshistorie (gesamte Flotte)
          </h2>
          {history.length === 0 ? (
            <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
              Noch keine Einsätze erfasst.
            </p>
          ) : (
            <ol className="mt-3 border border-line bg-paper">
              {history.map((h, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-1 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/fahrzeuge/${h.vehicle.id}`}
                      className="font-mono text-sm font-bold text-army-red hover:underline"
                    >
                      {h.vehicle.mNumber}
                    </Link>
                    <span className="ml-2 text-sm">{h.vehicle.name}</span>
                    <p className="text-sm text-muted">{h.reason || 'Kein Grund angegeben'}</p>
                  </div>
                  <div className="text-sm text-muted sm:text-right">
                    <p>{formatDateTime(h.assignedAt)}</p>
                    <p>
                      {h.returnedAt ? (
                        <>bis {formatDateTime(h.returnedAt)}</>
                      ) : (
                        <span className="font-semibold text-army-red">läuft</span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
