import { Link } from 'react-router-dom'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">R</span>
      ResumeOS
    </Link>
  )
}

export default function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Logo />
      <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
        <Link to="/templates" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
          Templates
        </Link>
        <Link to="/resumes" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
          My resumes
        </Link>
      </nav>
    </header>
  )
}
