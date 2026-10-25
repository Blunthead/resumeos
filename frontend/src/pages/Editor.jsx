import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import PaperPreview from '../components/PaperPreview.jsx'
import ResumeDocument from '../components/ResumeDocument.jsx'
import { STEPS } from '../components/editor/stepList.js'
import { api } from '../lib/api.js'
import { handoff } from '../lib/handoff.js'
import { ACCENTS, SAMPLE, TEMPLATES, accentOf, isEmptyResume } from '../lib/resume.js'
import documentCss from '../components/resumeDocument.css?raw'

const DEFAULT_TITLE = 'Untitled resume'

const SAVE_LABEL = {
  saved: 'All changes saved',
  dirty: 'Unsaved changes…',
  saving: 'Saving…',
  error: "Couldn't save — retrying…",
  failed: "Couldn't save — try reloading the page",
}

// Keyed by id so opening a different resume always starts from a clean slate.
export default function EditorPage() {
  const { id } = useParams()
  return <Editor key={id} id={id} />
}

function Editor({ id }) {
  const navigate = useNavigate()
  // A resume that was just created arrives with the click that made it, so the
  // editor opens at once instead of asking the server for it again.
  const [resume, setResume] = useState(() => handoff.peek(id))
  const [status, setStatus] = useState(resume ? 'ready' : 'loading') // loading | ready | missing | error
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saveState, setSaveState] = useState('saved')
  const [step, setStep] = useState(0)
  const [tab, setTab] = useState('edit') // phones show one pane at a time
  const [showStyle, setShowStyle] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  const latest = useRef(resume)
  const dirty = useRef(false)
  const timer = useRef(null)
  const queue = useRef(Promise.resolve())
  const retry = useRef({ timer: null, count: 0, stopped: false, run: null })
  const previewRef = useRef(null)

  useEffect(() => {
    handoff.drop(id)
    if (latest.current) return undefined
    let cancelled = false
    api
      .getResume(id)
      .then((r) => {
        if (cancelled) return
        latest.current = r
        setResume(r)
        setStatus('ready')
      })
      .catch((e) => {
        if (cancelled) return
        if (e.status === 404) setStatus('missing')
        else {
          setLoadError(e.message)
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  // What the server stores. An emptied title is saved as the default rather
  // than rejected, so the field can be cleared and retyped freely.
  const payload = () => {
    const { title, template, accent, data } = latest.current
    return { title: title.trim() || DEFAULT_TITLE, template, accent, data }
  }

  // Saves run one at a time. Two in flight together could land out of order
  // and let an older copy overwrite a newer one.
  const save = useCallback(() => {
    const run = async () => {
      if (!dirty.current || !latest.current) return
      dirty.current = false
      setSaveState('saving')
      try {
        await api.updateResume(id, payload())
        retry.current.count = 0
        setSaveState(dirty.current ? 'dirty' : 'saved')
      } catch (e) {
        dirty.current = true
        // Only failures that can heal are retried: no connection, a server
        // error, or being rate limited. A 404 (deleted elsewhere) or 400 will
        // fail identically every time, so those stop and say so.
        const healable = e.status === 0 || e.status === 429 || e.status >= 500
        setSaveState(healable ? 'error' : 'failed')
        const r = retry.current
        clearTimeout(r.timer)
        // 4s, 8s, 16s… up to every 30s, so a blip heals without another keystroke.
        if (healable && !r.stopped) r.timer = setTimeout(() => r.run?.(), Math.min(30_000, 4000 * 2 ** r.count++))
      }
    }
    queue.current = queue.current.then(run)
    return queue.current
  }, [id])

  // Closing or reloading the tab inside the 800ms before an edit is saved would
  // lose it. `keepalive` lets this last request finish after the page is gone.
  useEffect(() => {
    const flush = () => {
      if (!dirty.current || !latest.current) return
      dirty.current = false
      api.updateResume(id, payload(), { keepalive: true }).catch(() => {
        dirty.current = true
      })
    }
    const onHide = () => document.visibilityState === 'hidden' && flush()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
    }
  }, [id])

  // Leaving the page flushes any pending edit rather than dropping it.
  useEffect(() => {
    const r = retry.current
    r.stopped = false
    r.run = save
    return () => {
      clearTimeout(timer.current)
      void save()
      // One last attempt is made above; after that, no retries outlive the page.
      r.stopped = true
      clearTimeout(r.timer)
    }
  }, [save])

  function change(patch) {
    const next = { ...latest.current, ...patch }
    latest.current = next
    setResume(next)
    dirty.current = true
    setSaveState('dirty')
    clearTimeout(timer.current)
    timer.current = setTimeout(save, 800)
  }

  const changeData = (fn) => change({ data: fn(latest.current.data) })

  // Each template has a signature colour. Moving to another template takes its
  // colour too, unless the user picked their own, which we never overwrite.
  function switchTemplate(next) {
    const { template, accent } = latest.current
    const usingDefault = accent.toLowerCase() === accentOf(template).toLowerCase()
    change(usingDefault ? { template: next.id, accent: next.accent } : { template: next.id })
  }

  async function download() {
    const el = previewRef.current?.querySelector('.rd')
    if (!el) return
    setDownloading(true)
    setDownloadError('')
    try {
      await save()
      const html = `<style>${documentCss}</style>${el.outerHTML}`
      const name = resume.data.contact.fullName || resume.title.trim() || DEFAULT_TITLE
      const blob = await api.renderPdf(html, `${name} resume`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name || 'resume'}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (e) {
      setDownloadError(e.message)
    } finally {
      setDownloading(false)
    }
  }

  // The form updates instantly; the preview may lag a frame behind while a
  // fast typist is mid-word, which keeps every keystroke responsive. (Called
  // before the early returns below, so every render runs the same hooks.)
  const previewData = useDeferredValue(resume && !isEmptyResume(resume.data) ? resume.data : SAMPLE)

  if (status === 'loading') {
    return (
      <div role="status" className="grid min-h-screen place-items-center text-slate-500">
        Loading your resume…
      </div>
    )
  }
  if (status !== 'ready') {
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div>
          <p className="text-lg font-semibold">
            {status === 'missing' ? "We couldn't find that resume" : "Couldn't load your resume"}
          </p>
          {loadError && <p className="mt-1 text-slate-600">{loadError}</p>}
          <div className="mt-5 flex justify-center gap-3">
            {status === 'error' && (
              <button
                onClick={() => {
                  setStatus('loading')
                  setAttempt((n) => n + 1)
                }}
                className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                Try again
              </button>
            )}
            <button
              onClick={() => navigate('/resumes')}
              className={`rounded-xl px-5 py-2.5 font-semibold ${
                status === 'error' ? 'text-slate-600 hover:bg-slate-100' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Go to my resumes
            </button>
          </div>
        </div>
      </div>
    )
  }

  const empty = isEmptyResume(resume.data)
  const current = STEPS[step]
  const StepForm = current.Component
  const isLast = step === STEPS.length - 1

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="relative z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <Logo />
        <input
          aria-label="Resume name"
          value={resume.title}
          onChange={(e) => change({ title: e.target.value.slice(0, 100) })}
          onBlur={() => !resume.title.trim() && change({ title: DEFAULT_TITLE })}
          className="ml-2 hidden w-56 rounded-lg border border-transparent px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-200 focus:border-blue-400 focus:outline-none sm:block"
        />
        <span
          className={`ml-auto hidden text-xs md:block ${saveState === 'error' || saveState === 'failed' ? 'text-red-600' : 'text-slate-500'}`}
          role="status"
        >
          {SAVE_LABEL[saveState]}
        </span>
        <button
          onClick={() => setShowStyle((s) => !s)}
          className="ml-auto whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 md:ml-0"
          aria-expanded={showStyle}
        >
          Style
        </button>
        <button
          onClick={download}
          disabled={downloading || empty}
          title={empty ? 'Add something to your resume first' : undefined}
          className="whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>

        {showStyle && (
          <div className="rise absolute right-4 top-full mt-2 w-[min(92vw,26rem)] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
            <p className="mb-2 text-sm font-semibold text-slate-700">Template</p>
            <div className="grid max-h-[55vh] grid-cols-4 gap-x-2 gap-y-3 overflow-y-auto p-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTemplate(t)}
                  aria-pressed={resume.template === t.id}
                  className="text-center"
                >
                  <span
                    className={`block overflow-hidden rounded-md ring-2 ${
                      resume.template === t.id ? 'ring-blue-500' : 'ring-slate-200 hover:ring-slate-300'
                    }`}
                  >
                    <PaperPreview clip>
                      <ResumeDocument data={SAMPLE} template={t.id} accent={t.accent} />
                    </PaperPreview>
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-medium text-slate-600">{t.name}</span>
                </button>
              ))}
            </div>
            <p className="mb-2 mt-4 text-sm font-semibold text-slate-700">Colour</p>
            <div className="flex flex-wrap gap-2.5">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => change({ accent: c })}
                  aria-label={`Colour ${c}`}
                  aria-pressed={resume.accent === c}
                  className={`h-8 w-8 rounded-full ring-offset-2 ${resume.accent === c ? 'ring-2 ring-slate-900' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}
      </header>

      {downloadError && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {downloadError}
        </p>
      )}

      {/* Phone: switch between editing and previewing */}
      <div className="flex border-b border-slate-200 bg-white lg:hidden">
        {['edit', 'preview'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold capitalize ${
              tab === t ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,28rem)_1fr] xl:grid-cols-[minmax(0,32rem)_1fr]">
        {/* Form */}
        <section className={`min-h-0 overflow-y-auto bg-white lg:border-r lg:border-slate-200 ${tab === 'edit' ? '' : 'hidden lg:block'}`}>
          <div className="px-5 py-6">
            <ol className="mb-6 flex flex-wrap gap-1.5">
              {STEPS.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => setStep(i)}
                    aria-current={i === step ? 'step' : undefined}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      i === step
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ol>

            <div key={current.id} className="rise">
              <h1 className="text-2xl font-bold tracking-tight">{current.title}</h1>
              <p className="mb-5 mt-1 text-slate-600">{current.hint}</p>
              <StepForm data={resume.data} onData={changeData} />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:invisible"
              >
                Back
              </button>
              {isLast ? (
                <button
                  onClick={download}
                  disabled={downloading || empty}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {downloading ? 'Preparing…' : 'Download PDF'}
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Next: {STEPS[step + 1].title}
                </button>
              )}
            </div>
            <p className="mt-6 text-center text-xs text-slate-400">
              <Link to="/resumes" className="hover:text-slate-600">Back to my resumes</Link>
            </p>
          </div>
        </section>

        {/* Live preview */}
        <section className={`min-h-0 overflow-y-auto bg-slate-100 p-4 sm:p-8 ${tab === 'preview' ? '' : 'hidden lg:block'}`}>
          <div className="mx-auto max-w-[46rem]">
            {empty && (
              <p className="mb-3 text-center text-sm text-slate-500">
                This is a sample. Start typing and it becomes yours.
              </p>
            )}
            <div ref={previewRef} className="overflow-hidden rounded-lg shadow-lg ring-1 ring-slate-200">
              <PaperPreview>
                <ResumeDocument
                  data={previewData}
                  template={resume.template}
                  accent={resume.accent}
                />
              </PaperPreview>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
