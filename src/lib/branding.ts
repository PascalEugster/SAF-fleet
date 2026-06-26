import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Media } from '@/payload-types'

export type Branding = {
  organizationName: string
  applicationName: string
  logoUrl: string | null
  logoAlt: string
  headerLeft: string
  headerRight: string
  footerTitle: string
  footerSubtitle: string
}

const FALLBACK: Branding = {
  organizationName: 'Schweizer Armee',
  applicationName: 'Fahrzeugverwaltung',
  logoUrl: null,
  logoAlt: 'Logo',
  headerLeft: 'Schweizerische Eidgenossenschaft',
  headerRight: 'VBS · Logistikbasis der Armee',
  footerTitle: 'Schweizerische Eidgenossenschaft',
  footerSubtitle:
    'Eidgenössisches Departement für Verteidigung, Bevölkerungsschutz und Sport VBS',
}

export async function getBranding(): Promise<Branding> {
  try {
    const payload = await getPayload({ config: await config })
    const b = await payload.findGlobal({ slug: 'branding', depth: 1 })

    const logo = b?.logo && typeof b.logo === 'object' ? (b.logo as Media) : null

    return {
      organizationName: b?.organizationName || FALLBACK.organizationName,
      applicationName: b?.applicationName || FALLBACK.applicationName,
      logoUrl: logo?.url ?? null,
      logoAlt: logo?.alt || b?.organizationName || FALLBACK.logoAlt,
      headerLeft: b?.headerLeft ?? FALLBACK.headerLeft,
      headerRight: b?.headerRight ?? FALLBACK.headerRight,
      footerTitle: b?.footerTitle ?? FALLBACK.footerTitle,
      footerSubtitle: b?.footerSubtitle ?? FALLBACK.footerSubtitle,
    }
  } catch {
    return FALLBACK
  }
}
