import React from 'react'
import './globals.css'
import { Header } from '@/components/Header'
import { getBranding } from '@/lib/branding'

export async function generateMetadata() {
  const b = await getBranding()
  return {
    title: `${b.applicationName} — ${b.organizationName}`,
    description: `${b.applicationName} · ${b.organizationName}`,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branding = await getBranding()

  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col">
        <Header branding={branding} />
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-line bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
            {branding.footerTitle && (
              <p className="font-semibold text-ink">{branding.footerTitle}</p>
            )}
            {branding.footerSubtitle && (
              <p className="whitespace-pre-line">{branding.footerSubtitle}</p>
            )}
            <p className="mt-2 text-xs">
              Prototyp · {branding.applicationName} · Nicht für den produktiven Einsatz
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
