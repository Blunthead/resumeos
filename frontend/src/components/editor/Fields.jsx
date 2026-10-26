import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { fillEditor, markersFromDom, restoreSelection, saveSelection } from '../../lib/richDom.js'
import { move } from '../../lib/sections.js'
import { Chevron, Copy, Down, Grip, ListBullets, ListNumbers, Trash, Up } from './icons.jsx'
import { dropEdge, useSortable } from './sortable.js'

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100'

const LONG_MAX = 5000

export function Field({ label, value, onChange, placeholder, type = 'text', hint, maxLength = 200 }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        // Names and addresses are not necessarily left-to-right.
        dir="auto"
        className={inputCls}
      />
      {hint && <span className="mt-1 block text-xs text-slate-600">{hint}</span>}
    </label>
  )
}

const toolBtn =
  'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm pointer-coarse:h-10 pointer-coarse:min-w-10 text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 aria-pressed:bg-blue-100 aria-pressed:text-blue-800'

const COMMANDS = [
  { id: 'bold', label: 'Bold', hint: 'Bold (Ctrl+B)', cmd: 'bold', cls: 'font-bold', face: 'B' },
  { id: 'italic', label: 'Italic', hint: 'Italic (Ctrl+I)', cmd: 'italic', cls: 'italic', face: 'I' },
  { id: 'underline', label: 'Underline', hint: 'Underline (Ctrl+U)', cmd: 'underline', cls: 'underline', face: 'U' },
  null,
  { id: 'ul', label: 'Bulleted list', hint: 'Bulleted list', cmd: 'insertUnorderedList', icon: ListBullets },
  { id: 'ol', label: 'Numbered list', hint: 'Numbered list', cmd: 'insertOrderedList', icon: ListNumbers },
]

