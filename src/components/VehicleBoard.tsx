'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { Vehicle } from '@/payload-types'
import { VehicleCard } from './VehicleCard'
import { SegmentedFilter, type Segment } from './SegmentedFilter'
import { STATUS_LABELS } from '@/lib/labels'

export type FleetItem = {
  vehicle: Vehicle
  categoryId: string | null
  search: string
}

export type FleetCategory = { id: string; name: string; icon?: string | null }

const STATUS_SEGMENTS = [
  { value: 'all', label: 'Alle' },
  { value: 'available', label: STATUS_LABELS.available },
  { value: 'in_use', label: STATUS_LABELS.in_use },
  { value: 'maintenance', label: STATUS_LABELS.maintenance },
]

/** Same instant-filter behaviour as the key board, so both domains feel alike. */
export function VehicleBoard({
  items,
  categories,
  initial,
}: {
  items: FleetItem[]
  categories: FleetCategory[]
  initial: { status?: string; category?: string; q?: string }
}) {
  const [status, setStatus] = useState(initial.status ?? 'all')
  const [category, setCategory] = useState(initial.category ?? 'all')
  const [query, setQuery] = useState(initial.q ?? '')

  useEffect(() => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (category !== 'all') params.set('category', category)
    if (query.trim()) params.set('q', query.trim())
    const search = params.toString()
    window.history.replaceState(null, '', search ? `/?${search}` : '/')
  }, [status, category, query])

  const base = useMemo(() => {
    const q = query.toLowerCase().trim()
    return items.filter((item) => {
      if (category !== 'all' && item.categoryId !== category) return false
      if (q && !item.search.includes(q)) return false
      return true
    })
  }, [items, category, query])

  const statusSegments: Segment[] = useMemo(
    () =>
      STATUS_SEGMENTS.map((segment) => ({
        ...segment,
        count:
          segment.value === 'all'
            ? base.length
            : base.filter((item) => item.vehicle.status === segment.value).length,
      })),
    [base],
  )

  const categorySegments: Segment[] = useMemo(() => {
    const scoped = items.filter((item) => {
      const q = query.toLowerCase().trim()
      if (q && !item.search.includes(q)) return false
      return status === 'all' || item.vehicle.status === status
    })
    return [
      { value: 'all', label: 'Alle', count: scoped.length },
      ...categories.map((cat) => ({
        value: cat.id,
        label: `${cat.icon ? `${cat.icon} ` : ''}${cat.name}`,
        count: scoped.filter((item) => item.categoryId === cat.id).length,
      })),
    ]
  }, [items, categories, query, status])

  const visible = useMemo(
    () => base.filter((item) => status === 'all' || item.vehicle.status === status),
    [base, status],
  )

  const filtered = status !== 'all' || category !== 'all' || query.trim() !== ''

  const reset = () => {
    setStatus('all')
    setCategory('all')
    setQuery('')
  }

  return (
    <div>
      <div className="mt-6 space-y-3 border border-line bg-paper p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="M-Nummer, Bezeichnung oder Nutzer…"
          className="w-full max-w-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
        />
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
        {visible.length} {visible.length === 1 ? 'Fahrzeug' : 'Fahrzeuge'}
        {filtered && (
          <button type="button" onClick={reset} className="ml-2 text-army-red hover:underline">
            Filter zurücksetzen
          </button>
        )}
      </p>

      {visible.length === 0 ? (
        <div className="border border-dashed border-line bg-paper p-12 text-center text-muted">
          Keine Fahrzeuge gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <VehicleCard key={item.vehicle.id} vehicle={item.vehicle} />
          ))}
        </div>
      )}
    </div>
  )
}
