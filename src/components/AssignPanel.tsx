'use client'

import Link from 'next/link'
import React from 'react'
import { assignVehicle, releaseVehicle, setMaintenance } from '@/app/(frontend)/actions'
import { SubmitButton } from './SubmitButton'
import { UserCombobox, type UserOption } from './UserCombobox'

export function AssignPanel({
  vehicleId,
  status,
  currentUser,
  users,
}: {
  vehicleId: string
  status: string
  currentUser: { name: string } | null
  users: UserOption[]
}) {
  const inMaintenance = status === 'maintenance'

  return (
    <div className="sticky top-4 space-y-4 border border-line bg-paper p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Einsatz verwalten</h2>

      {currentUser ? (
        <div className="space-y-3">
          <div className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm">
            Aktuell im Einsatz durch <span className="font-semibold">{currentUser.name}</span>.
          </div>
          <form action={releaseVehicle}>
            <input type="hidden" name="vehicleId" value={vehicleId} />
            <SubmitButton variant="primary" pendingText="Wird freigegeben…">
              Fahrzeug freigeben
            </SubmitButton>
          </form>
        </div>
      ) : inMaintenance ? (
        <div className="space-y-3">
          <div className="border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
            Dieses Fahrzeug ist in Wartung und kann nicht zugewiesen werden.
          </div>
          <form action={setMaintenance}>
            <input type="hidden" name="vehicleId" value={vehicleId} />
            <input type="hidden" name="enable" value="false" />
            <SubmitButton variant="outline" pendingText="Wird aktualisiert…">
              Wartung beenden
            </SubmitButton>
          </form>
        </div>
      ) : users.length === 0 ? (
        <div className="space-y-3 text-sm text-muted">
          <p>Es sind noch keine Personen erfasst.</p>
          <Link
            href="/personen"
            className="inline-block bg-ink px-4 py-2 font-semibold text-white"
          >
            Person erfassen
          </Link>
        </div>
      ) : (
        <form action={assignVehicle} className="space-y-3">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <div className="block">
            <span className="mb-1 block text-sm font-medium">Nutzer zuweisen</span>
            <UserCombobox users={users} name="userId" />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Grund der Nutzung <span className="font-normal text-muted">(optional)</span>
            </span>
            <input
              type="text"
              name="reason"
              placeholder="z.B. Materialtransport WK 2026"
              className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
            />
          </label>
          <SubmitButton variant="primary" pendingText="Wird zugewiesen…">
            Zuweisen
          </SubmitButton>
        </form>
      )}

      {!currentUser && !inMaintenance && (
        <form action={setMaintenance} className="border-t border-line pt-3">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <input type="hidden" name="enable" value="true" />
          <SubmitButton variant="outline" pendingText="Wird aktualisiert…">
            In Wartung setzen
          </SubmitButton>
        </form>
      )}
    </div>
  )
}
