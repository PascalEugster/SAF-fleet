import type { Key, KeyCategory, KeyCopy, User } from '@/payload-types'

type CategoryRef = number | KeyCategory | null | undefined
type KeyRef = number | Key | null | undefined
type UserRef = number | User | null | undefined

export const KEY_STATUS_LABELS: Record<string, string> = {
  am_brett: 'Am Brett',
  ausgegeben: 'Ausgegeben',
  dauerausgabe: 'Dauerausgabe',
  versiegelt: 'Versiegelt',
  gesperrt: 'Gesperrt',
  verloren: 'Verloren',
  defekt: 'Defekt',
}

/** Board colours: green = available, red = out, blue = sealed, grey = unusable. */
export const KEY_STATUS_STYLES: Record<string, string> = {
  am_brett: 'bg-green-100 text-green-800 border-green-300',
  ausgegeben: 'bg-army-red/10 text-army-red border-army-red/30',
  dauerausgabe: 'bg-army-red/5 text-army-red border-army-red/20',
  versiegelt: 'bg-blue-50 text-blue-800 border-blue-300',
  gesperrt: 'bg-mist text-muted border-line',
  verloren: 'bg-mist text-muted border-line',
  defekt: 'bg-mist text-muted border-line',
}

export const OVERDUE_STYLE = 'bg-amber-100 text-amber-900 border-amber-400'

export const HIERARCHY_LABELS: Record<string, string> = {
  ES: 'Einzelschlüssel',
  GS: 'Gruppenschlüssel',
  HS: 'Hauptschlüssel',
  GHS: 'Generalhauptschlüssel',
}

export const RISK_LABELS: Record<string, string> = {
  normal: 'Normal',
  erhoeht: 'Erhöht',
  hoch: 'Hoch',
}

export const RISK_STYLES: Record<string, string> = {
  normal: 'bg-mist text-muted border-line',
  erhoeht: 'bg-amber-50 text-amber-800 border-amber-300',
  hoch: 'bg-army-red text-white border-army-red',
}

export const ZONE_LABELS: Record<string, string> = {
  keine: 'Keine Schutzzone',
  zone1: 'Schutzzone 1',
  zone2: 'Schutzzone 2',
  zone3: 'Schutzzone 3',
}

export const MEDIUM_LABELS: Record<string, string> = {
  mechanisch: 'Mechanischer Schlüssel',
  badge: 'Zutrittsbadge',
  transponder: 'Transponder',
  code: 'Code / PIN',
  vorhaengeschloss: 'Vorhängeschloss',
}

export const PSP_LABELS: Record<string, string> = {
  keine: 'Keine PSP',
  psp: 'Grundsicherheitsprüfung',
  psp_erweitert: 'Erweiterte Sicherheitsprüfung',
  psp_mit_befragung: 'Erweiterte Prüfung mit Befragung',
}

export const KEY_EVENT_LABELS: Record<string, string> = {
  ausgabe: 'Ausgabe',
  ruecknahme: 'Rücknahme',
  bund_ausgabe: 'Bund ausgegeben',
  bund_ruecknahme: 'Bund zurückgenommen',
  siegel_gebrochen: 'Siegel gebrochen',
  verlust: 'Verlust',
  sperrung: 'Gesperrt',
  freigabe: 'Freigegeben',
  inventur: 'Inventur',
  uebergabe: 'Übergabe',
  status_wechsel: 'Statuswechsel',
}

/** Statuses from which a copy can be handed out. */
export const ISSUABLE = ['am_brett']

export function keyCategoryName(cat: CategoryRef): string {
  return cat && typeof cat === 'object' ? cat.name : '—'
}

export function keyCategoryIcon(cat: CategoryRef): string {
  return cat && typeof cat === 'object' && cat.icon ? cat.icon : '🔑'
}

export function keyCategoryId(cat: CategoryRef): string | null {
  if (cat === null || cat === undefined) return null
  return typeof cat === 'object' ? String(cat.id) : String(cat)
}

/** The populated key of a copy, or null when only an id was loaded. */
export function keyOf(ref: KeyRef): Key | null {
  return ref && typeof ref === 'object' ? ref : null
}

export function userOf(ref: UserRef): User | null {
  return ref && typeof ref === 'object' ? ref : null
}

export function isOverdue(copy: Pick<KeyCopy, 'status' | 'dueAt'>): boolean {
  if (copy.status !== 'ausgegeben' || !copy.dueAt) return false
  return new Date(copy.dueAt).getTime() < Date.now()
}

export function personLabel(user: User | null): string {
  if (!user) return '—'
  return user.rank ? `${user.name} (${user.rank})` : user.name
}

/** True once the holder's last day of service has passed. */
export function isServiceOver(user: Pick<User, 'serviceEnd'>): boolean {
  if (!user.serviceEnd) return false
  return new Date(user.serviceEnd).getTime() < Date.now()
}

export function hasValidPsp(user: Pick<User, 'pspLevel' | 'pspValidUntil'>): boolean {
  if (!user.pspLevel || user.pspLevel === 'keine') return false
  if (!user.pspValidUntil) return true
  return new Date(user.pspValidUntil).getTime() >= Date.now()
}

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  verlust: 'Verlust',
  diebstahl: 'Diebstahl',
  defekt: 'Defekt',
  nicht_zurueckgegeben: 'Nicht zurückgegeben',
  siegelbruch_ungeklaert: 'Siegelbruch ungeklärt',
}

export const INCIDENT_MEASURE_LABELS: Record<string, string> = {
  offen: 'Offen',
  zylinder_tausch: 'Zylinder tauschen',
  gruppe_umbau: 'Gruppe umbauen',
  anlage_umbau: 'Schliessanlage umbauen',
  keine: 'Keine Massnahme',
}

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  erledigt: 'Erledigt',
}
