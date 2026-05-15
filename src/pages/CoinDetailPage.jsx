import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactApexChart from 'react-apexcharts'
import { getCoinDetail, getCoinChart } from '../services/api'
import { formatCurrency, formatPercent, formatNumber, getChangeClass } from '../utils/format'

const TIMEFRAMES = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'Max', days: 'max' }
]

function buildCandleOptions(coinName, price, isUp) {
  const fmtPrice = (v) => {
    if (!v && v !== 0) return '$0'
    return v < 0.01 ? `$${v.toFixed(8)}` : v < 1 ? `$${v.toFixed(6)}` : `$${v.toFixed(2)}`
  }
  return {
    chart: {
      type: 'candlestick',
      height: 420,
      background: 'transparent',
      foreColor: '#8b949e',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: true,
        tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
        autoSelected: 'zoom'
      },
      zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
      animations: { enabled: false }
    },
    plotOptions: {
      candlestick: {
        colors: { upward: '#16c784', downward: '#ea3943' },
        wick: { useFillColor: true }
      }
    },
    xaxis: {
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#8b949e', fontSize: '11px' }, datetimeUTC: false }
    },
    yaxis: {
      opposite: true,
      labels: { formatter: fmtPrice, style: { colors: '#8b949e', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    grid: { borderColor: '#1c2333', strokeDashArray: 3 },
    tooltip: {
      theme: 'dark',
      custom({ seriesIndex, dataPointIndex, w }) {
        const d = w.globals.initialSeries[seriesIndex]?.data?.[dataPointIndex]
        if (!d) return ''
        const [o, h, l, c] = d.y
        const chg = (((c - o) / o) * 100).toFixed(2)
        const col = c >= o ? '#16c784' : '#ea3943'
        const date = new Date(d.x).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        return `<div style="padding:12px;background:#1a1f2e;border:1px solid #30363d;border-radius:8px;min-width:160px;font-family:Inter,sans-serif">
          <div style="font-size:11px;color:#8b949e;margin-bottom:8px">${date}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px">
            <span style="color:#8b949e">Open</span><span style="color:#e6edf3;text-align:right">${fmtPrice(o)}</span>
            <span style="color:#8b949e">High</span><span style="color:#16c784;text-align:right">${fmtPrice(h)}</span>
            <span style="color:#8b949e">Low</span><span style="color:#ea3943;text-align:right">${fmtPrice(l)}</span>
            <span style="color:#8b949e">Close</span><span style="color:#e6edf3;text-align:right">${fmtPrice(c)}</span>
            <span style="color:#8b949e">Change</span><span style="color:${col};text-align:right">${chg >= 0 ? '+' : ''}${chg}%</span>
          </div>
        </div>`
      }
    },
    noData: { text: 'Loading chart data...', style: { color: '#8b949e', fontSize: '14px' } }
  }
}

function buildLineOptions(isUp) {
  const fmtPrice = (v) => v < 1 ? `$${v.toFixed(6)}` : `$${v.toFixed(2)}`
  const color = isUp ? '#16c784' : '#ea3943'
  return {
    chart: {
      type: 'area',
      height: 420,
      background: 'transparent',
      foreColor: '#8b949e',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: true,
        tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
        autoSelected: 'zoom'
      },
      zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
      animations: { enabled: true, easing: 'easeinout', speed: 600 }
    },
    colors: [color],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100], colorStops: [{ offset: 0, color, opacity: 0.4 }, { offset: 100, color, opacity: 0 }] }
    },
    xaxis: {
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#8b949e', fontSize: '11px' }, datetimeUTC: false }
    },
    yaxis: {
      opposite: true,
      labels: { formatter: fmtPrice, style: { colors: '#8b949e', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    grid: { borderColor: '#1c2333', strokeDashArray: 3 },
    tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy HH:mm' }, y: { formatter: (v) => fmtPrice(v) } },
    dataLabels: { enabled: false },
    noData: { text: 'Loading chart data...', style: { color: '#8b949e', fontSize: '14px' } }
  }
}

function buildVolumeOptions() {
  return {
    chart: {
      type: 'bar',
      height: 120,
      background: 'transparent',
      foreColor: '#8b949e',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false }
    },
    plotOptions: {
      bar: {
        columnWidth: '90%',
        colors: {
          ranges: [
            { from: 0, to: 1e18, color: '#3861FB' }
          ]
        }
      }
    },
    dataLabels: { enabled: false },
    xaxis: { type: 'datetime', labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    grid: { show: false },
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM yyyy HH:mm' },
      y: { formatter: (v) => `$${(v / 1e6).toFixed(2)}M` }
    }
  }
}