// A text box with a formatting toolbar. What you see is what the resume gets:
// bold looks bold, a bullet looks like a bullet. Underneath, the value is still
// the plain marker text from lib/richText.js (`**b**`, `- item`), so saved
// resumes, undo and the PDF all keep working, and the markers never show.
export function RichTextArea({ label, value, onChange, placeholder, rows = 4, hint }) {
  const ref = useRef(null)
  const sent = useRef(null) // the last value this editor itself produced
  const hintId = useId()
  const labelId = useId()
  const [active, setActive] = useState({})

  // Draws `value` into the editor, but only when it changed from outside (undo,
  // redo, another template): redrawing our own edits would throw the caret away.
  useLayoutEffect(() => {
    if (value !== sent.current && ref.current) {
      fillEditor(ref.current, value)
      sent.current = value
    }
  }, [value])

  // Which buttons are lit follows the caret.
  function refreshActive() {
    const el = ref.current
    if (!el || !el.contains(document.getSelection()?.anchorNode ?? null)) return
    const state = {}
    for (const c of COMMANDS) if (c) state[c.id] = document.queryCommandState(c.cmd)
    setActive(state)
  }
  useEffect(() => {
    document.addEventListener('selectionchange', refreshActive)
    return () => document.removeEventListener('selectionchange', refreshActive)
  })

  function emit() {
    const next = markersFromDom(ref.current)
    if (next.length > LONG_MAX) {
      // Too long: put back what was there rather than silently dropping text.
      const at = saveSelection(ref.current)
      fillEditor(ref.current, sent.current ?? '')
      if (at) restoreSelection(ref.current, { anchor: Math.max(0, at.anchor - 1), focus: Math.max(0, at.focus - 1) })
      return
    }
    if (next === sent.current) return
    sent.current = next
    onChange(next)
  }

  function run(cmd) {
    if (document.activeElement !== ref.current) ref.current.focus()
    const saved = saveSelection(ref.current)
    document.execCommand(cmd)
    // Only put the caret back if the browser moved it: re-setting an unmoved
    // caret would also cancel a bold the user switched on to type with.
    const now = saveSelection(ref.current)
    if (saved && (!now || now.anchor !== saved.anchor || now.focus !== saved.focus)) restoreSelection(ref.current, saved)
    refreshActive()
    emit()
  }

  // Pasted text goes in as plain text: no fonts, colours or links from a web
  // page or a Word file. Lines that start with "-" or "1." become lists on the
  // way back in, same as everywhere else.
  function onPaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n')
    // Whatever fits; the rest is cut rather than the whole paste being refused.
    document.execCommand('insertText', false, text.slice(0, Math.max(0, LONG_MAX - value.length)))
  }

  const keep = (e) => e.preventDefault() // keep focus and selection in the editor
  const near = value.length > LONG_MAX * 0.8

  return (
    <div>
      <span id={labelId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <div className="rounded-xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
        <div role="toolbar" aria-label={`Formatting for ${label}`} className="flex items-center gap-0.5 border-b border-slate-200 px-1.5 py-1">
          {COMMANDS.map((c, i) =>
            c ? (
              <button
                key={c.id}
                type="button"
                className={`${toolBtn} ${c.cls ?? ''}`}
                aria-label={c.label}
                aria-pressed={Boolean(active[c.id])}
                title={c.hint}
                onMouseDown={keep}
                onClick={() => run(c.cmd)}
              >
                {c.icon ? <c.icon /> : c.face}
              </button>
            ) : (
              <span key={i} className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
            ),
          )}
        </div>
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelId}
          aria-describedby={hintId}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          dir="auto"
          data-empty={value === ''}
          data-placeholder={placeholder}
          onInput={emit}
          onPaste={onPaste}
          onDrop={(e) => e.preventDefault()}
          style={{ minHeight: `${rows * 1.625 + 1.25}em` }}
          className="rich-editor block max-h-[60vh] w-full resize-y overflow-auto whitespace-pre-wrap break-words rounded-b-xl bg-transparent px-3.5 py-2.5 text-base sm:text-[15px] leading-relaxed text-slate-900 focus:outline-none"
        />
      </div>
      <div id={hintId} className="mt-1 flex justify-between gap-3 text-xs text-slate-600">
        <span>{hint}</span>
        {near && (
          <span className={value.length >= LONG_MAX ? 'font-semibold text-red-600' : ''}>
            {value.length.toLocaleString()} / {LONG_MAX.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

export function IconButton({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:opacity-30 ${
        danger ? 'text-slate-600 hover:bg-red-50 hover:text-red-600' : 'text-slate-600 hover:bg-white hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

// One entry in a list (a job, a project...). It can be dragged by its grip,
// moved with the arrows, duplicated, collapsed to a single line, or removed.
export function ItemCard({ title, index, count, sort, onMove, onDuplicate, onRemove, children }) {
  const [open, setOpen] = useState(true)
  const edge = dropEdge(sort, index)
  return (
    <div
      {...sort.itemProps(index)}
      className={`rise rounded-2xl border bg-slate-50/60 p-4 ${
        edge === 'top' ? 'border-t-blue-500 border-t-4' : edge === 'bottom' ? 'border-b-blue-500 border-b-4' : 'border-slate-200'
      } ${sort.dragging === index ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-1">
        <span
          {...sort.handleProps(index)}
          aria-hidden
          title="Drag to reorder"
          className="grid h-8 w-6 shrink-0 cursor-grab place-items-center text-slate-500 hover:text-slate-800 active:cursor-grabbing"
        >
          <Grip />
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg py-1 text-left text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
        >
          <Chevron open={open} />
          <span className="truncate">{title}</span>
        </button>
        <IconButton label="Move up" onClick={() => onMove(index - 1)} disabled={index === 0}>
          <Up />
        </IconButton>
        <IconButton label="Move down" onClick={() => onMove(index + 1)} disabled={index === count - 1}>
          <Down />
        </IconButton>
        <IconButton label="Duplicate" onClick={onDuplicate}>
          <Copy />
        </IconButton>
        <IconButton label="Remove" onClick={onRemove} danger>
          <Trash />
        </IconButton>
      </div>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  )
}

export function AddButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-blue-700 hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-transparent"
    >
      + {children}
    </button>
  )
}

// Type a skill, press Enter or comma, it becomes a chip. Chips can be removed,
// dragged into a new order, or moved with Alt + the arrow keys.
export function ChipInput({ label, values, onChange, placeholder, max = 60 }) {
  const [draft, setDraft] = useState('')
  const sort = useSortable((from, to) => onChange(move(values, from, to)))
  const full = values.length >= max

  // Accepts "a, b, c" (typed or pasted) and adds each non-duplicate piece.
  function commit(text = draft) {
    setDraft('')
    const next = [...values]
    for (const part of text.split(',')) {
      const v = part.trim().slice(0, 60)
      if (v && !next.includes(v) && next.length < max) next.push(v)
    }
    if (next.length !== values.length) onChange(next)
  }

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
        <input
          value={draft}
          onChange={(e) => {
            if (e.target.value.includes(',')) commit(e.target.value)
            else setDraft(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Backspace' && !draft && values.length) {
              onChange(values.slice(0, -1))
            }
          }}
          onBlur={() => commit()}
          placeholder={full ? `That's the maximum (${max})` : placeholder}
          disabled={full}
          dir="auto"
          className={`${inputCls} disabled:bg-slate-100`}
        />
        <span className="mt-1 flex justify-between text-xs text-slate-600">
          <span>Press Enter after each one. Drag to reorder.</span>
          <span>
            {values.length} / {max}
          </span>
        </span>
      </label>
      {values.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {values.map((v, i) => {
            const edge = dropEdge(sort, i)
            return (
              <li
                key={v}
                {...sort.itemProps(i)}
                {...sort.handleProps(i)}
                className={`flex cursor-grab items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-sm text-blue-900 active:cursor-grabbing ${
                  edge === 'top' ? 'ring-2 ring-blue-500' : edge === 'bottom' ? 'ring-2 ring-blue-500' : ''
                } ${sort.dragging === i ? 'opacity-40' : ''}`}
              >
                {v}
                <button
                  type="button"
                  aria-label={`Remove ${v}. Alt and arrow keys move it.`}
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  onKeyDown={(e) => {
                    if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
                    e.preventDefault()
                    onChange(move(values, i, i + (e.key === 'ArrowLeft' ? -1 : 1)))
                  }}
                  className="grid h-5 w-5 place-items-center rounded-full text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
