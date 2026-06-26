'use client'

import React, { useActionState, useEffect, useRef } from 'react'
import { createUser, type ActionState } from '@/app/(frontend)/actions'
import { SubmitButton } from './SubmitButton'

const RANKS = [
  'Rekrut',
  'Soldat',
  'Gefreiter',
  'Obergefreiter',
  'Korporal',
  'Wachtmeister',
  'Oberwachtmeister',
  'Feldweibel',
  'Hauptfeldweibel',
  'Leutnant',
  'Oberleutnant',
  'Hauptmann',
  'Major',
  'Oberstleutnant',
  'Oberst',
]

export function CreateUserForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createUser, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-4 border border-line bg-paper p-6">
      {state?.error && (
        <p className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm text-army-red">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-800">
          Person erfolgreich erfasst.
        </p>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Name *</span>
        <input
          name="name"
          required
          placeholder="z.B. Hans Muster"
          className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-army-red"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Grad</span>
          <select
            name="rank"
            defaultValue=""
            className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-army-red"
          >
            <option value="">—</option>
            {RANKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Einheit</span>
          <input
            name="unit"
            placeholder="z.B. Pz Bat 12"
            className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-army-red"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">E-Mail *</span>
        <input
          name="email"
          type="email"
          required
          placeholder="hans.muster@vtg.admin.ch"
          className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-army-red"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Passwort *</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          defaultValue="armee2026"
          className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-army-red"
        />
        <span className="mt-1 block text-xs text-muted">
          Mindestens 6 Zeichen. Für den Prototyp vorausgefüllt.
        </span>
      </label>

      <SubmitButton variant="dark" pendingText="Wird erfasst…">
        Person erfassen
      </SubmitButton>
    </form>
  )
}
