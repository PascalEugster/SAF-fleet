'use client'

import React, { useActionState, useMemo, useState } from 'react'
import { saveInventory, type KeyActionState } from '@/app/(frontend)/keyActions'
import { SubmitButton } from './SubmitButton'
import { UserCombobox, type UserOption } from './UserCombobox'

export type InventoryRow = {
  id: string
  number: string
  title: string
  expected: string
  slot?: string | null
  categoryId: string | null
}

/**
 * Counting pass over the board. Everything counts as found until it is ticked
 * off as missing — the fast path is walking the board and touching nothing.
 */
export function InventoryForm({
  rows,
  users,
  scopeIds,
}: {
  rows: InventoryRow[]
  users: UserOption[]
  scopeIds: string[]
}) {
  const [state, formAction] = useActionState<KeyActionState, FormData>(saveInventory, null)
  const [missing, setMissing] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) =>
      `${r.number} ${r.title} ${r.expected} ${r.slot ?? ''}`.toLowerCase().includes(q),
    )
  }, [rows, query])

  const toggle = (id: string) =>
    setMissing((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const found = rows.length - missing.size

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="expectedCount" value={rows.length} />
      {scopeIds.map((id) => (
        <input key={id} type="hidden" name="scope" value={id} />
      ))}

      {state?.ok && state.message && (
        <div className="border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-900">
          {state.message}
          {state.failures && state.failures.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {state.failures.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {state && !state.ok && state.error && (
        <div className="border-l-4 border-army-red bg-army-red/5 p-3 text-sm">{state.error}</div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 border border-line bg-paper p-4">
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold tabular-nums">{rows.length}</p>
            <p className="text-xs text-muted">Soll</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-green-700">{found}</p>
            <p className="text-xs text-muted">angetroffen</p>
          </div>
          <div>
            <p
              className={`text-2xl font-bold tabular-nums ${
                missing.size > 0 ? 'text-army-red' : ''
              }`}
            >
              {missing.size}
            </p>
            <p className="text-xs text-muted">
            {missing.size === 1 ? 'Differenz' : 'Differenzen'}
          </p>
          </div>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nummer, Platz oder Inhaber…"
          className="w-full max-w-xs border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
        />
      </div>

      <ul className="border border-line bg-paper">
        {filtered.length === 0 && <li className="px-4 py-3 text-sm text-muted">Kein Treffer.</li>}
        {filtered.map((row) => {
          const isMissing = missing.has(row.id)
          return (
            <li key={row.id} className="border-b border-line last:border-b-0">
              <label
                className={`flex cursor-pointer items-center gap-3 p-3 text-sm ${
                  isMissing ? 'bg-army-red/5' : 'hover:bg-mist'
                }`}
              >
                <input
                  type="checkbox"
                  name="missing"
                  value={row.id}
                  checked={isMissing}
                  onChange={() => toggle(row.id)}
                  className="h-4 w-4 accent-[#dc0018]"
                />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider text-army-red">
                      {row.number}
                    </span>
                    <span className="font-semibold">{row.title}</span>
                    {row.slot && (
                      <span className="border border-line bg-mist px-1.5 py-0.5 font-mono text-[11px]">
                        {row.slot}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">Erwartet: {row.expected}</span>
                </span>
                <span
                  className={`shrink-0 text-xs font-semibold uppercase ${
                    isMissing ? 'text-army-red' : 'text-green-700'
                  }`}
                >
                  {isMissing ? 'fehlt' : 'vorhanden'}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      <div className="grid gap-4 border border-line bg-paper p-5 sm:grid-cols-2">
        <div className="block">
          <span className="mb-1 block text-sm font-medium">
            Durchgeführt durch <span className="font-normal text-muted">(optional)</span>
          </span>
          <UserCombobox users={users} name="performedBy" />
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Bemerkung <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            type="text"
            name="note"
            placeholder="z.B. Rapport vor Dienstübergabe"
            className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
          />
        </label>
        <div className="sm:col-span-2">
          <SubmitButton variant="primary" pendingText="Wird erfasst…">
            {missing.size === 0
              ? 'Inventur abschliessen (keine Differenzen)'
              : `Inventur abschliessen (${missing.size} ${
                  missing.size === 1 ? 'Differenz' : 'Differenzen'
                })`}
          </SubmitButton>
        </div>
      </div>
    </form>
  )
}
