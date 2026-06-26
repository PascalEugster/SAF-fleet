'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

export type UserOption = {
  id: string
  name: string
  rank: string | null
  activeCount?: number
}

export function UserCombobox({
  users,
  name = 'userId',
  placeholder = 'Person suchen…',
}: {
  users: UserOption[]
  name?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<UserOption | null>(null)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return users
    return users.filter((u) => `${u.name} ${u.rank ?? ''}`.toLowerCase().includes(q))
  }, [users, query])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const choose = (u: UserOption) => {
    setSelected(u)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const u = filtered[highlight]
      if (u) choose(u)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={selected?.id ?? ''} />

      <button
        type="button"
        onClick={() => {
          setHighlight(0)
          setOpen((o) => !o)
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between border border-line bg-paper px-3 py-2 text-left text-sm outline-none focus:border-army-red"
      >
        <span className={selected ? '' : 'text-muted'}>
          {selected ? (
            <>
              {selected.name}
              {selected.rank ? <span className="text-muted"> — {selected.rank}</span> : null}
            </>
          ) : (
            'Person auswählen…'
          )}
        </span>
        <span className="ml-2 text-muted" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full border border-line bg-paper shadow-lg">
          <div className="border-b border-line p-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHighlight(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              role="combobox"
              aria-controls="user-combobox-list"
              aria-expanded={open}
              className="w-full border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-army-red"
            />
          </div>
          <ul id="user-combobox-list" role="listbox" className="max-h-60 overflow-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">Keine Person gefunden.</li>
            ) : (
              filtered.map((u, i) => {
                const active = i === highlight
                const isSelected = selected?.id === u.id
                return (
                  <li key={u.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => choose(u)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                        active ? 'bg-army-red text-white' : 'hover:bg-mist'
                      }`}
                    >
                      <span>
                        {u.name}
                        {u.rank ? (
                          <span className={active ? 'text-white/80' : 'text-muted'}> — {u.rank}</span>
                        ) : null}
                      </span>
                      {u.activeCount ? (
                        <span
                          className={`whitespace-nowrap text-xs ${active ? 'text-white/90' : 'text-army-red'}`}
                        >
                          {u.activeCount} aktiv
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
