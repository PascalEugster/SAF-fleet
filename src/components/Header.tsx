import Link from 'next/link'
import React from 'react'
import { SwissCross } from './SwissCross'
import type { Branding } from '@/lib/branding'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/fahrzeuge/neu', label: 'Fahrzeug erfassen' },
  { href: '/personen', label: 'Personen' },
]

export function Header({ branding }: { branding: Branding }) {
  return (
    <header className="bg-paper border-b border-line">
      {/* Federal top strip */}
      <div className="bg-ink text-white text-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
          <span className="tracking-wide">{branding.headerLeft}</span>
          {branding.headerRight && (
            <span className="hidden sm:inline text-white/60">{branding.headerRight}</span>
          )}
        </div>
      </div>

      {/* Brand row */}
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5">
        <Link href="/" className="flex items-center gap-3">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.logoAlt}
              className="h-11 w-auto max-w-[160px] object-contain"
            />
          ) : (
            <SwissCross size={44} />
          )}
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">
              {branding.organizationName}
            </span>
            <span className="block text-sm text-muted">{branding.applicationName}</span>
          </span>
        </Link>
        {/* Full page load into the Payload admin (separate route group) — not a soft Link. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/admin"
          className="ml-auto text-sm font-medium text-army-red hover:text-army-red-dark hover:underline"
        >
          Admin-Bereich →
        </a>
      </div>

      {/* Nav */}
      <nav className="border-t border-line">
        <div className="mx-auto flex max-w-6xl gap-0 px-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-ink hover:border-army-red hover:text-army-red"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
