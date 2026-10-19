'use client'

import React, { useActionState, useMemo, useState } from 'react'
import { issueKeys, type KeyActionState } from '@/app/(frontend)/keyActions'
import { UserCombobox, type UserOption } from './UserCombobox'
import { SubmitButton } from './SubmitButton'
import { RISK_LABELS, RISK_STYLES, ZONE_LABELS } from '@/lib/keyLabels'

export type IssueItem = {
  kind: 'copy' | 'bundle'
  id: string
  number: string
  title: string
  subtitle?: string | null
  risk?: string | null
  zone?: string | null
  needsPsp?: boolean
  needsFourEyes?: boolean
  count?: number
}

const DUE_MODES = [
  { value: 'today18', label: 'Heute 18:00' },
  { value: 'tomorrow08', label: 'Morgen 08:00' },
  { value: 'none', label: 'Dauerausgabe' },
  { value: 'custom', label: 'Eigene Frist' },
]

export function IssueForm({
  users,
  items,
  pspValidById,
  preselected = [],
}: {
  users: UserOption[]
  items: IssueItem[]
  /** Which people currently hold a valid security screening. */
  pspValidById: Record<string, boolean>
  preselected?: string[]
}) {
  const [state, formAction] = useActionState<KeyActionState, FormData>(issueKeys, null)
  const [query, setQuery] = useState('')
  const [person, setPerson] = useState<UserOption | null>(null)
  const [dueMode, setDueMode] = useState('today18')
  const [selected, setSelected] = useState<Set<string>>(new Set(preselected))

  const keyOf = (item: IssueItem) => `${item.kind}:${item.id}`

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return items
    return items.filter((i) =>
      `${i.number} ${i.title} ${i.subtitle ?? ''}`.toLowerCase().includes(q),
    )
  }, [items, query])

  const chosen = useMemo(
    () => items.filter((i) => selected.has(keyOf(i))),
    [items, selected],
  )
  const selectedCount = chosen.length
  const needsFourEyes = chosen.some((i) => i.needsFourEyes)
  const needsPsp = chosen.some((i) => i.needsPsp)
  const pspMissing = needsPsp && person !== null && pspValidById[person.id] !== true

  const toggle = (item: IssueItem) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const k = keyOf(item)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  return (
    <form action={formAction} className="space-y-8">
      {state?.ok && state.message && (
        <div className="border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-900">
          {state.message}
          {state.failures && state.failures.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-amber-900">
              {state.failures.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {state && !state.ok && state.error && (
        <div className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm">
          <p className="font-semibold">Ausgabe nicht möglich</p>
          <p className="mt-1">{state.error}</p>
          {state.failures && state.failures.length > 1 && (
            <ul className="mt-2 list-disc pl-5">
              {state.failures.slice(1).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Step 1 — person */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          1 · Person
        </h2>
        <div className="mt-3 max-w-md">
          <UserCombobox users={users} name="userId" onSelect={setPerson} />
        </div>
        {pspMissing && (
          <div className="mt-3 max-w-xl border-l-4 border-army-red bg-army-red/5 p-3 text-sm">
            <span className="font-semibold">{person?.name}</span> hat keine gültige
            Personensicherheitsprüfung. Schlüssel in Schutzzone 2/3 können nicht ausgegeben werden.
          </div>
        )}
      </section>

      {/* Step 2 — keys */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            2 · Schlüssel{' '}
            {selectedCount > 0 && <span className="text-army-red">({selectedCount})</span>}
          </h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nummer oder Bezeichnung…"
            className="w-full max-w-xs border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
          />
        </div>

        {items.length === 0 ? (
          <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
            Aktuell hängt kein ausgebbarer Schlüssel am Brett.
          </p>
        ) : (
          <ul className="mt-3 max-h-96 overflow-auto border border-line bg-paper">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted">Kein Treffer.</li>
            )}
            {filtered.map((item) => {
              const k = keyOf(item)
              const isOn = selected.has(k)
              return (
                <li key={k} className="border-b border-line last:border-b-0">
                  <label
                    className={`flex cursor-pointer items-start gap-3 p-3 text-sm ${
                      isOn ? 'bg-army-red/5' : 'hover:bg-mist'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name={item.kind === 'bundle' ? 'bundleIds' : 'copyIds'}
                      value={item.id}
                      checked={isOn}
                      onChange={() => toggle(item)}
                      className="mt-1 h-4 w-4 accent-[#dc0018]"
                    />
                    <span className="flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold tracking-wider text-army-red">
                          {item.number}
                        </span>
                        <span className="font-semibold">{item.title}</span>
                        {item.kind === 'bundle' && (
                          <span className="border border-ink bg-ink px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">
                            Bund · {item.count ?? 0}
                          </span>
                        )}
                        {item.risk && item.risk !== 'normal' && (
                          <span
                            className={`border px-1.5 py-0.5 text-[11px] font-semibold uppercase ${
                              RISK_STYLES[item.risk] ?? ''
                            }`}
                          >
                            {RISK_LABELS[item.risk]}
                          </span>
                        )}
                        {item.needsPsp && (
                          <span className="border border-amber-400 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-amber-900">
                            PSP · {ZONE_LABELS[item.zone ?? 'keine']}
                          </span>
                        )}
                        {item.needsFourEyes && (
                          <span className="border border-line bg-mist px-1.5 py-0.5 text-[11px] font-semibold uppercase">
                            4 Augen
                          </span>
                        )}
                      </span>
                      {item.subtitle && (
                        <span className="mt-0.5 block text-xs text-muted">{item.subtitle}</span>
                      )}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Step 3 — terms */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          3 · Frist und Quittung
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {DUE_MODES.map((m) => (
            <label
              key={m.value}
              className={`cursor-pointer border px-3 py-1.5 text-sm transition ${
                dueMode === m.value
                  ? 'border-army-red bg-army-red text-white'
                  : 'border-line bg-paper hover:border-army-red'
              }`}
            >
              <input
                type="radio"
                name="dueMode"
                value={m.value}
                checked={dueMode === m.value}
                onChange={() => setDueMode(m.value)}
                className="sr-only"
              />
              {m.label}
            </label>
          ))}
        </div>

        {dueMode === 'custom' && (
          <label className="mt-3 block max-w-xs">
            <span className="mb-1 block text-sm font-medium">Rückgabe bis</span>
            <input
              type="datetime-local"
              name="dueCustom"
              className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
            />
          </label>
        )}

        <label className="mt-4 block max-w-md">
          <span className="mb-1 block text-sm font-medium">
            Grund / Auftrag <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            type="text"
            name="reason"
            placeholder="z.B. Materialfassung WK 2026"
            className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
          />
        </label>

        {needsFourEyes && (
          <div className="mt-4 max-w-md border-l-4 border-army-red bg-army-red/5 p-3">
            <p className="text-sm font-semibold">Vier-Augen-Prinzip</p>
            <p className="mt-1 text-sm text-muted">
              Mindestens ein gewählter Schlüssel ist der Risikoklasse «Hoch» zugeordnet. Die
              Zweitunterschrift ist Pflicht.
            </p>
            <div className="mt-2">
              <UserCombobox
                users={users.filter((u) => u.id !== person?.id)}
                name="secondSignatureId"
                placeholder="Zweitunterschrift suchen…"
              />
            </div>
          </div>
        )}
      </section>

      <div className="max-w-md">
        <SubmitButton variant="primary" pendingText="Wird ausgegeben…">
          {selectedCount > 1 ? `${selectedCount} Schlüssel ausgeben` : 'Schlüssel ausgeben'}
        </SubmitButton>
      </div>
    </form>
  )
}
