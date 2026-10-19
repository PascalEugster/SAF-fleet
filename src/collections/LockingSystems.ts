import type { CollectionConfig } from 'payload'

export const LockingSystems: CollectionConfig = {
  slug: 'locking-systems',
  labels: {
    singular: { de: 'Schliessanlage', en: 'Locking system' },
    plural: { de: 'Schliessanlagen', en: 'Locking systems' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'location', 'manufacturer'],
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
          name: 'name',
          type: 'text',
          required: true,
          unique: true,
          label: { de: 'Bezeichnung', en: 'Name' },
          admin: { placeholder: 'z.B. Kaserne Ost', width: '50%' },
        },
        {
          name: 'location',
          type: 'text',
          label: { de: 'Standort / Objekt', en: 'Location' },
          admin: { placeholder: 'z.B. Waffenplatz Thun', width: '50%' },
        },
      ],
    },
    {
      name: 'manufacturer',
      type: 'text',
      label: { de: 'Hersteller', en: 'Manufacturer' },
      admin: { placeholder: 'z.B. Kaba, dormakaba' },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: { de: 'Bemerkungen', en: 'Notes' },
    },
  ],
}
