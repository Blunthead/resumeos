import { m } from 'motion/react'
import PillLink from '../PillLink.jsx'
import { EASE } from './ease.js'

export default function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24">
      <m.div
        className="relative overflow-hidden rounded-[36px] bg-[#1d1d1f] px-6 py-24 text-center md:py-32"
        initial={{ opacity: 0, y: 48, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        <m.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0071e3]/35 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-white md:text-6xl">
            Your next resume is a few minutes away.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-white/60">Free to start. No account needed.</p>
          <div className="mt-10">
            <PillLink to="/templates" variant="light">
              Create my resume
            </PillLink>
          </div>
        </div>
      </m.div>
    </section>
  )
}
