import { m } from 'motion/react'
import { EASE } from './ease.js'

// Fades and lifts its children into place once, the first time they scroll
// into view.
export default function Reveal({ children, delay = 0, y = 28, className = '', as = 'div' }) {
  const Tag = m[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </Tag>
  )
}
