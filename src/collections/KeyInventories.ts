import type { CollectionConfig } from 'payload'
import { logKeyEvent } from '../lib/keyEvents'

export const INVENTORY_STATUS = [
  { label: { de: 'Laufend', en: 'In progress' }, value: 'laufend' },
  { label: { de: 'Abgeschlossen', en: 'Completed' }, value: 'abgeschlossen' },
]

export const INVENTORY_FINDING = [
  { label: { de: 'Fehlt', en: 'Missing' }, value: 'fehlt' },
  { label: { de: 'Am falschen Ort', en: 'Wrong place' }, value: 'falscher_ort' },
  { label: { de: 'Beschädigt', en: 'Damaged' }, value: 'beschaedigt' },
]

/**
 * Schlüsselrapport: a counted pass over the board. Only deviations are recorded —
 * everything not listed was found where the system said it would be.
 */
export const KeyInventories: CollectionConfig = {
  slug: 'key-inventories',
  labels: {
    singular: { de: 'Inventur', en: 'Inventory' },
    plural: { de: 'Inventuren', en: 'Inventories' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'expectedCount', 'foundCount', 'status'],
    group: { de: 'Schlüssel', en: 'Keys' },
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
          name: 'date',
          type: 'date',
          required: true,
          label: { de: 'Datum', en: 'Date' },
          admin: {
            width: '34%',
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
          },
        },
        {
          name: 'performedBy',
          type: 'relationship',
          relationTo: 'users',
          label: { de: 'Durchgeführt durch', en: 'Performed by' },
          admin: { width: '33%' },
        },
        {
          name: 'signedOffBy',
          type: 'relationship',
          relationTo: 'users',
          label: { de: 'Visiert durch', en: 'Signed off by' },
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'scope',
      type: 'relationship',
      relationTo: 'key-categories',
      hasMany: true,
      label: { de: 'Umfang (Kategorien)', en: 'Scope (categories)' },
      admin: {
        description: {
          de: 'Leer = gesamter Bestand.',
          en: 'Empty = the whole inventory.',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'expectedCount',
          type: 'number',
          label: { de: 'Soll', en: 'Expected' },
          admin: { width: '34%', readOnly: true },
        },
        {
          name: 'foundCount',
          type: 'number',
          label: { de: 'Ist', en: 'Found' },
          admin: { width: '33%', readOnly: true },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'laufend',
          options: INVENTORY_STATUS,
          label: { de: 'Status', en: 'Status' },
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'differences',
      type: 'array',
      label: { de: 'Differenzen', en: 'Differences' },
      admin: {
        description: {
          de: 'Nur Abweichungen. Was nicht aufgeführt ist, wurde am erwarteten Ort angetroffen.',
          en: 'Deviations only. Anything not listed was found where expected.',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'copy',
              type: 'relationship',
              relationTo: 'key-copies',
              label: { de: 'Exemplar', en: 'Copy' },
              admin: { width: '34%' },
            },
            {
              name: 'copyLabel',
              type: 'text',
              label: { de: 'Bezeichnung (Snapshot)', en: 'Label (snapshot)' },
              admin: { width: '33%' },
            },
            {
              name: 'expectedStatus',
              type: 'text',
              label: { de: 'Erwartet', en: 'Expected' },
              admin: { width: '33%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'foundStatus',
              type: 'select',
              options: INVENTORY_FINDING,
              label: { de: 'Befund', en: 'Finding' },
              admin: { width: '34%' },
            },
            {
              name: 'note',
              type: 'text',
              label: { de: 'Bemerkung', en: 'Note' },
              admin: { width: '66%' },
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
      ({ data }) => {
        const when = data.date ? new Date(data.date) : new Date()
        data.title = `Inventur ${new Intl.DateTimeFormat('de-CH', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(when)}`
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation, context }) => {
        if (context?.skipKeyEvents) return doc
        const justCompleted =
          doc.status === 'abgeschlossen' &&
          (operation === 'create' || previousDoc?.status !== 'abgeschlossen')
        if (!justCompleted) return doc

        const differences = (doc.differences ?? []) as { copyLabel?: string | null }[]
        await logKeyEvent(
          req.payload,
          {
            type: 'inventur',
            keyLabel: doc.title,
            actor: req.user?.id ?? null,
            reason: `${doc.foundCount ?? 0} von ${doc.expectedCount ?? 0} angetroffen`,
            meta: {
              inventory: doc.id,
              expected: doc.expectedCount ?? 0,
              found: doc.foundCount ?? 0,
              differences: differences.map((d) => d.copyLabel).filter(Boolean),
            },
          },
          req,
        )
        return doc
      },
    ],
  },
  timestamps: true,
}
