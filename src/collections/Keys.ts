import type { CollectionConfig } from 'payload'
import { KEY_RISK } from './KeyCategories'

export const KEY_HIERARCHY = [
  { label: { de: 'Einzelschlüssel (ES)', en: 'Single key (ES)' }, value: 'ES' },
  { label: { de: 'Gruppenschlüssel (GS)', en: 'Group key (GS)' }, value: 'GS' },
  { label: { de: 'Hauptschlüssel (HS)', en: 'Master key (HS)' }, value: 'HS' },
  {
    label: { de: 'Generalhauptschlüssel (GHS)', en: 'Grand master key (GHS)' },
    value: 'GHS',
  },
]

export const PROTECTION_ZONE = [
  { label: { de: 'Keine Schutzzone', en: 'No protection zone' }, value: 'keine' },
  { label: { de: 'Schutzzone 1', en: 'Protection zone 1' }, value: 'zone1' },
  { label: { de: 'Schutzzone 2', en: 'Protection zone 2' }, value: 'zone2' },
  { label: { de: 'Schutzzone 3', en: 'Protection zone 3' }, value: 'zone3' },
]

/** Zones that require a valid personnel security screening (PSP) to access. */
export const PSP_ZONES = ['zone2', 'zone3']

export const Keys: CollectionConfig = {
  slug: 'keys',
  labels: {
    singular: { de: 'Schliessung', en: 'Key' },
    plural: { de: 'Schliessungen', en: 'Keys' },
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['keyNumber', 'label', 'category', 'hierarchy', 'risk'],
    group: { de: 'Schlüssel', en: 'Keys' },
    description: {
      de: 'Die Schliessung ist der Typ (die Tür), nicht das einzelne Stück Metall. Die zuweisbaren Exemplare liegen unter «Schlüsselexemplare».',
      en: 'A key here is the lock/door, not the physical item. Assignable items live in "Key copies".',
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'keyNumber',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: { de: 'Schlüsselnummer / Prägung', en: 'Key number' },
          admin: { placeholder: 'z.B. ZI-204', width: '35%' },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          label: { de: 'Bezeichnung', en: 'Label' },
          admin: { placeholder: 'z.B. Zimmer 204', width: '65%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'key-categories',
          required: true,
          label: { de: 'Kategorie', en: 'Category' },
          admin: { width: '50%' },
        },
        {
          name: 'lockingSystem',
          type: 'relationship',
          relationTo: 'locking-systems',
          label: { de: 'Schliessanlage', en: 'Locking system' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'hierarchy',
          type: 'select',
          required: true,
          defaultValue: 'ES',
          options: KEY_HIERARCHY,
          label: { de: 'Hierarchiestufe', en: 'Hierarchy level' },
          admin: {
            width: '50%',
            description: {
              de: 'Bestimmt das Schadenausmass bei Verlust. Der physische Anhänger wird nie mit «GHS» beschriftet.',
              en: 'Determines loss impact. The physical tag is never labelled "GHS".',
            },
          },
        },
        {
          name: 'risk',
          type: 'select',
          required: true,
          defaultValue: 'normal',
          options: KEY_RISK,
          label: { de: 'Risikoklasse', en: 'Risk class' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'opensLocation',
      type: 'text',
      label: { de: 'Öffnet (Raum / Objekt)', en: 'Opens (room / object)' },
      admin: { placeholder: 'z.B. Gebäude 3, Zimmer 204' },
    },
    {
      type: 'collapsible',
      label: { de: 'Sicherheitsauflagen', en: 'Security requirements' },
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'protectionZone',
          type: 'select',
          required: true,
          defaultValue: 'keine',
          options: PROTECTION_ZONE,
          label: { de: 'Schutzzone der Anlage', en: 'Protection zone' },
          admin: {
            description: {
              de: 'Zutritt zu Schutzzone 2 oder 3 ist sicherheitsempfindlich und setzt eine Personensicherheitsprüfung voraus.',
              en: 'Access to zone 2 or 3 requires a personnel security screening.',
            },
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'requiresPsp',
              type: 'checkbox',
              label: { de: 'Gültige PSP erforderlich', en: 'Valid PSP required' },
              admin: {
                width: '50%',
                description: {
                  de: 'Wird bei Schutzzone 2/3 automatisch gesetzt.',
                  en: 'Set automatically for zones 2 and 3.',
                },
              },
            },
            {
              name: 'requiresFourEyes',
              type: 'checkbox',
              label: { de: 'Vier-Augen-Prinzip', en: 'Four-eyes principle' },
              admin: {
                width: '50%',
                description: {
                  de: 'Wird bei Risikoklasse «Hoch» automatisch gesetzt.',
                  en: 'Set automatically for high risk.',
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: { de: 'Bild', en: 'Image' },
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
        // Security requirements follow from zone and risk — never silently weaker.
        if (PSP_ZONES.includes(String(data.protectionZone))) data.requiresPsp = true
        if (data.risk === 'hoch') data.requiresFourEyes = true
        return data
      },
    ],
  },
  timestamps: true,
}
