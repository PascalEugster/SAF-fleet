import type { CollectionConfig } from 'payload'

export const VEHICLE_STATUS = [
  { label: { de: 'Verfügbar', en: 'Available' }, value: 'available' },
  { label: { de: 'Im Einsatz', en: 'In use' }, value: 'in_use' },
  { label: { de: 'In Wartung', en: 'Maintenance' }, value: 'maintenance' },
]

const idOf = (v: unknown): number | string | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') return (v as { id: number | string }).id ?? null
  return v as number | string
}

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  labels: {
    singular: { de: 'Fahrzeug', en: 'Vehicle' },
    plural: { de: 'Fahrzeuge', en: 'Vehicles' },
  },
  admin: {
    useAsTitle: 'mNumber',
    defaultColumns: ['mNumber', 'name', 'category', 'status', 'currentUser'],
    group: { de: 'Flotte', en: 'Fleet' },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'mNumber',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: { de: 'M-Nummer', en: 'M-Number' },
          admin: {
            placeholder: 'M-312321',
            width: '50%',
          },
          validate: (value: string | null | undefined) => {
            if (!value) return 'M-Nummer ist erforderlich'
            if (!/^M-\d{4,7}$/.test(value)) {
              return 'Format muss M-XXXXXX sein (z.B. M-312321)'
            }
            return true
          },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          label: { de: 'Bezeichnung', en: 'Name' },
          admin: {
            placeholder: 'z.B. DURO 6x6',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          label: { de: 'Kategorie', en: 'Category' },
          admin: { width: '50%' },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'available',
          label: { de: 'Status', en: 'Status' },
          options: VEHICLE_STATUS,
          admin: {
            width: '50%',
            description: {
              de: 'Wird automatisch auf "Im Einsatz" gesetzt, sobald ein Nutzer zugewiesen ist.',
              en: 'Automatically set to "In use" when a user is assigned.',
            },
          },
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
    {
      type: 'collapsible',
      label: { de: 'Aktuelle Nutzung', en: 'Current usage' },
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'currentUser',
          type: 'relationship',
          relationTo: 'users',
          label: { de: 'Aktueller Nutzer', en: 'Current user' },
          admin: {
            description: {
              de: 'Leer lassen, um das Fahrzeug freizugeben.',
              en: 'Leave empty to release the vehicle.',
            },
          },
        },
        {
          name: 'currentReason',
          type: 'text',
          label: { de: 'Grund der Nutzung (optional)', en: 'Reason for usage (optional)' },
          admin: {
            condition: (data) => Boolean(data?.currentUser),
          },
        },
        {
          name: 'assignedAt',
          type: 'date',
          label: { de: 'Zugewiesen seit', en: 'Assigned since' },
          admin: {
            readOnly: true,
            condition: (data) => Boolean(data?.currentUser),
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
          },
        },
      ],
    },
    {
      name: 'usageHistory',
      type: 'array',
      label: { de: 'Nutzungshistorie', en: 'Usage history' },
      admin: {
        readOnly: true,
        description: {
          de: 'Wird automatisch geführt.',
          en: 'Maintained automatically.',
        },
      },
      fields: [
        { name: 'userName', type: 'text', label: { de: 'Nutzer', en: 'User' } },
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          label: { de: 'Person', en: 'Person' },
        },
        { name: 'reason', type: 'text', label: { de: 'Grund', en: 'Reason' } },
        {
          name: 'assignedAt',
          type: 'date',
          label: { de: 'Von', en: 'From' },
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'returnedAt',
          type: 'date',
          label: { de: 'Bis', en: 'Until' },
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, context }) => {
        const hasUserField = 'currentUser' in data
        const prevUserId = idOf(originalDoc?.currentUser)
        const newUserId = idOf(data.currentUser)
        const effectiveUserId = hasUserField ? newUserId : prevUserId
        const userChanged = hasUserField && String(newUserId) !== String(prevUserId)

        // Reset tool wipes usageHistory directly — don't let the hook rebuild it.
        if (userChanged && !context?.skipUsageHistory) {
          const now = new Date().toISOString()
          const history: Record<string, unknown>[] = Array.isArray(originalDoc?.usageHistory)
            ? originalDoc.usageHistory.map((h: Record<string, unknown>) => ({ ...h }))
            : []

          // Close the last still-open entry (someone returned the vehicle).
          for (let i = history.length - 1; i >= 0; i--) {
            if (!history[i].returnedAt) {
              history[i].returnedAt = now
              break
            }
          }

          if (newUserId) {
            // Snapshot the user's display name so history survives user deletion.
            let userName: string | null = null
            try {
              const u = await req.payload.findByID({
                collection: 'users',
                id: newUserId,
                depth: 0,
                req,
              })
              userName = (u as { name?: string })?.name ?? null
            } catch {
              userName = null
            }
            history.push({
              user: newUserId,
              userName,
              reason: data.currentReason || null,
              assignedAt: now,
            })
            data.assignedAt = now
          } else {
            data.assignedAt = null
            data.currentReason = null
          }

          data.usageHistory = history
        }

        // Keep status in sync with assignment. Manual "maintenance" wins when free.
        const currentStatus = data.status ?? originalDoc?.status
        if (effectiveUserId) {
          data.status = 'in_use'
        } else if (currentStatus === 'maintenance') {
          data.status = 'maintenance'
        } else {
          data.status = 'available'
        }

        return data
      },
    ],
  },
  timestamps: true,
}
