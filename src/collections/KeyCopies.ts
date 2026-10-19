import { APIError, type CollectionConfig } from 'payload'
import { logKeyEvent } from '../lib/keyEvents'
import { LEVEL_LABEL, LEVEL_RANK, PHYSICAL_MEDIA, requiredLevelFor } from './KeyDepots'

export const KEY_COPY_STATUS = [
  { label: { de: 'Am Brett', en: 'On the board' }, value: 'am_brett' },
  { label: { de: 'Ausgegeben', en: 'Issued' }, value: 'ausgegeben' },
  { label: { de: 'Dauerausgabe', en: 'Permanent issue' }, value: 'dauerausgabe' },
  { label: { de: 'Versiegelt', en: 'Sealed' }, value: 'versiegelt' },
  { label: { de: 'Gesperrt', en: 'Blocked' }, value: 'gesperrt' },
  { label: { de: 'Verloren', en: 'Lost' }, value: 'verloren' },
  { label: { de: 'Defekt', en: 'Defective' }, value: 'defekt' },
]

export const KEY_MEDIUM = [
  { label: { de: 'Mechanischer Schlüssel', en: 'Mechanical key' }, value: 'mechanisch' },
  { label: { de: 'Zutrittsbadge', en: 'Access badge' }, value: 'badge' },
  { label: { de: 'Transponder', en: 'Transponder' }, value: 'transponder' },
  { label: { de: 'Code / PIN', en: 'Code / PIN' }, value: 'code' },
  { label: { de: 'Vorhängeschloss', en: 'Padlock' }, value: 'vorhaengeschloss' },
]

/** Only a key hanging on the board can be handed out. */
const ASSIGNABLE_FROM = ['am_brett']

/** End states an operator may set by hand; everything else is hook-driven. */
const MANUAL_STATUS = ['am_brett', 'versiegelt', 'gesperrt', 'verloren', 'defekt']

const LOCKED_STATUS = ['gesperrt', 'verloren', 'defekt']

const BLOCK_REASON: Record<string, string> = {
  ausgegeben: 'ist bereits ausgegeben',
  dauerausgabe: 'ist in Dauerausgabe',
  versiegelt: 'ist versiegelt — Siegel zuerst brechen',
  gesperrt: 'ist gesperrt (Verlustmeldung offen)',
  verloren: 'ist als verloren gemeldet',
  defekt: 'ist als defekt gemeldet',
}

