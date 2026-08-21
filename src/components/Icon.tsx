/** Ported from design/components/shared.jsx — same 24x24 stroke geometry. */
export function Icon({
  d,
  size = 14,
  stroke = 1.5,
}: {
  d: React.ReactNode
  size?: number
  stroke?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d}
    </svg>
  )
}

export const I = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  download: <path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14" />,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  check: <path d="m5 12 5 5 9-11" />,
  chevleft: <path d="m15 18-6-6 6-6" />,
  chevdown: <path d="m6 9 6 6 6-6" />,
  rowsComfy: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  rowsCompact: (
    <>
      <path d="M4 5h16M4 9h16M4 13h16M4 17h16M4 21h16" />
    </>
  ),
  camera: (
    <>
      <path d="M3 7h3l2-3h8l2 3h3v12H3z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
}
