import { useMemo } from 'react'
import { useReducedMotion } from 'motion/react'
import PaperPreview from '../PaperPreview.jsx'
import ResumeDocument from '../ResumeDocument.jsx'
import { NAMES, useTyped } from './useTyped.js'
import { SAMPLE } from '../../lib/resume.js'

const STEPS = ['Contact', 'Summary', 'Experience', 'Projects', 'Education']

function Field({ label, value, live = false }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#6e6e73]">{label}</p>
      <div
        className={`mt-1.5 flex h-10 items-center rounded-xl border px-3 text-sm text-[#1d1d1f] ${
          live ? 'border-[#0071e3] ring-4 ring-[#0071e3]/15' : 'border-black/10'
        }`}
      >
        <span className="truncate">{value}</span>
        {live ? <span className="ml-px h-4 w-0.5 animate-pulse bg-[#0071e3]" /> : null}
      </div>
    </div>
  )
}

// A picture of the real editor: the guided form beside the live resume. The
// name is typed on a loop so the page shows the one thing that sells the
// product, the resume updating as you write.
export default function AppWindow() {
  const reduce = useReducedMotion()
  const name = useTyped(NAMES, !reduce)
  const data = useMemo(() => ({ ...SAMPLE, contact: { ...SAMPLE.contact, fullName: name || 'Your name' } }), [name])
  const c = SAMPLE.contact

  return (
    <div className="overflow-hidden rounded-2xl bg-white text-left ring-1 ring-black/10">
      <div className="flex items-center gap-4 border-b border-black/[0.06] bg-[#fbfbfd] px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <i className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <i className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <i className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-xs font-medium text-[#86868b]">
          {name || 'Untitled resume'} — {c.jobTitle}
        </p>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[#86868b] sm:block">All changes saved</span>
          <span className="rounded-full bg-[#0071e3] px-3 py-1 text-xs font-medium text-white">Download PDF</span>
        </div>
      </div>

      {/* minmax(0, 1fr), not 1fr or auto: those refuse to shrink below the paper's
          fixed 794px width, which pushed the resume past the window on a phone. */}
      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="hidden border-r border-black/[0.06] bg-white p-6 md:block">
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  i === 0 ? 'bg-[#0071e3] text-white' : 'bg-[#f5f5f7] text-[#6e6e73]'
                }`}
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mt-6 text-xl font-semibold tracking-tight text-[#1d1d1f]">Contact</p>
          <p className="mt-1 text-sm text-[#6e6e73]">How can employers reach you?</p>
          <div className="mt-6 space-y-4">
            <Field label="Full name" value={name} live />
            <Field label="Job title" value={c.jobTitle} />
            <Field label="Email" value={c.email} />
            <Field label="Phone" value={c.phone} />
          </div>
        </div>

        <div className="bg-[#f1f5f9] p-5 md:p-10">
          <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)]">
            <PaperPreview clip>
              <ResumeDocument data={data} template="modern" accent="#3d5a80" />
            </PaperPreview>
          </div>
        </div>
      </div>
    </div>
  )
}
