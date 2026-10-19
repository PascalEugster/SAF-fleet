'use client'

import Link from 'next/link'
import React, { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import {
  returnBundle,
  returnByNumber,
  returnCopy,
  type KeyActionState,
} from '@/app/(frontend)/keyActions'
import { formatDateTime } from '@/lib/labels'

export type OutstandingItem = {
  kind: 'copy' | 'bundle'
  id: string
  number: string
  title: string
  holder: string
  dueAt?: string | null
  overdue?: boolean
  href: string
}

function InlineSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 border border-line bg-paper px-3 py-1.5 text-sm font-semibold transition hover:border-army-red disabled:opacity-50"
    >
      {pending ? 'Läuft…' : 'Zurücknehmen'}
    </button>
  )
}

export function ReturnForm({ outstanding }: { outstanding: OutstandingItem[] }) {
  const [state, formAction] = useActionState<KeyActionState, FormData>(returnByNumber, null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clear and refocus after every booking — the evening return run is a series.
  useEffect(() => {
    if (state?.ok && inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }, [state])

  return (
    <div className="space-y-8">
      <section>
        <form action={formAction} className="flex max-w-xl gap-2">
          <input
            ref={inputRef}
            autoFocus
            type="text"
            name="query"
            autoComplete="off"
            placeholder="Nummer scannen oder tippen (z.B. ZI-204 · Ex. 2, Marke 214)…"
            className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-army-red"
          />
          <button
            type="submit"
            className="shrink-0 bg-army-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-army-red-dark"
          >
            Zurücknehmen
          </button>
        </form>

        {state?.ok && state.message && (
          <div className="mt-3 max-w-xl border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-900">
            {state.message}
          </div>
        )}
        {state && !state.ok && state.error && (
          <div className="mt-3 max-w-xl border-l-4 border-army-red bg-army-red/5 p-3 text-sm">
            {state.error}
            {state.failures && state.failures.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {state.failures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Offene Ausgaben ({outstanding.length})
        </h2>
        {outstanding.length === 0 ? (
          <p className="mt-3 border border-dashed border-line bg-paper p-6 text-sm text-muted">
            Alle Schlüssel sind am Brett.
          </p>
        ) : (
          <ul className="mt-3 border border-line bg-paper">
            {outstanding.map((item) => (
              <li
                key={`${item.kind}:${item.id}`}
                className={`flex flex-col gap-2 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between ${
                  item.overdue ? 'bg-amber-50' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider text-army-red">
                      {item.number}
                    </span>
                    <Link href={item.href} className="font-semibold hover:text-army-red hover:underline">
                      {item.title}
                    </Link>
                    {item.kind === 'bundle' && (
                      <span className="border border-ink bg-ink px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">
                        Bund
                      </span>
                    )}
                    {item.overdue && (
                      <span className="border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-amber-900">
                        Überfällig
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    bei <span className="font-semibold text-ink">{item.holder}</span>
                    {item.dueAt ? ` · bis ${formatDateTime(item.dueAt)}` : ' · Dauerausgabe'}
                  </p>
                </div>
                <form action={item.kind === 'bundle' ? returnBundle : returnCopy}>
                  <input
                    type="hidden"
                    name={item.kind === 'bundle' ? 'bundleId' : 'copyId'}
                    value={item.id}
                  />
                  <InlineSubmit />
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
