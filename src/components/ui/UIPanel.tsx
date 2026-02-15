import { useCallback, useRef, useState } from 'react'
import type { PanelConfig, PanelLayout } from '@/types/ui'
import { UI_GRID_COLS, UI_GRID_ROWS } from '@/types/ui'

interface UIPanelProps {
  config: PanelConfig
  layout: PanelLayout
  onLayoutChange: (layout: PanelLayout) => void
  closable?: boolean
  onClose?: () => void
  zIndex?: number
  onPanelFocus?: () => void
  children: React.ReactNode
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se'

// ---- Clamp a value between min and max ----
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

// ---- Cursor style per corner ----
const CORNER_CURSORS: Record<ResizeCorner, string> = {
  nw: 'cursor-nw-resize',
  ne: 'cursor-ne-resize',
  sw: 'cursor-sw-resize',
  se: 'cursor-se-resize',
}

// ---- Position classes per corner ----
const CORNER_POSITIONS: Record<ResizeCorner, string> = {
  nw: 'top-0 left-0',
  ne: 'top-0 right-0',
  sw: 'bottom-0 left-0',
  se: 'bottom-0 right-0',
}

export default function UIPanel({
  config,
  layout,
  onLayoutChange,
  closable,
  onClose,
  zIndex,
  onPanelFocus,
  children,
}: UIPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [tempPos, setTempPos] = useState<{
    x: number
    y: number
  } | null>(null)
  const [tempRect, setTempRect] = useState<{
    x: number
    y: number
    w: number
    h: number
  } | null>(null)

  // ---- Compute cell size from viewport ----
  const getCellSize = useCallback(() => {
    return {
      w: window.innerWidth / UI_GRID_COLS,
      h: window.innerHeight / UI_GRID_ROWS,
    }
  }, [])

  // ---- Drag handlers ----
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      // ---- Don't drag if clicking resize handle or close button ----
      const target = e.target as HTMLElement
      if (target.dataset.resize || target.dataset.close) return

      e.preventDefault()
      e.stopPropagation()

      const cell = getCellSize()
      const panelX = layout.gridCol * cell.w
      const panelY = layout.gridRow * cell.h

      setIsDragging(true)

      const handleMouseMove = (ev: MouseEvent) => {
        setTempPos({
          x: ev.clientX - (e.clientX - panelX),
          y: ev.clientY - (e.clientY - panelY),
        })
      }

      const handleMouseUp = (ev: MouseEvent) => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        setIsDragging(false)

        const cell = getCellSize()
        const rawX = ev.clientX - (e.clientX - panelX)
        const rawY = ev.clientY - (e.clientY - panelY)

        // ---- Snap to grid or allow free positioning ----
        const col = config.gridLocked
          ? Math.round(rawX / cell.w)
          : rawX / cell.w
        const row = config.gridLocked
          ? Math.round(rawY / cell.h)
          : rawY / cell.h

        const clampedCol = clamp(col, 0, UI_GRID_COLS - layout.gridWidth)
        const clampedRow = clamp(row, 0, UI_GRID_ROWS - layout.gridHeight)

        setTempPos(null)
        onLayoutChange({
          ...layout,
          gridCol: clampedCol,
          gridRow: clampedRow,
        })
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [config.gridLocked, layout, getCellSize, onLayoutChange],
  )

