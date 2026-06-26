import type { GlobalConfig } from 'payload'

export const Branding: GlobalConfig = {
  slug: 'branding',
  label: { de: 'Erscheinungsbild', en: 'Branding' },
  admin: {
    group: { de: 'Verwaltung', en: 'Administration' },
    description: {
      de: 'Passen Sie Logo, Name und Kopf-/Fusszeilen an Ihr Bataillon oder Ihre Kompanie an. Änderungen erscheinen sofort auf der Webseite.',
      en: 'Customize logo, name and header/footer texts for your battalion or company. Changes appear immediately on the site.',
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'collapsible',
      label: { de: 'Marke', en: 'Brand' },
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'organizationName',
          type: 'text',
          required: true,
          defaultValue: 'Schweizer Armee',
          label: { de: 'Organisation', en: 'Organization' },
          admin: {
            description: {
              de: 'Grosser Name neben dem Logo. z.B. «Panzerbataillon 12».',
              en: 'Large name next to the logo.',
            },
          },
        },
        {
          name: 'applicationName',
          type: 'text',
          required: true,
          defaultValue: 'Fahrzeugverwaltung',
          label: { de: 'Anwendungsname', en: 'Application name' },
          admin: {
            description: {
              de: 'Untertitel unter der Organisation.',
              en: 'Subtitle below the organization.',
            },
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: { de: 'Logo', en: 'Logo' },
          admin: {
            description: {
              de: 'Optional. Ohne eigenes Logo wird das Schweizerkreuz angezeigt.',
              en: 'Optional. Falls back to the Swiss cross if empty.',
            },
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: { de: 'Kopfzeile (schwarzer Balken)', en: 'Header strip' },
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'headerLeft',
              type: 'text',
              defaultValue: 'Schweizerische Eidgenossenschaft',
              label: { de: 'Text links', en: 'Left text' },
              admin: { width: '50%' },
            },
            {
              name: 'headerRight',
              type: 'text',
              defaultValue: 'VBS · Logistikbasis der Armee',
              label: { de: 'Text rechts', en: 'Right text' },
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: { de: 'Fusszeile', en: 'Footer' },
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'footerTitle',
          type: 'text',
          defaultValue: 'Schweizerische Eidgenossenschaft',
          label: { de: 'Titel', en: 'Title' },
        },
        {
          name: 'footerSubtitle',
          type: 'textarea',
          defaultValue:
            'Eidgenössisches Departement für Verteidigung, Bevölkerungsschutz und Sport VBS',
          label: { de: 'Text', en: 'Text' },
        },
      ],
    },
  ],
}
