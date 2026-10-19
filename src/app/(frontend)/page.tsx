import Link from 'next/link'
import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Category, Vehicle } from '@/payload-types'
import { VehicleCard } from '@/components/VehicleCard'
import { categoryId, STATUS_LABELS } from '@/lib/labels'
import { keyStats } from '@/lib/keyQueries'
import type { KeyCopy } from '@/payload-types'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ category?: string; status?: string; q?: string }>

function Kpi({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`border border-line bg-paper p-5 ${accent ? 'border-l-4 border-l-army-red' : ''}`}>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}

function KeyKpi({
  label,
  value,
  href,
  warn,
}: {
  label: string
  value: number
  href: string
  warn?: boolean
}) {
  return (
    <Link
      href={href}
      className={`border border-line bg-paper p-4 transition hover:border-army-red ${
        warn && value > 0 ? 'border-l-4 border-l-amber-400 bg-amber-50' : ''
      }`}
    >
      <p className="text-2xl font-bold tabular-nums">{value}</p>
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

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, status, q } = await searchParams
  const payload = await getPayload({ config: await config })

  const { docs: allVehicles } = await payload.find({
    collection: 'vehicles',
    depth: 1,
    limit: 500,
    sort: 'mNumber',
  })

  const { docs: categories } = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 100,
    sort: 'sortOrder',
  })

  const { docs: keyCopies } = await payload.find({
    collection: 'key-copies',
    depth: 0,
    limit: 1000,
  })
  const keys = keyStats(keyCopies as KeyCopy[])

  const stats = {
    total: allVehicles.length,
    available: allVehicles.filter((v) => v.status === 'available').length,
    in_use: allVehicles.filter((v) => v.status === 'in_use').length,
    maintenance: allVehicles.filter((v) => v.status === 'maintenance').length,
  }

  const query = (q || '').toLowerCase().trim()
  const filtered = (allVehicles as Vehicle[]).filter((v) => {
    if (category && categoryId(v.category) !== category) return false
    if (status && v.status !== status) return false
    if (query) {
      const hay = `${v.mNumber} ${v.name}`.toLowerCase()
      if (!hay.includes(query)) return false
    }
    return true
  })

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { category, status, q, ...patch }
    Object.entries(merged).forEach(([k, val]) => {
      if (val) params.set(k, val)
    })
    const s = params.toString()
    return s ? `/?${s}` : '/'
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fahrzeugflotte</h1>
          <p className="mt-1 text-muted">Übersicht und Verwaltung aller Armeefahrzeuge</p>
        </div>
        <Link
          href="/fahrzeuge/neu"
          className="bg-army-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-army-red-dark"
        >
          + Fahrzeug erfassen
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Fahrzeuge gesamt" value={stats.total} accent />
        <Kpi label={STATUS_LABELS.available} value={stats.available} />
        <Kpi label={STATUS_LABELS.in_use} value={stats.in_use} />
        <Kpi label={STATUS_LABELS.maintenance} value={stats.maintenance} />
      </div>

      {/* Keys */}
      <section className="mt-8 border border-line bg-paper p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Schlüsselverwaltung
            </h2>
            <p className="mt-1 text-sm text-muted">
              Zimmer, Material, Anlage und Sicherheit — {keys.total}{' '}
              {keys.total === 1 ? 'Exemplar' : 'Exemplare'} erfasst.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/schluessel/ausgabe"
              className="bg-army-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-army-red-dark"
            >
              Ausgabe
            </Link>
            <Link
              href="/schluessel/ruecknahme"
              className="border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
            >
              Rücknahme
            </Link>
            <Link
              href="/schluessel"
              className="border border-line px-4 py-2 text-sm font-semibold transition hover:border-army-red"
            >
              Schlüsselbrett →
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KeyKpi label="Am Brett" value={keys.onBoard} href="/schluessel?status=am_brett" />
          <KeyKpi label="Ausgegeben" value={keys.out} href="/schluessel?status=out" />
          <KeyKpi
            label="Überfällig"
            value={keys.overdue}
            href="/schluessel?status=overdue"
            warn
          />
          <KeyKpi
            label="Gesperrt / Verloren"
            value={keys.blocked}
            href="/schluessel?status=blocked"
          />
        </div>
      </section>

      {/* Filters */}
      <div className="mt-8 space-y-3">
        <form action="/" method="get" className="flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Suche nach M-Nummer oder Bezeichnung…"
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
          {(categories as Category[]).map((cat) => (
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
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <FilterChip key={value} active={status === value} href={buildHref({ status: value })}>
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6">
        <p className="mb-3 text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? 'Fahrzeug' : 'Fahrzeuge'}
          {(category || status || q) && (
            <Link href="/" className="ml-2 text-army-red hover:underline">
              Filter zurücksetzen
            </Link>
          )}
        </p>
        {filtered.length === 0 ? (
          <div className="border border-dashed border-line bg-paper p-12 text-center text-muted">
            Keine Fahrzeuge gefunden.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
