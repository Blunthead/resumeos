import { useRef, useState } from 'react'

// Drag-to-reorder using the browser's own drag events: no library, nothing to
// load. It is the mouse path only. Touch screens don't fire these events, and
// keyboard users can't drag, so every sortable list also offers move up / down
// buttons; the drag handle is a convenience, never the only way.
//
//   const sort = useSortable((from, to) => onItems(move(items, from, to)))
//   <li {...sort.itemProps(i)}> <span {...sort.handleProps(i)} /> ... </li>
export function useSortable(onMove) {
  const from = useRef(-1)
  const [over, setOver] = useState(-1)
  const [dragging, setDragging] = useState(-1)

  const end = () => {
    from.current = -1
    setOver(-1)
    setDragging(-1)
  }

  return {
    over,
    dragging,
    handleProps: (index) => ({
      draggable: true,
      onDragStart(e) {
        from.current = index
        setDragging(index)
        e.dataTransfer.effectAllowed = 'move'
        // Firefox needs data set for the drag to start at all.
        e.dataTransfer.setData('text/plain', String(index))
        // Drag the whole row, not just the little handle.
        const row = e.currentTarget.closest('[data-sortable]')
        if (row) e.dataTransfer.setDragImage(row, 16, 16)
      },
      onDragEnd: end,
    }),
    itemProps: (index) => ({
      'data-sortable': '',
      onDragOver(e) {
        if (from.current < 0) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (over !== index) setOver(index)
      },
      onDrop(e) {
        if (from.current < 0) return
        e.preventDefault()
        const source = from.current
        end()
        if (source !== index) onMove(source, index)
      },
    }),
  }
}

// Which edge of a row shows the drop marker: the one the dragged row will land on.
export function dropEdge(sort, index) {
  if (sort.over !== index || sort.dragging < 0 || sort.dragging === index) return ''
  return sort.dragging > index ? 'top' : 'bottom'
}
