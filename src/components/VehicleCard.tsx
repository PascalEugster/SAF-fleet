import Link from 'next/link'
import React from 'react'
import type { User, Vehicle } from '@/payload-types'
import { StatusBadge } from './StatusBadge'
import { categoryIcon, categoryName } from '@/lib/labels'

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const user = typeof vehicle.currentUser === 'object' ? (vehicle.currentUser as User) : null

  return (
    <Link
      href={`/fahrzeuge/${vehicle.id}`}
      className="group flex flex-col border border-line bg-paper transition hover:border-army-red hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line p-4">
        <div>
          <p className="font-mono text-sm font-bold tracking-wider text-army-red">
            {vehicle.mNumber}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold leading-tight">{vehicle.name}</h3>
        </div>
        <span className="text-3xl leading-none" aria-hidden>
          {categoryIcon(vehicle.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{categoryName(vehicle.category)}</span>
          <StatusBadge status={vehicle.status} />
        </div>
        <div className="mt-auto border-t border-line pt-3 text-sm">
          {user ? (
            <p>
              <span className="text-muted">Nutzer: </span>
              <span className="font-medium">{user.name}</span>
            </p>
          ) : (
            <p className="text-muted">Kein Nutzer zugewiesen</p>
          )}
        </div>
      </div>
    </Link>
  )
}
