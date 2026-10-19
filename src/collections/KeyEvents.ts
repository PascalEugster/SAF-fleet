import type { CollectionConfig } from 'payload'

export const KEY_EVENT_TYPES = [
  { label: { de: 'Ausgabe', en: 'Issued' }, value: 'ausgabe' },
  { label: { de: 'Rücknahme', en: 'Returned' }, value: 'ruecknahme' },
  { label: { de: 'Bund ausgegeben', en: 'Bundle issued' }, value: 'bund_ausgabe' },
  { label: { de: 'Bund zurückgenommen', en: 'Bundle returned' }, value: 'bund_ruecknahme' },
  { label: { de: 'Siegel gebrochen', en: 'Seal broken' }, value: 'siegel_gebrochen' },
  { label: { de: 'Verlust', en: 'Loss' }, value: 'verlust' },
  { label: { de: 'Gesperrt', en: 'Blocked' }, value: 'sperrung' },
  { label: { de: 'Freigegeben', en: 'Released' }, value: 'freigabe' },
  { label: { de: 'Inventur', en: 'Inventory' }, value: 'inventur' },
  { label: { de: 'Übergabe', en: 'Handover' }, value: 'uebergabe' },
  { label: { de: 'Statuswechsel', en: 'Status change' }, value: 'status_wechsel' },
]

/**
 * Append-only journal of every key movement. Updates are denied so the audit
 * trail cannot be rewritten; deletion stays open for the reset tool.
 */
export const KeyEvents: CollectionConfig = {
  slug: 'key-events',
  labels: {
    singular: { de: 'Schlüsselbewegung', en: 'Key event' },
    plural: { de: 'Schlüsseljournal', en: 'Key journal' },
  },
  admin: {
    useAsTitle: 'keyLabel',
    defaultColumns: ['at', 'type', 'keyLabel', 'personName', 'actorName'],
    group: { de: 'Schlüssel', en: 'Keys' },
    description: {
      de: 'Lückenloses Protokoll. Einträge können nicht nachträglich geändert werden.',
      en: 'Complete log. Entries cannot be edited after the fact.',
    },
  },
  access: {
    read: () => true,
    update: () => false,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'at',
          type: 'date',
          required: true,
          index: true,
          label: { de: 'Zeitpunkt', en: 'Timestamp' },
          admin: {
            width: '50%',
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
          },
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: KEY_EVENT_TYPES,
          label: { de: 'Vorgang', en: 'Event' },
          admin: { width: '50%', readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'copy',
          type: 'relationship',
          relationTo: 'key-copies',
          label: { de: 'Exemplar', en: 'Copy' },
          admin: { width: '50%', readOnly: true },
        },
        {
          name: 'bundle',
          type: 'relationship',
          relationTo: 'key-bundles',
          label: { de: 'Bund', en: 'Bundle' },
          admin: { width: '50%', readOnly: true },
        },
      ],
    },
    {
      name: 'keyLabel',
      type: 'text',
      label: { de: 'Bezeichnung (Snapshot)', en: 'Label (snapshot)' },
      admin: { readOnly: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'person',
          type: 'relationship',
          relationTo: 'users',
          label: { de: 'Person', en: 'Person' },
          admin: { width: '25%', readOnly: true },
        },
        {
          name: 'personName',
          type: 'text',
          label: { de: 'Person (Snapshot)', en: 'Person (snapshot)' },
          admin: { width: '25%', readOnly: true },
        },
        {
          name: 'actor',
          type: 'relationship',
          relationTo: 'users',
          label: { de: 'Gebucht von', en: 'Booked by' },
          admin: { width: '25%', readOnly: true },
        },
        {
          name: 'actorName',
          type: 'text',
          label: { de: 'Gebucht von (Snapshot)', en: 'Booked by (snapshot)' },
          admin: { width: '25%', readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'reason',
          type: 'text',
          label: { de: 'Grund', en: 'Reason' },
          admin: { width: '50%', readOnly: true },
        },
        {
          name: 'dueAt',
          type: 'date',
          label: { de: 'Rückgabe bis', en: 'Due' },
          admin: {
            width: '50%',
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
          },
        },
      ],
    },
    {
      name: 'meta',
      type: 'json',
      label: { de: 'Details', en: 'Details' },
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
