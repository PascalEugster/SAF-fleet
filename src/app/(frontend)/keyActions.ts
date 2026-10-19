'use server'

import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import config from '@/payload.config'
import { logKeyEvent, type KeyEventType } from '@/lib/keyEvents'

async function payload() {
  return getPayload({ config: await config })
}

export type KeyActionState = {
  ok: boolean
  error?: string
  message?: string
  failures?: string[]
} | null

function revalidateKeys(...paths: string[]) {
  revalidatePath('/schluessel')
  revalidatePath('/schluessel/ausgabe')
  revalidatePath('/schluessel/ruecknahme')
  revalidatePath('/schluessel/abschluss')
  revalidatePath('/schluessel/inventur')
  revalidatePath('/schluessel/vorfaelle')
  revalidatePath('/')
  paths.forEach((p) => revalidatePath(p))
}

function messageOf(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  return 'Unbekannter Fehler'
}

/** Translate the form's due-date choice into an ISO timestamp (null = permanent). */
function resolveDueAt(mode: string, custom: string): string | null {
  const now = new Date()
  if (mode === 'none') return null
  if (mode === 'custom') {
    if (!custom) return null
    const d = new Date(custom)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  if (mode === 'tomorrow08') {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    d.setHours(8, 0, 0, 0)
    return d.toISOString()
  }
  // Default: end of today's duty.
  const d = new Date(now)
  d.setHours(18, 0, 0, 0)
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1)
  return d.toISOString()
}

/**
 * Hand out any number of copies and bundles to one person. Each item is booked
 * on its own so a single blocked key (missing PSP, sealed, already out) does not
 * cancel the rest — the blocked ones are reported back by name.
 */
export async function issueKeys(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const userId = String(formData.get('userId') || '')
  const reason = String(formData.get('reason') || '').trim()
  const dueMode = String(formData.get('dueMode') || 'today18')
  const dueCustom = String(formData.get('dueCustom') || '')
  const secondSignature = String(formData.get('secondSignatureId') || '')
  const copyIds = formData.getAll('copyIds').map(String).filter(Boolean)
  const bundleIds = formData.getAll('bundleIds').map(String).filter(Boolean)

  if (!userId) return { ok: false, error: 'Bitte eine Person auswählen.' }
  if (copyIds.length === 0 && bundleIds.length === 0) {
    return { ok: false, error: 'Bitte mindestens einen Schlüssel auswählen.' }
  }

  const p = await payload()

  // Deposit tags: the board only stays in sync if the tag changes hands too.
  const tagsConfirmed = String(formData.get('tagsConfirmed') || '') === 'on'
  const tags: string[] = []
  for (const id of copyIds) {
    const doc = await p.findByID({ collection: 'key-copies', id, depth: 0 }).catch(() => null)
    if (doc?.tagNumber) tags.push(`${doc.label}: Marke ${doc.tagNumber}`)
  }
  for (const id of bundleIds) {
    const doc = await p.findByID({ collection: 'key-bundles', id, depth: 0 }).catch(() => null)
    if (doc?.tagNumber) tags.push(`${doc.label}: Marke ${doc.tagNumber}`)
  }
  if (tags.length > 0 && !tagsConfirmed) {
    return {
      ok: false,
      error: 'Bitte die Aushändigung der Marke bestätigen.',
      failures: tags,
    }
  }

  const dueAt = resolveDueAt(dueMode, dueCustom)
  const data = {
    currentHolder: Number(userId),
    currentReason: reason || null,
    dueAt,
    ...(secondSignature ? { secondSignature: Number(secondSignature) } : {}),
  }

  const failures: string[] = []
  let issued = 0

  for (const id of bundleIds) {
    try {
      await p.update({ collection: 'key-bundles', id, data: data as never })
      issued++
    } catch (err) {
      failures.push(messageOf(err))
    }
  }

  for (const id of copyIds) {
    try {
      await p.update({ collection: 'key-copies', id, data: data as never })
      issued++
    } catch (err) {
      failures.push(messageOf(err))
    }
  }

  revalidateKeys(...copyIds.map((id) => `/schluessel/${id}`))

  if (issued === 0) {
    return { ok: false, error: failures[0] ?? 'Ausgabe nicht möglich.', failures }
  }
  return {
    ok: true,
    message:
      `${issued === 1 ? 'Ein Schlüssel' : `${issued} Schlüssel`} ausgegeben${dueAt ? '' : ' (Dauerausgabe)'}.` +
      (tags.length > 0 ? ` Marken ausgehändigt: ${tags.length}.` : ''),
    ...(failures.length > 0 ? { failures } : {}),
  }
}

