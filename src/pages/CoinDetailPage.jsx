import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCoinDetail, getCoinChart } from '../services/api'
import { formatCurrency, formatPercent, formatNumber, getChangeClass } from '../utils/format'

const TIMEFRAMES = [
  { label: '24h', days: 1 }, { label: '7d', days: 7 }, { label: '30d', days: 30 },
  { label: '90d', days: 90 }, { label: '1y', days: 365 }, { label: 'Max', days: 'max' }
]

export default function CoinDetailPage() {
  const { id } = useParams()
  const [coin, setCoin] = useState(null)
  const [chart, setChart] = useState(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    getCoinDetail(id).then(data => { setCoin(data); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    getCoinChart(id, days).then(setChart).catch(console.error)
  }, [id, days])

  useEffect(() => {
    if (!chart || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const prices = chart.prices || []
    if (prices.length === 0) return

    const w = rect.width, h = rect.height
    const vals = prices.map(p => p[1])
    const min = Math.min(...vals), max = Math.max(...vals)
    const range = max - min || 1
    const pad = 20
    const stepX = (w - pad) / (vals.length - 1)

    ctx.clearRect(0, 0, w, h)

    // Line
    const isUp = vals[vals.length - 1] >= vals[0]
    const lineColor = isUp ? '#16c784' : '#ea3943'

    ctx.beginPath()
    vals.forEach((v, i) => {
      const x = i * stepX
      const y = pad + ((max - v) / range) * (h - pad * 2)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Fill gradient
    const lastX = (vals.length - 1) * stepX
    ctx.lineTo(lastX, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, lineColor + '30')
    grad.addColorStop(1, lineColor + '05')
    ctx.fillStyle = grad
    ctx.fill()
  }, [chart])

  if (loading) return (
    <div className="container" style={{padding:'60px 20px'}}>
      <div className="loading-skeleton" style={{width:300,height:40,marginBottom:20}}></div>
      <div className="loading-skeleton" style={{width:200,height:50,marginBottom:30}}></div>
      <div className="loading-skeleton" style={{width:'100%',height:350,borderRadius:16}}></div>
    </div>
  )

  if (!coin) return <div className="container" style={{padding:60,textAlign:'center'}}><h2>Coin not found</h2><Link to="/" className="btn btn-primary" style={{marginTop:20}}>← Back</Link></div>

  const md = coin.market_data || {}
  const change24 = md.price_change_percentage_24h

  return (
    <div className="coin-detail">
      <div className="container">
        <div style={{marginBottom:16}}>
          <Link to="/" style={{color:'var(--text-muted)',fontSize:14}}>Cryptocurrencies</Link>
          <span style={{color:'var(--text-muted)',margin:'0 8px'}}>/</span>
          <span style={{fontSize:14}}>{coin.name}</span>
        </div>

        <div className="coin-header">
          <img src={coin.image?.large} alt={coin.name} />
          <h1>{coin.name}</h1>
          <span className="symbol-badge">{coin.symbol?.toUpperCase()}</span>
          <span className="rank-badge">Rank #{coin.market_cap_rank}</span>
        </div>

        <div className="coin-price-section">
          <div className="current-price">{formatCurrency(md.current_price?.usd, md.current_price?.usd < 1 ? 6 : 2)}</div>
          <span className={`price-change ${getChangeClass(change24)}`}>
            {change24 >= 0 ? '▲' : '▼'} {formatPercent(change24)} (24h)
          </span>
        </div>

        <div className="chart-container">
          <div className="chart-timeframes">
            {TIMEFRAMES.map(tf => (
              <button key={tf.label} className={days === tf.days ? 'active' : ''} onClick={() => setDays(tf.days)}>
                {tf.label}
              </button>
            ))}
          </div>
          <div className="chart-area">
            <canvas ref={canvasRef} style={{width:'100%',height:'100%'}} />
          </div>
        </div>

        <div className="coin-stats-grid">
          <div>
            <div className="coin-stat-row"><span className="label">Market Cap</span><span className="value">{formatCurrency(md.market_cap?.usd)}</span></div>
            <div className="coin-stat-row"><span className="label">24h Volume</span><span className="value">{formatCurrency(md.total_volume?.usd)}</span></div>
            <div className="coin-stat-row"><span className="label">Fully Diluted Valuation</span><span className="value">{formatCurrency(md.fully_diluted_valuation?.usd)}</span></div>
            <div className="coin-stat-row"><span className="label">Vol/Market Cap</span><span className="value">{md.market_cap?.usd ? ((md.total_volume?.usd / md.market_cap.usd) * 100).toFixed(2) + '%' : 'N/A'}</span></div>
          </div>
          <div>
            <div className="coin-stat-row"><span className="label">Circulating Supply</span><span className="value">{formatNumber(md.circulating_supply)} {coin.symbol?.toUpperCase()}</span></div>
            <div className="coin-stat-row"><span className="label">Total Supply</span><span className="value">{md.total_supply ? formatNumber(md.total_supply) : '∞'}</span></div>
            <div className="coin-stat-row"><span className="label">Max Supply</span><span className="value">{md.max_supply ? formatNumber(md.max_supply) : '∞'}</span></div>
            <div className="coin-stat-row"><span className="label">All-Time High</span><span className="value">{formatCurrency(md.ath?.usd)}</span></div>
            <div className="coin-stat-row"><span className="label">All-Time Low</span><span className="value">{formatCurrency(md.atl?.usd)}</span></div>
          </div>
        </div>

        {coin.description?.en && (
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-light)',borderRadius:16,padding:24}}>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:12}}>About {coin.name}</h2>
            <div style={{fontSize:14,color:'var(--text-secondary)',lineHeight:1.8}} dangerouslySetInnerHTML={{__html: coin.description.en.split('. ').slice(0,5).join('. ')+'.'}} />
          </div>
        )}
      </div>
    </div>
  )
}
