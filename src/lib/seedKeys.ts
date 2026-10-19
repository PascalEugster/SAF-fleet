import type { Payload, PayloadRequest } from 'payload'

type SeedOpts = { req?: PayloadRequest; userIds: Record<string, number | string> }

const KEY_CATEGORIES = [
  { name: 'Unterkunft', icon: '🚪', sortOrder: 1, defaultRisk: 'normal' },
  { name: 'Material', icon: '📦', sortOrder: 2, defaultRisk: 'erhoeht' },
  { name: 'Sicherheit', icon: '🔒', sortOrder: 3, defaultRisk: 'hoch' },
  { name: 'Führung', icon: '📁', sortOrder: 4, defaultRisk: 'erhoeht' },
  { name: 'Anlage', icon: '🏢', sortOrder: 5, defaultRisk: 'hoch' },
  { name: 'Elektronisch', icon: '💳', sortOrder: 6, defaultRisk: 'normal' },
] as const

const LOCKING_SYSTEMS = [
  { name: 'Kaserne Ost', location: 'Waffenplatz Thun', manufacturer: 'dormakaba' },
  {
    name: 'Anlage A4711',
    location: 'Kampf- und Führungsinfrastruktur',
    manufacturer: 'Kaba Gemini',
  },
] as const

type KeySpec = {
  number: string
  label: string
  category: (typeof KEY_CATEGORIES)[number]['name']
  system?: (typeof LOCKING_SYSTEMS)[number]['name']
  hierarchy?: 'ES' | 'GS' | 'HS' | 'GHS'
  risk?: 'normal' | 'erhoeht' | 'hoch'
  zone?: 'keine' | 'zone1' | 'zone2' | 'zone3'
  opens?: string
  medium?: 'mechanisch' | 'badge' | 'transponder' | 'code' | 'vorhaengeschloss'
  copies: number
  notes?: string
}

