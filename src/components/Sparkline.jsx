import { useEffect, useRef } from 'react'

export default function Sparkline({ data, color = '#16c784', width = 140, height = 40 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.clearRect(0, 0, width, height)

    const points = data.length > 48 ? data.filter((_, i) => i % Math.ceil(data.length / 48) === 0) : data
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const stepX = width / (points.length - 1)
    const padding = 4

    ctx.beginPath()
    points.forEach((val, i) => {
      const x = i * stepX
      const y = padding + ((max - val) / range) * (height - padding * 2)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Gradient fill
    const lastX = (points.length - 1) * stepX
    ctx.lineTo(lastX, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color + '30')
    gradient.addColorStop(1, color + '00')
    ctx.fillStyle = gradient
    ctx.fill()
  }, [data, color, width, height])

  return <canvas ref={canvasRef} />
}
