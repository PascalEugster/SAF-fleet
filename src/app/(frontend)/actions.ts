'use server'

import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import config from '@/payload.config'

async function payload() {
  return getPayload({ config: await config })
}

export type ActionState = { ok: boolean; error?: string } | null

export async function assignVehicle(formData: FormData): Promise<void> {
  const id = String(formData.get('vehicleId'))
  const userId = String(formData.get('userId') || '')
  const reason = String(formData.get('reason') || '').trim()

  if (!userId) return

  const p = await payload()
  await p.update({
    collection: 'vehicles',
    id,
    data: {
      currentUser: Number(userId),
      currentReason: reason || null,
    },
  })

  revalidatePath(`/fahrzeuge/${id}`)
  revalidatePath('/fahrzeuge')
  revalidatePath('/')
}

export async function releaseVehicle(formData: FormData): Promise<void> {
  const id = String(formData.get('vehicleId'))

  const p = await payload()
  await p.update({
    collection: 'vehicles',
    id,
    data: { currentUser: null },
  })

  revalidatePath(`/fahrzeuge/${id}`)
  revalidatePath('/fahrzeuge')
  revalidatePath('/')
}

export async function setMaintenance(formData: FormData): Promise<void> {
  const id = String(formData.get('vehicleId'))
  const enable = String(formData.get('enable')) === 'true'

  const p = await payload()
  await p.update({
    collection: 'vehicles',
    id,
    data: { status: enable ? 'maintenance' : 'available' },
  })

  revalidatePath(`/fahrzeuge/${id}`)
  revalidatePath('/fahrzeuge')
  revalidatePath('/')
}

export async function createUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const rank = String(formData.get('rank') || '').trim()
  const unit = String(formData.get('unit') || '').trim()

  if (!name || !email || !password) {
    return { ok: false, error: 'Name, E-Mail und Passwort sind erforderlich.' }
  }
  if (password.length < 6) {
    return { ok: false, error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' }
  }

  const p = await payload()
  try {
    await p.create({
      collection: 'users',
      data: {
        name,
        email,
        password,
        ...(rank ? { rank: rank as never } : {}),
        ...(unit ? { unit } : {}),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    if (/duplicate|unique|already/i.test(message)) {
      return { ok: false, error: 'Diese E-Mail-Adresse ist bereits registriert.' }
    }
    return { ok: false, error: message }
  }

  revalidatePath('/personen')
  return { ok: true }
}

export async function createVehicle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const mNumber = String(formData.get('mNumber') || '').trim().toUpperCase()
  const name = String(formData.get('name') || '').trim()
  const category = String(formData.get('category') || '').trim()
  const notes = String(formData.get('notes') || '').trim()

  if (!mNumber || !name || !category) {
    return { ok: false, error: 'M-Nummer, Bezeichnung und Kategorie sind erforderlich.' }
  }
  if (!/^M-\d{4,7}$/.test(mNumber)) {
    return { ok: false, error: 'M-Nummer muss dem Format M-XXXXXX entsprechen (z.B. M-312321).' }
  }

  const p = await payload()
  let createdId: number | string | undefined
  try {
    const doc = await p.create({
      collection: 'vehicles',
      data: {
        mNumber,
        name,
        category: Number(category) as never,
        status: 'available',
        ...(notes ? { notes } : {}),
      },
    })
    createdId = doc.id
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    if (/duplicate|unique|already/i.test(message)) {
      return { ok: false, error: 'Diese M-Nummer existiert bereits.' }
    }
    return { ok: false, error: message }
  }

  revalidatePath('/fahrzeuge')
  revalidatePath('/')
  redirect(`/fahrzeuge/${createdId}`)
}
