import { addDataAndFileToRequest, type Endpoint } from 'payload'
import { seedDatabase } from '../lib/seedData'

const ALL = ['vehicles', 'persons', 'history', 'media', 'categories', 'keys'] as const
type Target = (typeof ALL)[number]

/**
 * POST /api/reset — wipe selected data (and optionally reseed). Admin-only.
 * Body: { targets: ('vehicles'|'persons'|'history'|'media'|'categories'|'keys'|'all')[], reseed?: boolean }
 *
 * The currently logged-in user is always preserved so you don't lock yourself out.
 */
export const resetEndpoint: Endpoint = {
  path: '/reset',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Nicht autorisiert. Bitte einloggen.' }, { status: 401 })
    }

    await addDataAndFileToRequest(req)
    const body = (req.data ?? {}) as { targets?: string[]; reseed?: boolean }

    let targets: string[] = Array.isArray(body.targets) ? body.targets : []
    if (targets.includes('all')) targets = [...ALL]
    targets = targets.filter((t): t is Target => (ALL as readonly string[]).includes(t))
    const reseed = Boolean(body.reseed)

    if (targets.length === 0 && !reseed) {
      return Response.json({ error: 'Keine Auswahl getroffen.' }, { status: 400 })
    }

    const payload = req.payload
    const deleted: Record<string, number> = {}

    const wantVehicles = targets.includes('vehicles')
    const wantPersons = targets.includes('persons')
    const wantHistory = targets.includes('history')
    const wantMedia = targets.includes('media')
    const wantCategories = targets.includes('categories')
    const wantKeys = targets.includes('keys')

    try {
      if (wantVehicles) {
        const res = await payload.delete({ collection: 'vehicles', where: { id: { exists: true } }, req })
        deleted.vehicles = res.docs?.length ?? 0
      } else {
        if (wantHistory) {
          const res = await payload.update({
            collection: 'vehicles',
            where: { id: { exists: true } },
            data: { usageHistory: [], currentUser: null, currentReason: null, assignedAt: null },
            context: { skipUsageHistory: true },
            req,
          })
          deleted.history = res.docs?.length ?? 0
        }
        if (wantMedia) {
          // Drop dangling image references before media is deleted.
          await payload.update({
            collection: 'vehicles',
            where: { image: { exists: true } },
            data: { image: null },
            context: { skipUsageHistory: true },
            req,
          })
        }
        if (wantPersons) {
          // Release vehicles held by people that are about to be deleted.
          await payload.update({
            collection: 'vehicles',
            where: { currentUser: { not_equals: req.user.id } },
            data: { currentUser: null },
            req,
          })
        }
      }

      if (wantKeys) {
        // Journal first, then the things it points at, then the stammdaten.
        for (const collection of [
          'key-events',
          'key-incidents',
          'key-inventories',
          'key-bundles',
          'key-copies',
          'keys',
          'key-categories',
          'key-depots',
          'locking-systems',
        ] as const) {
          const res = await payload.delete({ collection, where: { id: { exists: true } }, req })
          deleted[collection] = res.docs?.length ?? 0
        }
      } else if (wantPersons) {
        // Release keys held by people that are about to be deleted.
        await payload.update({
          collection: 'key-bundles',
          where: { currentHolder: { not_equals: req.user.id } },
          data: { currentHolder: null },
          req,
        })
        await payload.update({
          collection: 'key-copies',
          where: { currentHolder: { not_equals: req.user.id } },
          data: { currentHolder: null },
          req,
        })
      }

      if (wantPersons) {
        const res = await payload.delete({
          collection: 'users',
          where: { id: { not_equals: req.user.id } },
          req,
        })
        deleted.persons = res.docs?.length ?? 0
      }

      if (wantMedia) {
        await payload.updateGlobal({ slug: 'branding', data: { logo: null }, req })
        const res = await payload.delete({ collection: 'media', where: { id: { exists: true } }, req })
        deleted.media = res.docs?.length ?? 0
      }

      if (wantCategories) {
        // Vehicles must be gone first (category is a required relationship).
        if (!wantVehicles) {
          await payload.delete({ collection: 'vehicles', where: { id: { exists: true } }, req })
        }
        const res = await payload.delete({ collection: 'categories', where: { id: { exists: true } }, req })
        deleted.categories = res.docs?.length ?? 0
      }

      let reseeded: { users: number; vehicles: number } | null = null
      if (reseed) {
        reseeded = await seedDatabase(payload, { req })
      }

      payload.logger.info({
        msg: `Reset by ${req.user.email}: ${targets.join(', ') || '(none)'}${reseed ? ' + reseed' : ''}`,
      })

      return Response.json({ ok: true, deleted, reseeded, keptUser: req.user.email })
    } catch (err) {
      payload.logger.error({ msg: 'Reset failed', err })
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      return Response.json({ error: message }, { status: 500 })
    }
  },
}
