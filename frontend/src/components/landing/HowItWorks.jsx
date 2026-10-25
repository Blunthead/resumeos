import { m } from 'motion/react'
import Reveal from './Reveal.jsx'
import { EASE } from './ease.js'

const STEPS = [
  { n: '1', title: 'Pick a template', text: 'Choose a layout you like. You can switch any time.' },
  { n: '2', title: 'Fill in the blanks', text: 'A short guided form, one small step at a time.' },
  { n: '3', title: 'Download your PDF', text: 'Ready to send. Change the colour whenever you like.' },
]

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-28 md:pb-40">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-[#1d1d1f] md:text-6xl">
          Three steps.
          <br />
          <span className="text-[#86868b]">That's the whole thing.</span>
        </h2>
      </Reveal>

      <div className="mt-20 grid gap-14 md:grid-cols-3 md:gap-10">
        {STEPS.map((s, i) => (
          <m.div
            key={s.n}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, delay: i * 0.14, ease: EASE }}
          >
            <p className="bg-gradient-to-b from-[#0071e3] to-[#7a5af8] bg-clip-text text-8xl font-semibold leading-none tracking-[-0.06em] text-transparent">
              {s.n}
            </p>
            <m.div
              className="mt-6 h-px origin-left bg-black/10"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.2 + i * 0.14, ease: EASE }}
            />
            <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f]">{s.title}</h3>
            <p className="mt-2 text-[17px] leading-relaxed text-[#6e6e73]">{s.text}</p>
          </m.div>
        ))}
      </div>
    </section>
  )
}
