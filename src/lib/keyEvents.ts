import type { Payload, PayloadRequest } from 'payload'

export type KeyEventType =
  | 'ausgabe'
  | 'ruecknahme'
  | 'bund_ausgabe'
  | 'bund_ruecknahme'
  | 'siegel_gebrochen'
  | 'verlust'
  | 'sperrung'
  | 'freigabe'
  | 'inventur'
  | 'uebergabe'
  | 'status_wechsel'

export type KeyEventInput = {
  type: KeyEventType
  copy?: number | string | null
  bundle?: number | string | null
  keyLabel?: string | null
  person?: number | string | null
  actor?: number | string | null
  reason?: string | null
  dueAt?: string | null
  meta?: unknown
}

async function nameOfUser(
  payload: Payload,
  id: number | string | null | undefined,
  req?: PayloadRequest,
): Promise<string | null> {
  if (id === null || id === undefined) return null
  try {
    const u = await payload.findByID({ collection: 'users', id, depth: 0, req })
    return (u as { name?: string })?.name ?? null
  } catch {
    return null
  }
}

/**
 * Append one entry to the key journal. Names are snapshotted so the record
 * survives deletion of the person — same approach as the vehicle history.
 */
export async function logKeyEvent(
  payload: Payload,
  input: KeyEventInput,
  req?: PayloadRequest,
): Promise<void> {
  const [personName, actorName] = await Promise.all([
    nameOfUser(payload, input.person, req),
    nameOfUser(payload, input.actor, req),
  ])

  await payload.create({
    collection: 'key-events',
    data: {
      type: input.type,
      copy: (input.copy ?? null) as never,
      bundle: (input.bundle ?? null) as never,
      keyLabel: input.keyLabel ?? null,
      person: (input.person ?? null) as never,
      personName,
      actor: (input.actor ?? null) as never,
      actorName,
      reason: input.reason ?? null,
      dueAt: input.dueAt ?? null,
      meta: (input.meta ?? null) as never,
      at: new Date().toISOString(),
    },
    req,
    context: { skipKeyEvents: true },
  })
}
