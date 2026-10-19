import { APIError, type CollectionConfig } from 'payload'

export const DEPOT_TYPES = [
  { label: { de: 'Schlüsselbrett', en: 'Key board' }, value: 'brett' },
  { label: { de: 'Schlüsselschrank', en: 'Key cabinet' }, value: 'schrank' },
  { label: { de: 'Schlüsseltresor', en: 'Key safe' }, value: 'tresor' },
  {
    label: { de: 'Elektronisches Ausgabesystem', en: 'Electronic key dispenser' },
    value: 'ausgabesystem',
  },
  { label: { de: 'Objektdepot (Zugriff Dritte)', en: 'On-site key depot' }, value: 'objektdepot' },
  { label: { de: 'Siegelschrank', en: 'Sealed-key cabinet' }, value: 'siegelschrank' },
  { label: { de: 'Panzerschrank', en: 'Security container' }, value: 'panzerschrank' },
  { label: { de: 'Mobil (am Mann)', en: 'Carried' }, value: 'mobil' },
  {
    label: { de: 'Elektronische Berechtigung', en: 'Electronic credential' },
    value: 'elektronisch',
  },
]

export const DEPOT_LOCKS = [
  { label: { de: 'Offen / nur Sichtkontrolle', en: 'Open' }, value: 'offen' },
  { label: { de: 'Schlüssel', en: 'Key' }, value: 'schluessel' },
  { label: { de: 'Zahlenschloss', en: 'Combination lock' }, value: 'zahlenschloss' },
  { label: { de: 'Schlüssel und Code', en: 'Key and code' }, value: 'schluessel_und_code' },
  {
    label: { de: 'Doppelverschluss (zwei Personen)', en: 'Double lock (two persons)' },
    value: 'doppelverschluss',
  },
  { label: { de: 'Badge / Transponder', en: 'Badge / transponder' }, value: 'badge' },
  { label: { de: 'Biometrie', en: 'Biometrics' }, value: 'biometrie' },
  { label: { de: 'Siegel', en: 'Seal' }, value: 'siegel' },
]

/**
 * Resistance classes as the trade uses them: EN 14450 for key cabinets,
 * EN 1143-1 for safes. Ordered — the rank is what the weakest-link check needs.
 */
export const SECURITY_LEVELS = [
  { label: { de: 'Keine (offen)', en: 'None' }, value: 'keine' },
  { label: { de: 'Abschliessbar (EN 14450 S1)', en: 'Lockable (EN 14450 S1)' }, value: 's1' },
  { label: { de: 'Sicherheitsschrank (EN 14450 S2)', en: 'Secure cabinet (EN 14450 S2)' }, value: 's2' },
  { label: { de: 'Wertschutzschrank Grad 0 (EN 1143-1)', en: 'Safe grade 0' }, value: 'grad0' },
  { label: { de: 'Wertschutzschrank Grad 1', en: 'Safe grade 1' }, value: 'grad1' },
  { label: { de: 'Wertschutzschrank Grad 2 oder höher', en: 'Safe grade 2+' }, value: 'grad2' },
]

export const LEVEL_RANK: Record<string, number> = {
  keine: 0,
  s1: 1,
  s2: 2,
  grad0: 3,
  grad1: 4,
  grad2: 5,
}

export const LEVEL_LABEL: Record<string, string> = {
  keine: 'keine',
  s1: 'abschliessbar (S1)',
  s2: 'Sicherheitsschrank (S2)',
  grad0: 'Wertschutzschrank Grad 0',
  grad1: 'Wertschutzschrank Grad 1',
  grad2: 'Wertschutzschrank Grad 2+',
}

/** Security levels implied by the construction, used as the default. */
const LEVEL_BY_TYPE: Record<string, string> = {
  brett: 'keine',
  schrank: 's1',
  tresor: 'grad0',
  ausgabesystem: 's2',
  objektdepot: 's2',
  siegelschrank: 's1',
  panzerschrank: 'grad0',
  mobil: 'keine',
  elektronisch: 'keine',
}

/**
 * Weakest-link rule: a key may only be kept somewhere that is itself secured to
 * the level the key demands. Electronic credentials are exempt — their security
 * sits in the system, not in the cupboard.
 */
export function requiredLevelFor(risk?: string | null, zone?: string | null): string {
  if (zone === 'zone2' || zone === 'zone3') return 'grad0'
  if (risk === 'hoch') return 's2'
  if (risk === 'erhoeht') return 's1'
  return 'keine'
}

export const PHYSICAL_MEDIA = ['mechanisch', 'vorhaengeschloss']

