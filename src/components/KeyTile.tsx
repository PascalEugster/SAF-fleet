import Link from 'next/link'
import React from 'react'
import { KeyStatusBadge } from './KeyStatusBadge'
import { formatDateTime } from '@/lib/labels'
import { RISK_LABELS, RISK_STYLES } from '@/lib/keyLabels'

export type KeyTileData = {
  href: string
  icon: string
  number: string
  title: string
  subtitle?: string | null
  status: string
  overdue?: boolean
  holder?: string | null
  dueAt?: string | null
  risk?: string | null
  marker?: string | null
  slot?: string | null
  depot?: string | null
}

/** One hook on the board: green = hanging, red = out, amber = overdue. */
export function KeyTile({ data }: { data: KeyTileData }) {
  const accent = data.overdue
    ? 'border-l-amber-400'
    : data.status === 'am_brett'
      ? 'border-l-green-500'
      : data.status === 'versiegelt'
        ? 'border-l-blue-400'
        : data.status === 'ausgegeben' || data.status === 'dauerausgabe'
          ? 'border-l-army-red'
          : 'border-l-line'

  return (
    <Link
      href={data.href}
      className={`flex min-h-[7.5rem] flex-col border border-line border-l-4 bg-paper p-4 transition hover:border-army-red ${accent}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="text-2xl leading-none" aria-hidden>
            {data.icon}
          </span>
          <div>
            <p className="font-mono text-xs font-bold tracking-wider text-army-red">{data.number}</p>
            <p className="font-semibold leading-tight">{data.title}</p>
            {data.subtitle && <p className="mt-0.5 text-xs text-muted">{data.subtitle}</p>}
          </div>
        </div>
        {data.marker && (
          <span className="shrink-0 border border-line bg-mist px-1.5 py-0.5 font-mono text-[11px] font-bold">
            {data.marker}
          </span>
        )}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <KeyStatusBadge status={data.status} overdue={data.overdue} />
          {data.risk && data.risk !== 'normal' && (
            <span
              className={`border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                RISK_STYLES[data.risk] ?? ''
              }`}
            >
              {RISK_LABELS[data.risk]}
            </span>
          )}
        </div>
        {data.holder ? (
          <p className="mt-2 text-xs text-muted">
            bei <span className="font-semibold text-ink">{data.holder}</span>
            {data.dueAt ? ` · bis ${formatDateTime(data.dueAt)}` : ' · Dauerausgabe'}
          </p>
        ) : data.depot || data.slot ? (
          <p className="mt-2 text-xs text-muted">
            {[data.depot, data.slot ? `Platz ${data.slot}` : null].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
