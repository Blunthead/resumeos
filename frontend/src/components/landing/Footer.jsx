import { Link } from 'react-router-dom'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl border-t border-black/[0.08] px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-[#6e6e73]">
        <p>© {YEAR} ResumeOS</p>
        <nav className="flex items-center gap-6">
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
