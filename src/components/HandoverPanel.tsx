'use client'

import React, { useActionState } from 'react'
import { confirmHandover, type KeyActionState } from '@/app/(frontend)/keyActions'
import { SubmitButton } from './SubmitButton'
import { UserCombobox, type UserOption } from './UserCombobox'

export function HandoverPanel({
  users,
  out,
  overdue,
}: {
  users: UserOption[]
  out: number
  overdue: number
}) {
  const [state, formAction] = useActionState<KeyActionState, FormData>(confirmHandover, null)

  return (
    <form action={formAction} className="space-y-4 border border-line bg-paper p-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Übergabe quittieren
        </h2>
        <p className="mt-1 text-sm text-muted">
          Hält fest, wie viele Schlüssel beim Schichtwechsel draussen waren. Der Eintrag landet im
          Journal und lässt sich nicht mehr ändern.
        </p>
      </div>

      {state?.ok && state.message && (
        <div className="border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-900">
          {state.message}
        </div>
      )}
      {state && !state.ok && state.error && (
        <div className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm">{state.error}</div>
      )}

      <div className="flex flex-wrap gap-4 border-y border-line py-3">
        <div>
          <p className="text-2xl font-bold tabular-nums">{out}</p>
          <p className="text-xs text-muted">Exemplare draussen</p>
        </div>
        <div>
          <p className={`text-2xl font-bold tabular-nums ${overdue > 0 ? 'text-amber-700' : ''}`}>
            {overdue}
          </p>
          <p className="text-xs text-muted">überfällig</p>
        </div>
      </div>

      <div className="block">
        <span className="mb-1 block text-sm font-medium">
          Übernommen durch <span className="font-normal text-muted">(optional)</span>
        </span>
        <UserCombobox users={users} name="toUserId" placeholder="Ablösung suchen…" />
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          Bemerkung <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          type="text"
          name="note"
          placeholder="z.B. Bund Wache Nord bleibt bei der Ablösung"
          className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
        />
      </label>

      <SubmitButton variant="primary" pendingText="Wird quittiert…">
        Übergabe quittieren
      </SubmitButton>
    </form>
  )
}
