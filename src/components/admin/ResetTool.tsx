'use client'

import React, { useState } from 'react'

const TARGETS = [
  { key: 'vehicles', label: 'Fahrzeuge', hint: 'Löscht alle Fahrzeuge (inkl. deren Historie).' },
  { key: 'persons', label: 'Personen', hint: 'Löscht alle Personen ausser der angemeldeten.' },
  { key: 'history', label: 'Nutzungshistorie & Zuweisungen', hint: 'Setzt alle Fahrzeuge auf «verfügbar» und leert die Historie.' },
  { key: 'media', label: 'Medien', hint: 'Löscht alle hochgeladenen Bilder (inkl. Logo).' },
  { key: 'categories', label: 'Kategorien', hint: 'Löscht alle Kategorien (und die zugehörigen Fahrzeuge).' },
  { key: 'keys', label: 'Schlüssel', hint: 'Löscht Schliessungen, Exemplare, Bünde, Journal, Vorfälle, Inventuren und Schlüsselkategorien.' },
] as const

const CONFIRM_WORD = 'RESET'

export function ResetTool() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reseed, setReseed] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allSelected = selected.size === TARGETS.length
  const needsConfirm = selected.size > 0
  const canSubmit =
    !loading &&
    (selected.size > 0 || reseed) &&
    (!needsConfirm || confirm.trim().toUpperCase() === CONFIRM_WORD)

  const toggle = (key: string) => {
    setResult(null)
    setError(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAll = () => {
    setResult(null)
    setError(null)
    setSelected(allSelected ? new Set() : new Set(TARGETS.map((t) => t.key)))
  }

  const submit = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targets: [...selected], reseed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Zurücksetzen fehlgeschlagen.')

      const LABELS: Record<string, string> = {
        vehicles: 'Fahrzeuge',
        persons: 'Personen',
        media: 'Medien',
        categories: 'Kategorien',
        keys: 'Schliessungen',
        'key-copies': 'Schlüsselexemplare',
        'key-bundles': 'Schlüsselbünde',
        'key-events': 'Journaleinträge',
        'key-incidents': 'Vorfälle',
        'key-inventories': 'Inventuren',
        'key-categories': 'Schlüsselkategorien',
        'locking-systems': 'Schliessanlagen',
      }
      const parts: string[] = []
      for (const [k, v] of Object.entries(data.deleted ?? {})) {
        if (k === 'history') parts.push(`${v} Fahrzeuge bereinigt`)
        else parts.push(`${v} ${LABELS[k] ?? k} gelöscht`)
      }
      if (data.reseeded)
        parts.push(
          `Beispieldaten geladen (${data.reseeded.vehicles} Fahrzeuge, ${data.reseeded.users} Personen, ${data.reseeded.keyCopies} Schlüsselexemplare)`,
        )
      setResult(parts.length ? parts.join(' · ') : 'Fertig.')
      setSelected(new Set())
      setReseed(false)
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        marginTop: '2.5rem',
        border: '1px solid var(--theme-error-500, #c8102e)',
        borderRadius: 4,
        padding: '1.25rem 1.5rem',
        background: 'var(--theme-elevation-50, rgba(200,16,46,0.04))',
        maxWidth: 720,
      }}
    >
      <h3 style={{ margin: '0 0 0.25rem', color: 'var(--theme-error-500, #c8102e)' }}>
        ⚠️ Daten zurücksetzen
      </h3>
      <p style={{ margin: '0 0 1rem', color: 'var(--theme-elevation-600, #888)', fontSize: 13 }}>
        Wählen Sie aus, welche Daten gelöscht werden sollen. Optional können anschliessend die
        Beispieldaten neu geladen werden. <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600 }}>
        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
        Alles auswählen
      </label>

      <div style={{ display: 'grid', gap: 6, margin: '0 0 1rem', paddingLeft: 4 }}>
        {TARGETS.map((t) => (
          <label key={t.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <input
              type="checkbox"
              checked={selected.has(t.key)}
              onChange={() => toggle(t.key)}
              style={{ marginTop: 3 }}
            />
            <span>
              <span style={{ fontWeight: 500 }}>{t.label}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--theme-elevation-500, #999)' }}>
                {t.hint}
              </span>
            </span>
          </label>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
        <input type="checkbox" checked={reseed} onChange={(e) => setReseed(e.target.checked)} />
        Beispieldaten anschliessend neu laden (Reseed)
      </label>

      {needsConfirm && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
            Zur Bestätigung <strong>{CONFIRM_WORD}</strong> eingeben:
          </label>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
            style={{
              padding: '6px 10px',
              border: '1px solid var(--theme-elevation-150, #555)',
              borderRadius: 4,
              background: 'var(--theme-input-bg, var(--theme-elevation-0, #222))',
              color: 'var(--theme-text, inherit)',
              width: 200,
            }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        style={{
          padding: '9px 18px',
          border: 'none',
          borderRadius: 4,
          fontWeight: 600,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          background: canSubmit ? 'var(--theme-error-500, #c8102e)' : 'var(--theme-elevation-150, #444)',
          color: '#fff',
          opacity: canSubmit ? 1 : 0.6,
        }}
      >
        {loading ? 'Wird ausgeführt…' : 'Jetzt zurücksetzen'}
      </button>

      {result && (
        <p style={{ marginTop: '1rem', color: 'var(--theme-success-500, #2e7d32)', fontWeight: 500 }}>
          ✓ {result}{' '}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--theme-text, #09f)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Seite neu laden
          </button>
        </p>
      )}
      {error && (
        <p style={{ marginTop: '1rem', color: 'var(--theme-error-500, #c8102e)', fontWeight: 500 }}>
          ✗ {error}
        </p>
      )}
    </div>
  )
}