export async function returnCopy(formData: FormData): Promise<void> {
  const id = String(formData.get('copyId'))
  const p = await payload()
  await p.update({ collection: 'key-copies', id, data: { currentHolder: null } })
  revalidateKeys(`/schluessel/${id}`)
}

export async function returnBundle(formData: FormData): Promise<void> {
  const id = String(formData.get('bundleId'))
  const p = await payload()
  await p.update({ collection: 'key-bundles', id, data: { currentHolder: null } })
  revalidateKeys(`/schluessel/bund/${id}`)
}

/**
 * Take a key back by whatever is printed on the tag: key number, copy label or
 * the deposit tag. Built for a barcode scanner, which just types text.
 */
export async function returnByNumber(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const raw = String(formData.get('query') || '').trim()
  if (!raw) return { ok: false, error: 'Bitte eine Nummer eingeben oder scannen.' }

  const p = await payload()

  // Bundles first — a scanned tag usually belongs to the ring, not a single key.
  const bundles = await p.find({
    collection: 'key-bundles',
    where: {
      and: [
        { currentHolder: { exists: true } },
        { or: [{ label: { like: raw } }, { tagNumber: { equals: raw } }] },
      ],
    },
    limit: 2,
    depth: 1,
  })
  if (bundles.totalDocs === 1) {
    const bundle = bundles.docs[0]
    await p.update({ collection: 'key-bundles', id: bundle.id, data: { currentHolder: null } })
    revalidateKeys(`/schluessel/bund/${bundle.id}`)
    return {
      ok: true,
      message:
        `${bundle.label} zurückgenommen.` +
        (bundle.tagNumber ? ` Marke ${bundle.tagNumber} wieder ans Brett.` : ''),
    }
  }

  const copies = await p.find({
    collection: 'key-copies',
    where: {
      and: [
        { currentHolder: { exists: true } },
        {
          or: [
            { label: { like: raw } },
            { tagNumber: { equals: raw } },
            { storageSlot: { equals: raw } },
          ],
        },
      ],
    },
    limit: 5,
    depth: 1,
  })

  if (copies.totalDocs === 0) {
    return { ok: false, error: `Kein ausgegebener Schlüssel zu «${raw}» gefunden.` }
  }
  if (copies.totalDocs > 1) {
    return {
      ok: false,
      error: `«${raw}» ist nicht eindeutig (${copies.totalDocs} Treffer). Bitte in der Liste auswählen.`,
      failures: copies.docs.map((c) => String(c.label)),
    }
  }

  const copy = copies.docs[0]
  if (copy.bundle) {
    const bundleId = typeof copy.bundle === 'object' ? copy.bundle.id : copy.bundle
    await p.update({ collection: 'key-bundles', id: bundleId, data: { currentHolder: null } })
    revalidateKeys(`/schluessel/bund/${bundleId}`)
    return { ok: true, message: `${copy.label} gehört zu einem Bund — ganzer Bund zurückgenommen.` }
  }

  await p.update({ collection: 'key-copies', id: copy.id, data: { currentHolder: null } })
  revalidateKeys(`/schluessel/${copy.id}`)
  return {
    ok: true,
    message:
      `${copy.label} zurückgenommen.` +
      (copy.tagNumber ? ` Marke ${copy.tagNumber} wieder ans Brett.` : ''),
  }
}

const STATUS_EVENT: Record<string, KeyEventType> = {
  gesperrt: 'sperrung',
  verloren: 'verlust',
  defekt: 'status_wechsel',
  am_brett: 'freigabe',
}

/** Block, report lost, mark defective, or release a copy back onto the board. */
export async function setCopyStatus(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const id = String(formData.get('copyId'))
  const status = String(formData.get('status') || '')
  const reason = String(formData.get('reason') || '').trim()

  if (!STATUS_EVENT[status]) return { ok: false, error: 'Unbekannter Status.' }

  const p = await payload()
  try {
    const before = await p.findByID({ collection: 'key-copies', id, depth: 0 })
    const doc = await p.update({
      collection: 'key-copies',
      id,
      data: { status: status as never, ...(reason ? { notes: reason } : {}) },
      context: { skipKeyEvents: true },
    })
    await logKeyEvent(p, {
      type: STATUS_EVENT[status],
      copy: doc.id,
      keyLabel: doc.label,
      person: (before.currentHolder as number | null) ?? null,
      reason: reason || null,
      meta: { from: before.status, to: status },
    })
  } catch (err) {
    return { ok: false, error: messageOf(err) }
  }

  revalidateKeys(`/schluessel/${id}`)
  return { ok: true, message: 'Status aktualisiert.' }
}

