import { useState } from 'react'
import { IconButton } from './Fields.jsx'
import { Down, Grip, Up } from './icons.jsx'
import { dropEdge, useSortable } from './sortable.js'
import { LIMITS, blankCustomSection } from '../../lib/resume.js'
import {
  SECTION_SUGGESTIONS,
  customKey,
  isCustomKey,
  move,
  resolveOrder,
  sectionTitle,
} from '../../lib/sections.js'

// Arrange the sections and add new ones. The order set here is the order on
// the resume and the order of the tabs above the form.
export default function SectionsPanel({ data, onData, onOpen }) {
  const order = resolveOrder(data)
  const [title, setTitle] = useState('')
  const sort = useSortable((from, to) => onData((d) => ({ ...d, order: move(resolveOrder(d), from, to) })))
  const full = data.custom.length >= LIMITS.customSections
  const used = new Set(data.custom.map((c) => c.title.trim().toLowerCase()))

  function add(raw) {
    const name = raw.trim().slice(0, 60)
    if (!name || full) return
    const section = blankCustomSection(name)
    onData((d) => ({ ...d, custom: [...d.custom, section], order: [...resolveOrder(d), customKey(section.id)] }))
    setTitle('')
    onOpen(customKey(section.id))
  }

  const moveTo = (from, to) => onData((d) => ({ ...d, order: move(resolveOrder(d), from, to) }))

  return (
    <div className="rise mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4" role="group" aria-label="Arrange sections">
      <p className="text-sm text-slate-700">
        Drag to reorder, or use the arrows. A section shows on your resume once it has something in it.
      </p>

      <ul className="mt-3 space-y-1.5">
        {order.map((key, i) => {
          const edge = dropEdge(sort, i)
          return (
            <li
              key={key}
              {...sort.itemProps(i)}
              className={`flex items-center gap-1 rounded-xl border bg-white py-1 pl-1 pr-1.5 ${
                edge === 'top' ? 'border-t-4 border-blue-500' : edge === 'bottom' ? 'border-b-4 border-blue-500' : 'border-slate-200'
              } ${sort.dragging === i ? 'opacity-50' : ''}`}
            >
              <span
                {...sort.handleProps(i)}
                aria-hidden
                title="Drag to reorder"
                className="grid h-8 w-6 shrink-0 cursor-grab place-items-center text-slate-500 hover:text-slate-800 active:cursor-grabbing"
              >
                <Grip />
              </span>
              <button
                type="button"
                onClick={() => onOpen(key)}
                className="min-w-0 flex-1 truncate rounded-lg px-1.5 py-1 text-left text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                {sectionTitle(data, key)}
              </button>
              {isCustomKey(key) && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800">Yours</span>}
              <IconButton label={`Move ${sectionTitle(data, key)} up`} onClick={() => moveTo(i, i - 1)} disabled={i === 0}>
                <Up />
              </IconButton>
              <IconButton label={`Move ${sectionTitle(data, key)} down`} onClick={() => moveTo(i, i + 1)} disabled={i === order.length - 1}>
                <Down />
              </IconButton>
            </li>
          )
        })}
      </ul>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault()
          add(title)
        }}
      >
        <label className="block text-sm font-medium text-slate-700" htmlFor="new-section">
          Add your own section
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="new-section"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            disabled={full}
            placeholder={full ? `That's the maximum (${LIMITS.customSections})` : 'e.g. Awards'}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[15px] placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={full || !title.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {!full && (
          <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Suggestions">
            {SECTION_SUGGESTIONS.filter((s) => !used.has(s.toLowerCase())).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-800"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}
