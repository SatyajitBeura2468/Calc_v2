import { useEffect, useRef } from 'react'
import { graphValue } from '../lib/calculator'
import type { AngleMode } from '../types'

interface GraphCanvasProps {
  expression: string
  angleMode: AngleMode
  accent: string
  large?: boolean
}

export function GraphCanvas({ expression, angleMode, accent, large = false }: GraphCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(rect.width * ratio)
    canvas.height = Math.round(rect.height * ratio)
    const context = canvas.getContext('2d')
    if (!context) return
    context.scale(ratio, ratio)

    const width = rect.width
    const height = rect.height
    const centerX = width / 2
    const centerY = height / 2
    const xScale = width / (Math.PI * 4)
    const yScale = large ? 44 : 34

    context.clearRect(0, 0, width, height)
    context.strokeStyle = 'rgba(180, 168, 146, .13)'
    context.lineWidth = 1
    for (let x = 0; x <= width; x += width / 8) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke()
    }
    for (let y = 0; y <= height; y += height / 6) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke()
    }
    context.strokeStyle = 'rgba(225, 210, 180, .46)'
    context.beginPath(); context.moveTo(0, centerY); context.lineTo(width, centerY); context.stroke()
    context.beginPath(); context.moveTo(centerX, 0); context.lineTo(centerX, height); context.stroke()

    context.strokeStyle = accent
    context.lineWidth = 2.25
    context.shadowColor = accent
    context.shadowBlur = 8
    context.beginPath()
    let drawing = false
    for (let px = 0; px <= width; px += 1.5) {
      const x = (px - centerX) / xScale
      const value = graphValue(expression || 'sin(x)', x, angleMode)
      const py = centerY - value * yScale
      const valid = Number.isFinite(py) && py > -height * 2 && py < height * 3
      if (!valid) {
        drawing = false
      } else if (!drawing) {
        context.moveTo(px, py)
        drawing = true
      } else {
        context.lineTo(px, py)
      }
    }
    context.stroke()
    context.shadowBlur = 0
  }, [expression, angleMode, accent, large])

  return <canvas ref={ref} className={large ? 'graph-canvas large' : 'graph-canvas'} aria-label={`Graph of ${expression}`} />
}
