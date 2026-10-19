'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { KeyTile, type KeyTileData } from './KeyTile'
import { SegmentedFilter, type Segment } from './SegmentedFilter'

export type BoardItem = {
  tile: KeyTileData
  kind: 'copy' | 'bundle'
  categoryId: string | null
  depotId: string | null
  statusGroup: 'am_brett' | 'out' | 'versiegelt' | 'blocked'
  overdue: boolean
  /** Lowercased haystack: number, label, room, slot, tag and holder. */
  search: string
}

export type BoardCategory = { id: string; name: string; icon?: string | null }
export type BoardDepot = { id: string; name: string }

const STATUS_SEGMENTS: { value: string; label: string; warn?: boolean }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'am_brett', label: 'Am Brett' },
  { value: 'out', label: 'Ausgegeben' },
  { value: 'overdue', label: 'Überfällig', warn: true },
  { value: 'versiegelt', label: 'Versiegelt' },
  { value: 'blocked', label: 'Gesperrt' },
]

const TYPE_SEGMENTS: Segment[] = [
  { value: 'all', label: 'Alle' },
  { value: 'copy', label: 'Einzelschlüssel' },
  { value: 'bundle', label: 'Bünde' },
]

function matchesStatus(item: BoardItem, status: string): boolean {
  if (status === 'all') return true
  if (status === 'overdue') return item.overdue
  return item.statusGroup === status
}

/**
 * The board filters in the browser: the whole inventory is already on the page,
 * so every keystroke and every segment is instant instead of a round trip. The
 * counts sit on the filters themselves, which is why there is no counter row.
 */
export function KeyBoard({
  items,
  categories,
  depots,
  initial,
}: {
  items: BoardItem[]
  categories: BoardCategory[]
  depots: BoardDepot[]
  initial: { status?: string; category?: string; depot?: string; q?: string }
}) {
  const [status, setStatus] = useState(initial.status ?? 'all')
  const [category, setCategory] = useState(initial.category ?? 'all')
  const [depot, setDepot] = useState(initial.depot ?? 'all')
  const [type, setType] = useState('all')
  const [query, setQuery] = useState(initial.q ?? '')

  // Keep the address bar in step so a filtered board stays shareable, without
  // triggering a navigation.
  useEffect(() => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (category !== 'all') params.set('category', category)
    if (depot !== 'all') params.set('depot', depot)
    if (type !== 'all') params.set('type', type)
    if (query.trim()) params.set('q', query.trim())
    const search = params.toString()
    window.history.replaceState(null, '', search ? `/schluessel?${search}` : '/schluessel')
  }, [status, category, depot, type, query])

  // Everything except the status filter — so the status counts stay meaningful.
  const base = useMemo(() => {
    const q = query.toLowerCase().trim()
    return items.filter((item) => {
      if (category !== 'all' && item.categoryId !== category) return false
      if (depot !== 'all' && item.depotId !== depot) return false
      if (type !== 'all' && item.kind !== type) return false
      if (q && !item.search.includes(q)) return false
      return true
    })
  }, [items, category, depot, type, query])

  const statusSegments: Segment[] = useMemo(
    () =>
      STATUS_SEGMENTS.map((segment) => ({
        ...segment,
        count: base.filter((item) => matchesStatus(item, segment.value)).length,
      })),
    [base],
  )

  const categorySegments: Segment[] = useMemo(() => {
    const scoped = items.filter((item) => {
      const q = query.toLowerCase().trim()
      if (type !== 'all' && item.kind !== type) return false
      if (depot !== 'all' && item.depotId !== depot) return false
      if (q && !item.search.includes(q)) return false
      return matchesStatus(item, status)
    })
    return [
      { value: 'all', label: 'Alle', count: scoped.length },
      ...categories.map((cat) => ({
        value: cat.id,
        label: `${cat.icon ? `${cat.icon} ` : ''}${cat.name}`,
        count: scoped.filter((item) => item.categoryId === cat.id).length,
      })),
    ]
  }, [items, categories, query, type, depot, status])

  const visible = useMemo(
    () => base.filter((item) => matchesStatus(item, status)),
    [base, status],
  )

  const filtered =
    status !== 'all' ||
    category !== 'all' ||
    depot !== 'all' ||
    type !== 'all' ||
    query.trim() !== ''

  const reset = () => {
    setStatus('all')
    setCategory('all')
    setDepot('all')
    setType('all')
    setQuery('')
  }

  return (
    <div>
      <div className="mt-6 space-y-3 border border-line bg-paper p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nummer, Raum, Platz, Marke oder Inhaber…"
            className="min-w-[14rem] flex-1 border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
          />
          <SegmentedFilter segments={TYPE_SEGMENTS} value={type} onChange={setType} label="Typ" />
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Verwahrung
            </span>
            <select
              value={depot}
              onChange={(e) => setDepot(e.target.value)}
              className="border border-line bg-paper px-3 py-1.5 text-sm outline-none focus:border-army-red"
            >
              <option value="all">Alle</option>
              {depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <SegmentedFilter
          segments={statusSegments}
          value={status}
          onChange={setStatus}
          label="Status"
        />
        <SegmentedFilter
          segments={categorySegments}
          value={category}
          onChange={setCategory}
          label="Kategorie"
        />
      </div>

      <p className="mb-3 mt-4 text-sm text-muted">
        {visible.length} {visible.length === 1 ? 'Eintrag' : 'Einträge'}
        {filtered && (
          <button
            type="button"
            onClick={reset}
            className="ml-2 text-army-red hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </p>

      {visible.length === 0 ? (
        <div className="border border-dashed border-line bg-paper p-12 text-center text-muted">
          Kein Schlüssel gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <KeyTile key={item.tile.href} data={item.tile} />
          ))}
        </div>
      )}
    </div>
  )
}
