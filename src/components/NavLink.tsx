'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export type NavItem = {
  href: string
  label: string
  /** Extra path prefixes that also mark this entry as the current section. */
  match?: string[]
  /** Only the exact path counts — for an entry whose children are siblings. */
  exact?: boolean
  badge?: number
}

function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true
  if (item.exact) return false
  if (item.href !== '/' && pathname.startsWith(`${item.href}/`)) return true
  return (item.match ?? []).some((m) => pathname === m || pathname.startsWith(`${m}/`))
}

/** Top-level section link: underlined and red while you are in that section. */
export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = isActive(pathname, item)
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
        active
          ? 'border-army-red text-army-red'
          : 'border-transparent text-ink hover:border-army-red hover:text-army-red'
      }`}
    >
      {item.label}
    </Link>
  )
}

/** Second-level link inside a section, with an optional attention counter. */
export function SubNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = isActive(pathname, item)
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`flex shrink-0 items-center gap-1.5 border px-3 py-1.5 text-sm transition ${
        active
          ? 'border-ink bg-ink text-white'
          : 'border-line bg-paper text-ink hover:border-army-red'
      }`}
    >
      {item.label}
      {item.badge ? (
        <span
          className={`min-w-[1.25rem] px-1 text-center text-[11px] font-bold tabular-nums ${
            active ? 'bg-white/20' : 'bg-army-red text-white'
          }`}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  )
}
