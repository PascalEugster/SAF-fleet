import { getPayload } from 'payload'
import config from '@/payload.config'
import type { KeyBundle, KeyCategory, KeyCopy, KeyDepot, User } from '@/payload-types'
import { hasValidPsp, isOverdue } from './keyLabels'

export type PersonOption = {
  id: string
  name: string
  rank: string | null
  activeCount: number
}

export const refId = (v: unknown): string | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') {
    const id = (v as { id?: number | string }).id
    return id === undefined ? null : String(id)
  }
  return String(v)
}

export async function payloadClient() {
  return getPayload({ config: await config })
}

export type KeyScreenData = {
  copies: KeyCopy[]
  bundles: KeyBundle[]
  categories: KeyCategory[]
  copyById: Map<string, KeyCopy>
  /** Copies that hang on a bundle and are therefore not issued on their own. */
  memberIds: Set<string>
}

/** Everything the board, the issue flow and the return flow need in one pass. */
export async function loadKeyScreen(): Promise<KeyScreenData> {
  const payload = await payloadClient()

  const [copiesRes, bundlesRes, categoriesRes] = await Promise.all([
    payload.find({ collection: 'key-copies', depth: 2, limit: 1000, sort: 'label' }),
    payload.find({ collection: 'key-bundles', depth: 1, limit: 200, sort: 'label' }),
    payload.find({ collection: 'key-categories', depth: 0, limit: 100, sort: 'sortOrder' }),
  ])

  const copies = copiesRes.docs as KeyCopy[]
  const bundles = bundlesRes.docs as KeyBundle[]
  const copyById = new Map(copies.map((c) => [String(c.id), c]))
  const memberIds = new Set<string>()
  for (const bundle of bundles) {
    for (const member of bundle.copies ?? []) {
      const id = refId(member)
      if (id) memberIds.add(id)
    }
  }

  return {
    copies,
    bundles,
    categories: categoriesRes.docs as KeyCategory[],
    copyById,
    memberIds,
  }
}

/** People for the comboboxes, plus who may receive protection-zone keys. */
export async function loadPeopleOptions(copies: KeyCopy[]): Promise<{
  users: PersonOption[]
  pspValidById: Record<string, boolean>
}> {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'users', depth: 0, limit: 300, sort: 'name' })

  const heldByUser = new Map<string, number>()
  for (const copy of copies) {
    const holder = refId(copy.currentHolder)
    if (!holder) continue
    heldByUser.set(holder, (heldByUser.get(holder) ?? 0) + 1)
  }

  const users = (docs as User[]).map((u) => ({
    id: String(u.id),
    name: u.name,
    rank: u.rank ?? null,
    activeCount: heldByUser.get(String(u.id)) ?? 0,
  }))

  const pspValidById: Record<string, boolean> = {}
  for (const u of docs as User[]) pspValidById[String(u.id)] = hasValidPsp(u)

  return { users, pspValidById }
}

export type KeyStats = {
  total: number
  onBoard: number
  out: number
  overdue: number
  blocked: number
}

export function keyStats(copies: KeyCopy[]): KeyStats {
  return {
    total: copies.length,
    onBoard: copies.filter((c) => c.status === 'am_brett').length,
    out: copies.filter((c) => c.status === 'ausgegeben' || c.status === 'dauerausgabe').length,
    overdue: copies.filter((c) => isOverdue(c)).length,
    blocked: copies.filter((c) => ['gesperrt', 'verloren', 'defekt'].includes(c.status)).length,
  }
}

/** A bundle has no status column — it follows its hand-over state. */
export function bundleStatus(bundle: KeyBundle): string {
  return bundle.currentHolder ? (bundle.dueAt ? 'ausgegeben' : 'dauerausgabe') : 'am_brett'
}

export function bundleOverdue(bundle: KeyBundle): boolean {
  if (!bundle.currentHolder || !bundle.dueAt) return false
  return new Date(bundle.dueAt).getTime() < Date.now()
}

/** Labels of the copies on a ring, in board order. */
export function memberLabels(bundle: KeyBundle, copyById: Map<string, KeyCopy>): string[] {
  return (bundle.copies ?? [])
    .map((member) => copyById.get(String(refId(member)))?.label)
    .filter((label): label is string => Boolean(label))
}

export type DepotOccupancy = {
  /** Copies assigned to this depot, whether or not they are currently out. */
  total: number
  /** Copies physically present: not issued, not lost. */
  present: number
  out: number
  blocked: number
}

/** Depots plus how full each one is, derived from the copies already loaded. */
export function depotOccupancy(copies: KeyCopy[]): Map<string, DepotOccupancy> {
  const byDepot = new Map<string, DepotOccupancy>()
  for (const copy of copies) {
    const depot = refId(copy.depot)
    if (!depot) continue
    const entry = byDepot.get(depot) ?? { total: 0, present: 0, out: 0, blocked: 0 }
    entry.total++
    if (copy.status === 'ausgegeben' || copy.status === 'dauerausgabe') entry.out++
    else if (['gesperrt', 'verloren', 'defekt'].includes(copy.status)) entry.blocked++
    else entry.present++
    byDepot.set(depot, entry)
  }
  return byDepot
}

export async function loadDepots(): Promise<KeyDepot[]> {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'key-depots',
    depth: 1,
    limit: 200,
    sort: 'name',
  })
  return docs as KeyDepot[]
}
