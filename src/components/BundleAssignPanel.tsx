'use client'

import React, { useActionState, useState } from 'react'
import { issueKeys, returnBundle, type KeyActionState } from '@/app/(frontend)/keyActions'
import { SubmitButton } from './SubmitButton'
import { UserCombobox, type UserOption } from './UserCombobox'
import { ZONE_LABELS } from '@/lib/keyLabels'

const DUE_OPTIONS = [
  { value: 'today18', label: 'Heute 18:00' },
  { value: 'tomorrow08', label: 'Morgen 08:00' },
  { value: 'none', label: 'Dauerausgabe (ohne Frist)' },
]

export function BundleAssignPanel({
  bundleId,
  holderName,
  memberCount,
  requiresPsp,
  requiresFourEyes,
  zone,
  users,
  pspValidById,
}: {
  bundleId: string
  holderName: string | null
  memberCount: number
  requiresPsp: boolean
  requiresFourEyes: boolean
  zone: string
  users: UserOption[]
  pspValidById: Record<string, boolean>
}) {
  const [state, formAction] = useActionState<KeyActionState, FormData>(issueKeys, null)
  const [person, setPerson] = useState<UserOption | null>(null)
  const pspMissing = requiresPsp && person !== null && pspValidById[person.id] !== true

  return (
    <div className="sticky top-4 space-y-4 border border-line bg-paper p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Bund verwalten</h2>

      {state && !state.ok && state.error && (
        <div className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm">
          <p className="font-semibold">Ausgabe nicht möglich</p>
          <p className="mt-1">{state.error}</p>
        </div>
      )}

      {holderName ? (
        <div className="space-y-3">
          <div className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm">
            Der ganze Bund ({memberCount} Schlüssel) ist bei{' '}
            <span className="font-semibold">{holderName}</span>.
          </div>
          <form action={returnBundle}>
            <input type="hidden" name="bundleId" value={bundleId} />
            <SubmitButton variant="primary" pendingText="Wird zurückgenommen…">
              Ganzen Bund zurücknehmen
            </SubmitButton>
          </form>
        </div>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="bundleIds" value={bundleId} />
          <div className="border-l-4 border-ink bg-mist p-3 text-sm">
            Alle {memberCount} Schlüssel werden gemeinsam ausgegeben — eine Quittung, ein
            Journaleintrag.
          </div>

          <div className="block">
            <span className="mb-1 block text-sm font-medium">Ausgeben an</span>
            <UserCombobox users={users} name="userId" onSelect={setPerson} />
          </div>

          {requiresPsp && (
            <p className="text-xs text-muted">
              Enthält Schlüssel in {ZONE_LABELS[zone]} — gültige PSP erforderlich.
            </p>
          )}
          {pspMissing && (
            <div className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm">
              <span className="font-semibold">{person?.name}</span> hat keine gültige PSP.
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Rückgabe</span>
            <select
              name="dueMode"
              defaultValue="today18"
              className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
            >
              {DUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Grund <span className="font-normal text-muted">(optional)</span>
            </span>
            <input
              type="text"
              name="reason"
              placeholder="z.B. Wachdienst 18:00–06:00"
              className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
            />
          </label>

          {requiresFourEyes && (
            <div className="border-l-4 border-army-red bg-army-red/5 p-3">
              <p className="text-sm font-semibold">Zweitunterschrift erforderlich</p>
              <div className="mt-2">
                <UserCombobox
                  users={users.filter((u) => u.id !== person?.id)}
                  name="secondSignatureId"
                  placeholder="Zweitunterschrift suchen…"
                />
              </div>
            </div>
          )}

          <SubmitButton variant="primary" pendingText="Wird ausgegeben…">
            Bund ausgeben
          </SubmitButton>
        </form>
      )}
    </div>
  )
}
