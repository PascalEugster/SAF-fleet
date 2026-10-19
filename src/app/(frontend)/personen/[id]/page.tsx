import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { KeyBundle, KeyCopy, User, Vehicle } from '@/payload-types'
import { releaseVehicle } from '@/app/(frontend)/actions'
import { returnAllForUser, returnBundle, returnCopy } from '@/app/(frontend)/keyActions'
import { SubmitButton } from '@/components/SubmitButton'
import { categoryIcon, categoryName, formatDateTime } from '@/lib/labels'
import {
  PSP_LABELS,
  hasValidPsp,
  isOverdue,
  isServiceOver,
  keyCategoryIcon,
  keyOf,
} from '@/lib/keyLabels'

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

  const [heldCopies, heldBundles] = await Promise.all([
    payload.find({
      collection: 'key-copies',
      where: { currentHolder: { equals: id } },
      limit: 200,
      depth: 2,
      sort: 'label',
    }),
    payload.find({
      collection: 'key-bundles',
      where: { currentHolder: { equals: id } },
      limit: 50,
      depth: 1,
      sort: 'label',
    }),
  ])
  const bundleMemberIds = new Set<string>()
  for (const bundle of heldBundles.docs as KeyBundle[]) {
    for (const member of bundle.copies ?? []) {
      const memberId = idOf(member)
      if (memberId) bundleMemberIds.add(memberId)
    }
  }
  const loseCopies = (heldCopies.docs as KeyCopy[]).filter(
    (c) => !bundleMemberIds.has(String(c.id)),
  )
  const keyCount = heldCopies.totalDocs
  const overdueKeys = (heldCopies.docs as KeyCopy[]).filter((c) => isOverdue(c)).length
  const serviceOver = isServiceOver(person!)

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
            {person!.serviceFunction ? ` · ${person!.serviceFunction}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`border px-2 py-0.5 font-semibold uppercase tracking-wide ${
                hasValidPsp(person!)
                  ? 'border-green-300 bg-green-100 text-green-800'
                  : 'border-line bg-mist text-muted'
              }`}
            >
              {PSP_LABELS[person!.pspLevel ?? 'keine']}
              {person!.pspValidUntil ? ` bis ${formatDateTime(person!.pspValidUntil).slice(0, 10)}` : ''}
            </span>
            {person!.serviceEnd && (
              <span
                className={`border px-2 py-0.5 font-semibold uppercase tracking-wide ${
                  serviceOver
                    ? 'border-army-red bg-army-red text-white'
                    : 'border-line bg-mist text-muted'
                }`}
              >
                Dienstende {formatDateTime(person!.serviceEnd).slice(0, 10)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="border border-line bg-paper px-4 py-3 text-center">
            <p className="text-3xl font-bold tabular-nums text-army-red">{activeVehicles.length}</p>
            <p className="text-xs text-muted">
              {activeVehicles.length === 1 ? 'aktives Fahrzeug' : 'aktive Fahrzeuge'}
            </p>
          </div>
          <div className="border border-line bg-paper px-4 py-3 text-center">
            <p className="text-3xl font-bold tabular-nums text-army-red">{keyCount}</p>
            <p className="text-xs text-muted">Schlüssel</p>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Schlüssel in Besitz
          </h2>
          {keyCount > 0 && (
            <form action={returnAllForUser}>
              <input type="hidden" name="userId" value={id} />
              <button
                type="submit"
                className="border border-army-red bg-paper px-4 py-2 text-sm font-semibold text-army-red transition hover:bg-army-red hover:text-white"
              >
                Alle zurücknehmen ({keyCount})
              </button>
            </form>
          )}
        </div>

        {(serviceOver || (person!.serviceEnd && keyCount > 0)) && (
          <div
            className={`mt-3 border-l-4 p-3 text-sm ${
              serviceOver ? 'border-army-red bg-army-red/5' : 'border-amber-400 bg-amber-50'
            }`}
          >
            {serviceOver
              ? `Der Dienst endete am ${formatDateTime(person!.serviceEnd).slice(0, 10)}. ${
                  keyCount === 0
                    ? 'Alle Schlüssel sind zurück.'
                    : keyCount === 1
                      ? 'Ein Schlüssel ist noch nicht zurück.'
                      : `${keyCount} Schlüssel sind noch nicht zurück.`
                }`
              : `Dienstende am ${formatDateTime(person!.serviceEnd).slice(0, 10)} — bis dahin ${
                  keyCount === 1 ? 'muss der Schlüssel' : `müssen alle ${keyCount} Schlüssel`
                } zurück sein.`}
          </div>
        )}

        {keyCount === 0 ? (
          <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
            Diese Person hat aktuell keinen Schlüssel.
          </p>
        ) : (
          <ul className="mt-3 border border-line bg-paper">
            {(heldBundles.docs as KeyBundle[]).map((bundle) => (
              <li
                key={`bundle-${bundle.id}`}
                className="flex flex-col gap-2 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl leading-none" aria-hidden>
                      🗝️
                    </span>
                    <Link
                      href={`/schluessel/bund/${bundle.id}`}
                      className="font-semibold hover:text-army-red hover:underline"
                    >
                      {bundle.label}
                    </Link>
                    <span className="border border-ink bg-ink px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">
                      Bund · {(bundle.copies ?? []).length}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {bundle.currentReason || 'Kein Grund angegeben'}
                    {bundle.dueAt
                      ? ` · bis ${formatDateTime(bundle.dueAt)}`
                      : ' · Dauerausgabe'}
                  </p>
                </div>
                <form action={returnBundle}>
                  <input type="hidden" name="bundleId" value={String(bundle.id)} />
                  <button
                    type="submit"
                    className="shrink-0 border border-line bg-paper px-3 py-1.5 text-sm font-semibold transition hover:border-army-red"
                  >
                    Zurücknehmen
                  </button>
                </form>
              </li>
            ))}
            {loseCopies.map((copy) => {
              const overdue = isOverdue(copy)
              return (
                <li
                  key={`copy-${copy.id}`}
                  className={`flex flex-col gap-2 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between ${
                    overdue ? 'bg-amber-50' : ''
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl leading-none" aria-hidden>
                        {keyCategoryIcon(keyOf(copy.key)?.category)}
                      </span>
                      <span className="font-mono text-xs font-bold tracking-wider text-army-red">
                        {copy.label}
                      </span>
                      <Link
                        href={`/schluessel/${copy.id}`}
                        className="font-semibold hover:text-army-red hover:underline"
                      >
                        {keyOf(copy.key)?.label ?? '—'}
                      </Link>
                      {overdue && (
                        <span className="border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-amber-900">
                          Überfällig
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {copy.currentReason || 'Kein Grund angegeben'}
                      {copy.dueAt ? ` · bis ${formatDateTime(copy.dueAt)}` : ' · Dauerausgabe'}
                    </p>
                  </div>
                  <form action={returnCopy}>
                    <input type="hidden" name="copyId" value={String(copy.id)} />
                    <button
                      type="submit"
                      className="shrink-0 border border-line bg-paper px-3 py-1.5 text-sm font-semibold transition hover:border-army-red"
                    >
                      Zurücknehmen
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
        {overdueKeys > 0 && (
          <p className="mt-2 text-sm text-amber-800">
            {overdueKeys} {overdueKeys === 1 ? 'Schlüssel ist' : 'Schlüssel sind'} überfällig.
          </p>
        )}
      </section>

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
