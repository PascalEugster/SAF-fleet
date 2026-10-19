import { APIError, type CollectionConfig } from 'payload'
import { logKeyEvent } from '../lib/keyEvents'

const idOf = (v: unknown): number | string | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') return (v as { id: number | string }).id ?? null
  return v as number | string
}

/**
 * A bundle is handed over as one unit: one receipt, one signature, one journal
 * entry. Assignment cascades to every copy on the ring, so a single blocked key
 * (sealed, lost, missing PSP) fails the whole hand-over.
 */
export const KeyBundles: CollectionConfig = {
  slug: 'key-bundles',
  labels: {
    singular: { de: 'Schlüsselbund', en: 'Key bundle' },
    plural: { de: 'Schlüsselbünde', en: 'Key bundles' },
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'tagNumber', 'currentHolder', 'dueAt'],
    group: { de: 'Schlüssel', en: 'Keys' },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          unique: true,
          label: { de: 'Bezeichnung', en: 'Label' },
          admin: { placeholder: 'z.B. Bund Wache Nord', width: '60%' },
        },
        {
          name: 'tagNumber',
          type: 'text',
          label: { de: 'Marke / Pfandnummer', en: 'Tag number' },
          admin: { width: '40%' },
        },
      ],
    },
    {
      name: 'copies',
      type: 'relationship',
      relationTo: 'key-copies',
      hasMany: true,
      label: { de: 'Schlüssel am Bund', en: 'Keys on the ring' },
      admin: {
        description: {
          de: 'Diese Exemplare werden gemeinsam ausgegeben und zurückgenommen.',
          en: 'These copies are issued and returned together.',
        },
      },
    },
    {
      type: 'collapsible',
      label: { de: 'Aktuelle Ausgabe', en: 'Current issue' },
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'currentHolder',
          type: 'relationship',
          relationTo: 'users',
          index: true,
          label: { de: 'Inhaber', en: 'Holder' },
          admin: {
            description: {
              de: 'Leer lassen, um den ganzen Bund zurückzunehmen.',
              en: 'Leave empty to take the whole bundle back.',
            },
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'currentReason',
              type: 'text',
              label: { de: 'Grund / Auftrag', en: 'Reason' },
              admin: { width: '50%', condition: (data) => Boolean(data?.currentHolder) },
            },
            {
              name: 'dueAt',
              type: 'date',
              label: { de: 'Rückgabe bis', en: 'Due back' },
              admin: {
                width: '50%',
                condition: (data) => Boolean(data?.currentHolder),
                date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'assignedAt',
              type: 'date',
              label: { de: 'Ausgegeben am', en: 'Issued at' },
              admin: {
                width: '50%',
                readOnly: true,
                condition: (data) => Boolean(data?.currentHolder),
                date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
              },
            },
            {
              name: 'issuedBy',
              type: 'relationship',
              relationTo: 'users',
              label: { de: 'Ausgegeben durch', en: 'Issued by' },
              admin: { width: '25%', readOnly: true, condition: (data) => Boolean(data?.currentHolder) },
            },
            {
              name: 'secondSignature',
              type: 'relationship',
              relationTo: 'users',
              label: { de: 'Zweitunterschrift', en: 'Second signature' },
              admin: { width: '25%' },
            },
          ],
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: { de: 'Bemerkungen', en: 'Notes' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req }) => {
        const prevHolder = idOf(originalDoc?.currentHolder)
        const hasHolderField = 'currentHolder' in data
        const newHolder = idOf(data.currentHolder)
        const holderChanged = hasHolderField && String(newHolder) !== String(prevHolder)

        if (holderChanged && newHolder) {
          const copies = (('copies' in data ? data.copies : originalDoc?.copies) ?? []) as unknown[]
          if (copies.length === 0) {
            throw new APIError('Der Bund enthält keine Schlüssel.', 400)
          }
          data.assignedAt = new Date().toISOString()
          if (!data.issuedBy && req.user) data.issuedBy = req.user.id
        } else if (holderChanged && !newHolder) {
          data.assignedAt = null
          data.currentReason = null
          data.dueAt = null
          data.secondSignature = null
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (context?.skipKeyEvents) return doc

        const prevHolder = idOf(previousDoc?.currentHolder)
        const nowHolder = idOf(doc.currentHolder)
        if (String(prevHolder) === String(nowHolder)) return doc

        const copyIds = ((doc.copies ?? []) as unknown[]).map(idOf).filter(Boolean) as (number | string)[]
        const labels: string[] = []

        try {
          for (const copyId of copyIds) {
            const updated = await req.payload.update({
              collection: 'key-copies',
              id: copyId,
              data: nowHolder
                ? {
                    currentHolder: nowHolder as never,
                    currentReason: doc.currentReason ?? null,
                    dueAt: doc.dueAt ?? null,
                    secondSignature: idOf(doc.secondSignature) as never,
                  }
                : { currentHolder: null },
              req,
              context: { fromBundle: true, skipKeyEvents: true },
            })
            labels.push(String((updated as { label?: string }).label ?? copyId))
          }
        } finally {
          // Flags live on req.context — clear them so later operations log again.
          if (req.context) {
            req.context.fromBundle = false
            req.context.skipKeyEvents = false
          }
        }

        await logKeyEvent(
          req.payload,
          {
            type: nowHolder ? 'bund_ausgabe' : 'bund_ruecknahme',
            bundle: doc.id,
            keyLabel: doc.label,
            person: nowHolder ?? prevHolder,
            actor: req.user?.id ?? null,
            reason: nowHolder ? (doc.currentReason ?? null) : null,
            dueAt: nowHolder ? (doc.dueAt ?? null) : null,
            meta: { copies: labels, count: labels.length },
          },
          req,
        )

        return doc
      },
    ],
  },
  timestamps: true,
}
