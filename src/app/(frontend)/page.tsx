import Link from 'next/link'
import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Category, KeyCopy, User, Vehicle } from '@/payload-types'
import { VehicleBoard, type FleetItem } from '@/components/VehicleBoard'
import { categoryId } from '@/lib/labels'
import { keyStats } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ category?: string; status?: string; q?: string }>

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

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, status, q } = await searchParams
  const payload = await getPayload({ config: await config })

  const [vehiclesRes, categoriesRes, keyCopiesRes] = await Promise.all([
    payload.find({ collection: 'vehicles', depth: 1, limit: 500, sort: 'mNumber' }),
    payload.find({ collection: 'categories', depth: 0, limit: 100, sort: 'sortOrder' }),
    payload.find({ collection: 'key-copies', depth: 0, limit: 1000 }),
  ])

  const keys = keyStats(keyCopiesRes.docs as KeyCopy[])

  const items: FleetItem[] = (vehiclesRes.docs as Vehicle[]).map((vehicle) => {
    const user = typeof vehicle.currentUser === 'object' ? (vehicle.currentUser as User) : null
    return {
      vehicle,
      categoryId: categoryId(vehicle.category),
      search: [vehicle.mNumber, vehicle.name, user?.name].filter(Boolean).join(' ').toLowerCase(),
    }
  })

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

      <section className="mt-6 border border-line bg-paper p-5">
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
          <KeyKpi label="Überfällig" value={keys.overdue} href="/schluessel?status=overdue" warn />
          <KeyKpi
            label="Gesperrt / Verloren"
            value={keys.blocked}
            href="/schluessel?status=blocked"
          />
        </div>
      </section>

      <VehicleBoard
        items={items}
        categories={(categoriesRes.docs as Category[]).map((cat) => ({
          id: String(cat.id),
          name: cat.name,
          icon: cat.icon,
        }))}
        initial={{ status, category, q }}
      />
    </div>
  )
}
