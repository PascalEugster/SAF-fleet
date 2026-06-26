import Link from 'next/link'
import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { User, Vehicle } from '@/payload-types'
import { CreateUserForm } from '@/components/CreateUserForm'

export const dynamic = 'force-dynamic'

export default async function PersonenPage() {
  const payload = await getPayload({ config: await config })

  const { docs: users } = await payload.find({
    collection: 'users',
    limit: 200,
    sort: 'name',
    depth: 0,
  })

  // Map which vehicle each user currently operates.
  const { docs: vehicles } = await payload.find({
    collection: 'vehicles',
    limit: 500,
    depth: 0,
    where: { currentUser: { exists: true } },
  })

  const activeByUser = new Map<string, Vehicle[]>()
  for (const v of vehicles as Vehicle[]) {
    const uid = typeof v.currentUser === 'object' ? (v.currentUser as User)?.id : v.currentUser
    if (uid == null) continue
    const key = String(uid)
    activeByUser.set(key, [...(activeByUser.get(key) ?? []), v])
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Personen</h1>
        <p className="mt-1 text-muted">Angehörige der Armee, denen Fahrzeuge zugewiesen werden können.</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Erfasste Personen ({users.length})
          </h2>
          {users.length === 0 ? (
            <p className="mt-3 border border-dashed border-line bg-paper p-12 text-center text-muted">
              Noch keine Personen erfasst.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-line border border-line bg-paper">
              {(users as User[]).map((u) => {
                const active = activeByUser.get(String(u.id)) ?? []
                return (
                  <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <Link href={`/personen/${u.id}`} className="font-semibold hover:text-army-red">
                        {u.rank ? <span className="text-muted">{u.rank} </span> : null}
                        {u.name}
                      </Link>
                      <p className="text-sm text-muted">
                        {u.email}
                        {u.unit ? ` · ${u.unit}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {active.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            {active.map((v) => (
                              <Link
                                key={v.id}
                                href={`/fahrzeuge/${v.id}`}
                                className="border border-army-red/30 bg-army-red/10 px-2 py-1 font-mono text-xs font-semibold text-army-red hover:bg-army-red/20"
                              >
                                {v.mNumber}
                              </Link>
                            ))}
                          </div>
                          {active.length > 1 && (
                            <span className="whitespace-nowrap text-xs font-semibold text-army-red">
                              {active.length} Fahrzeuge
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">Kein Fahrzeug</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Create form */}
        <div className="lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Neue Person erfassen
          </h2>
          <CreateUserForm />
        </div>
      </div>
    </div>
  )
}
