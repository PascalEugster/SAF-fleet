import Link from 'next/link'
import React from 'react'
import QRCode from 'qrcode'
import { keyCategoryId, keyOf } from '@/lib/keyLabels'
import { loadKeyScreen } from '@/lib/keyQueries'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ category?: string }>

type Label = {
  id: string
  code: string
  slot: string | null
  svg: string
}

/**
 * Printable key tags. The tag carries the number and nothing else — no room, no
 * hierarchy level. A found tag must not tell anyone what it opens.
 */
export default async function KeyLabelsPage({ searchParams }: { searchParams: SearchParams }) {
  const { category } = await searchParams
  const { copies, bundles, categories } = await loadKeyScreen()

  const selected = copies.filter((c) => {
    if (!category) return true
    return keyCategoryId(keyOf(c.key)?.category) === category
  })

  const toSvg = (text: string) =>
    QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', width: 120 })

  const copyLabels: Label[] = await Promise.all(
    selected.map(async (c) => ({
      id: `copy-${c.id}`,
      code: c.label ?? String(c.id),
      slot: c.storageSlot ?? null,
      svg: await toSvg(c.label ?? String(c.id)),
    })),
  )

  const bundleLabels: Label[] = category
    ? []
    : await Promise.all(
        bundles.map(async (b) => ({
          id: `bundle-${b.id}`,
          code: b.label,
          slot: b.tagNumber ? `Marke ${b.tagNumber}` : null,
          svg: await toSvg(b.label),
        })),
      )

  const labels = [...bundleLabels, ...copyLabels]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="print:hidden">

        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Schlüsselanhänger drucken</h1>
            <p className="mt-1 text-muted">
              Ein Etikett je Exemplar. Bewusst nur die Nummer — ein gefundener Anhänger darf nicht
              verraten, welche Tür er öffnet. Der Code ist im Rücknahmefeld scannbar.
            </p>
          </div>
          <p className="text-sm text-muted">{labels.length} Etiketten</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Auswahl
          </span>
          <Link
            href="/schluessel/etiketten"
            className={`border px-3 py-1.5 text-sm transition ${
              !category
                ? 'border-army-red bg-army-red text-white'
                : 'border-line bg-paper hover:border-army-red'
            }`}
          >
            Alle
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/schluessel/etiketten?category=${cat.id}`}
              className={`border px-3 py-1.5 text-sm transition ${
                category === String(cat.id)
                  ? 'border-army-red bg-army-red text-white'
                  : 'border-line bg-paper hover:border-army-red'
              }`}
            >
              {cat.icon ? `${cat.icon} ` : ''}
              {cat.name}
            </Link>
          ))}
          <span className="ml-auto text-sm text-muted">
            Drucken über das Browsermenü (Strg/Cmd + P).
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex break-inside-avoid items-center gap-3 border border-line bg-paper p-3"
          >
            <div
              className="h-[72px] w-[72px] shrink-0 [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: label.svg }}
            />
            <div className="min-w-0">
              <p className="break-words font-mono text-sm font-bold leading-tight">{label.code}</p>
              {label.slot && <p className="mt-1 text-xs text-muted">{label.slot}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