const idOf = (v: unknown): number | string | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') return (v as { id: number | string }).id ?? null
  return v as number | string
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export const KeyCopies: CollectionConfig = {
  slug: 'key-copies',
  labels: {
    singular: { de: 'Schlüsselexemplar', en: 'Key copy' },
    plural: { de: 'Schlüsselexemplare', en: 'Key copies' },
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'status', 'currentHolder', 'dueAt', 'storageSlot'],
    group: { de: 'Schlüssel', en: 'Keys' },
    description: {
      de: 'Das physische Stück. Ausgabe und Rücknahme laufen immer über das Exemplar — ausser es gehört zu einem Bund.',
      en: 'The physical item. Hand-over always happens here, unless it belongs to a bundle.',
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: { de: 'Bezeichnung', en: 'Label' },
      admin: {
        readOnly: true,
        description: {
          de: 'Wird automatisch aus Schliessung und Exemplarnummer gebildet.',
          en: 'Derived from key and copy number.',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'key',
          type: 'relationship',
          relationTo: 'keys',
          required: true,
          index: true,
          label: { de: 'Schliessung', en: 'Key' },
          admin: { width: '50%' },
        },
        {
          name: 'copyNumber',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 1,
          label: { de: 'Exemplar Nr.', en: 'Copy no.' },
          admin: { width: '25%' },
        },
        {
          name: 'medium',
          type: 'select',
          required: true,
          defaultValue: 'mechanisch',
          options: KEY_MEDIUM,
          label: { de: 'Art', en: 'Medium' },
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'am_brett',
          index: true,
          options: KEY_COPY_STATUS,
          label: { de: 'Status', en: 'Status' },
          admin: {
            width: '34%',
            description: {
              de: 'Wird durch Ausgabe und Rücknahme geführt. Manuell setzbar sind nur «Gesperrt», «Verloren» und «Defekt».',
              en: 'Driven by issue/return. Only blocked, lost and defective are set by hand.',
            },
          },
        },
        {
          name: 'storageSlot',
          type: 'text',
          label: { de: 'Platz', en: 'Slot' },
          admin: {
            placeholder: 'z.B. B-14',
            width: '33%',
            description: { de: 'Haken oder Fach innerhalb der Verwahrung.', en: 'Hook or slot inside the depot.' },
          },
        },
        {
          name: 'tagNumber',
          type: 'text',
          label: { de: 'Marke / Pfandnummer', en: 'Tag number' },
          admin: { placeholder: 'z.B. 214', width: '33%' },
        },
      ],
    },
    {
      name: 'depot',
      type: 'relationship',
      relationTo: 'key-depots',
      index: true,
      label: { de: 'Verwahrung', en: 'Depot' },
      admin: {
        description: {
          de: 'Wo das Exemplar liegt, wenn es nicht ausgegeben ist. Die Sicherheitsstufe der Verwahrung muss zum Risiko des Schlüssels passen.',
          en: 'Where the copy lives when it is not issued. The depot must match the key’s exposure.',
        },
      },
    },
    {
      name: 'bundle',
      type: 'relationship',
      relationTo: 'key-bundles',
      label: { de: 'Teil von Bund', en: 'Part of bundle' },
      admin: {
        description: {
          de: 'Exemplare in einem Bund werden nur über den Bund ausgegeben.',
          en: 'Copies in a bundle are only issued through the bundle.',
        },
      },
    },
    {
      type: 'collapsible',
      label: { de: 'Siegel (Notschlüssel)', en: 'Seal (emergency key)' },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'seal',
          type: 'group',
          label: false,
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'sealed',
                  type: 'checkbox',
                  label: { de: 'Versiegelt', en: 'Sealed' },
                  admin: { width: '34%' },
                },
                {
                  name: 'sealNumber',
                  type: 'text',
                  label: { de: 'Siegelnummer', en: 'Seal number' },
                  admin: { width: '33%' },
                },
                {
                  name: 'sealedAt',
                  type: 'date',
                  label: { de: 'Versiegelt am', en: 'Sealed at' },
                  admin: { width: '33%', date: { displayFormat: 'dd.MM.yyyy' } },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: { de: 'Aktuelle Ausgabe', en: 'Current issue' },
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'currentHolder',
          type: 'relationship',
          relationTo: 'users',
          index: true,
          label: { de: 'Inhaber', en: 'Holder' },
          admin: {
            description: {
              de: 'Leer lassen, um den Schlüssel zurückzunehmen.',
              en: 'Leave empty to take the key back.',
            },
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'currentReason',
              type: 'text',
              label: { de: 'Grund / Auftrag', en: 'Reason' },
              admin: { width: '50%', condition: (data) => Boolean(data?.currentHolder) },
            },
            {
              name: 'dueAt',
              type: 'date',
              label: { de: 'Rückgabe bis', en: 'Due back' },
              admin: {
                width: '50%',
                condition: (data) => Boolean(data?.currentHolder),
                date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
                description: {
                  de: 'Leer = Dauerausgabe (keine Fälligkeit).',
                  en: 'Empty = permanent issue (no due date).',
                },
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'assignedAt',
              type: 'date',
              label: { de: 'Ausgegeben am', en: 'Issued at' },
              admin: {
                width: '34%',
                readOnly: true,
                condition: (data) => Boolean(data?.currentHolder),
                date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
              },
            },
            {
              name: 'issuedBy',
              type: 'relationship',
              relationTo: 'users',
              label: { de: 'Ausgegeben durch', en: 'Issued by' },
              admin: { width: '33%', readOnly: true, condition: (data) => Boolean(data?.currentHolder) },
            },
            {
              name: 'secondSignature',
              type: 'relationship',
              relationTo: 'users',
              label: { de: 'Zweitunterschrift', en: 'Second signature' },
              admin: {
                width: '33%',
                description: {
                  de: 'Pflicht bei Schliessungen mit Vier-Augen-Prinzip.',
                  en: 'Required for four-eyes keys.',
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: { de: 'Bemerkungen', en: 'Notes' },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        const keyId = idOf('key' in data ? data.key : originalDoc?.key)
        if (!keyId) throw new APIError('Schliessung ist erforderlich.', 400)

        const key = await req.payload.findByID({ collection: 'keys', id: keyId, depth: 0, req })
        const copyNumber = Number(data.copyNumber ?? originalDoc?.copyNumber ?? 1)

        // Readable title for pickers and the journal.
        data.label = `${(key as { keyNumber: string }).keyNumber} · Ex. ${copyNumber}`

        // One copy number per key.
        const duplicate = await req.payload.find({
          collection: 'key-copies',
          where: {
            and: [
              { key: { equals: keyId } },
              { copyNumber: { equals: copyNumber } },
              ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
            ],
          },
          limit: 1,
          depth: 0,
          req,
        })
        if (duplicate.totalDocs > 0) {
          throw new APIError(`Exemplar ${copyNumber} existiert für diese Schliessung bereits.`, 400)
        }

        const medium = String(data.medium ?? originalDoc?.medium ?? 'mechanisch')
        const bundleId = idOf('bundle' in data ? data.bundle : originalDoc?.bundle)

        // A key that must be kept apart never hangs on a ring.
        if (bundleId && (key as { requiresSeparateStorage?: boolean }).requiresSeparateStorage) {
          throw new APIError(
            `${data.label} ist getrennt zu verwahren und darf nicht an einem Schlüsselbund geführt werden.`,
            400,
          )
        }

        // The depot is the weakest link: it must be at least as strong as the
        // key it holds. Electronic credentials are exempt — their protection
        // lives in the system, not in the cupboard.
        const depotId = idOf('depot' in data ? data.depot : originalDoc?.depot)
        if (depotId && PHYSICAL_MEDIA.includes(medium)) {
          const depot = await req.payload.findByID({
            collection: 'key-depots',
            id: depotId,
            depth: 0,
            req,
          })
          const required = requiredLevelFor(
            (key as { risk?: string }).risk,
            (key as { protectionZone?: string }).protectionZone,
          )
          const have = String((depot as { securityLevel?: string }).securityLevel ?? 'keine')
          if ((LEVEL_RANK[have] ?? 0) < (LEVEL_RANK[required] ?? 0)) {
            throw new APIError(
              `${data.label} verlangt mindestens «${LEVEL_LABEL[required]}». ` +
                `«${(depot as { name: string }).name}» bietet «${LEVEL_LABEL[have]}». ` +
                'Der Verwahrungsort wäre das schwächste Glied.',
              400,
            )
          }
        }

        const sealed = Boolean(('seal' in data ? data.seal?.sealed : originalDoc?.seal?.sealed) ?? false)
        const sealNumber = ('seal' in data ? data.seal?.sealNumber : originalDoc?.seal?.sealNumber) ?? null

        const prevSealed = Boolean(originalDoc?.seal?.sealed)
        if (prevSealed && !sealed) {
          // Payload hands the hook the merged document, so an unchanged note is
          // not a justification — only a fresh one counts.
          const note = typeof data.notes === 'string' ? data.notes.trim() : ''
          const noteIsNew = note.length > 0 && note !== String(originalDoc?.notes ?? '').trim()
          const reason =
            (req.context?.sealReason as string | undefined)?.trim() || (noteIsNew ? note : '')
          if (!reason) {
            throw new APIError(
              `Siegelbruch an ${data.label} erfordert eine Begründung. Bitte über «Siegel brechen» erfassen oder eine Bemerkung hinterlegen.`,
              400,
            )
          }
        }

        const prevHolder = idOf(originalDoc?.currentHolder)
        const hasHolderField = 'currentHolder' in data
        const newHolder = idOf(data.currentHolder)
        const holderChanged = hasHolderField && String(newHolder) !== String(prevHolder)
        const effectiveHolder = hasHolderField ? newHolder : prevHolder

        // A key reported lost, blocked or broken leaves the holder's hands at once,
        // whatever the assignment state was.
        const explicitLocked = 'status' in data && LOCKED_STATUS.includes(String(data.status))

        if (explicitLocked) {
          data.currentHolder = null
          data.currentReason = null
          data.assignedAt = null
          data.dueAt = null
          data.issuedBy = null
          data.secondSignature = null
        } else if (holderChanged && newHolder) {
          const from = (originalDoc?.status as string) ?? 'am_brett'

          if (sealed) {
            throw new APIError(
              `${data.label} ist versiegelt${sealNumber ? ` (Siegel ${sealNumber})` : ''}. Siegel zuerst brechen.`,
              400,
            )
          }
          if (!ASSIGNABLE_FROM.includes(from)) {
            throw new APIError(`${data.label} ${BLOCK_REASON[from] ?? 'kann nicht ausgegeben werden'}.`, 400)
          }

          if (bundleId && !req.context?.fromBundle) {
            throw new APIError(
              `${data.label} gehört zu einem Schlüsselbund. Ausgabe bitte über den Bund buchen.`,
              400,
            )
          }

          const holder = await req.payload.findByID({
            collection: 'users',
            id: newHolder,
            depth: 0,
            req,
          })
          const person = holder as {
            name?: string
            pspLevel?: string
            pspValidUntil?: string | null
            serviceEnd?: string | null
          }

          if (person.serviceEnd) {
            const end = new Date(person.serviceEnd)
            end.setHours(18, 0, 0, 0)
            if (end.getTime() < Date.now()) {
              throw new APIError(
                `Der Dienst von ${person.name ?? 'dieser Person'} endete am ${formatDate(person.serviceEnd)}. Es kann kein Schlüssel mehr ausgegeben werden.`,
                400,
              )
            }
            const due = data.dueAt ? new Date(String(data.dueAt)) : null
            // Shorten the term to the last day of service, including permanent issues.
            if (!due || due.getTime() > end.getTime()) data.dueAt = end.toISOString()
          }

          // Zone 2/3 keys need a valid personnel security screening (PSPV).
          if ((key as { requiresPsp?: boolean }).requiresPsp) {
            if (!person.pspLevel || person.pspLevel === 'keine') {
              throw new APIError(
                `${person.name ?? 'Diese Person'} hat keine Personensicherheitsprüfung. ${data.label} liegt in einer Schutzzone und erfordert eine gültige PSP.`,
                400,
              )
            }
            if (person.pspValidUntil && new Date(person.pspValidUntil).getTime() < Date.now()) {
              throw new APIError(
                `Die PSP von ${person.name ?? 'dieser Person'} ist am ${formatDate(person.pspValidUntil)} abgelaufen.`,
                400,
              )
            }
          }

          // High-risk keys — and depots under double lock — need a second person.
          let fourEyes = Boolean((key as { requiresFourEyes?: boolean }).requiresFourEyes)
          let fourEyesReason = `${data.label} unterliegt dem Vier-Augen-Prinzip`
          if (!fourEyes && depotId) {
            const depot = await req.payload.findByID({
              collection: 'key-depots',
              id: depotId,
              depth: 0,
              req,
            })
            if ((depot as { lockType?: string }).lockType === 'doppelverschluss') {
              fourEyes = true
              fourEyesReason = `«${(depot as { name: string }).name}» steht unter Doppelverschluss`
            }
          }

          if (fourEyes) {
            const second = idOf('secondSignature' in data ? data.secondSignature : originalDoc?.secondSignature)
            if (!second) {
              throw new APIError(`${fourEyesReason}. Zweitunterschrift erforderlich.`, 400)
            }
            if (String(second) === String(newHolder)) {
              throw new APIError('Zweitunterschrift muss von einer anderen Person stammen.', 400)
            }
          }

          data.assignedAt = new Date().toISOString()
          if (!data.issuedBy && req.user) data.issuedBy = req.user.id
          data.status = data.dueAt ? 'ausgegeben' : 'dauerausgabe'
        } else if (holderChanged && !newHolder) {
          data.status = 'am_brett'
          data.currentReason = null
          data.assignedAt = null
          data.dueAt = null
          data.issuedBy = null
          data.secondSignature = null
        } else if (effectiveHolder) {
          const dueAt = 'dueAt' in data ? data.dueAt : originalDoc?.dueAt
          data.status = dueAt ? 'ausgegeben' : 'dauerausgabe'
        } else {
          const wanted = (data.status as string) ?? (originalDoc?.status as string) ?? 'am_brett'
          data.status = MANUAL_STATUS.includes(wanted) ? wanted : 'am_brett'
          if (sealed && !LOCKED_STATUS.includes(data.status)) {
            data.status = 'versiegelt'
          } else if (!sealed && data.status === 'versiegelt') {
            // Seal was broken — the copy returns to the board.
            data.status = 'am_brett'
          }
          if (operation === 'create' && !data.assignedAt) data.assignedAt = null
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation, context }) => {
        if (context?.skipKeyEvents) return doc

        const prevHolder = idOf(previousDoc?.currentHolder)
        const nowHolder = idOf(doc.currentHolder)
        const prevSealed = Boolean(previousDoc?.seal?.sealed)
        const nowSealed = Boolean(doc.seal?.sealed)

        if (String(prevHolder) !== String(nowHolder)) {
          if (nowHolder) {
            await logKeyEvent(
              req.payload,
              {
                type: 'ausgabe',
                copy: doc.id,
                keyLabel: doc.label,
                person: nowHolder,
                actor: req.user?.id ?? null,
                reason: doc.currentReason ?? null,
                dueAt: doc.dueAt ?? null,
              },
              req,
            )
          } else if (prevHolder) {
            await logKeyEvent(
              req.payload,
              {
                type: 'ruecknahme',
                copy: doc.id,
                keyLabel: doc.label,
                person: prevHolder,
                actor: req.user?.id ?? null,
              },
              req,
            )
          }
        } else if (operation === 'update' && previousDoc?.status !== doc.status) {
          const broken = prevSealed && !nowSealed
          await logKeyEvent(
            req.payload,
            {
              type: broken ? 'siegel_gebrochen' : doc.status === 'verloren' ? 'verlust' : 'status_wechsel',
              copy: doc.id,
              keyLabel: doc.label,
              actor: req.user?.id ?? null,
              reason: doc.notes ?? null,
              meta: { from: previousDoc?.status, to: doc.status, sealNumber: previousDoc?.seal?.sealNumber ?? null },
            },
            req,
          )
        }

        return doc
      },
    ],
  },
  timestamps: true,
}
