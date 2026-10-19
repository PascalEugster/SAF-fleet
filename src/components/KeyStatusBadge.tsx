import React from 'react'
import { KEY_STATUS_LABELS, KEY_STATUS_STYLES, OVERDUE_STYLE } from '@/lib/keyLabels'

export function KeyStatusBadge({
  status,
  overdue,
}: {
  status: string
  overdue?: boolean
}) {
  const style = overdue ? OVERDUE_STYLE : (KEY_STATUS_STYLES[status] ?? 'bg-mist text-ink border-line')
  const label = overdue ? 'Überfällig' : (KEY_STATUS_LABELS[status] ?? status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
