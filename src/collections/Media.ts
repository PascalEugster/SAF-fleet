import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { de: 'Medium', en: 'Media' },
    plural: { de: 'Medien', en: 'Media' },
  },
  admin: {
    group: { de: 'Verwaltung', en: 'Administration' },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: { de: 'Alt-Text', en: 'Alt text' },
    },
  ],
  upload: true,
}
