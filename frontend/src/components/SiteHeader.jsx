import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import PillLink from './PillLink.jsx'

// Clear at the top of the page; frosted glass once content scrolls beneath it.
// One boolean flips at the threshold, so scrolling doesn't re-render anything
// and no animation library is needed on the pages that share this header.
export default function SiteHeader({ cta = false }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? 'border-black/[0.08] bg-[#fbfbfd]/75 backdrop-blur-xl backdrop-saturate-150'
          : 'border-transparent bg-transparent'
      }`}
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
    </header>
  )
}
