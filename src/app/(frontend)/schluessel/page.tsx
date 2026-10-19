import Link from 'next/link'
import React from 'react'
import type { KeyCopy } from '@/payload-types'
import { KeyTile, type KeyTileData } from '@/components/KeyTile'
import {
  isOverdue,
  keyCategoryIcon,
  keyCategoryId,
  keyCategoryName,
  keyOf,
  userOf,
} from '@/lib/keyLabels'
import {
  bundleOverdue,
  bundleStatus,
  keyStats,
  loadKeyScreen,
  refId,
} from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ category?: string; status?: string; q?: string }>

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'am_brett', label: 'Am Brett' },
  { value: 'out', label: 'Ausgegeben' },
  { value: 'overdue', label: 'Überfällig' },
  { value: 'versiegelt', label: 'Versiegelt' },
  { value: 'blocked', label: 'Gesperrt / Verloren' },
]

function matchesStatus(filter: string | undefined, status: string, overdue: boolean): boolean {
  if (!filter) return true
  if (filter === 'out') return status === 'ausgegeben' || status === 'dauerausgabe'
  if (filter === 'overdue') return overdue
  if (filter === 'blocked') return ['gesperrt', 'verloren', 'defekt'].includes(status)
  return status === filter
}

function Kpi({
  label,
  value,
  href,
  accent,
  warn,
}: {
  label: string
  value: number
  href: string
  accent?: boolean
  warn?: boolean
}) {
  return (
    <Link
      href={href}
      className={`border border-line bg-paper p-5 transition hover:border-army-red ${
        accent ? 'border-l-4 border-l-army-red' : ''
      } ${warn && value > 0 ? 'border-l-4 border-l-amber-400 bg-amber-50' : ''}`}
    >
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </Link>
  )
}

function FilterChip({
  active,
  href,
  children,
}: {
  active: boolean
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`border px-3 py-1.5 text-sm transition ${
        active
          ? 'border-army-red bg-army-red text-white'
          : 'border-line bg-paper text-ink hover:border-army-red'
      }`}
    >
      {children}
    </Link>
  )
}

