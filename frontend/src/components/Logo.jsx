import { Link } from 'react-router-dom'

// The full wordmark on wider screens; the "ROS." monogram where space is tight.
export default function Logo({ className = '' }) {
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
