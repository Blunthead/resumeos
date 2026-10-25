import { useRef, useState } from 'react'
import { m, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import PaperPreview from '../PaperPreview.jsx'
import ResumeDocument from '../ResumeDocument.jsx'
import { EASE } from './ease.js'
import { SAMPLE, TEMPLATES } from '../../lib/resume.js'

// The page pins itself while you scroll, and the resume changes its whole look
// in place — the clearest way to show what the templates are.
const PICKS = ['modern', 'classic', 'sidebar-dark', 'tech'].map((id) => TEMPLATES.find((t) => t.id === id))

export default function Showcase() {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.min(PICKS.length - 1, Math.max(0, Math.floor(v * PICKS.length))))
  })

  return (
    <section ref={ref} className="relative bg-[#f5f5f7]" style={{ height: `${PICKS.length * 85 + 40}vh` }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-[#fbfbfd] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-[#fbfbfd] to-transparent"
      />
      <div className="sticky top-0 flex h-screen items-center overflow-hidden pt-16 md:pt-0">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 md:grid-cols-2 md:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0071e3]">Templates</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold leading-[1.06] tracking-[-0.04em] text-[#1d1d1f] md:text-6xl">
              Same you.
              <br />
              <span className="text-[#86868b]">{TEMPLATES.length} different looks.</span>
            </h2>

            <ul className="mt-5 space-y-0.5 md:mt-12 md:space-y-1">
              {PICKS.map((t, i) => (
                <m.li
                  key={t.id}
                  animate={{ opacity: i === active ? 1 : 0.32 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="flex gap-4"
                >
                  <span className="relative mt-1.5 w-0.5 self-stretch overflow-hidden rounded-full bg-black/10">
                    <m.span
                      className="absolute inset-x-0 top-0 h-full origin-top rounded-full"
                      style={{ backgroundColor: t.accent }}
                      animate={{ scaleY: i === active ? 1 : 0 }}
                      transition={{ duration: 0.6, ease: EASE }}
                    />
                  </span>
                  <div className="py-1">
                    <p className="text-lg font-semibold tracking-tight text-[#1d1d1f] md:text-2xl">{t.name}</p>
                    <m.p
                      initial={false}
                      animate={{ height: i === active ? 'auto' : 0, opacity: i === active ? 1 : 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="overflow-hidden text-[#6e6e73] md:text-lg"
                    >
                      {t.blurb}
                    </m.p>
                  </div>
                </m.li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-[min(260px,30svh)] md:w-[min(400px,62svh)]" style={{ aspectRatio: '794 / 1123' }}>
            <div
              aria-hidden
              className="absolute -inset-10 rounded-full blur-3xl transition-colors duration-700"
              style={{ backgroundColor: `${PICKS[active].accent}22` }}
            />
            {PICKS.map((t, i) => {
              const on = i === active
              return (
                <m.div
                  key={t.id}
                  aria-hidden={!on}
                  className="absolute inset-0 overflow-hidden rounded-[10px] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.05)]"
                  initial={false}
                  animate={{
                    opacity: on ? 1 : 0,
                    y: reduce ? 0 : on ? 0 : i < active ? -48 : 48,
                    scale: reduce ? 1 : on ? 1 : 0.94,
                    rotate: reduce ? 0 : on ? 0 : i < active ? -2 : 2,
                  }}
                  transition={{ duration: 0.8, ease: EASE }}
                >
                  <PaperPreview clip>
                    <ResumeDocument data={SAMPLE} template={t.id} accent={t.accent} />
                  </PaperPreview>
                </m.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