const KEYS: KeySpec[] = [
  // Unterkunft
  { number: 'ZI-201', label: 'Zimmer 201', category: 'Unterkunft', system: 'Kaserne Ost', opens: 'Gebäude 3, Zimmer 201', copies: 2 },
  { number: 'ZI-202', label: 'Zimmer 202', category: 'Unterkunft', system: 'Kaserne Ost', opens: 'Gebäude 3, Zimmer 202', copies: 2 },
  { number: 'ZI-203', label: 'Zimmer 203', category: 'Unterkunft', system: 'Kaserne Ost', opens: 'Gebäude 3, Zimmer 203', copies: 2 },
  { number: 'ZI-204', label: 'Zimmer 204 (Kader)', category: 'Unterkunft', system: 'Kaserne Ost', opens: 'Gebäude 3, Zimmer 204', copies: 2 },
  { number: 'ZI-205', label: 'Zimmer 205', category: 'Unterkunft', system: 'Kaserne Ost', opens: 'Gebäude 3, Zimmer 205', copies: 2 },
  { number: 'ZI-206', label: 'Zimmer 206', category: 'Unterkunft', system: 'Kaserne Ost', opens: 'Gebäude 3, Zimmer 206', copies: 2 },
  { number: 'TH-1', label: 'Theoriezimmer 1', category: 'Unterkunft', system: 'Kaserne Ost', opens: 'Gebäude 2, EG', copies: 2 },
  { number: 'AU-1', label: 'Aufenthaltsraum', category: 'Unterkunft', system: 'Kaserne Ost', opens: 'Gebäude 3, EG', copies: 1 },
  { number: 'DU-1', label: 'Duschen und WC', category: 'Unterkunft', system: 'Kaserne Ost', opens: 'Gebäude 3, UG', copies: 1 },
  { number: 'PU-1', label: 'Putzraum', category: 'Unterkunft', system: 'Kaserne Ost', copies: 1 },
  { number: 'SP-12', label: 'Spind 12', category: 'Unterkunft', medium: 'vorhaengeschloss', copies: 1 },
  { number: 'GS-G3', label: 'Gruppenschlüssel Gebäude 3', category: 'Unterkunft', system: 'Kaserne Ost', hierarchy: 'GS', risk: 'erhoeht', opens: 'Alle Zimmer Gebäude 3', copies: 2, notes: 'Nur an Kader. Anhänger trägt keine Stufenbezeichnung.' },

  // Material
  { number: 'MA-1', label: 'Materiallager Nord', category: 'Material', system: 'Kaserne Ost', opens: 'Gebäude 1, Halle A', copies: 2 },
  { number: 'MA-2', label: 'Magazin Süd', category: 'Material', system: 'Kaserne Ost', copies: 2 },
  { number: 'ZH-1', label: 'Zeughaus Halle 1', category: 'Material', copies: 1 },
  { number: 'WE-1', label: 'Werkstatt', category: 'Material', system: 'Kaserne Ost', copies: 1 },
  { number: 'ET-1', label: 'Ersatzteillager', category: 'Material', copies: 1 },
  { number: 'GA-1', label: 'Fahrzeughalle', category: 'Material', system: 'Kaserne Ost', opens: 'Gebäude 5', copies: 2 },
  { number: 'TA-1', label: 'Tankanlage', category: 'Material', risk: 'hoch', copies: 1, notes: 'Treibstoff — Ausgabe nur an instruierte Personen.' },
  { number: 'KU-1', label: 'Verpflegungsmagazin', category: 'Material', system: 'Kaserne Ost', copies: 1 },

  // Sicherheit
  { number: 'WL-1', label: 'Waffenlokal', category: 'Sicherheit', system: 'Kaserne Ost', risk: 'hoch', zone: 'zone2', opens: 'Gebäude 1, Raum 014', copies: 2, notes: 'Schlüssel getrennt von der Munition aufbewahren, nie am Schlüsselbund tragen.' },
  { number: 'MU-1', label: 'Munitionsmagazin', category: 'Sicherheit', risk: 'hoch', zone: 'zone2', copies: 1 },
  { number: 'SM-1', label: 'Sprengmittelmagazin', category: 'Sicherheit', risk: 'hoch', zone: 'zone3', copies: 1 },
  { number: 'PS-1', label: 'Panzerschrank klassifizierte Dokumente', category: 'Sicherheit', risk: 'hoch', zone: 'zone2', copies: 1, notes: 'Zusätzlich mit Zahlenkombination gesichert.' },
  { number: 'FM-1', label: 'Fm- und Serverraum', category: 'Sicherheit', system: 'Kaserne Ost', risk: 'hoch', zone: 'zone2', copies: 1 },
  { number: 'SA-1', label: 'Medikamentenschrank Sanität', category: 'Sicherheit', risk: 'hoch', copies: 1, notes: 'Betäubungsmittel — Zwei-Schlüssel-Prinzip.' },

  // Führung
  { number: 'KP-1', label: 'Kommandoposten', category: 'Führung', system: 'Kaserne Ost', copies: 2 },
  { number: 'BU-KDT', label: 'Büro Kp Kdt', category: 'Führung', system: 'Kaserne Ost', copies: 1 },
  { number: 'AR-1', label: 'Archiv', category: 'Führung', system: 'Kaserne Ost', copies: 1 },
  { number: 'KA-1', label: 'Geldkassette', category: 'Führung', copies: 1 },
  { number: 'SK-1', label: 'Schlüsselkasten Zentrale', category: 'Führung', risk: 'hoch', copies: 2, notes: 'Der Schlüssel zum Schlüsseldepot ist selbst ein zu verwaltender Schlüssel.' },

  // Anlage
  { number: 'TO-1', label: 'Haupttor', category: 'Anlage', system: 'Kaserne Ost', zone: 'zone1', risk: 'erhoeht', copies: 2 },
  { number: 'BA-1', label: 'Barriere Einfahrt', category: 'Anlage', system: 'Kaserne Ost', risk: 'erhoeht', copies: 1 },
  { number: 'TE-1', label: 'Technikraum Heizung', category: 'Anlage', system: 'Kaserne Ost', risk: 'erhoeht', copies: 1 },
  { number: 'A4711-ZU', label: 'Zugang Anlage A4711', category: 'Anlage', system: 'Anlage A4711', hierarchy: 'HS', risk: 'hoch', zone: 'zone2', copies: 1 },
  { number: 'A4711-GHS', label: 'Generalhauptschlüssel Anlage A4711', category: 'Anlage', system: 'Anlage A4711', hierarchy: 'GHS', risk: 'hoch', zone: 'zone3', opens: 'Gesamte Anlage A4711', copies: 1, notes: 'Verlust bedeutet Umbau der gesamten Schliessanlage.' },

  // Elektronisch
  { number: 'BA-100', label: 'Zutrittsbadge Kaserne Ost', category: 'Elektronisch', system: 'Kaserne Ost', medium: 'badge', copies: 3 },
  { number: 'TR-50', label: 'Transponder Werkstatt', category: 'Elektronisch', medium: 'transponder', copies: 1 },
  { number: 'CO-S1', label: 'Tresorkombination S1', category: 'Elektronisch', medium: 'code', risk: 'hoch', copies: 1 },
]

