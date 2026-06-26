'use client'

import React, { useActionState } from 'react'
import { createVehicle, type ActionState } from '@/app/(frontend)/actions'
import { SubmitButton } from './SubmitButton'

type CategoryOption = { id: string; name: string; icon: string | null }

export function CreateVehicleForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createVehicle, null)

  return (
    <form action={formAction} className="space-y-4 border border-line bg-paper p-6">
      {state?.error && (
        <p className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm text-army-red">
          {state.error}
        </p>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium">M-Nummer *</span>
        <input
          name="mNumber"
          required
          placeholder="M-312321"
          pattern="M-\d{4,7}"
          title="Format: M-XXXXXX (z.B. M-312321)"
          className="w-full border border-line bg-paper px-3 py-2 font-mono outline-none focus:border-army-red"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Bezeichnung *</span>
        <input
          name="name"
          required
          placeholder="z.B. DURO 6x6"
          className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-army-red"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Kategorie *</span>
        <select
          name="category"
          required
          defaultValue=""
          className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-army-red"
        >
          <option value="" disabled>
            Kategorie auswählen…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ''}
              {c.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <span className="mt-1 block text-xs text-army-red">
            Noch keine Kategorien erfasst. Bitte zuerst im Admin-Bereich unter «Kategorien» anlegen.
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          Bemerkungen <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={3}
          className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-army-red"
        />
      </label>

      <SubmitButton variant="primary" pendingText="Wird erfasst…">
        Fahrzeug erfassen
      </SubmitButton>
    </form>
  )
}
