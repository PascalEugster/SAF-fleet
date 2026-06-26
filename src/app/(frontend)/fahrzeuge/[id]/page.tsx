import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { User, Vehicle } from '@/payload-types'
import { StatusBadge } from '@/components/StatusBadge'
import { AssignPanel } from '@/components/AssignPanel'
import { categoryIcon, categoryName, formatDateTime } from '@/lib/labels'

export const dynamic = 'force-dynamic'

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payload = await getPayload({ config: await config })

  let vehicle: Vehicle
  try {
    vehicle = (await payload.findByID({
      collection: 'vehicles',
      id,
      depth: 2,
    })) as Vehicle
  } catch {
    notFound()
  }

  const { docs: users } = await payload.find({
    collection: 'users',
    limit: 200,
    sort: 'name',
    depth: 0,
  })

  // Count how many vehicles each person is currently active on (multi-vehicle support).
  const { docs: busyVehicles } = await payload.find({
    collection: 'vehicles',
    limit: 500,
    depth: 0,
    where: { currentUser: { exists: true } },
  })
  const activeCountByUser = new Map<string, number>()
  for (const v of busyVehicles as Vehicle[]) {
    const uid = typeof v.currentUser === 'object' ? (v.currentUser as User)?.id : v.currentUser
    if (uid == null) continue
    const key = String(uid)
    activeCountByUser.set(key, (activeCountByUser.get(key) ?? 0) + 1)
  }

  const currentUser =
    typeof vehicle!.currentUser === 'object' ? (vehicle!.currentUser as User) : null

  const history = [...(vehicle!.usageHistory ?? [])].reverse()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-army-red hover:underline">
        ← Zurück zur Übersicht
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl leading-none" aria-hidden>
            {categoryIcon(vehicle!.category)}
          </span>
          <div>
            <p className="font-mono text-sm font-bold tracking-wider text-army-red">
              {vehicle!.mNumber}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{vehicle!.name}</h1>
            <p className="mt-1 text-muted">{categoryName(vehicle!.category)}</p>
          </div>
        </div>
        <StatusBadge status={vehicle!.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left: details + history */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Fahrzeugdaten
            </h2>
            <dl className="mt-3 divide-y divide-line border border-line bg-paper">
              <Row label="M-Nummer" value={vehicle!.mNumber} mono />
              <Row label="Bezeichnung" value={vehicle!.name} />
              <Row label="Kategorie" value={categoryName(vehicle!.category)} />
              <Row
                label="Aktueller Nutzer"
                value={currentUser ? `${currentUser.name}${currentUser.rank ? ` (${currentUser.rank})` : ''}` : '—'}
              />
              {currentUser && (
                <Row label="Grund der Nutzung" value={vehicle!.currentReason || 'Kein Grund angegeben'} />
              )}
              {currentUser && <Row label="Im Einsatz seit" value={formatDateTime(vehicle!.assignedAt)} />}
              {vehicle!.notes && <Row label="Bemerkungen" value={vehicle!.notes} />}
            </dl>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Nutzungshistorie
            </h2>
            {history.length === 0 ? (
              <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
                Noch keine Einsätze erfasst.
              </p>
            ) : (
              <ol className="mt-3 border border-line bg-paper">
                {history.map((entry, i) => {
                  const entryUser =
                    typeof entry.user === 'object' && entry.user
                      ? (entry.user as User).name
                      : entry.userName
                  const ongoing = !entry.returnedAt
                  return (
                    <li
                      key={entry.id ?? i}
                      className="flex flex-col gap-1 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{entryUser || 'Unbekannt'}</p>
                        <p className="text-sm text-muted">
                          {entry.reason || 'Kein Grund angegeben'}
                        </p>
                      </div>
                      <div className="text-sm text-muted sm:text-right">
                        <p>{formatDateTime(entry.assignedAt)}</p>
                        <p>
                          {ongoing ? (
                            <span className="font-semibold text-army-red">läuft</span>
                          ) : (
                            <>bis {formatDateTime(entry.returnedAt)}</>
                          )}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>

        {/* Right: assignment panel */}
        <div className="lg:col-span-1">
          <AssignPanel
            vehicleId={String(vehicle!.id)}
            status={vehicle!.status}
            currentUser={currentUser ? { name: currentUser.name } : null}
            users={(users as User[]).map((u) => ({
              id: String(u.id),
              name: u.name,
              rank: u.rank ?? null,
              activeCount: activeCountByUser.get(String(u.id)) ?? 0,
            }))}
          />
        </div>
      </div>
    </div>
  )
}

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
