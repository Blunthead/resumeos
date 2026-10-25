// Small stroke icons for the editor's controls. Decorative: every button that
// uses one carries its own aria-label.
const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const Up = () => (
  <svg {...base}>
    <path d="m6 15 6-6 6 6" />
  </svg>
)
export const Down = () => (
  <svg {...base}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)
export const Copy = () => (
  <svg {...base}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
)
export const Trash = () => (
  <svg {...base}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
)
export const Grip = () => (
  <svg {...base} strokeWidth={0} fill="currentColor">
    <circle cx="9" cy="6" r="1.6" />
    <circle cx="15" cy="6" r="1.6" />
    <circle cx="9" cy="12" r="1.6" />
    <circle cx="15" cy="12" r="1.6" />
    <circle cx="9" cy="18" r="1.6" />
    <circle cx="15" cy="18" r="1.6" />
  </svg>
)
export const Undo = () => (
  <svg {...base}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </svg>
)
export const Redo = () => (
  <svg {...base}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H10a6 6 0 0 0 0 12h3" />
  </svg>
)
export const ListBullets = () => (
  <svg {...base}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" />
  </svg>
)
export const ListNumbers = () => (
  <svg {...base}>
    <path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1V9M3.5 14.5c.3-.9 2.5-.9 2.5.5 0 1.3-2.5 1.6-2.5 3H6" strokeWidth={1.6} />
  </svg>
)
export const Chevron = ({ open }) => (
  <svg {...base} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)
