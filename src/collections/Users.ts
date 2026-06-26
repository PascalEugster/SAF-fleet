import type { CollectionConfig } from 'payload'

const RANKS = [
  'Rekrut',
  'Soldat',
  'Gefreiter',
  'Obergefreiter',
  'Korporal',
  'Wachtmeister',
  'Oberwachtmeister',
  'Feldweibel',
  'Hauptfeldweibel',
  'Leutnant',
  'Oberleutnant',
  'Hauptmann',
  'Major',
  'Oberstleutnant',
  'Oberst',
]

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { de: 'Person', en: 'User' },
    plural: { de: 'Personen', en: 'Users' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'rank', 'unit', 'email'],
    group: { de: 'Verwaltung', en: 'Administration' },
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { de: 'Name', en: 'Name' },
    },
    {
      name: 'rank',
      type: 'select',
      label: { de: 'Grad', en: 'Rank' },
      options: RANKS.map((r) => ({ label: r, value: r })),
    },
    {
      name: 'unit',
      type: 'text',
      label: { de: 'Einheit', en: 'Unit' },
      admin: {
        placeholder: 'z.B. Pz Bat 12',
      },
    },
  ],
  versions: false,
}
