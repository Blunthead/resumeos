import { useEffect, useRef, useState } from 'react'

// A page preview costs real work: the resume is laid out at full A4 size and
// then scaled down. The template gallery has fourteen of them, but only about
// six are ever on screen at once. This holds the exact space (so nothing
// shifts) and only builds the preview once it is about to scroll into view.
export default function LazyPaper({ children, rootMargin = '300px' }) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [rootMargin])

  return (
    <div ref={ref} className="w-full bg-white" style={{ aspectRatio: '794 / 1123' }}>
      {near ? children : null}
    </div>
  )
}
