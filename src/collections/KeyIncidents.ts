import { APIError, type CollectionConfig } from 'payload'
import { logKeyEvent } from '../lib/keyEvents'
import { PHYSICAL_MEDIA } from './KeyDepots'

export const INCIDENT_TYPES = [
  { label: { de: 'Verlust', en: 'Loss' }, value: 'verlust' },
  { label: { de: 'Diebstahl', en: 'Theft' }, value: 'diebstahl' },
  { label: { de: 'Defekt', en: 'Defective' }, value: 'defekt' },
  { label: { de: 'Nicht zurückgegeben', en: 'Not returned' }, value: 'nicht_zurueckgegeben' },
  {
    label: { de: 'Siegelbruch ungeklärt', en: 'Unexplained seal break' },
    value: 'siegelbruch_ungeklaert',
  },
]

export const INCIDENT_MEASURES = [
  { label: { de: 'Offen', en: 'Open' }, value: 'offen' },
  { label: { de: 'Zylinder tauschen', en: 'Replace cylinder' }, value: 'zylinder_tausch' },
  { label: { de: 'Gruppe umbauen', en: 'Rekey group' }, value: 'gruppe_umbau' },
  { label: { de: 'Schliessanlage umbauen', en: 'Rekey locking system' }, value: 'anlage_umbau' },
  {
    label: { de: 'Berechtigung sperren', en: 'Revoke credential' },
    value: 'berechtigung_sperren',
  },
  { label: { de: 'Keine Massnahme', en: 'No measure' }, value: 'keine' },
]

export const INCIDENT_STATUS = [
  { label: { de: 'Offen', en: 'Open' }, value: 'offen' },
  { label: { de: 'In Bearbeitung', en: 'In progress' }, value: 'in_bearbeitung' },
  { label: { de: 'Erledigt', en: 'Closed' }, value: 'erledigt' },
]

/** What a lost copy does to the copy itself while the incident is open. */
const BLOCKING_STATUS: Record<string, string> = {
  verlust: 'gesperrt',
  diebstahl: 'gesperrt',
  nicht_zurueckgegeben: 'gesperrt',
  siegelbruch_ungeklaert: 'gesperrt',
  defekt: 'defekt',
}

const MEASURE_BY_HIERARCHY: Record<string, string> = {
  ES: 'zylinder_tausch',
  GS: 'gruppe_umbau',
  HS: 'gruppe_umbau',
  GHS: 'anlage_umbau',
}

const idOf = (v: unknown): number | string | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') return (v as { id: number | string }).id ?? null
  return v as number | string
}

