import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import PaperPreview from '../components/PaperPreview.jsx'
import ResumeDocument from '../components/ResumeDocument.jsx'
import SectionsPanel from '../components/editor/SectionsPanel.jsx'
import StylePanel from '../components/editor/StylePanel.jsx'
import { Redo, Undo } from '../components/editor/icons.jsx'
import { buildSteps } from '../components/editor/stepList.js'
import { api } from '../lib/api.js'
import { createHistory } from '../lib/history.js'
import { handoff } from '../lib/handoff.js'
import { withSample } from '../lib/preview.js'
import { accentOf, isEmptyResume, normalizeData } from '../lib/resume.js'
import documentCss from '../components/resumeDocument.css?raw'

const DEFAULT_TITLE = 'Untitled resume'

const SAVE_LABEL = {
  saved: 'All changes saved',
  dirty: 'Unsaved changes…',
  saving: 'Saving…',
  error: "Couldn't save — retrying…",
  failed: "Couldn't save — try reloading the page",
}

// The serif and monospace templates use fonts that are only fetched when
// something uses them. Asking for them when the style panel opens means a
// template switch never flashes in the wrong typeface.
const TEMPLATE_FONTS = [
  '400 1em "Source Serif 4"',
  '600 1em "Source Serif 4"',
  '700 1em "Source Serif 4"',
  'italic 400 1em "Source Serif 4"',
  'italic 700 1em "Source Serif 4"',
  '400 1em "JetBrains Mono"',
  '600 1em "JetBrains Mono"',
  '700 1em "JetBrains Mono"',
  'italic 400 1em "JetBrains Mono"',
]

// The parts of a resume an undo step restores.
const snapshotOf = ({ title, template, accent, data }) => ({ title, template, accent, data })

