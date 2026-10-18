import { useState } from 'react'

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100'

export function Field({ label, value, onChange, placeholder, type = 'text', hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={200}
        className={inputCls}
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function TextArea({ label, value, onChange, placeholder, rows = 4, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={5000}
        className={`${inputCls} resize-y leading-relaxed`}
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function ItemCard({ title, onRemove, children }) {
  return (
    <div className="rise space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-white hover:text-red-600"
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  )
}

export function AddButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-blue-700 hover:border-blue-400 hover:bg-blue-50"
    >
      + {children}
    </button>
  )
}

// Type a skill, press Enter or comma, it becomes a removable chip.
export function ChipInput({ label, values, onChange, placeholder, max = 60 }) {
  const [draft, setDraft] = useState('')

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
          placeholder={placeholder}
          className={inputCls}
        />
        <span className="mt-1 block text-xs text-slate-500">Press Enter after each one.</span>
      </label>
      {values.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {values.map((v) => (
            <li key={v} className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-sm text-blue-900">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="grid h-5 w-5 place-items-center rounded-full text-blue-700 hover:bg-blue-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