export default function CoinDetailPage() {
  const { id } = useParams()
  const [coin, setCoin] = useState(null)
  const [chart, setChart] = useState(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [chartType, setChartType] = useState('candle')

  useEffect(() => {
    setLoading(true)
    getCoinDetail(id)
      .then(data => { setCoin(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    setChartLoading(true)
    setChart(null)
    getCoinChart(id, days)
      .then(data => { setChart(data); setChartLoading(false) })
      .catch(() => setChartLoading(false))
  }, [id, days])

  if (loading) return (
    <div className="container" style={{ padding: '60px 20px' }}>
      <div className="loading-skeleton" style={{ width: 300, height: 40, marginBottom: 20 }}></div>
      <div className="loading-skeleton" style={{ width: 200, height: 50, marginBottom: 30 }}></div>
      <div className="loading-skeleton" style={{ width: '100%', height: 500, borderRadius: 16 }}></div>
    </div>
  )

  if (!coin) return (
    <div className="container" style={{ padding: 60, textAlign: 'center' }}>
      <h2>Coin not found</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>← Back</Link>
    </div>
  )

  const md = coin.market_data || {}
  const change24 = md.price_change_percentage_24h || 0
  const change1h = md.price_change_percentage_1h_in_currency?.usd || coin.price_change_percentage_1h_in_currency || 0
  const change7d = md.price_change_percentage_7d || coin.price_change_percentage_7d_in_currency || 0
  const currentPrice = md.current_price?.usd || coin.current_price || 0
  const isUp = change24 >= 0

  // Fix OHLC format — ensure x is a number and y is [o,h,l,c]
  const rawOhlc = chart?.ohlc || []
  const ohlcData = rawOhlc
    .filter(d => d && d.x && d.y && d.y.length === 4)
    .map(d => ({ x: new Date(d.x).getTime(), y: d.y.map(v => parseFloat(v) || 0) }))
    .filter(d => d.y.every(v => v > 0))

  const priceLineData = (chart?.prices || [])
    .filter(p => p && p.length === 2)
    .map(p => ({ x: new Date(p[0]).getTime(), y: parseFloat(p[1]) || 0 }))
    .filter(d => d.y > 0)

  const volumeData = (chart?.volumes || [])
    .filter(v => v && v.length === 2)
    .map(v => ({ x: new Date(v[0]).getTime(), y: parseFloat(v[1]) || 0 }))

  const candleOptions = buildCandleOptions(coin.name, currentPrice, isUp)
  const lineOptions = buildLineOptions(isUp)
  const volOptions = buildVolumeOptions()

  const mainSeries = [{
    name: coin.name,
    data: chartType === 'candle' ? ohlcData : priceLineData
  }]

  const volSeries = [{ name: 'Volume', data: volumeData }]

  const fmtPrice = (v) => {
    if (!v && v !== 0) return '$0'
    return v < 0.01 ? `$${v.toFixed(8)}` : v < 1 ? `$${v.toFixed(6)}` : `$${v.toFixed(2)}`
  }

  return (
    <div className="coin-detail" style={{ paddingBottom: 60 }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Cryptocurrencies</Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{coin.name}</span>
        </div>

        {/* ── Hero Section ─────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1a1f2e 100%)',
          border: '1px solid var(--border-light)',
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 200, height: 200,
            background: isUp ? 'rgba(22,199,132,0.08)' : 'rgba(234,57,67,0.08)',
            borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              {/* Coin identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <img
                  src={coin.image?.large || coin.image?.small}
                  alt={coin.name}
                  style={{ width: 52, height: 52, borderRadius: '50%', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{coin.name}</h1>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                      {coin.symbol?.toUpperCase()}
                    </span>
                    {coin.market_cap_rank && (
                      <span style={{ background: 'rgba(56,97,251,0.15)', color: '#3861FB', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                        Rank #{coin.market_cap_rank}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
                {fmtPrice(currentPrice)}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { label: '1h', val: change1h },
                  { label: '24h', val: change24 },
                  { label: '7d', val: change7d }
                ].map(({ label, val }) => (
                  <span key={label} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: val >= 0 ? 'rgba(22,199,132,0.12)' : 'rgba(234,57,67,0.12)',
                    color: val >= 0 ? '#16c784' : '#ea3943'
                  }}>
                    {val >= 0 ? '▲' : '▼'} {Math.abs(val).toFixed(2)}% ({label})
                  </span>
                ))}
              </div>
            </div>

            {/* Key stats on the right */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', minWidth: 260 }}>
              {[
                { label: 'Market Cap', val: formatCurrency(md.market_cap?.usd || coin.market_cap) },
                { label: '24h Volume', val: formatCurrency(md.total_volume?.usd || coin.total_volume) },
                { label: 'Circ. Supply', val: `${formatNumber(md.circulating_supply || coin.circulating_supply)} ${coin.symbol?.toUpperCase()}` },
                { label: 'Max Supply', val: md.max_supply || coin.max_supply ? formatNumber(md.max_supply || coin.max_supply) : '∞' }
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chart Section ─────────────────────────────── */}
        <div style={{
          background: '#0d1117',
          border: '1px solid var(--border-light)',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 24
        }}>
          {/* Chart header */}
          <div style={{
            padding: '20px 24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {coin.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ USD</span>
              </span>
              {/* Chart type toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 8, padding: 2, border: '1px solid var(--border)' }}>
                {['candle', 'line'].map(type => (
                  <button key={type} onClick={() => setChartType(type)} style={{
                    padding: '5px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: chartType === type ? '#3861FB' : 'transparent',
                    color: chartType === type ? '#fff' : 'var(--text-muted)'
                  }}>
                    {type === 'candle' ? '🕯 Candle' : '📈 Line'}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe buttons */}
            <div style={{ display: 'flex', gap: 4 }}>
              {TIMEFRAMES.map(tf => (
                <button key={tf.label} onClick={() => setDays(tf.days)} style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: days === tf.days ? 'rgba(56,97,251,0.15)' : 'transparent',
                  color: days === tf.days ? '#3861FB' : 'var(--text-muted)',
                  borderColor: days === tf.days ? 'rgba(56,97,251,0.4)' : 'transparent'
                }}>
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ padding: '10px 24px', display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            {chartType === 'candle' && (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, background: '#16c784', borderRadius: 2, display: 'inline-block' }}></span> Bullish
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, background: '#ea3943', borderRadius: 2, display: 'inline-block' }}></span> Bearish
                </span>
              </>
            )}
            <span style={{ marginLeft: 'auto', color: isUp ? '#16c784' : '#ea3943', fontWeight: 600 }}>
              {isUp ? '▲' : '▼'} {Math.abs(change24).toFixed(2)}% (24h)
            </span>
          </div>

          {/* Chart body */}
          <div style={{ padding: '0 8px' }}>
            {chartLoading ? (
              <div style={{ height: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading chart data...</span>
              </div>
            ) : (
              <ReactApexChart
                key={`${chartType}-${days}-${id}`}
                options={chartType === 'candle' ? candleOptions : lineOptions}
                series={mainSeries}
                type={chartType === 'candle' ? 'candlestick' : 'area'}
                height={420}
              />
            )}
          </div>

          {/* Volume chart */}
          {volumeData.length > 0 && !chartLoading && (
            <div style={{ padding: '0 8px', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Volume
              </div>
              <ReactApexChart
                key={`vol-${days}-${id}`}
                options={volOptions}
                series={volSeries}
                type="bar"
                height={100}
              />
            </div>
          )}
        </div>

        {/* ── Stats Grid ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Left column */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Market Stats</h3>
            {[
              { label: 'Market Cap', val: formatCurrency(md.market_cap?.usd || coin.market_cap) },
              { label: '24h Volume', val: formatCurrency(md.total_volume?.usd || coin.total_volume) },
              { label: 'Fully Diluted Val.', val: formatCurrency(md.fully_diluted_valuation?.usd) },
              { label: 'Vol / Market Cap', val: md.market_cap?.usd ? ((md.total_volume?.usd / md.market_cap.usd) * 100).toFixed(2) + '%' : 'N/A' }
            ].map(({ label, val }) => (
              <div key={label} className="coin-stat-row">
                <span className="label">{label}</span>
                <span className="value">{val}</span>
              </div>
            ))}
          </div>

          {/* Right column */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Supply Info</h3>
            {[
              { label: 'Circulating Supply', val: `${formatNumber(md.circulating_supply || coin.circulating_supply)} ${coin.symbol?.toUpperCase()}` },
              { label: 'Total Supply', val: md.total_supply ? formatNumber(md.total_supply) : '∞' },
              { label: 'Max Supply', val: md.max_supply || coin.max_supply ? formatNumber(md.max_supply || coin.max_supply) : '∞' },
              { label: 'All-Time High', val: <span style={{ color: '#16c784' }}>{formatCurrency(md.ath?.usd)}</span> },
              { label: 'All-Time Low', val: <span style={{ color: '#ea3943' }}>{formatCurrency(md.atl?.usd)}</span> }
            ].map(({ label, val }) => (
              <div key={label} className="coin-stat-row">
                <span className="label">{label}</span>
                <span className="value">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {coin.description?.en && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>About {coin.name}</h2>
            <div
              style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: coin.description.en.split('. ').slice(0, 5).join('. ') + '.' }}
            />
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
