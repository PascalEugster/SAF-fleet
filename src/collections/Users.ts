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

export const PSP_LEVELS = [
  { label: { de: 'Keine', en: 'None' }, value: 'keine' },
  { label: { de: 'Grundsicherheitsprüfung', en: 'Basic screening' }, value: 'psp' },
  { label: { de: 'Erweiterte Sicherheitsprüfung', en: 'Extended screening' }, value: 'psp_erweitert' },
  {
    label: { de: 'Erweiterte Prüfung mit Befragung', en: 'Extended screening with interview' },
    value: 'psp_mit_befragung',
  },
]

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { de: 'Person', en: 'User' },
    plural: { de: 'Personen', en: 'Users' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'rank', 'unit', 'pspLevel', 'email'],
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
      type: 'row',
      fields: [
        {
          name: 'unit',
          type: 'text',
          label: { de: 'Einheit', en: 'Unit' },
          admin: {
            placeholder: 'z.B. Pz Bat 12',
            width: '50%',
          },
        },
        {
          name: 'serviceFunction',
          type: 'text',
          label: { de: 'Funktion', en: 'Function' },
          admin: {
            placeholder: 'z.B. Fourier, Zeugwart',
            width: '50%',
            description: {
              de: 'Relevant für Dauerausgaben von Material- und Lagerschlüsseln.',
              en: 'Relevant for permanently issued depot keys.',
            },
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: { de: 'Sicherheit und Dienst', en: 'Security and service' },
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'pspLevel',
              type: 'select',
              defaultValue: 'keine',
              options: PSP_LEVELS,
              label: { de: 'Personensicherheitsprüfung', en: 'Security screening' },
              admin: {
                width: '34%',
                description: {
                  de: 'Ohne gültige PSP verweigert die App Schlüssel zu Schutzzone 2 und 3.',
                  en: 'Without a valid screening, zone 2 and 3 keys cannot be issued.',
                },
              },
            },
            {
              name: 'pspValidUntil',
              type: 'date',
              label: { de: 'PSP gültig bis', en: 'Screening valid until' },
              admin: {
                width: '33%',
                date: { displayFormat: 'dd.MM.yyyy' },
                condition: (data) => Boolean(data?.pspLevel) && data.pspLevel !== 'keine',
                description: { de: 'Leer = unbefristet.', en: 'Empty = open-ended.' },
              },
            },
            {
              name: 'serviceEnd',
              type: 'date',
              label: { de: 'Dienstende', en: 'Service end' },
              admin: {
                width: '33%',
                date: { displayFormat: 'dd.MM.yyyy' },
                description: {
                  de: 'Bis dahin müssen alle Schlüssel zurück sein.',
                  en: 'All keys must be returned by this date.',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  versions: false,
}
