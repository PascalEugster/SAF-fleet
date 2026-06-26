import type { Category } from '@/payload-types'

type CategoryRef = number | Category | null | undefined

/** Display name of a (possibly populated) category relationship. */
export function categoryName(cat: CategoryRef): string {
  return cat && typeof cat === 'object' ? cat.name : '—'
}

/** Emoji of a (possibly populated) category relationship, with a fallback. */
export function categoryIcon(cat: CategoryRef): string {
  return cat && typeof cat === 'object' && cat.icon ? cat.icon : '🚙'
}

/** Stable string id of a category relationship, for filtering/links. */
export function categoryId(cat: CategoryRef): string | null {
  if (cat === null || cat === undefined) return null
  return typeof cat === 'object' ? String(cat.id) : String(cat)
}

export const STATUS_LABELS: Record<string, string> = {
  available: 'Verfügbar',
  in_use: 'Im Einsatz',
  maintenance: 'In Wartung',
}

/** Tailwind classes for a status badge. */
export const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-100 text-green-800 border-green-300',
  in_use: 'bg-army-red/10 text-army-red border-army-red/30',
  maintenance: 'bg-amber-100 text-amber-800 border-amber-300',
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