/** Break the seal on an emergency key. The seal number and reason go on record. */
export async function breakSeal(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const id = String(formData.get('copyId'))
  const reason = String(formData.get('reason') || '').trim()
  if (!reason) return { ok: false, error: 'Für den Siegelbruch ist ein Grund erforderlich.' }

  const p = await payload()
  try {
    const before = await p.findByID({ collection: 'key-copies', id, depth: 0 })
    const doc = await p.update({
      collection: 'key-copies',
      id,
      data: { seal: { sealed: false, sealNumber: before.seal?.sealNumber ?? null } },
      context: { skipKeyEvents: true, sealReason: reason },
    })
    await logKeyEvent(p, {
      type: 'siegel_gebrochen',
      copy: doc.id,
      keyLabel: doc.label,
      reason,
      meta: { sealNumber: before.seal?.sealNumber ?? null },
    })
  } catch (err) {
    return { ok: false, error: messageOf(err) }
  }

  revalidateKeys(`/schluessel/${id}`)
  return { ok: true, message: 'Siegel gebrochen. Der Schlüssel ist jetzt ausgebbar.' }
}

/** Report a loss, theft, defect or missing return. Blocks the copy via the incident hook. */
export async function reportIncident(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const copyId = String(formData.get('copyId') || '')
  const type = String(formData.get('type') || '')
  const description = String(formData.get('description') || '').trim()

  if (!copyId) return { ok: false, error: 'Kein Exemplar angegeben.' }
  if (!type) return { ok: false, error: 'Bitte die Art des Vorfalls wählen.' }

  const p = await payload()
  let created
  try {
    created = await p.create({
      collection: 'key-incidents',
      data: { copy: Number(copyId), type, description: description || null } as never,
    })
  } catch (err) {
    return { ok: false, error: messageOf(err) }
  }

  revalidateKeys(`/schluessel/${copyId}`)
  return {
    ok: true,
    message: 'Vorfall erfasst, Exemplar gesperrt.',
    failures: created.impact ? [created.impact] : undefined,
  }
}

/** Close an incident: either the key turned up, or the rekeying was done. */
export async function closeIncident(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const incidentId = String(formData.get('incidentId') || '')
  const measure = String(formData.get('measure') || 'offen')
  const costNote = String(formData.get('costNote') || '').trim()

  if (!incidentId) return { ok: false, error: 'Kein Vorfall angegeben.' }

  const p = await payload()
  try {
    const doc = await p.update({
      collection: 'key-incidents',
      id: incidentId,
      data: { status: 'erledigt', measure, ...(costNote ? { costNote } : {}) } as never,
    })
    revalidateKeys(`/schluessel/${String((doc as { copy: number | { id: number } }).copy)}`)
  } catch (err) {
    return { ok: false, error: messageOf(err) }
  }

  return {
    ok: true,
    message:
      measure === 'keine'
        ? 'Vorfall erledigt, Exemplar wieder am Brett.'
        : 'Vorfall erledigt, Exemplar als verloren verbucht.',
  }
}

/** Release a blocked copy — closing an open incident if there is one. */
export async function releaseBlockedCopy(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const copyId = String(formData.get('copyId') || '')
  if (!copyId) return { ok: false, error: 'Kein Exemplar angegeben.' }

  const p = await payload()
  try {
    const open = await p.find({
      collection: 'key-incidents',
      where: { and: [{ copy: { equals: copyId } }, { status: { not_equals: 'erledigt' } }] },
      limit: 1,
      depth: 0,
    })
    if (open.totalDocs > 0) {
      await p.update({
        collection: 'key-incidents',
        id: open.docs[0].id,
        data: { status: 'erledigt', measure: 'keine' } as never,
      })
    } else {
      const doc = await p.update({
        collection: 'key-copies',
        id: copyId,
        data: { status: 'am_brett' as never },
        context: { skipKeyEvents: true },
      })
      await logKeyEvent(p, { type: 'freigabe', copy: doc.id, keyLabel: doc.label })
    }
  } catch (err) {
    return { ok: false, error: messageOf(err) }
  }

  revalidateKeys(`/schluessel/${copyId}`)
  return { ok: true, message: 'Exemplar wieder freigegeben.' }
}

