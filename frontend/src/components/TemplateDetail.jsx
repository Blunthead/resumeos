import { useEffect, useRef } from 'react'
import PaperPreview from './PaperPreview.jsx'
import ResumeDocument from './ResumeDocument.jsx'
import { ACCENTS, SAMPLE } from '../lib/resume.js'

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  )
}

export function Swatches({ value, onChange, original, label = 'Colour' }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-2">
      {original && (
        <button
          type="button"
          role="radio"
          aria-checked={value == null}
          aria-label="Original colour"
          title="Original colour"
          onClick={() => onChange(null)}
          className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-slate-600 ring-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
            value == null ? 'bg-white ring-2 ring-slate-900' : 'bg-white ring-1 ring-slate-300 hover:ring-slate-400'
          }`}
        >
          {original}
        </button>
      )}
      {ACCENTS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={`Colour ${c}`}
          onClick={() => onChange(c)}
          className={`h-7 w-7 rounded-full ring-offset-2 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
            value === c ? 'ring-2 ring-slate-900' : ''
          }`}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}

// A closer look at one template before using it: a full-size preview in the
// chosen colour, what the template is, and what it is good for. Arrow keys or
// the side buttons move to the next one without closing.
export default function TemplateDetail({ template, accent, onAccent, index, total, onPrev, onNext, onClose, onUse, busy }) {
  const dialog = useRef(null)
  const opener = useRef(null)
  const shownAccent = accent ?? template.accent
  const single = template.layout === 'single'

  useEffect(() => {
    opener.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      opener.current?.focus?.()
    }
  }, [])

  function onKeyDown(e) {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowLeft' && !e.target.closest('[role=radiogroup]')) onPrev()
    else if (e.key === 'ArrowRight' && !e.target.closest('[role=radiogroup]')) onNext()
    else if (e.key === 'Tab') {
      // Keep Tab inside the dialog.
      const items = [...dialog.current.querySelectorAll('button:not([disabled]), a[href]')]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const nav = 'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-slate-900/80 text-white shadow-lg hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:grid'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()} onKeyDown={onKeyDown}>
      <p className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-b-xl bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white sm:top-0" aria-live="polite">
        Showing {index + 1} of {total} templates
      </p>
      <button type="button" aria-label="Previous template" onClick={onPrev} className={`${nav} left-3 xl:left-10`}>
        <span aria-hidden="true">←</span>
      </button>
      <button type="button" aria-label="Next template" onClick={onNext} className={`${nav} right-3 xl:right-10`}>
        <span aria-hidden="true">→</span>
      </button>

      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tpl-title"
        tabIndex={-1}
        className="rise relative mt-9 grid max-h-[88vh] w-full max-w-4xl grid-cols-[minmax(0,1fr)] overflow-y-auto rounded-2xl bg-white shadow-2xl focus:outline-none sm:mt-0 sm:max-h-[92vh] md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="bg-slate-100 p-5 sm:p-7">
          <div className="mx-auto max-w-[22rem] overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-slate-200 md:max-w-none" aria-hidden="true">
            <PaperPreview clip>
              <ResumeDocument data={SAMPLE} template={template.id} accent={shownAccent} />
            </PaperPreview>
          </div>
        </div>

        <div className="flex min-w-0 flex-col p-6 sm:p-8">
          <span className="w-fit rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">{template.category}</span>
          <h2 id="tpl-title" className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {template.name}
          </h2>
          <p className="mt-1 text-slate-600">{template.blurb}</p>

          <ul className="mt-5 space-y-2.5 text-[15px] text-slate-800">
            <li className="flex gap-2">
              <Check />
              <span>{single ? '1-column layout' : '2-column layout'}</span>
            </li>
            <li className="flex gap-2">
              <Check />
              <span>
                {single
                  ? 'Reads cleanly in job-portal systems (ATS)'
                  : 'Best sent straight to a person. Some job portals read two columns less reliably.'}
              </span>
            </li>
            <li className="flex gap-2">
              <Check />
              <span>Real text, never a picture, so it can be searched and copied</span>
            </li>
            <li className="flex gap-2">
              <Check />
              <span>
                Best for: <span className="text-slate-600">{template.bestFor}</span>
              </span>
            </li>
            <li className="flex gap-2">
              <Check />
              <span>
                Font: <span className="text-slate-600">{template.font}</span>
              </span>
            </li>
            <li className="flex gap-2">
              <Check />
              <span>Switch template any time. Your words stay put.</span>
            </li>
          </ul>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-slate-700">Colour</p>
            <Swatches value={accent} onChange={onAccent} original={<span className="block h-4 w-4 rounded-full" style={{ background: template.accent }} />} />
          </div>

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={onUse}
              disabled={busy}
              className="w-full rounded-full bg-blue-600 px-7 py-3 text-base font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 sm:w-auto"
            >
              {busy ? 'Opening…' : 'Use this template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