export const KeyDepots: CollectionConfig = {
  slug: 'key-depots',
  labels: {
    singular: { de: 'Verwahrung', en: 'Key depot' },
    plural: { de: 'Verwahrungen', en: 'Key depots' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'securityLevel', 'lockType', 'location'],
    group: { de: 'Schlüssel', en: 'Keys' },
    description: {
      de: 'Wo Schlüssel liegen: Brett, Schrank, Tresor, Ausgabeautomat, Objektdepot oder gar nicht physisch. Die Sicherheitsstufe entscheidet mit, welche Schlüssel hier liegen dürfen.',
      en: 'Where keys live and how well that place is secured.',
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
          label: { de: 'Bezeichnung', en: 'Name' },
          admin: { placeholder: 'z.B. Schlüsselschrank Wache', width: '50%' },
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'brett',
          options: DEPOT_TYPES,
          label: { de: 'Art der Verwahrung', en: 'Type' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'lockType',
          type: 'select',
          required: true,
          defaultValue: 'schluessel',
          options: DEPOT_LOCKS,
          label: { de: 'Verschluss', en: 'Lock' },
          admin: { width: '50%' },
        },
        {
          name: 'securityLevel',
          type: 'select',
          required: true,
          defaultValue: 'keine',
          options: SECURITY_LEVELS,
          label: { de: 'Sicherheitsstufe', en: 'Security level' },
          admin: {
            width: '50%',
            description: {
              de: 'Ein Schlüssel darf nie besser gesichert sein müssen als sein Verwahrungsort — sonst ist der Ort das schwächste Glied.',
              en: 'A key must never need more protection than the place it is kept in.',
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'location',
          type: 'text',
          label: { de: 'Standort', en: 'Location' },
          admin: { placeholder: 'z.B. Wachlokal, Gebäude 1', width: '50%' },
        },
        {
          name: 'custodian',
          type: 'relationship',
          relationTo: 'users',
          label: { de: 'Verantwortlich', en: 'Custodian' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'capacity',
          type: 'number',
          min: 0,
          label: { de: 'Plätze', en: 'Capacity' },
          admin: {
            width: '50%',
            description: { de: 'Anzahl Haken oder Fächer. Leer = unbegrenzt.', en: 'Empty = unlimited.' },
          },
        },
        {
          name: 'systemReference',
          type: 'text',
          label: { de: 'System / Gerätenummer', en: 'System reference' },
          admin: {
            width: '50%',
            placeholder: 'z.B. Ausgabeautomat Nr. 2',
            condition: (data) => ['ausgabesystem', 'objektdepot', 'elektronisch'].includes(data?.type),
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: { de: 'Besonderheiten', en: 'Special handling' },
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'selfService',
              type: 'checkbox',
              label: { de: 'Selbstbedienung', en: 'Self service' },
              admin: {
                width: '34%',
                description: {
                  de: 'Das System gibt den Schlüssel gegen Badge oder PIN selbst frei und protokolliert automatisch.',
                  en: 'The cabinet releases keys against a badge and logs by itself.',
                },
              },
            },
            {
              name: 'externalAccess',
              type: 'checkbox',
              label: { de: 'Zugriff durch Dritte', en: 'Third-party access' },
              admin: {
                width: '33%',
                description: {
                  de: 'z.B. Feuerwehr oder Betreiber. Muss gemeldet und überwacht sein.',
                  en: 'e.g. fire brigade. Must be reported and monitored.',
                },
              },
            },
            {
              name: 'tamperMonitored',
              type: 'checkbox',
              label: { de: 'Sabotageüberwacht', en: 'Tamper monitored' },
              admin: { width: '33%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'codeChangedAt',
              type: 'date',
              label: { de: 'Code gewechselt am', en: 'Code changed' },
              admin: {
                width: '50%',
                date: { displayFormat: 'dd.MM.yyyy' },
                condition: (data) =>
                  ['zahlenschloss', 'schluessel_und_code', 'badge', 'biometrie'].includes(
                    data?.lockType,
                  ),
              },
            },
            {
              name: 'codeIntervalDays',
              type: 'number',
              min: 0,
              label: { de: 'Wechselintervall (Tage)', en: 'Change interval (days)' },
              admin: {
                width: '50%',
                placeholder: '180',
                condition: (data) =>
                  ['zahlenschloss', 'schluessel_und_code', 'badge', 'biometrie'].includes(
                    data?.lockType,
                  ),
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
      ({ data, operation }) => {
        // The construction sets the floor; a stronger level may be entered by hand.
        if (operation === 'create' && (!data.securityLevel || data.securityLevel === 'keine')) {
          data.securityLevel = LEVEL_BY_TYPE[String(data.type)] ?? 'keine'
        }
        if (data.type === 'ausgabesystem') data.selfService = true
        if (data.lockType === 'doppelverschluss' && data.selfService) {
          throw new APIError(
            'Ein Depot mit Doppelverschluss kann nicht in Selbstbedienung geführt werden.',
            400,
          )
        }
        return data
      },
    ],
  },
  timestamps: true,
}