/** Take back everything one person holds — the service-exit check. */
export async function returnAllForUser(formData: FormData): Promise<void> {
  const userId = String(formData.get('userId') || '')
  if (!userId) return

  const p = await payload()

  const bundles = await p.find({
    collection: 'key-bundles',
    where: { currentHolder: { equals: userId } },
    limit: 100,
    depth: 0,
  })
  for (const bundle of bundles.docs) {
    await p.update({ collection: 'key-bundles', id: bundle.id, data: { currentHolder: null } })
  }

  const copies = await p.find({
    collection: 'key-copies',
    where: { currentHolder: { equals: userId } },
    limit: 500,
    depth: 0,
  })
  for (const copy of copies.docs) {
    await p.update({ collection: 'key-copies', id: copy.id, data: { currentHolder: null } })
  }

  revalidateKeys(`/personen/${userId}`)
  revalidatePath('/personen')
}

/** Sign off the shift: count what is still out and put it on record. */
export async function confirmHandover(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const toUserId = String(formData.get('toUserId') || '')
  const note = String(formData.get('note') || '').trim()

  const p = await payload()

  const [copies, bundles] = await Promise.all([
    p.find({
      collection: 'key-copies',
      where: { currentHolder: { exists: true } },
      limit: 1000,
      depth: 1,
    }),
    p.find({
      collection: 'key-bundles',
      where: { currentHolder: { exists: true } },
      limit: 200,
      depth: 1,
    }),
  ])

  const now = Date.now()
  const overdue = copies.docs.filter(
    (c) => c.status === 'ausgegeben' && c.dueAt && new Date(c.dueAt).getTime() < now,
  )

  await logKeyEvent(
    p,
    {
      type: 'uebergabe',
      keyLabel: 'Tagesabschluss / Wachübergabe',
      person: toUserId ? Number(toUserId) : null,
      reason: note || null,
      meta: {
        out: copies.totalDocs,
        bundles: bundles.totalDocs,
        overdue: overdue.length,
        items: copies.docs.map((c) => c.label),
      },
    },
    undefined,
  )

  revalidateKeys()
  return {
    ok: true,
    message: `Übergabe quittiert: ${copies.totalDocs} Exemplare draussen, davon ${overdue.length} überfällig.`,
  }
}

/** Record a counted pass over the board. Only deviations are submitted. */
export async function saveInventory(
  _prev: KeyActionState,
  formData: FormData,
): Promise<KeyActionState> {
  const missingIds = formData.getAll('missing').map(String).filter(Boolean)
  const expected = Number(formData.get('expectedCount') || 0)
  const note = String(formData.get('note') || '').trim()
  const performedBy = String(formData.get('performedBy') || '')
  const scope = formData.getAll('scope').map(String).filter(Boolean)

  if (!expected) return { ok: false, error: 'Es wurde kein Bestand geprüft.' }

  const p = await payload()

  const differences = []
  for (const id of missingIds) {
    const copy = await p.findByID({ collection: 'key-copies', id, depth: 0 }).catch(() => null)
    if (!copy) continue
    differences.push({
      copy: Number(id),
      copyLabel: copy.label,
      expectedStatus: copy.currentHolder ? 'Bei Inhaber' : 'Am Brett',
      foundStatus: 'fehlt',
    })
  }

  try {
    await p.create({
      collection: 'key-inventories',
      data: {
        date: new Date().toISOString(),
        ...(performedBy ? { performedBy: Number(performedBy) } : {}),
        ...(scope.length > 0 ? { scope: scope.map(Number) } : {}),
        expectedCount: expected,
        foundCount: expected - differences.length,
        differences,
        status: 'abgeschlossen',
        ...(note ? { notes: note } : {}),
      } as never,
    })
  } catch (err) {
    return { ok: false, error: messageOf(err) }
  }

  revalidateKeys()
  return {
    ok: true,
    message:
      differences.length === 0
        ? `Inventur abgeschlossen: ${expected} von ${expected} angetroffen, keine Differenzen.`
        : `Inventur abgeschlossen: ${expected - differences.length} von ${expected} angetroffen, ${differences.length} ${
            differences.length === 1 ? 'Differenz' : 'Differenzen'
          }.`,
    failures: differences.map((d) => `${d.copyLabel} — fehlt (erwartet: ${d.expectedStatus})`),
  }
}
