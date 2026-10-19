'use client'

import Link from 'next/link'
import React, { useActionState, useState } from 'react'
import {
  breakSeal,
  issueKeys,
  returnCopy,
  setCopyStatus,
  type KeyActionState,
} from '@/app/(frontend)/keyActions'
import { SubmitButton } from './SubmitButton'
import { UserCombobox, type UserOption } from './UserCombobox'
import { ZONE_LABELS } from '@/lib/keyLabels'

const DUE_OPTIONS = [
  { value: 'today18', label: 'Heute 18:00' },
  { value: 'tomorrow08', label: 'Morgen 08:00' },
  { value: 'none', label: 'Dauerausgabe (ohne Frist)' },
]

function Banner({ state }: { state: KeyActionState }) {
  if (!state) return null
  if (state.ok) {
    return (
      <div className="border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-900">
        {state.message ?? 'Gebucht.'}
      </div>
    )
  }
  return (
    <div className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm">{state.error}</div>
  )
}

export function KeyAssignPanel({
  copyId,
  status,
  holderName,
  sealNumber,
  bundle,
  requiresPsp,
  requiresFourEyes,
  zone,
  users,
  pspValidById,
}: {
  copyId: string
  status: string
  holderName: string | null
  sealNumber?: string | null
  bundle: { id: string; label: string } | null
  requiresPsp: boolean
  requiresFourEyes: boolean
  zone: string
  users: UserOption[]
  pspValidById: Record<string, boolean>
}) {
  const [issueState, issueAction] = useActionState<KeyActionState, FormData>(issueKeys, null)
  const [sealState, sealAction] = useActionState<KeyActionState, FormData>(breakSeal, null)
  const [statusState, statusAction] = useActionState<KeyActionState, FormData>(setCopyStatus, null)
  const [person, setPerson] = useState<UserOption | null>(null)

  const locked = ['gesperrt', 'verloren', 'defekt'].includes(status)
  const issued = ['ausgegeben', 'dauerausgabe'].includes(status)
  const sealed = status === 'versiegelt'
  const pspMissing = requiresPsp && person !== null && pspValidById[person.id] !== true

  return (
    <div className="sticky top-4 space-y-4 border border-line bg-paper p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Schlüssel verwalten
      </h2>

      {bundle && (
        <div className="border-l-4 border-ink bg-mist p-3 text-sm">
          Dieses Exemplar gehört zum Bund{' '}
          <Link href={`/schluessel/bund/${bundle.id}`} className="font-semibold hover:underline">
            {bundle.label}
          </Link>
          . Ausgabe und Rücknahme laufen über den Bund.
        </div>
      )}

      {issued && (
        <div className="space-y-3">
          <Banner state={statusState} />
          <div className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm">
            Ausgegeben an <span className="font-semibold">{holderName ?? 'unbekannt'}</span>.
          </div>
          {!bundle && (
            <form action={returnCopy}>
              <input type="hidden" name="copyId" value={copyId} />
              <SubmitButton variant="primary" pendingText="Wird zurückgenommen…">
                Zurücknehmen
              </SubmitButton>
            </form>
          )}
        </div>
      )}

      {sealed && (
        <form action={sealAction} className="space-y-3">
          <Banner state={sealState} />
          <div className="border-l-4 border-blue-400 bg-blue-50 p-3 text-sm text-blue-900">
            Notschlüssel, Siegel intakt{sealNumber ? ` (Nr. ${sealNumber})` : ''}. Der Siegelbruch
            wird protokolliert.
          </div>
          <input type="hidden" name="copyId" value={copyId} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Grund des Siegelbruchs</span>
            <input
              type="text"
              name="reason"
              required
              placeholder="z.B. Zugang Materiallager, Schlüssel verloren"
              className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
            />
          </label>
          <SubmitButton variant="dark" pendingText="Wird protokolliert…">
            Siegel brechen
          </SubmitButton>
        </form>
      )}

      {locked && (
        <form action={statusAction} className="space-y-3">
          <Banner state={statusState} />
          <div className="border-l-4 border-line bg-mist p-3 text-sm">
            Dieses Exemplar ist nicht einsetzbar und kann nicht ausgegeben werden.
          </div>
          <input type="hidden" name="copyId" value={copyId} />
          <input type="hidden" name="status" value="am_brett" />
          <SubmitButton variant="outline" pendingText="Wird freigegeben…">
            Wieder freigeben
          </SubmitButton>
        </form>
      )}

      {status === 'am_brett' && !bundle && (
        <form action={issueAction} className="space-y-3">
          <Banner state={issueState} />
          <input type="hidden" name="copyIds" value={copyId} />

          <div className="block">
            <span className="mb-1 block text-sm font-medium">Ausgeben an</span>
            <UserCombobox users={users} name="userId" onSelect={setPerson} />
          </div>

          {requiresPsp && (
            <p className="text-xs text-muted">
              {ZONE_LABELS[zone]} — gültige Personensicherheitsprüfung erforderlich.
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
              placeholder="z.B. Wachdienst"
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
            Ausgeben
          </SubmitButton>
        </form>
      )}

      {!issued && !locked && (
        <form action={statusAction} className="space-y-3 border-t border-line pt-4">
          <p className="text-sm font-medium">Vorfall erfassen</p>
          <input type="hidden" name="copyId" value={copyId} />
          <input
            type="text"
            name="reason"
            placeholder="Bemerkung (optional)"
            className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              name="status"
              value="verloren"
              className="flex-1 border border-army-red bg-paper px-3 py-2 text-sm font-semibold text-army-red transition hover:bg-army-red hover:text-white"
            >
              Verlust melden
            </button>
            <button
              type="submit"
              name="status"
              value="gesperrt"
              className="flex-1 border border-line bg-paper px-3 py-2 text-sm font-semibold transition hover:border-army-red"
            >
              Sperren
            </button>
            <button
              type="submit"
              name="status"
              value="defekt"
              className="flex-1 border border-line bg-paper px-3 py-2 text-sm font-semibold transition hover:border-army-red"
            >
              Defekt
            </button>
          </div>
        </form>
      )}

      {issued && !bundle && (
        <form action={statusAction} className="space-y-3 border-t border-line pt-4">
          <p className="text-sm font-medium">Vorfall erfassen</p>
          <input type="hidden" name="copyId" value={copyId} />
          <input
            type="text"
            name="reason"
            placeholder="Bemerkung (optional)"
            className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
          />
          <button
            type="submit"
            name="status"
            value="verloren"
            className="w-full border border-army-red bg-paper px-3 py-2 text-sm font-semibold text-army-red transition hover:bg-army-red hover:text-white"
          >
            Verlust melden (Ausgabe wird beendet)
          </button>
        </form>
      )}
    </div>
  )
}