const BUNDLES: {
  label: string
  tagNumber: string
  members: [string, number][]
  notes?: string
}[] = [
  {
    label: 'Bund Wache Nord',
    tagNumber: '214',
    members: [
      ['TO-1', 1],
      ['BA-1', 1],
      ['TE-1', 1],
      ['KP-1', 1],
    ],
    notes: 'Wird bei jeder Wachübergabe gezählt und quittiert.',
  },
  {
    label: 'Bund Fourier',
    tagNumber: '307',
    members: [
      ['MA-1', 1],
      ['MA-2', 1],
      ['ZH-1', 1],
      ['ET-1', 1],
      ['KU-1', 1],
    ],
    notes: 'Dauerausgabe an den Fourier, Rückgabe bei Funktionswechsel.',
  },
]

const at = (daysFromNow: number, hour: number, minute = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/**
 * Sample key inventory: every category, both hierarchy extremes, two bundles,
 * one sealed emergency key, one overdue issue and one lost badge. Idempotent —
 * everything is matched on its unique business key before being created.
 */
export async function seedKeys(payload: Payload, { req, userIds }: SeedOpts) {
  const ensure = async <T extends Record<string, unknown>>(
    collection: 'key-categories' | 'locking-systems' | 'keys' | 'key-bundles',
    field: string,
    value: unknown,
    data: T,
  ) => {
    const found = await payload.find({
      collection,
      where: { [field]: { equals: value } },
      limit: 1,
      depth: 0,
      req,
    })
    if (found.totalDocs > 0) return found.docs[0]
    return payload.create({ collection, data: data as never, req })
  }

  const categoryIds: Record<string, number | string> = {}
  for (const c of KEY_CATEGORIES) {
    const doc = await ensure('key-categories', 'name', c.name, c)
    categoryIds[c.name] = doc.id
  }

  const systemIds: Record<string, number | string> = {}
  for (const s of LOCKING_SYSTEMS) {
    const doc = await ensure('locking-systems', 'name', s.name, s)
    systemIds[s.name] = doc.id
  }

  const keyIds: Record<string, number | string> = {}
  for (const spec of KEYS) {
    const doc = await ensure('keys', 'keyNumber', spec.number, {
      keyNumber: spec.number,
      label: spec.label,
      category: categoryIds[spec.category],
      ...(spec.system ? { lockingSystem: systemIds[spec.system] } : {}),
      hierarchy: spec.hierarchy ?? 'ES',
      risk: spec.risk ?? KEY_CATEGORIES.find((c) => c.name === spec.category)!.defaultRisk,
      protectionZone: spec.zone ?? 'keine',
      ...(spec.opens ? { opensLocation: spec.opens } : {}),
      ...(spec.notes ? { notes: spec.notes } : {}),
    })
    keyIds[spec.number] = doc.id
  }

  // Copies, numbered per key, with a board slot so the physical board matches.
  const copyIds: Record<string, number | string> = {}
  let slot = 0
  for (const spec of KEYS) {
    for (let n = 1; n <= spec.copies; n++) {
      slot++
      const code = `${spec.number}#${n}`
      const found = await payload.find({
        collection: 'key-copies',
        where: {
          and: [{ key: { equals: keyIds[spec.number] } }, { copyNumber: { equals: n } }],
        },
        limit: 1,
        depth: 0,
        req,
      })
      if (found.totalDocs > 0) {
        copyIds[code] = found.docs[0].id
        continue
      }

      // WL-1 keeps a sealed reserve key — the seal, not the hand-over, is the event.
      const sealed = spec.number === 'WL-1' && n === 2
      const doc = await payload.create({
        collection: 'key-copies',
        data: {
          key: keyIds[spec.number] as never,
          copyNumber: n,
          medium: spec.medium ?? 'mechanisch',
          storageSlot: `${String.fromCharCode(65 + Math.floor((slot - 1) / 20))}-${String(
            ((slot - 1) % 20) + 1,
          ).padStart(2, '0')}`,
          ...(sealed
            ? {
                seal: { sealed: true, sealNumber: 'S-04711', sealedAt: at(-120, 9) },
                notes: 'Notschlüssel im versiegelten Kuvert.',
              }
            : {}),
        } as never,
        req,
      })
      copyIds[code] = doc.id
    }
  }

  // Bundles
  const bundleIds: Record<string, number | string> = {}
  for (const b of BUNDLES) {
    const members = b.members
      .map(([number, n]) => copyIds[`${number}#${n}`])
      .filter(Boolean) as (number | string)[]
    const doc = await ensure('key-bundles', 'label', b.label, {
      label: b.label,
      tagNumber: b.tagNumber,
      copies: members,
      ...(b.notes ? { notes: b.notes } : {}),
    })
    bundleIds[b.label] = doc.id
  }

  // --- Demo movements. Each step checks first, so re-running adds no history. ---

  const issueCopy = async (
    code: string,
    email: string,
    opts: { reason?: string; dueAt?: string | null; second?: string } = {},
  ) => {
    const id = copyIds[code]
    if (!id) return
    const doc = await payload.findByID({ collection: 'key-copies', id, depth: 0, req })
    if (doc.currentHolder || doc.status !== 'am_brett') return
    try {
      await payload.update({
        collection: 'key-copies',
        id,
        data: {
          currentHolder: userIds[email] as never,
          currentReason: opts.reason ?? null,
          dueAt: opts.dueAt ?? null,
          ...(opts.second ? { secondSignature: userIds[opts.second] as never } : {}),
        },
        req,
      })
    } catch (err) {
      // A demo booking the rules reject (e.g. missing PSP) must not abort the seed.
      payload.logger.warn(`Seed: ${code} nicht ausgegeben — ${(err as Error).message}`)
    }
  }

  const issueBundle = async (
    label: string,
    email: string,
    opts: { reason?: string; dueAt?: string | null; second?: string } = {},
  ) => {
    const id = bundleIds[label]
    if (!id) return
    const doc = await payload.findByID({ collection: 'key-bundles', id, depth: 0, req })
    if (doc.currentHolder) return
    try {
      await payload.update({
        collection: 'key-bundles',
        id,
        data: {
          currentHolder: userIds[email] as never,
          currentReason: opts.reason ?? null,
          dueAt: opts.dueAt ?? null,
          ...(opts.second ? { secondSignature: userIds[opts.second] as never } : {}),
        },
        req,
      })
    } catch (err) {
      payload.logger.warn(`Seed: ${label} nicht ausgegeben — ${(err as Error).message}`)
    }
  }

  // Permanent issue to the quartermaster, no due date.
  await issueBundle('Bund Fourier', 'anna.buehler@vtg.admin.ch', {
    reason: 'Funktion Fourier',
  })
  // Guard duty, back at the next shift change.
  await issueBundle('Bund Wache Nord', 'hans.muster@vtg.admin.ch', {
    reason: 'Wachdienst',
    dueAt: at(1, 6),
  })

  await issueCopy('ZI-201#1', 'marco.rossi@vtg.admin.ch', {
    reason: 'Unterkunft WK 2026',
    dueAt: at(0, 18),
  })
  // Deliberately overdue, so the board shows an amber tile on first start.
  await issueCopy('ZI-202#1', 'sophie.favre@vtg.admin.ch', {
    reason: 'Unterkunft WK 2026',
    dueAt: at(-1, 18),
  })
  // High risk plus protection zone 2: needs a valid PSP and a second signature.
  await issueCopy('WL-1#1', 'sophie.favre@vtg.admin.ch', {
    reason: 'Waffenkontrolle',
    dueAt: at(0, 22),
    second: 'anna.buehler@vtg.admin.ch',
  })

  // One closed hand-over so the journal is not empty.
  const closed = copyIds['ZI-203#1']
  if (closed) {
    const doc = await payload.findByID({ collection: 'key-copies', id: closed, depth: 0, req })
    const history = await payload.find({
      collection: 'key-events',
      where: { copy: { equals: closed } },
      limit: 1,
      depth: 0,
      req,
    })
    if (!doc.currentHolder && doc.status === 'am_brett' && history.totalDocs === 0) {
      await payload.update({
        collection: 'key-copies',
        id: closed,
        data: {
          currentHolder: userIds['hans.muster@vtg.admin.ch'] as never,
          currentReason: 'Zimmerwechsel',
          dueAt: at(-3, 18),
        },
        req,
      })
      await payload.update({
        collection: 'key-copies',
        id: closed,
        data: { currentHolder: null },
        req,
      })
    }
  }

  // One lost badge, blocked for issue.
  const lost = copyIds['BA-100#3']
  if (lost) {
    const doc = await payload.findByID({ collection: 'key-copies', id: lost, depth: 0, req })
    if (doc.status === 'am_brett' && !doc.currentHolder) {
      await payload.update({
        collection: 'key-copies',
        id: lost,
        data: { status: 'verloren', notes: 'Beim Austritt nicht zurückgegeben.' },
        req,
      })
    }
  }

  return {
    keys: Object.keys(keyIds).length,
    copies: Object.keys(copyIds).length,
    bundles: Object.keys(bundleIds).length,
  }
}