  // ---- Corner resize handler ----
  const handleCornerResize = useCallback(
    (e: React.MouseEvent, corner: ResizeCorner) => {
      if (!config.resizable) return
      e.preventDefault()
      e.stopPropagation()

      setIsResizing(true)

      const cell = getCellSize()
      const startX = e.clientX
      const startY = e.clientY
      // ---- Pixel rect of panel at drag start ----
      const origLeft = layout.gridCol * cell.w
      const origTop = layout.gridRow * cell.h
      const origW = layout.gridWidth * cell.w
      const origH = layout.gridHeight * cell.h

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY

        // ---- Compute new rect depending on which corner is dragged ----
        let newX = origLeft
        let newY = origTop
        let newW = origW
        let newH = origH

        if (corner === 'se') {
          newW = origW + dx
          newH = origH + dy
        } else if (corner === 'sw') {
          newX = origLeft + dx
          newW = origW - dx
          newH = origH + dy
        } else if (corner === 'ne') {
          newW = origW + dx
          newY = origTop + dy
          newH = origH - dy
        } else {
          // ---- nw ----
          newX = origLeft + dx
          newW = origW - dx
          newY = origTop + dy
          newH = origH - dy
        }

        setTempRect({ x: newX, y: newY, w: newW, h: newH })
      }

      const handleMouseUp = (ev: MouseEvent) => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        setIsResizing(false)

        const cell = getCellSize()
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY

        let newX = origLeft
        let newY = origTop
        let newW = origW
        let newH = origH

        if (corner === 'se') {
          newW = origW + dx
          newH = origH + dy
        } else if (corner === 'sw') {
          newX = origLeft + dx
          newW = origW - dx
          newH = origH + dy
        } else if (corner === 'ne') {
          newW = origW + dx
          newY = origTop + dy
          newH = origH - dy
        } else {
          newX = origLeft + dx
          newW = origW - dx
          newY = origTop + dy
          newH = origH - dy
        }

        // ---- Snap to grid units ----
        let snappedCol = Math.round(newX / cell.w)
        let snappedRow = Math.round(newY / cell.h)
        let snappedW = Math.round(newW / cell.w)
        let snappedH = Math.round(newH / cell.h)

        // ---- Enforce min/max size ----
        snappedW = clamp(snappedW, config.minWidth, config.maxWidth)
        snappedH = clamp(snappedH, config.minHeight, config.maxHeight)

        // ---- Adjust position so the opposite edge stays anchored ----
        if (corner === 'nw' || corner === 'sw') {
          snappedCol = layout.gridCol + layout.gridWidth - snappedW
        }
        if (corner === 'nw' || corner === 'ne') {
          snappedRow = layout.gridRow + layout.gridHeight - snappedH
        }

        // ---- Keep within screen bounds ----
        snappedCol = clamp(snappedCol, 0, UI_GRID_COLS - snappedW)
        snappedRow = clamp(snappedRow, 0, UI_GRID_ROWS - snappedH)

        setTempRect(null)
        onLayoutChange({
          gridCol: snappedCol,
          gridRow: snappedRow,
          gridWidth: snappedW,
          gridHeight: snappedH,
        })
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [config, layout, getCellSize, onLayoutChange],
  )

  // ---- Compute position/size styles ----
  const cell = getCellSize()
  let style: React.CSSProperties

  if (isDragging && tempPos) {
    style = {
      left: tempPos.x,
      top: tempPos.y,
      width: layout.gridWidth * cell.w,
      height: layout.gridHeight * cell.h,
    }
  } else if (isResizing && tempRect) {
    style = {
      left: tempRect.x,
      top: tempRect.y,
      width: tempRect.w,
      height: tempRect.h,
    }
  } else {
    style = {
      left: `${(layout.gridCol / UI_GRID_COLS) * 100}%`,
      top: `${(layout.gridRow / UI_GRID_ROWS) * 100}%`,
      width: `${(layout.gridWidth / UI_GRID_COLS) * 100}%`,
      height: `${(layout.gridHeight / UI_GRID_ROWS) * 100}%`,
    }
  }

  const corners: ResizeCorner[] = ['nw', 'ne', 'sw', 'se']

  return (
    <div
      ref={panelRef}
      className="absolute select-none overflow-hidden rounded border border-white/20 bg-black/70 backdrop-blur-sm"
      style={{
        ...style,
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: zIndex ?? 'auto',
      }}
      onMouseDown={(e) => {
        onPanelFocus?.()
        handleMouseDown(e)
      }}
    >
      {/* ---- Close button for secondary panels ---- */}
      {closable && onClose && (
        <button
          data-close="true"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-1 right-1 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded text-xs text-white/60 hover:bg-white/20 hover:text-white"
        >
          ✕
        </button>
      )}

      {children}

      {/* ---- Resize handles on all four corners ---- */}
      {config.resizable &&
        corners.map((corner) => (
          <div
            key={corner}
            data-resize="true"
            className={`absolute h-4 w-4 ${CORNER_POSITIONS[corner]} ${CORNER_CURSORS[corner]}`}
            onMouseDown={(e) => handleCornerResize(e, corner)}
          />
        ))}
    </div>
  )
}
