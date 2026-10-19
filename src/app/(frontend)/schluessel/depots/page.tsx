import Link from 'next/link'
import React from 'react'
import type { KeyDepot, User } from '@/payload-types'
import { formatDateTime } from '@/lib/labels'
import {
  DEPOT_LOCK_LABELS,
  DEPOT_TYPE_ICONS,
  DEPOT_TYPE_LABELS,
  SECURITY_LEVEL_LABELS,
  codeChangeDue,
  personLabel,
  userOf,
} from '@/lib/keyLabels'
import { depotOccupancy, loadDepots, loadKeyScreen } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-line bg-mist px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
      {children}
    </span>
  )
}

export default async function KeyDepotsPage() {
  const [depots, { copies }] = await Promise.all([loadDepots(), loadKeyScreen()])
  const occupancy = depotOccupancy(copies)
  const unassigned = copies.filter((copy) => !copy.depot).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="border-b border-line pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Verwahrung</h1>
        <p className="mt-1 text-muted">
          Nicht jeder Schlüssel hängt am Brett. Schrank, Tresor, Ausgabeautomat, Objektdepot für
          Dritte, Siegelschrank oder rein elektronische Berechtigung — jede Art hat eigene Regeln.
        </p>
      </div>

      {unassigned > 0 && (
        <div className="mt-6 border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
          {unassigned} {unassigned === 1 ? 'Exemplar ist' : 'Exemplare sind'} keiner Verwahrung
          zugeordnet.
        </div>
      )}

      {depots.length === 0 ? (
        <p className="mt-6 border border-dashed border-line bg-paper p-6 text-sm text-muted">
          Noch keine Verwahrung erfasst.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {(depots as KeyDepot[]).map((depot) => {
            const stats = occupancy.get(String(depot.id)) ?? {
              total: 0,
              present: 0,
              out: 0,
              blocked: 0,
            }
            const custodian = userOf(depot.custodian as number | User | null | undefined)
            const codeDue = codeChangeDue(depot)
            const free =
              depot.capacity && depot.capacity > 0 ? depot.capacity - stats.total : null

            return (
              <Link
                key={depot.id}
                href={`/schluessel/depots/${depot.id}`}
                className="flex flex-col border border-line bg-paper p-5 transition hover:border-army-red"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl leading-none" aria-hidden>
                    {DEPOT_TYPE_ICONS[depot.type] ?? '🔑'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{depot.name}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {DEPOT_TYPE_LABELS[depot.type] ?? depot.type}
                      {depot.location ? ` · ${depot.location}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 border border-line bg-mist px-2 py-1 text-xs font-semibold">
                    {SECURITY_LEVEL_LABELS[depot.securityLevel] ?? depot.securityLevel}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 border-y border-line py-3">
                  <div>
                    <p className="text-xl font-bold tabular-nums">{stats.present}</p>
                    <p className="text-xs text-muted">vorhanden</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums">{stats.out}</p>
                    <p className="text-xs text-muted">draussen</p>
                  </div>
                  {stats.blocked > 0 && (
                    <div>
                      <p className="text-xl font-bold tabular-nums text-army-red">
                        {stats.blocked}
                      </p>
                      <p className="text-xs text-muted">gesperrt</p>
                    </div>
                  )}
                  {free !== null && (
                    <div>
                      <p
                        className={`text-xl font-bold tabular-nums ${free < 0 ? 'text-army-red' : ''}`}
                      >
                        {free}
                      </p>
                      <p className="text-xs text-muted">{free < 0 ? 'zu viel' : 'Plätze frei'}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Flag>{DEPOT_LOCK_LABELS[depot.lockType] ?? depot.lockType}</Flag>
                  {depot.selfService && <Flag>Selbstbedienung</Flag>}
                  {depot.externalAccess && <Flag>Zugriff Dritte</Flag>}
                  {depot.tamperMonitored && <Flag>Sabotageüberwacht</Flag>}
                  {codeDue && (
                    <span className="border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-amber-900">
                      Codewechsel fällig
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-muted">
                  {custodian ? `Verantwortlich: ${personLabel(custodian)}` : 'Keine verantwortliche Person'}
                  {depot.codeChangedAt
                    ? ` · Code zuletzt ${formatDateTime(depot.codeChangedAt).slice(0, 10)}`
                    : ''}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
