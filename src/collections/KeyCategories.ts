import type { CollectionConfig } from 'payload'

export const KEY_RISK = [
  { label: { de: 'Normal', en: 'Normal' }, value: 'normal' },
  { label: { de: 'Erhöht', en: 'Elevated' }, value: 'erhoeht' },
  { label: { de: 'Hoch', en: 'High' }, value: 'hoch' },
]

export const KeyCategories: CollectionConfig = {
  slug: 'key-categories',
  labels: {
    singular: { de: 'Schlüsselkategorie', en: 'Key category' },
    plural: { de: 'Schlüsselkategorien', en: 'Key categories' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'icon', 'defaultRisk', 'sortOrder'],
    group: { de: 'Schlüssel', en: 'Keys' },
    description: {
      de: 'Eigene Kategorien für Schlüssel — getrennt von den Fahrzeugkategorien.',
      en: 'Separate categories for keys, kept apart from vehicle categories.',
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
          name: 'name',
          type: 'text',
          required: true,
          unique: true,
          label: { de: 'Name', en: 'Name' },
          admin: { placeholder: 'z.B. Unterkunft', width: '50%' },
        },
        {
          name: 'icon',
          type: 'text',
          label: { de: 'Symbol (Emoji)', en: 'Icon (emoji)' },
          admin: { placeholder: '🚪', width: '25%' },
        },
        {
          name: 'sortOrder',
          type: 'number',
          defaultValue: 0,
          label: { de: 'Sortierung', en: 'Sort order' },
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'defaultRisk',
      type: 'select',
      required: true,
      defaultValue: 'normal',
      options: KEY_RISK,
      label: { de: 'Standard-Risikoklasse', en: 'Default risk class' },
      admin: {
        description: {
          de: 'Vorschlag für neue Schliessungen dieser Kategorie.',
          en: 'Suggested default for new keys in this category.',
        },
      },
    },
  ],
}
