import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import AppWindow from './AppWindow.jsx'
import PillLink from './PillLink.jsx'
import { EASE } from './ease.js'
import { TEMPLATES } from '../../lib/resume.js'

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

// The product shot is cropped and fades into the page, the way Apple shows a
// device: enough to see the whole idea, never a full screenshot.
const FADE = 'linear-gradient(to bottom, #000 62%, transparent 100%)'

export default function Hero() {
  const reduce = useReducedMotion()
  const shotRef = useRef(null)

  // The window starts tipped back and flattens as it rises into view.
  const { scrollYProgress } = useScroll({ target: shotRef, offset: ['start end', 'start 40%'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.5, 1])

  return (
    <section className="relative overflow-hidden pb-28 pt-14 md:pt-20">
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
          className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-[#6e6e73] md:text-xl"
        >
          Pick a template, answer a few simple questions, and download a clean PDF.
        </m.p>

        <m.div {...fade(0.9)} className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <PillLink to="/templates">Create my resume</PillLink>
          <Link
            to="/resumes"
            className="group text-[17px] font-medium text-[#0066cc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc]"
          >
            Open my resumes{' '}
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">›</span>
          </Link>
        </m.div>
      </div>

      <m.div
        {...fade(1.1)}
        className="relative mx-auto mt-14 w-full max-w-5xl px-5 md:mt-16"
        style={{ perspective: 1800 }}
      >
        <div
          aria-hidden
          className="absolute inset-x-16 top-10 bottom-0 rounded-[40px] bg-[#0071e3]/10 blur-3xl"
        />
        <m.div
          ref={shotRef}
          style={reduce ? undefined : { rotateX, scale, opacity, transformOrigin: '50% 100%' }}
          className="relative"
        >
          <div
            className="max-h-[430px] overflow-hidden md:max-h-[600px]"
            style={{ maskImage: FADE, WebkitMaskImage: FADE }}
          >
            <AppWindow />
          </div>
        </m.div>
      </m.div>
    </section>
  )
}
