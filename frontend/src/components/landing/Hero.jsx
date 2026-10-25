import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import PaperPreview from '../PaperPreview.jsx'
import ResumeDocument from '../ResumeDocument.jsx'
import PillLink from './PillLink.jsx'
import { EASE } from './ease.js'
import { SAMPLE, TEMPLATES } from '../../lib/resume.js'

const HEADLINE = [
  { t: 'A' },
  { t: 'resume' },
  { t: 'you' },
  { t: 'can' },
  { t: 'be' },
  { t: 'proud', accent: true },
  { t: 'of,', accent: true },
  { t: 'in' },
  { t: 'minutes.' },
]

const sentence = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }
const word = { hidden: { y: '110%' }, show: { y: 0, transition: { duration: 1, ease: EASE } } }
const fade = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: EASE },
})

// Soft colour behind the page. It drifts so slowly it reads as light, not motion.
function Glow({ className, delay = 0 }) {
  return (
    <m.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      animate={{ scale: [1, 1.12, 1], x: [0, 24, 0] }}
      transition={{ duration: 16, delay, ease: 'easeInOut', repeat: Infinity }}
    />
  )
}

// A small glass label that floats beside the resume, at its own depth.
function Chip({ children, className, y, delay }) {
  return (
    <m.div className={`absolute hidden md:block ${className}`} style={y ? { y } : undefined}>
      <m.div
        className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#1d1d1f] shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      >
        <m.span
          className="flex items-center gap-2"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 6, delay, ease: 'easeInOut', repeat: Infinity }}
        >
          {children}
        </m.span>
      </m.div>
    </m.div>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()
  const paperRef = useRef(null)

  // The paper starts tipped back and flattens as it rises into view.
  const { scrollYProgress } = useScroll({ target: paperRef, offset: ['start end', 'center 55%'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.35], [0.4, 1])

  // The chips travel at different speeds, which is what gives the scene depth.
  const { scrollY } = useScroll()
  const chipA = useTransform(scrollY, [0, 900], [0, -90])
  const chipB = useTransform(scrollY, [0, 900], [0, -40])
  const chipC = useTransform(scrollY, [0, 900], [0, -140])

  return (
    <section className="relative overflow-hidden pb-28 pt-16 md:pt-24">
      <Glow className="-top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 bg-[#0071e3]/15" />
      <Glow className="top-64 -left-40 h-[420px] w-[420px] bg-[#7a5af8]/10" delay={4} />
      <Glow className="top-96 -right-40 h-[420px] w-[420px] bg-[#30b0c7]/10" delay={8} />

      <div className="relative mx-auto max-w-6xl px-5 text-center">
        <m.p
          {...fade(0)}
          className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-[#6e6e73] ring-1 ring-black/5 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#30d158]" />
          {TEMPLATES.length} templates · Free · No sign-up
        </m.p>

        <m.h1
          className="mx-auto mt-7 max-w-4xl text-balance text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.045em] text-[#1d1d1f] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          variants={sentence}
          initial="hidden"
          animate="show"
        >
          {HEADLINE.map((w, i) => (
            <span key={i}>
              <span className="inline-block overflow-hidden pb-[0.14em] align-bottom">
                <m.span
                  variants={word}
                  className={
                    w.accent
                      ? 'inline-block bg-gradient-to-r from-[#0071e3] to-[#7a5af8] bg-clip-text text-transparent'
                      : 'inline-block'
                  }
                >
                  {w.t}
                </m.span>
              </span>
              {i < HEADLINE.length - 1 ? ' ' : null}
            </span>
          ))}
        </m.h1>

        <m.p
          {...fade(0.75)}
          className="mx-auto mt-7 max-w-xl text-balance text-lg leading-relaxed text-[#6e6e73] md:text-xl"
        >
          Pick a template, answer a few simple questions, and download a clean PDF.
        </m.p>

        <m.div {...fade(0.9)} className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <PillLink to="/templates">Create my resume</PillLink>
          <Link
            to="/resumes"
            className="group text-[17px] font-medium text-[#0066cc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc]"
          >
            Open my resumes{' '}
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">›</span>
          </Link>
        </m.div>

        <div className="relative mx-auto mt-16 w-full max-w-[540px] md:mt-20" style={{ perspective: 1600 }}>
          <Chip className="-left-52 top-20" y={reduce ? undefined : chipA} delay={1.3}>
            <span className="h-2 w-2 rounded-full bg-[#0071e3]" /> Live preview
          </Chip>
          <Chip className="-right-56 top-56" y={reduce ? undefined : chipB} delay={1.5}>
            <span className="h-2 w-2 rounded-full bg-[#30d158]" /> All changes saved
          </Chip>
          <Chip className="-left-48 top-[26rem]" y={reduce ? undefined : chipC} delay={1.7}>
            <span className="h-2 w-2 rounded-full bg-[#ff9f0a]" /> Download PDF
          </Chip>

          <m.div
            ref={paperRef}
            style={reduce ? undefined : { rotateX, scale, opacity, transformOrigin: '50% 100%' }}
            className="overflow-hidden rounded-[10px] bg-white text-left shadow-[0_40px_120px_-20px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)]"
          >
            <PaperPreview clip>
              <ResumeDocument data={SAMPLE} template="modern" accent="#3d5a80" />
            </PaperPreview>
          </m.div>
        </div>
      </div>
    </section>
  )
}
