import type { Payload, PayloadRequest } from 'payload'
import { seedKeys } from './seedKeys'

type SeedOpts = { req?: PayloadRequest }

const PEOPLE = [
  {
    name: 'Hans Muster',
    rank: 'Wachtmeister',
    unit: 'Pz Bat 12',
    email: 'hans.muster@vtg.admin.ch',
    serviceFunction: 'Wachtmeister Wache',
    serviceEndInDays: 21,
    pspLevel: 'psp',
    pspValidUntil: '2028-12-31',
  },
  {
    name: 'Anna Bühler',
    rank: 'Leutnant',
    unit: 'Log Bat 1',
    email: 'anna.buehler@vtg.admin.ch',
    serviceFunction: 'Fourier',
    pspLevel: 'psp_erweitert',
    pspValidUntil: '2029-06-30',
  },
  {
    // No security screening on purpose: shows the PSP gate blocking a hand-over.
    name: 'Marco Rossi',
    rank: 'Korporal',
    unit: 'Geb Inf Bat 30',
    email: 'marco.rossi@vtg.admin.ch',
    pspLevel: 'keine',
    serviceEndInDays: 14,
  },
  {
    name: 'Sophie Favre',
    rank: 'Hauptmann',
    unit: 'Pz Bat 12',
    email: 'sophie.favre@vtg.admin.ch',
    serviceFunction: 'Kp Kdt',
    pspLevel: 'psp_mit_befragung',
    pspValidUntil: '2030-01-31',
  },
] as const

const CATEGORIES = [
  { name: 'Personenwagen', icon: '🚗', sortOrder: 1 },
  { name: 'Lastwagen', icon: '🚚', sortOrder: 2 },
  { name: 'Panzer', icon: '🛡️', sortOrder: 3 },
  { name: 'Motorrad', icon: '🏍️', sortOrder: 4 },
  { name: 'Spezialfahrzeug', icon: '🚜', sortOrder: 5 },
] as const

const VEHICLES = [
  { mNumber: 'M-312321', name: 'DURO 6x6', category: 'Lastwagen', notes: 'Geländegängiger Mannschaftstransporter.' },
  { mNumber: 'M-104587', name: 'Mowag Eagle IV', category: 'Personenwagen', notes: 'Geschütztes Aufklärungsfahrzeug.' },
  { mNumber: 'M-208814', name: 'Leopard 2 (Pz 87)', category: 'Panzer', notes: 'Kampfpanzer der Panzertruppen.' },
  { mNumber: 'M-440190', name: 'Condor Motorrad', category: 'Motorrad', notes: null },
  { mNumber: 'M-771203', name: 'Mowag Piranha', category: 'Spezialfahrzeug', notes: 'Radschützenpanzer 8x8.' },
  { mNumber: 'M-512004', name: 'Steyr Lastwagen', category: 'Lastwagen', notes: 'Materialtransport.' },
  { mNumber: 'M-119076', name: 'VW Touareg Stab', category: 'Personenwagen', notes: 'Stabsfahrzeug.' },
  { mNumber: 'M-630558', name: 'Bison Pionierpanzer', category: 'Spezialfahrzeug', notes: 'Genie- und Rettungsfahrzeug.' },
] as const

/**
 * Populate the database with sample data. Idempotent: existing users (by email) and
 * vehicles (by M-number) are reused instead of duplicated, so it is safe to re-run.
 */
