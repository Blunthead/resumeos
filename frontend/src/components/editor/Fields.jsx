import { useId, useLayoutEffect, useRef, useState } from 'react'
import { continueList, toggleList, toggleMark } from '../../lib/richEdit.js'
import { move } from '../../lib/sections.js'
import { Chevron, Copy, Down, Grip, ListBullets, ListNumbers, Trash, Up } from './icons.jsx'
import { dropEdge, useSortable } from './sortable.js'

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100'

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
  'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600'

// A text area with a formatting toolbar. The formatting is plain markers in the
// text (see lib/richText.js), so what the toolbar does is also what you could
// type by hand, and nothing is lost if the markers are edited directly.
export function RichTextArea({ label, value, onChange, placeholder, rows = 4, hint }) {
  const ref = useRef(null)
  const pending = useRef(null)
  const hintId = useId()
  const fieldId = useId()

  // The caret and selection are restored after React has applied the new value.
  useLayoutEffect(() => {
    if (pending.current && ref.current) {
      ref.current.focus()
      ref.current.setSelectionRange(pending.current.start, pending.current.end)
      pending.current = null
    }
  })

  function apply(edit) {
    const el = ref.current
    const next = edit(el.value, el.selectionStart, el.selectionEnd)
    if (next.value.length > LONG_MAX) return
    pending.current = { start: next.start, end: next.end }
    onChange(next.value)
  }

  function onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey
    const key = e.key.toLowerCase()
    if (mod && (key === 'b' || key === 'i' || key === 'u')) {
      e.preventDefault()
      const kind = { b: 'bold', i: 'italic', u: 'underline' }[key]
      apply((v, s, en) => toggleMark(v, s, en, kind))
    } else if (e.key === 'Enter' && !e.shiftKey && !mod && ref.current.selectionStart === ref.current.selectionEnd) {
      const next = continueList(ref.current.value, ref.current.selectionStart)
      if (next && next.value.length <= LONG_MAX) {
        e.preventDefault()
        pending.current = { start: next.start, end: next.end }
        onChange(next.value)
      }
    }
  }

  const keep = (e) => e.preventDefault() // keep focus and selection in the text area
  const near = value.length > LONG_MAX * 0.8

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="rounded-xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
        <div role="toolbar" aria-label={`Formatting for ${label}`} className="flex items-center gap-0.5 border-b border-slate-200 px-1.5 py-1">
          <button type="button" className={`${toolBtn} font-bold`} aria-label="Bold" title="Bold (Ctrl+B)" onMouseDown={keep} onClick={() => apply((v, s, e) => toggleMark(v, s, e, 'bold'))}>
            B
          </button>
          <button type="button" className={`${toolBtn} italic`} aria-label="Italic" title="Italic (Ctrl+I)" onMouseDown={keep} onClick={() => apply((v, s, e) => toggleMark(v, s, e, 'italic'))}>
            I
          </button>
          <button type="button" className={`${toolBtn} underline`} aria-label="Underline" title="Underline (Ctrl+U)" onMouseDown={keep} onClick={() => apply((v, s, e) => toggleMark(v, s, e, 'underline'))}>
            U
          </button>
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
          <button type="button" className={toolBtn} aria-label="Bulleted list" title="Bulleted list" onMouseDown={keep} onClick={() => apply((v, s, e) => toggleList(v, s, e, 'bullet'))}>
            <ListBullets />
          </button>
          <button type="button" className={toolBtn} aria-label="Numbered list" title="Numbered list" onMouseDown={keep} onClick={() => apply((v, s, e) => toggleList(v, s, e, 'number'))}>
            <ListNumbers />
          </button>
        </div>
        <textarea
          id={fieldId}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={rows}
          maxLength={LONG_MAX}
          dir="auto"
          aria-describedby={hintId}
          className="block w-full resize-y rounded-b-xl bg-transparent px-3.5 py-2.5 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-500 focus:outline-none"
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
