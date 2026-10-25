import { Link } from 'react-router-dom'
import { m, useScroll, useTransform } from 'motion/react'
import PillLink from './landing/PillLink.jsx'

// The full wordmark on wider screens; the "ROS." monogram where space is tight.
export function Logo({ className = '' }) {
  return (
    <Link
      to="/"
      aria-label="ResumeOS home"
      className={`font-brand text-[22px] font-medium leading-none tracking-[-0.02em] text-[#2f2f2f] transition-opacity hover:opacity-70 ${className}`}
    >
      <span className="sm:hidden">ROS.</span>
      <span className="hidden sm:inline">ResumeOS.</span>
    </Link>
  )
}

// Clear at the top of the page; frosted glass once content scrolls beneath it.
export default function SiteHeader({ cta = false }) {
  const { scrollY } = useScroll()
  const background = useTransform(scrollY, [0, 60], ['rgba(251,251,253,0)', 'rgba(251,251,253,0.72)'])
  const blur = useTransform(scrollY, [0, 60], ['blur(0px)', 'blur(20px) saturate(180%)'])
  const line = useTransform(scrollY, [0, 60], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)'])

  return (
    <m.header
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: background, backdropFilter: blur, WebkitBackdropFilter: blur, borderBottomColor: line }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <nav className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-slate-600">
          <Link to="/templates" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
            Templates
          </Link>
          <Link to="/resumes" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
            My resumes
          </Link>
          {cta ? (
            <span className="ml-2 hidden sm:block">
              <PillLink to="/templates" size="md" className="whitespace-nowrap">
                Get started
              </PillLink>
            </span>
          ) : null}
        </nav>
      </div>
    </m.header>
  )
}
