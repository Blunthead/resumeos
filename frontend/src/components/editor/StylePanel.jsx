import PaperPreview from '../PaperPreview.jsx'
import ResumeDocument from '../ResumeDocument.jsx'
import { ACCENTS, SAMPLE, STYLE_SIZES, STYLE_SPACINGS, TEMPLATES } from '../../lib/resume.js'

function Segmented({ label, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700" id={`seg-${label}`}>
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={`seg-${label}`} className="inline-flex rounded-xl bg-slate-100 p-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-lg px-2.5 py-1.5 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${
              value === o.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Template, colour, text size and spacing. Everything here changes the look of
// the whole document, never its content.
export default function StylePanel({ resume, onTemplate, onAccent, onStyle }) {
  const style = resume.data.style
  return (
    <div
      role="dialog"
      aria-label="Style"
      className="rise absolute right-4 top-full z-30 mt-2 w-[min(94vw,30rem)] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200"
    >
      <div className="max-h-[78vh] overflow-y-auto pr-1">
        <p className="mb-2 text-sm font-semibold text-slate-700">Template</p>
        <div className="grid grid-cols-5 gap-x-2 gap-y-2.5 p-1">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTemplate(t)}
              aria-pressed={resume.template === t.id}
              aria-label={`${t.name} template`}
              className="text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span
                aria-hidden="true"
                className={`block overflow-hidden rounded-md ring-2 ${
                  resume.template === t.id ? 'ring-blue-500' : 'ring-slate-200 hover:ring-slate-300'
                }`}
              >
                <PaperPreview clip>
                  <ResumeDocument data={SAMPLE} template={t.id} accent={t.accent} />
                </PaperPreview>
              </span>
              <span className="mt-1 block truncate text-[11px] font-medium text-slate-700">{t.name}</span>
            </button>
          ))}
        </div>

        <p className="mb-2 mt-4 text-sm font-semibold text-slate-700">Colour</p>
        <div className="flex flex-wrap gap-1.5">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onAccent(c)}
              aria-label={`Colour ${c}`}
              aria-pressed={resume.accent === c}
              className={`h-6 w-6 rounded-full ring-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                resume.accent === c ? 'ring-2 ring-slate-900' : ''
              }`}
              style={{ background: c }}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <Segmented label="Text size" options={STYLE_SIZES} value={style.size} onChange={(size) => onStyle({ size })} />
          <Segmented label="Spacing" options={STYLE_SPACINGS} value={style.spacing} onChange={(spacing) => onStyle({ spacing })} />
        </div>
      </div>
    </div>
  )
}