export async function seedDatabase(payload: Payload, { req }: SeedOpts = {}) {
  const ensureUser = async (data: Record<string, unknown> & { email: string }) => {
    const found = await payload.find({
      collection: 'users',
      where: { email: { equals: data.email } },
      limit: 1,
      depth: 0,
      req,
    })
    if (found.totalDocs > 0) {
      // Keep security fields current for databases seeded before they existed.
      const { email: _email, password: _password, ...rest } = data
      return payload.update({
        collection: 'users',
        id: found.docs[0].id,
        data: rest as never,
        req,
      })
    }
    return payload.create({ collection: 'users', data: data as never, req })
  }

  const ensureCategory = async (c: (typeof CATEGORIES)[number]) => {
    const found = await payload.find({
      collection: 'categories',
      where: { name: { equals: c.name } },
      limit: 1,
      depth: 0,
      req,
    })
    if (found.totalDocs > 0) return found.docs[0]
    return payload.create({ collection: 'categories', data: c, req })
  }

  const categoryIds: Record<string, number | string> = {}
  for (const c of CATEGORIES) {
    const doc = await ensureCategory(c)
    categoryIds[c.name] = doc.id
  }

  const ensureVehicle = async (v: (typeof VEHICLES)[number]) => {
    const found = await payload.find({
      collection: 'vehicles',
      where: { mNumber: { equals: v.mNumber } },
      limit: 1,
      depth: 0,
      req,
    })
    if (found.totalDocs > 0) return found.docs[0]
    return payload.create({
      collection: 'vehicles',
      data: {
        mNumber: v.mNumber,
        name: v.name,
        category: categoryIds[v.category] as never,
        status: 'available',
        ...(v.notes ? { notes: v.notes } : {}),
      },
      req,
    })
  }

  // Login / admin account
  await ensureUser({
    name: 'Administrator',
    email: 'admin@vtg.admin.ch',
    password: 'armee2026',
    rank: 'Oberst',
    unit: 'LBA',
  })

  // Service end is relative so the demo keeps making sense months from now.
  const inDays = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    d.setHours(18, 0, 0, 0)
    return d.toISOString()
  }

  const userIds: Record<string, number | string> = {}
  for (const p of PEOPLE) {
    const { serviceEndInDays, ...rest } = p as typeof p & { serviceEndInDays?: number }
    const u = await ensureUser({
      ...rest,
      password: 'armee2026',
      ...(serviceEndInDays ? { serviceEnd: inDays(serviceEndInDays) } : {}),
    })
    userIds[p.email] = u.id
  }

  const vehicleIds: Record<string, number | string> = {}
  for (const v of VEHICLES) {
    const doc = await ensureVehicle(v)
    vehicleIds[v.mNumber] = doc.id
  }

  // Assign a few vehicles — only if currently free, so re-runs don't pile up history.
  const assign = async (mNumber: string, email: string, reason?: string) => {
    const doc = await payload.findByID({ collection: 'vehicles', id: vehicleIds[mNumber], depth: 0, req })
    if (doc.currentUser || doc.status !== 'available') return
    await payload.update({
      collection: 'vehicles',
      id: vehicleIds[mNumber],
      data: { currentUser: userIds[email] as never, ...(reason ? { currentReason: reason } : {}) },
      req,
    })
  }

  await assign('M-312321', 'hans.muster@vtg.admin.ch', 'Materialtransport WK 2026')
  await assign('M-208814', 'sophie.favre@vtg.admin.ch', 'Ausbildungssequenz Panzer')
  await assign('M-512004', 'anna.buehler@vtg.admin.ch')

  // One vehicle into maintenance (only if currently free).
  const piranha = await payload.findByID({ collection: 'vehicles', id: vehicleIds['M-771203'], depth: 0, req })
  if (!piranha.currentUser && piranha.status === 'available') {
    await payload.update({ collection: 'vehicles', id: vehicleIds['M-771203'], data: { status: 'maintenance' }, req })
  }

  // Assign then release one to leave a closed history entry.
  const eagle = await payload.findByID({ collection: 'vehicles', id: vehicleIds['M-104587'], depth: 0, req })
  if (!eagle.currentUser && eagle.status === 'available' && (eagle.usageHistory?.length ?? 0) === 0) {
    await payload.update({
      collection: 'vehicles',
      id: vehicleIds['M-104587'],
      data: { currentUser: userIds['marco.rossi@vtg.admin.ch'] as never, currentReason: 'Patrouille' },
      req,
    })
    await payload.update({
      collection: 'vehicles',
      id: vehicleIds['M-104587'],
      data: { currentUser: null },
      req,
    })
  }

  const keys = await seedKeys(payload, { req, userIds })

  return {
    users: Object.keys(userIds).length + 1,
    vehicles: Object.keys(vehicleIds).length,
    keys: keys.keys,
    keyCopies: keys.copies,
    keyBundles: keys.bundles,
  }
}
