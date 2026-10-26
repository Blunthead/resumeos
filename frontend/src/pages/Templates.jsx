import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import LazyPaper from '../components/LazyPaper.jsx'
import PaperPreview from '../components/PaperPreview.jsx'
import ResumeDocument from '../components/ResumeDocument.jsx'
import { api } from '../lib/api.js'
import { handoff, newResumeId } from '../lib/handoff.js'
import { loadEditor, whenIdle } from '../lib/routes.js'
import { SAMPLE, TEMPLATES, normalizeData } from '../lib/resume.js'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'single', label: 'Single column' },
  { id: 'sidebar', label: 'Two column' },
]

export default function Templates() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // While the visitor looks over the templates: download the editor's code,
    // and open the connection (waking the server if it was asleep) so choosing
    // one is a single quick request.
    api.prime()
    whenIdle(loadEditor)
  }, [])

  const shown = TEMPLATES.filter((t) => filter === 'all' || t.layout === filter)

  // A ref, not just `busy`: state only updates on the next render, so a burst
  // of clicks inside one frame would all still see "not busy".
  const creating = useRef(false)

  function choose(template) {
    if (creating.current) return
    creating.current = true
    setBusy(template.id)
    // Open the editor at once. The server may be asleep and take a minute to
    // answer, and nothing the visitor does next needs it: the editor holds the
    // new resume itself and its first save waits for the server (see Editor).
    const id = newResumeId()
    handoff.put({ _id: id, title: 'Untitled resume', template: template.id, accent: template.accent, data: normalizeData({}) })
    handoff.start(id, () => api.createResume({ id, template: template.id, accent: template.accent }))
    navigate(`/resumes/${id}`)
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24">
        <div className="rise py-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pick a template</h1>
          <p className="mt-2 text-slate-600">You can change it any time, your content stays put.</p>

          <div role="group" aria-label="Layout" className="mt-6 inline-flex rounded-xl bg-slate-200/70 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
                  filter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {filter === 'single' && (
            <p className="mt-3 text-sm text-slate-500">The safest choice for online job portals.</p>
          )}
          {filter === 'sidebar' && (
            <p className="mt-3 text-sm text-slate-500">
              Great when you email your resume. Some job portals read these less reliably.
            </p>
          )}
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t, i) => (
            <button
              key={t.id}
              onClick={() => choose(t)}
              disabled={busy !== null}
              className="rise group min-w-0 text-left disabled:opacity-60"
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
            >
              <div aria-hidden="true" className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 group-hover:shadow-lg group-hover:ring-blue-300 group-focus-visible:ring-2 group-focus-visible:ring-blue-500">
                <LazyPaper>
                  <PaperPreview clip>
                    <ResumeDocument data={SAMPLE} template={t.id} accent={t.accent} />
                  </PaperPreview>
                </LazyPaper>
              </div>
              <div className="mt-3 flex items-baseline justify-between px-1">
                <span className="font-semibold text-slate-900">{t.name}</span>
                <span className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100">
                  {busy === t.id ? 'Creating…' : 'Use this'}
                </span>
              </div>
              <p className="px-1 text-sm text-slate-500">{t.blurb}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
