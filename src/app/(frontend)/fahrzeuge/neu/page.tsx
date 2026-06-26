import Link from 'next/link'
import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Category } from '@/payload-types'
import { CreateVehicleForm } from '@/components/CreateVehicleForm'

export const dynamic = 'force-dynamic'

export default async function NewVehiclePage() {
  const payload = await getPayload({ config: await config })
  const { docs: categories } = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 100,
    sort: 'sortOrder',
  })

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-army-red hover:underline">
        ← Zurück zur Übersicht
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Fahrzeug erfassen</h1>
      <p className="mt-1 text-muted">
        Erfassen Sie ein neues Fahrzeug in der Flotte. Es wird mit dem Status «Verfügbar» angelegt.
      </p>
      <div className="mt-6">
        <CreateVehicleForm
          categories={(categories as Category[]).map((c) => ({
            id: String(c.id),
            name: c.name,
            icon: c.icon ?? null,
          }))}
        />
      </div>
    </div>
  )
}
