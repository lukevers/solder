// src/components/WaveformDisplay.tsx
import { useEffect, useRef } from 'react'

type Props = {
  inputBuffer:  Float32Array | null
  outputBuffer: Float32Array | null
  height?: number
}

export function WaveformDisplay({ inputBuffer, outputBuffer, height = 60 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, w, h)

    function drawBuffer(buf: Float32Array, color: string) {
      if (!ctx) return
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      for (let i = 0; i < buf.length; i++) {
        const x = (i / buf.length) * w
        const y = h / 2 - (buf[i] * h) / 2.5
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    if (inputBuffer)  drawBuffer(inputBuffer,  '#3b82f680')
    if (outputBuffer) drawBuffer(outputBuffer, '#22c55e')
  }, [inputBuffer, outputBuffer])

  return (
    <canvas
      ref={canvasRef}
      width={176}
      height={height}
      className="rounded border border-gray-800 w-full"
    />
  )
}
