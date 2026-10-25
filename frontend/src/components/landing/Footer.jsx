import { Link } from 'react-router-dom'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl border-t border-black/[0.08] px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-[#6e6e73]">
        <p className="flex items-baseline gap-3">
          <span className="font-brand text-lg font-medium tracking-[-0.02em] text-[#2f2f2f]">ResumeOS.</span>
          <span>© {YEAR}</span>
        </p>
        <nav aria-label="Footer" className="flex items-center gap-6">
          <Link to="/templates" className="hover:text-[#1d1d1f]">Templates</Link>
          <Link to="/resumes" className="hover:text-[#1d1d1f]">My resumes</Link>
          <a href="https://github.com/Blunthead/resumeos" className="hover:text-[#1d1d1f]" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
