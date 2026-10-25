import { m, useReducedMotion } from 'motion/react'
import Reveal from './Reveal.jsx'
import { EASE } from './ease.js'
import { NAMES, useTyped } from './useTyped.js'
import { TEMPLATES } from '../../lib/resume.js'

// A soft blue spotlight follows the cursor across the card.
function Card({ className = '', children }) {
  const track = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <m.div
      onMouseMove={track}
      className={`group relative overflow-hidden rounded-[28px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.06] md:p-10 ${className}`}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -4, boxShadow: '0 24px 60px -24px rgba(0,0,0,0.18)' }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(0,113,227,0.07), transparent 65%)' }}
      />
      <div className="relative">{children}</div>
    </m.div>
  )
}

const Title = ({ children }) => (
  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f] md:text-[1.75rem]">{children}</h3>
)
const Body = ({ children }) => <p className="mt-2 max-w-sm text-[17px] leading-relaxed text-[#6e6e73]">{children}</p>

function LivePreview() {
  const reduce = useReducedMotion()
  const typed = useTyped(NAMES, !reduce)
  return (
    <Card className="md:col-span-4">
      <Title>Watch it come together.</Title>
      <Body>Your resume updates as you type. No refresh, no guesswork.</Body>

      <div className="mt-8 grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-2xl bg-[#f5f5f7] p-4">
          <p className="text-xs font-medium text-[#86868b]">Full name</p>
          <p className="mt-1 flex h-7 items-center text-lg font-medium text-[#1d1d1f]">
            {typed}
            <span className="ml-px inline-block h-5 w-0.5 animate-pulse bg-[#0071e3]" />
          </p>
        </div>
        <span aria-hidden className="hidden text-2xl text-[#c7c7cc] sm:block">→</span>
        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
          <p className="flex h-7 items-center text-lg font-bold tracking-tight text-[#1d1d1f]">{typed || ' '}</p>
          <p className="text-xs font-medium text-[#3d5a80]">Software Engineer</p>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-[#e8e8ed]" />
            <div className="h-1.5 w-5/6 rounded-full bg-[#e8e8ed]" />
            <div className="h-1.5 w-2/3 rounded-full bg-[#e8e8ed]" />
          </div>
        </div>
      </div>
    </Card>
  )
}

function Templates() {
  return (
    <Card className="md:col-span-2">
      <p className="bg-gradient-to-br from-[#1d1d1f] to-[#6e6e73] bg-clip-text text-7xl font-semibold leading-none tracking-[-0.06em] text-transparent">
        {TEMPLATES.length}
      </p>
      <Title>templates.</Title>
      <Body>From classic to bold, each with its own accent colour.</Body>
      <div className="mt-7 flex flex-wrap gap-2">
        {TEMPLATES.map((t, i) => (
          <m.span
            key={t.id}
            className="h-5 w-5 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: t.accent }}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.04, ease: EASE }}
          />
        ))}
      </div>
    </Card>
  )
}

function Pdf() {
  return (
    <Card className="md:col-span-3">
      <Title>The PDF you see is the PDF you get.</Title>
      <Body>It's made from the exact preview on your screen, so nothing shifts on the way out.</Body>
      <div className="mt-8 flex items-center gap-4">
        <div className="relative grid h-16 w-14 place-items-center rounded-lg bg-[#f5f5f7] ring-1 ring-black/5">
          <span className="text-xs font-bold tracking-wider text-[#ff453a]">PDF</span>
        </div>
        <m.svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0071e3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
        >
          <path d="M12 4v12m0 0 5-5m-5 5-5-5M5 20h14" />
        </m.svg>
      </div>
    </Card>
  )
}

function Saved() {
  return (
    <Card className="md:col-span-3">
      <Title>Start without signing up.</Title>
      <Body>Your resume saves as you go, and it's waiting when you come back on this browser.</Body>
      <div className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-[#f5f5f7] py-2 pl-2 pr-4 text-sm font-medium text-[#1d1d1f]">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#30d158]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <m.path
              d="m5 12.5 4.5 4.5L19 7.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
            />
          </svg>
        </span>
        All changes saved
      </div>
    </Card>
  )
}

export default function Features() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-28 md:py-40">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-[#1d1d1f] md:text-6xl">
          Everything you need.
          <br />
          <span className="text-[#86868b]">Nothing you don't.</span>
        </h2>
      </Reveal>
      <div className="mt-16 grid gap-5 md:grid-cols-6">
        <LivePreview />
        <Templates />
        <Pdf />
        <Saved />
      </div>
    </section>
  )
}
