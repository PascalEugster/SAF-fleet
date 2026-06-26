import React from 'react'

/** White Swiss cross on the federal red square. */
export function SwissCross({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Schweizerkreuz"
      className="shrink-0"
    >
      <rect width="32" height="32" fill="var(--color-army-red)" />
      <rect x="13" y="6" width="6" height="20" fill="#ffffff" />
      <rect x="6" y="13" width="20" height="6" fill="#ffffff" />
    </svg>
  )
}