// A cheap fingerprint of everything that is a structural change rather than
// typing: what exists and in what order. Typing inside a field changes none of
// it, so Undo can group typing into phrases and keep add, remove and reorder
// as steps of their own.
function shapeOf(d) {
  const list = (items) => items.map((i) => i.id).join(',')
  return [
    list(d.experience), list(d.education), list(d.projects),
    d.skills.join('|'), d.certifications.join('|'), d.languages.join('|'),
    d.order.join(','), d.custom.map((c) => `${c.id}:${list(c.entries)}`).join(';'),
  ].join('#')
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
  const [resume, setResume] = useState(() => {
    const created = handoff.peek(id)
    return created && { ...created, data: normalizeData(created.data) }
  })
  const [status, setStatus] = useState(resume ? 'ready' : 'loading') // loading | ready | missing | error
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saveState, setSaveState] = useState('saved')
  const [activeKey, setActiveKey] = useState('contact')
  const [focusTick, setFocusTick] = useState(0)
  const [tab, setTab] = useState('edit') // phones show one pane at a time
  const [showStyle, setShowStyle] = useState(false)
  const [showSections, setShowSections] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [createError, setCreateError] = useState('')

  const latest = useRef(resume)
  const dirty = useRef(false)
  const timer = useRef(null)
  const queue = useRef(Promise.resolve())
  const retry = useRef({ timer: null, count: 0, stopped: false, run: null })
  const history = useRef(createHistory())
  const previewRef = useRef(null)
  const formRef = useRef(null)
  const styleRef = useRef(null)
  const actions = useRef({})

  useEffect(() => {
    handoff.drop(id)
    if (latest.current) return undefined
    let cancelled = false
    api
      .getResume(id)
      .then((loaded) => {
        if (cancelled) return
        const r = { ...loaded, data: normalizeData(loaded.data) }
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

  // A resume made a moment ago may not exist on the server yet. If it never
  // will (the limit of 25, no connection), say so now rather than at the first
  // save, so nobody types a whole resume into something that cannot be kept.
  useEffect(() => {
    let cancelled = false
    handoff.ready(id).catch((e) => !cancelled && setCreateError(e.message))
    return () => {
      cancelled = true
    }
  }, [id])

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
        await handoff.ready(id) // a brand-new resume may still be reaching the server
        setCreateError('')
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

  // The tabs follow the sections' order and titles. If the open section was
  // deleted, its tab is gone and the first one is shown instead.
  const custom = resume?.data.custom
  const order = resume?.data.order
  const steps = useMemo(() => (custom ? buildSteps({ custom, order }) : []), [custom, order])
  const stepIndex = Math.max(0, steps.findIndex((s) => s.key === activeKey))
  const currentKey = steps[stepIndex]?.key ?? 'contact'

  // Sections already visited and left. Until then an empty section is shown
  // with sample content in the preview (see lib/preview.js). Remembered per
  // resume, so a section someone skipped on purpose stays empty on return.
  const leftKey = `resumeos.left.${id}`
  const [left, setLeft] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(leftKey) ?? '[]'))
    } catch {
      return new Set()
    }
  })
  const lastKey = useRef(currentKey)
  useEffect(() => {
    const gone = lastKey.current
    lastKey.current = currentKey
    if (gone === currentKey) return
    setLeft((prev) => {
      if (prev.has(gone)) return prev
      const next = new Set(prev).add(gone)
      try {
        localStorage.setItem(leftKey, JSON.stringify([...next]))
      } catch {
        // storage blocked: the samples simply come back next visit
      }
      return next
    })
  }, [currentKey, leftKey])
  const shown = useMemo(() => (resume ? withSample(resume.data, left) : null), [resume, left])

  const syncHistory = () => {
    setCanUndo(history.current.canUndo)
    setCanRedo(history.current.canRedo)
  }

  // Puts a new state on screen and schedules its save. Every edit, and every
  // undo and redo, goes through here.
  function apply(next) {
    latest.current = next
    setResume(next)
    dirty.current = true
    setSaveState('dirty')
    clearTimeout(timer.current)
    timer.current = setTimeout(save, 800)
    syncHistory()
  }

  // `key` names the field being typed in, so a burst of typing is one undo step.
  function change(patch, key = null) {
    history.current.record(snapshotOf(latest.current), { key })
    apply({ ...latest.current, ...patch })
  }

  const changeData = (fn) => {
    const prev = latest.current.data
    const data = fn(prev)
    const typing = shapeOf(prev) === shapeOf(data)
    change({ data }, typing ? `data:${currentKey}` : null)
  }

  const undo = () => {
    const before = history.current.undo(snapshotOf(latest.current))
    if (before) apply({ ...latest.current, ...before })
  }
  const redo = () => {
    const after = history.current.redo(snapshotOf(latest.current))
    if (after) apply({ ...latest.current, ...after })
  }
  const saveNow = () => {
    clearTimeout(timer.current)
    void save()
  }
  // Read by the shortcut listener below, which is attached only once.
  useEffect(() => {
    actions.current = { undo, redo, saveNow }
  })

  // Each template has a signature colour. Moving to another template takes its
  // colour too, unless the user picked their own, which we never overwrite.
  function switchTemplate(next) {
    const { template, accent } = latest.current
    const usingDefault = accent.toLowerCase() === accentOf(template).toLowerCase()
    change(usingDefault ? { template: next.id, accent: next.accent } : { template: next.id })
  }

  const setStyle = (patch) => changeData((d) => ({ ...d, style: { ...d.style, ...patch } }))

  // Moves the form to a section and, with a mouse, into its first field.
  const openSection = useCallback((key) => {
    setActiveKey(key)
    setTab('edit')
    setFocusTick((n) => n + 1)
  }, [])

  // After a section is opened from the preview or a tab: scroll the form to the
  // top and, if there is a mouse, put the cursor in its first field. On a phone
  // that would raise the keyboard uninvited, so it is skipped there.
  useEffect(() => {
    if (!focusTick) return undefined
    const frame = requestAnimationFrame(() => {
      const form = formRef.current
      if (!form) return
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      form.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })
      if (window.matchMedia('(pointer: fine)').matches) {
        form.querySelector('[data-step-form] input, [data-step-form] textarea')?.focus({ preventScroll: true })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [focusTick])

  // Shortcuts. They go through `actions` so this listener is attached once.
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) actions.current.redo()
        else actions.current.undo()
      } else if (mod && key === 'y') {
        e.preventDefault()
        actions.current.redo()
      } else if (mod && key === 's') {
        e.preventDefault()
        actions.current.saveNow()
      } else if (e.key === 'Escape') {
        setShowStyle(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // The style panel closes when you click anywhere else, and warms the fonts.
  useEffect(() => {
    if (!showStyle) return undefined
    TEMPLATE_FONTS.forEach((font) => document.fonts?.load(font, 'Aa').catch(() => {}))
    const onDown = (e) => !styleRef.current?.contains(e.target) && setShowStyle(false)
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [showStyle])

  async function download() {
    setDownloading(true)
    setDownloadError('')
    try {
      await save()
      // Drawn from the real data, not from what is on screen, so the grey sample
      // content in the preview can never end up in the file.
      const { renderToStaticMarkup } = await import('react-dom/server')
      const html = `<style>${documentCss}</style>${renderToStaticMarkup(
        <ResumeDocument data={resume.data} template={resume.template} accent={resume.accent} />,
      )}`
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
  const preview = useDeferredValue(shown) ?? shown

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
  const current = steps[stepIndex]
  const StepForm = current.Component
  const isLast = stepIndex === steps.length - 1
  const iconBtn =
    'grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="relative z-20 flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:gap-3 sm:px-4">
        <Logo />
        <input
          aria-label="Resume name"
          value={resume.title}
          onChange={(e) => change({ title: e.target.value.slice(0, 100) }, 'title')}
          onBlur={() => !resume.title.trim() && change({ title: DEFAULT_TITLE })}
          className="ml-2 hidden w-36 min-w-0 rounded-lg border border-transparent lg:w-56 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-200 focus:border-blue-400 focus:outline-none sm:block"
        />
        <span
          className={`ml-auto hidden whitespace-nowrap text-xs md:block ${saveState === 'error' || saveState === 'failed' ? 'text-red-600' : 'text-slate-600'}`}
          role="status"
        >
          {SAVE_LABEL[saveState]}
        </span>
        <div className="ml-auto flex items-center md:ml-0">
          <button type="button" onClick={undo} disabled={!canUndo} className={iconBtn} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} className={iconBtn} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Redo />
          </button>
        </div>
        <div ref={styleRef} className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowStyle((s) => !s)}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
            aria-expanded={showStyle}
            aria-haspopup="dialog"
          >
            Style
          </button>
          {showStyle && (
            <StylePanel resume={resume} onTemplate={switchTemplate} onAccent={(accent) => change({ accent })} onStyle={setStyle} />
          )}
        </div>
        <button
          type="button"
          onClick={download}
          disabled={downloading || empty}
          title={empty ? 'Add something to your resume first' : undefined}
          className="whitespace-nowrap rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 sm:px-4"
        >
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>
      </header>

      {createError && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {createError} Your changes can't be saved yet.
        </p>
      )}

      {downloadError && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {downloadError}
        </p>
      )}

      {/* Phone: switch between editing and previewing */}
      <div className="flex border-b border-slate-200 bg-white lg:hidden" role="tablist" aria-label="Editor view">
        {['edit', 'preview'].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold capitalize ${
              tab === t ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,28rem)_1fr] xl:grid-cols-[minmax(0,32rem)_1fr]">
        {/* Form */}
        <section
          ref={formRef}
          aria-label="Edit your resume"
          className={`min-h-0 overflow-y-auto bg-white lg:border-r lg:border-slate-200 ${tab === 'edit' ? '' : 'hidden lg:block'}`}
        >
          <div className="px-5 py-6">
            <nav aria-label="Resume sections" className="mb-6">
              <ol className="flex flex-wrap gap-1.5">
                {steps.map((s, i) => (
                  <li key={s.key} className="max-w-full">
                    <button
                      type="button"
                      onClick={() => openSection(s.key)}
                      aria-current={i === stepIndex ? 'step' : undefined}
                      className={`max-w-[11rem] truncate rounded-full px-3 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        i === stepIndex ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {s.title}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setShowSections((s) => !s)}
                    aria-expanded={showSections}
                    className={`rounded-full border border-dashed px-3 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      showSections ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-400 text-slate-700 hover:border-blue-500 hover:text-blue-800'
                    }`}
                  >
                    + Sections
                  </button>
                </li>
              </ol>
            </nav>

            {showSections && <SectionsPanel data={resume.data} onData={changeData} onOpen={openSection} />}

            <div key={current.key} className="rise" data-step-form>
              <div className="mb-4 flex items-center gap-3" aria-hidden="true">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue-600 transition-[width] duration-500" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-slate-600">
                  Step {stepIndex + 1} of {steps.length}
                </span>
              </div>
              <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-slate-900">{current.heading ?? current.title}</h1>
              <p className="mb-5 mt-1.5 text-slate-600">{current.hint}</p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <StepForm data={resume.data} onData={changeData} onOpen={openSection} sectionId={current.sectionId} />
              </div>
            </div>

            <div className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-between border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
              <button
                type="button"
                onClick={() => openSection(steps[Math.max(0, stepIndex - 1)].key)}
                disabled={stepIndex === 0}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:invisible"
              >
                Back
              </button>
              {isLast ? (
                <button
                  type="button"
                  onClick={download}
                  disabled={downloading || empty}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {downloading ? 'Preparing…' : 'Download PDF'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openSection(steps[stepIndex + 1].key)}
                  className="max-w-[60%] truncate rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Next: {steps[stepIndex + 1].title}
                </button>
              )}
            </div>
            <p className="mt-6 text-center text-xs text-slate-600">
              <Link to="/resumes" className="underline-offset-2 hover:text-slate-900 hover:underline">
                Back to my resumes
              </Link>
            </p>
          </div>
        </section>

        {/* Live preview */}
        <section
          aria-label="Resume preview"
          tabIndex={0}
          className={`min-h-0 overflow-y-auto bg-slate-100 p-4 sm:p-8 ${tab === 'preview' ? '' : 'hidden lg:block'}`}
        >
          <div className="mx-auto max-w-[46rem]">
            <p className="mb-3 text-center text-sm text-slate-600">
              {preview.ghost.size
                ? "The faded parts are samples. They won't be in your PDF."
                : 'Click any part of your resume to edit it.'}
            </p>
            {/* Marks the section being edited. It lives beside the preview, not
                inside the document, so it never reaches the PDF. */}
            <style>{`.rd-preview [data-section=${JSON.stringify(current.key)}]{outline-color:rgba(0,113,227,.6)!important;background-color:rgba(0,113,227,.04)}`}</style>
            <div
              ref={previewRef}
              onClick={(e) => {
                const hit = e.target.closest('[data-section]')
                if (hit) openSection(hit.dataset.section)
              }}
              className="rd-preview overflow-hidden rounded-lg shadow-lg ring-1 ring-slate-200"
            >
              <PaperPreview>
                <ResumeDocument data={preview.data} ghost={preview.ghost} template={resume.template} accent={resume.accent} />
              </PaperPreview>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
