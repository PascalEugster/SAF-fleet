'use client'

import React from 'react'

export type Segment = {
  value: string
  label: string
  count?: number
  /** Draws the segment in amber when it holds something that needs attention. */
  warn?: boolean
}

/**
 * One row of mutually exclusive filters with their result counts. Replaces the
 * separate counter tiles — the number lives where you act on it.
 */
export function SegmentedFilter({
  segments,
  value,
  onChange,
  label,
}: {
  segments: Segment[]
  value: string
  onChange: (value: string) => void
  label: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <div className="flex flex-wrap gap-1">
        {segments.map((segment) => {
          const active = value === segment.value
          const empty = segment.count === 0
          return (
            <button
              key={segment.value}
              type="button"
              onClick={() => onChange(segment.value)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 border px-3 py-1.5 text-sm transition ${
                active
                  ? 'border-army-red bg-army-red text-white'
                  : segment.warn && !empty
                    ? 'border-amber-400 bg-amber-50 text-amber-900 hover:border-army-red'
                    : `border-line bg-paper hover:border-army-red ${empty ? 'text-muted' : ''}`
              }`}
            >
              {segment.label}
              {segment.count !== undefined && (
                <span
                  className={`text-xs font-bold tabular-nums ${active ? 'text-white/80' : 'text-muted'}`}
                >
                  {segment.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