export default async function KeyBoardPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, status, q } = await searchParams
  const { copies, bundles, categories, copyById, memberIds } = await loadKeyScreen()
  const stats = keyStats(copies)

  const query = (q || '').toLowerCase().trim()

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { category, status, q, ...patch }
    Object.entries(merged).forEach(([k, val]) => {
      if (val) params.set(k, val)
    })
    const s = params.toString()
    return s ? `/schluessel?${s}` : '/schluessel'
  }

  // Bundle tiles. A bundle matches a category when any key on the ring does.
  const bundleTiles: KeyTileData[] = bundles
    .filter((bundle) => {
      const members = (bundle.copies ?? [])
        .map((m) => copyById.get(String(refId(m))))
        .filter(Boolean) as KeyCopy[]

      if (category) {
        const hit = members.some((m) => keyCategoryId(keyOf(m.key)?.category) === category)
        if (!hit) return false
      }
      if (!matchesStatus(status, bundleStatus(bundle), bundleOverdue(bundle))) return false
      if (query) {
        const hay = `${bundle.label} ${bundle.tagNumber ?? ''} ${members
          .map((m) => m.label ?? '')
          .join(' ')}`.toLowerCase()
        if (!hay.includes(query)) return false
      }
      return true
    })
    .map((bundle) => {
      const count = (bundle.copies ?? []).length
      const holder = userOf(bundle.currentHolder)
      return {
        href: `/schluessel/bund/${bundle.id}`,
        icon: '🗝️',
        number: bundle.tagNumber ? `Marke ${bundle.tagNumber}` : 'Bund',
        title: bundle.label,
        subtitle: `${count} ${count === 1 ? 'Schlüssel' : 'Schlüssel'} am Bund`,
        status: bundleStatus(bundle),
        overdue: bundleOverdue(bundle),
        holder: holder?.name ?? null,
        dueAt: bundle.dueAt ?? null,
        marker: 'BUND',
      }
    })

  // Standalone copies — keys on a ring are shown inside their bundle instead.
  const copyTiles: KeyTileData[] = copies
    .filter((copy) => {
      if (memberIds.has(String(copy.id))) return false
      const key = keyOf(copy.key)
      if (category && keyCategoryId(key?.category) !== category) return false
      if (!matchesStatus(status, copy.status, isOverdue(copy))) return false
      if (query) {
        const hay = `${copy.label ?? ''} ${key?.label ?? ''} ${key?.keyNumber ?? ''} ${
          key?.opensLocation ?? ''
        } ${copy.tagNumber ?? ''} ${copy.storageSlot ?? ''}`.toLowerCase()
        if (!hay.includes(query)) return false
      }
      return true
    })
    .map((copy) => {
      const key = keyOf(copy.key)
      const holder = userOf(copy.currentHolder)
      return {
        href: `/schluessel/${copy.id}`,
        icon: keyCategoryIcon(key?.category),
        number: key?.keyNumber ?? '—',
        title: key?.label ?? (copy.label ?? '—'),
        subtitle: key?.opensLocation || keyCategoryName(key?.category),
        status: copy.status,
        overdue: isOverdue(copy),
        holder: holder?.name ?? null,
        dueAt: copy.dueAt ?? null,
        risk: key?.risk ?? null,
        marker: key?.hierarchy && key.hierarchy !== 'ES' ? key.hierarchy : null,
        slot: copy.storageSlot ?? null,
      }
    })

  const tiles = [...bundleTiles, ...copyTiles]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schlüsselbrett</h1>
          <p className="mt-1 text-muted">
            Zimmer, Material, Anlage und Sicherheit — wer hat welchen Schlüssel.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/schluessel/ausgabe"
            className="bg-army-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-army-red-dark"
          >
            Ausgabe
          </Link>
          <Link
            href="/schluessel/ruecknahme"
            className="border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Rücknahme
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Exemplare gesamt" value={stats.total} href="/schluessel" accent />
        <Kpi label="Am Brett" value={stats.onBoard} href={buildHref({ status: 'am_brett' })} />
        <Kpi label="Ausgegeben" value={stats.out} href={buildHref({ status: 'out' })} />
        <Kpi label="Überfällig" value={stats.overdue} href={buildHref({ status: 'overdue' })} warn />
        <Kpi
          label="Gesperrt / Verloren"
          value={stats.blocked}
          href={buildHref({ status: 'blocked' })}
        />
      </div>

      <div className="mt-8 space-y-3">
        <form action="/schluessel" method="get" className="flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Suche nach Nummer, Raum, Marke oder Platz…"
            className="w-full max-w-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-army-red"
          />
          <button
            type="submit"
            className="border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Suchen
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Kategorie
          </span>
          <FilterChip active={!category} href={buildHref({ category: undefined })}>
            Alle
          </FilterChip>
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              active={category === String(cat.id)}
              href={buildHref({ category: String(cat.id) })}
            >
              {cat.icon ? `${cat.icon} ` : ''}
              {cat.name}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Status
          </span>
          <FilterChip active={!status} href={buildHref({ status: undefined })}>
            Alle
          </FilterChip>
          {STATUS_FILTERS.map((s) => (
            <FilterChip
              key={s.value}
              active={status === s.value}
              href={buildHref({ status: s.value })}
            >
              {s.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm text-muted">
          {tiles.length} {tiles.length === 1 ? 'Eintrag' : 'Einträge'}
          {(category || status || q) && (
            <Link href="/schluessel" className="ml-2 text-army-red hover:underline">
              Filter zurücksetzen
            </Link>
          )}
        </p>
        {tiles.length === 0 ? (
          <div className="border border-dashed border-line bg-paper p-12 text-center text-muted">
            Kein Schlüssel gefunden.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((tile) => (
              <KeyTile key={tile.href} data={tile} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
