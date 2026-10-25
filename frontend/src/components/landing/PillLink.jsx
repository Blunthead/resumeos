import { Link } from 'react-router-dom'
import { m } from 'motion/react'

const VARIANTS = {
  primary: 'bg-[#0071e3] text-white hover:bg-[#0077ed] focus-visible:outline-[#0071e3]',
  light: 'bg-white text-[#1d1d1f] hover:bg-white/90 focus-visible:outline-white',
  dark: 'bg-[#1d1d1f] text-white hover:bg-black focus-visible:outline-[#1d1d1f]',
}

const SIZES = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-4 text-[17px]',
}

// The page's one button shape: a pill that leans in on hover and presses on tap.
export default function PillLink({ to, variant = 'primary', size = 'lg', children, className = '' }) {
  return (
    <m.span
      className="inline-block"
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <Link
        to={to}
        className={`inline-flex items-center rounded-full font-medium tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      >
        {children}
      </Link>
    </m.span>
  )
}
