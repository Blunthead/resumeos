import { useLayoutEffect, useRef, useState } from 'react'

// A4 at 96dpi. The paper is laid out at its true size and then scaled down to
// whatever width is available, so fonts, wrapping and page breaks are exactly
// what the PDF will show — just smaller.
const PAPER_W = 794
const PAPER_H = 1123
const PAD_X = 60 // 16mm
const PAD_Y = 53 // 14mm

export default function PaperPreview({ children, clip = false, className = '' }) {
  const outer = useRef(null)
  const inner = useRef(null)
  const [scale, setScale] = useState(0.5)
  const [innerH, setInnerH] = useState(PAPER_H)

  useLayoutEffect(() => {
    // Measured once synchronously, so the first paint is already the right
    // size and there is no jump from a guessed scale.
    setScale(outer.current.clientWidth / PAPER_W)
    if (!clip) setInnerH(inner.current.offsetHeight)

    // After that, the observer reports sizes itself, so nothing here reads
    // layout again. Setting equal state is a no-op, so unchanged sizes cost
    // nothing.
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === outer.current) setScale(entry.contentRect.width / PAPER_W)
        else setInnerH(entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight)
      }
    })
    ro.observe(outer.current)
    // A clipped preview shows a fixed page height, so its content height is irrelevant.
    if (!clip) ro.observe(inner.current)
    return () => ro.disconnect()
  }, [clip])

  const height = clip ? PAPER_H * scale : Math.max(innerH, PAPER_H) * scale

  return (
    <div
      ref={outer}
      className={`relative w-full overflow-hidden bg-white ${className}`}
      style={{ height }}
    >
      <div
        ref={inner}
        style={{
          width: PAPER_W,
          minHeight: PAPER_H,
          padding: `${PAD_Y}px ${PAD_X}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}
