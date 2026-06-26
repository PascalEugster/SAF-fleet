'use client'

import React from 'react'
import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  variant = 'primary',
  pendingText,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'dark' | 'outline'
  pendingText?: string
}) {
  const { pending } = useFormStatus()

  const base =
    'w-full px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed'
  const styles = {
    primary: 'bg-army-red text-white hover:bg-army-red-dark',
    dark: 'bg-ink text-white hover:bg-black',
    outline: 'border border-line bg-paper text-ink hover:border-army-red',
  }[variant]

  return (
    <button type="submit" disabled={pending} className={`${base} ${styles}`}>
      {pending ? (pendingText ?? 'Wird gespeichert…') : children}
    </button>
  )
}
