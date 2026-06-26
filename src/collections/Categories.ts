import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: { de: 'Kategorie', en: 'Category' },
    plural: { de: 'Kategorien', en: 'Categories' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'icon', 'sortOrder'],
    group: { de: 'Flotte', en: 'Fleet' },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      label: { de: 'Name', en: 'Name' },
      admin: { placeholder: 'z.B. Personenwagen' },
    },
    {
      name: 'icon',
      type: 'text',
      label: { de: 'Symbol (Emoji)', en: 'Icon (emoji)' },
      admin: {
        placeholder: '🚗',
        description: {
          de: 'Optionales Emoji, das in der Übersicht angezeigt wird.',
          en: 'Optional emoji shown in the overview.',
        },
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: { de: 'Sortierung', en: 'Sort order' },
      admin: {
        description: {
          de: 'Kleinere Zahlen erscheinen zuerst.',
          en: 'Lower numbers appear first.',
        },
      },
    },
  ],
}