export const KeyIncidents: CollectionConfig = {
  slug: 'key-incidents',
  labels: {
    singular: { de: 'Schlüsselvorfall', en: 'Key incident' },
    plural: { de: 'Schlüsselvorfälle', en: 'Key incidents' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status', 'measure', 'reportedAt'],
    group: { de: 'Schlüssel', en: 'Keys' },
    description: {
      de: 'Verlust, Diebstahl, Defekt. Das betroffene Exemplar wird automatisch gesperrt, die Folge aus der Hierarchiestufe berechnet.',
      en: 'Loss, theft, defect. The copy is blocked automatically and the impact derived from the hierarchy level.',
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: { de: 'Bezeichnung', en: 'Title' },
      admin: { readOnly: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'copy',
          type: 'relationship',
          relationTo: 'key-copies',
          required: true,
          index: true,
          label: { de: 'Exemplar', en: 'Copy' },
          admin: { width: '50%' },
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'verlust',
          options: INCIDENT_TYPES,
          label: { de: 'Art', en: 'Type' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'reportedAt',
          type: 'date',
          label: { de: 'Gemeldet am', en: 'Reported at' },
          admin: {
            width: '34%',
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
          },
        },
        {
          name: 'reportedBy',
          type: 'relationship',
          relationTo: 'users',
          label: { de: 'Gemeldet durch', en: 'Reported by' },
          admin: { width: '33%' },
        },
        {
          name: 'heldBy',
          type: 'relationship',
          relationTo: 'users',
          label: { de: 'War bei', en: 'Was held by' },
          admin: {
            width: '33%',
            readOnly: true,
            description: {
              de: 'Inhaber im Moment der Meldung.',
              en: 'Holder at the time of the report.',
            },
          },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      label: { de: 'Sachverhalt', en: 'Description' },
    },
    {
      name: 'impact',
      type: 'textarea',
      label: { de: 'Folgenabschätzung', en: 'Impact' },
      admin: {
        readOnly: true,
        description: {
          de: 'Wird aus Hierarchiestufe und Schliessanlage berechnet.',
          en: 'Derived from hierarchy level and locking system.',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'measure',
          type: 'select',
          required: true,
          defaultValue: 'offen',
          options: INCIDENT_MEASURES,
          label: { de: 'Massnahme', en: 'Measure' },
          admin: { width: '34%' },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'offen',
          options: INCIDENT_STATUS,
          label: { de: 'Status', en: 'Status' },
          admin: { width: '33%' },
        },
        {
          name: 'costNote',
          type: 'text',
          label: { de: 'Kostenfolge', en: 'Cost note' },
          admin: { width: '33%', placeholder: 'z.B. Umbau 8 Zylinder' },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        const copyId = idOf('copy' in data ? data.copy : originalDoc?.copy)
        if (!copyId) throw new APIError('Betroffenes Exemplar fehlt.', 400)

        const copy = await req.payload.findByID({
          collection: 'key-copies',
          id: copyId,
          depth: 0,
          req,
        })
        const key = await req.payload.findByID({
          collection: 'keys',
          id: idOf(copy.key)!,
          depth: 0,
          req,
        })

        data.title = `${copy.label} — ${key.label}`

        if (operation === 'create') {
          data.reportedAt = data.reportedAt ?? new Date().toISOString()
          data.heldBy = idOf(copy.currentHolder)
          if (!data.reportedBy && req.user) data.reportedBy = req.user.id

          const hierarchy = String(key.hierarchy ?? 'ES')
          const systemId = idOf(key.lockingSystem)
          let systemName = 'ohne Schliessanlage'
          let keysInSystem = 1
          let copiesInSystem = 0

          if (systemId) {
            const system = await req.payload.findByID({
              collection: 'locking-systems',
              id: systemId,
              depth: 0,
              req,
            })
            systemName = `«${(system as { name: string }).name}»`
            const keys = await req.payload.find({
              collection: 'keys',
              where: { lockingSystem: { equals: systemId } },
              limit: 500,
              depth: 0,
              req,
            })
            keysInSystem = keys.totalDocs
            const copies = await req.payload.find({
              collection: 'key-copies',
              where: { key: { in: keys.docs.map((k) => k.id) } },
              limit: 1,
              depth: 0,
              req,
            })
            copiesInSystem = copies.totalDocs
          }

          const ownCopies = await req.payload.find({
            collection: 'key-copies',
            where: { key: { equals: key.id } },
            limit: 1,
            depth: 0,
            req,
          })

          // An electronic credential is revoked, not drilled out — the cost of a
          // loss is a database entry, not a locksmith.
          if (!PHYSICAL_MEDIA.includes(String(copy.medium)) && data.type !== 'defekt') {
            data.impact =
              `Elektronische Berechtigung für «${key.label}». Kein Zylindertausch nötig: ` +
              'Berechtigung im System sperren und aus den betroffenen Zylindern ausprogrammieren. ' +
              `Von dieser Schliessung sind ${ownCopies.totalDocs} Berechtigungen ausgegeben.`
            data.measure = 'berechtigung_sperren'
          } else if (data.type === 'defekt') {
            data.impact =
              `Defektes Exemplar. Kein Schliessungsrisiko — Ersatzexemplar beschaffen. ` +
              `Von «${key.label}» sind ${ownCopies.totalDocs} Exemplare erfasst.`
          } else if (hierarchy === 'GHS') {
            data.impact =
              `Generalhauptschlüssel der Schliessanlage ${systemName}. ` +
              `Umbau der gesamten Schliessanlage erforderlich: ${keysInSystem} Schliessungen, ` +
              `${copiesInSystem} Exemplare betroffen. Bis zum Entscheid bleibt das Exemplar gesperrt.`
          } else if (hierarchy === 'HS' || hierarchy === 'GS') {
            data.impact =
              `${hierarchy === 'HS' ? 'Hauptschlüssel' : 'Gruppenschlüssel'} der Schliessanlage ${systemName}. ` +
              `Teilumbau erforderlich. Der genaue Umfang ergibt sich aus dem Schliessplan; ` +
              `die Anlage umfasst ${keysInSystem} Schliessungen mit ${copiesInSystem} Exemplaren.`
          } else {
            data.impact =
              `Einzelschlüssel «${key.label}»${key.opensLocation ? ` (${key.opensLocation})` : ''}. ` +
              `Zylinder dieser Tür tauschen, ${ownCopies.totalDocs} Exemplare einziehen und neu ausgeben.`
          }

          if (data.measure === 'offen' || !data.measure) {
            data.measure =
              data.type === 'defekt' ? 'keine' : (MEASURE_BY_HIERARCHY[hierarchy] ?? 'zylinder_tausch')
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation, context }) => {
        if (context?.skipKeyEvents) return doc
        const copyId = idOf(doc.copy)
        if (!copyId) return doc

        const setCopy = async (status: string) => {
          await req.payload.update({
            collection: 'key-copies',
            id: copyId,
            data: { status: status as never },
            req,
            context: { skipKeyEvents: true },
          })
          if (req.context) req.context.skipKeyEvents = false
        }

        if (operation === 'create') {
          await setCopy(BLOCKING_STATUS[doc.type] ?? 'gesperrt')
          await logKeyEvent(
            req.payload,
            {
              type: doc.type === 'verlust' || doc.type === 'diebstahl' ? 'verlust' : 'sperrung',
              copy: copyId,
              keyLabel: doc.title,
              person: idOf(doc.heldBy),
              actor: req.user?.id ?? null,
              reason: doc.description ?? null,
              meta: { incident: doc.id, type: doc.type, measure: doc.measure },
            },
            req,
          )
          return doc
        }

        // Closing an incident decides what happens to the copy.
        if (previousDoc?.status !== 'erledigt' && doc.status === 'erledigt') {
          const found = doc.measure === 'keine' && doc.type !== 'defekt'
          await setCopy(found ? 'am_brett' : doc.type === 'defekt' ? 'defekt' : 'verloren')
          await logKeyEvent(
            req.payload,
            {
              type: found ? 'freigabe' : 'status_wechsel',
              copy: copyId,
              keyLabel: doc.title,
              actor: req.user?.id ?? null,
              reason: doc.costNote ?? doc.description ?? null,
              meta: { incident: doc.id, measure: doc.measure, closed: true },
            },
            req,
          )
        }

        return doc
      },
    ],
  },
  timestamps: true,
}
