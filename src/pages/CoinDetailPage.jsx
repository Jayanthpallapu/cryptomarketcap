import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCoinDetail, getCoinChart } from '../services/api'
import { formatCurrency, formatPercent, formatNumber, getChangeClass } from '../utils/format'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend
} from 'chart.js'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import 'chartjs-adapter-date-fns'
import { Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
)

const TIMEFRAMES = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'Max', days: 'max' }
]

export default function CoinDetailPage() {
  const { id } = useParams()
  const [coin, setCoin] = useState(null)
  const [chart, setChart] = useState(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const chartRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    getCoinDetail(id)
      .then(data => { setCoin(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    setChartLoading(true)
    getCoinChart(id, days)
      .then(data => { setChart(data); setChartLoading(false) })
      .catch(() => setChartLoading(false))
  }, [id, days])

  if (loading) return (
    <div className="container" style={{ padding: '60px 20px' }}>
      <div className="loading-skeleton" style={{ width: 300, height: 40, marginBottom: 20 }}></div>
      <div className="loading-skeleton" style={{ width: 200, height: 50, marginBottom: 30 }}></div>
      <div className="loading-skeleton" style={{ width: '100%', height: 400, borderRadius: 16 }}></div>
    </div>
  )

  if (!coin) return (
    <div className="container" style={{ padding: 60, textAlign: 'center' }}>
      <h2>Coin not found</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>← Back</Link>
    </div>
  )

  const md = coin.market_data || {}
  const change24 = md.price_change_percentage_24h
  const currentPrice = md.current_price?.usd

  // Build candlestick dataset
  const ohlcData = chart?.ohlc || []
  const isUp = ohlcData.length > 0
    ? ohlcData[ohlcData.length - 1].c >= ohlcData[0].o
    : (change24 >= 0)
  const bullColor = '#16c784'
  const bearColor = '#ea3943'

  const candleDataset = {
    label: coin.name,
    data: ohlcData,
    color: {
      up: bullColor,
      down: bearColor,
      unchanged: '#8b949e'
    },
    borderColor: {
      up: bullColor,
      down: bearColor,
      unchanged: '#8b949e'
    }
  }

  const timeUnit = days === 1 ? 'hour' : days <= 30 ? 'day' : days <= 90 ? 'week' : 'month'

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    layout: { padding: { left: 10, right: 10, top: 10, bottom: 10 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1f2e',
        borderColor: '#30363d',
        borderWidth: 1,
        padding: 12,
        titleColor: '#e6edf3',
        bodyColor: '#8b949e',
        callbacks: {
          label: (ctx) => {
            const d = ctx.raw
            if (!d) return ''
            const fmt = (v) => v < 1 ? `$${v.toFixed(6)}` : `$${v.toFixed(4)}`
            return [
              `Open:  ${fmt(d.o)}`,
              `High:  ${fmt(d.h)}`,
              `Low:   ${fmt(d.l)}`,
              `Close: ${fmt(d.c)}`,
              `Change: ${d.c >= d.o ? '+' : ''}${(((d.c - d.o) / d.o) * 100).toFixed(2)}%`
            ]
          },
          title: (items) => {
            if (!items[0]) return ''
            const date = new Date(items[0].raw.x)
            return date.toLocaleString('en-US', {
              month: 'short', day: 'numeric',
              hour: days <= 7 ? '2-digit' : undefined,
              minute: days <= 7 ? '2-digit' : undefined,
              hour12: false
            })
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: timeUnit, tooltipFormat: 'MMM d, HH:mm' },
        grid: { color: '#21262d', drawBorder: false },
        ticks: { color: '#8b949e', maxTicksLimit: 10, maxRotation: 0 },
        border: { display: false }
      },
      y: {
        position: 'right',
        grid: { color: '#21262d', drawBorder: false },
        ticks: {
          color: '#8b949e',
          callback: (v) => v < 1 ? `$${v.toFixed(5)}` : `$${v.toFixed(2)}`
        },
        border: { display: false }
      }
    }
  }

  const chartData = { datasets: [candleDataset] }

  return (
    <div className="coin-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: 16 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cryptocurrencies</Link>
          <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>/</span>
          <span style={{ fontSize: 14 }}>{coin.name}</span>
        </div>

        {/* Header */}
        <div className="coin-header">
          <img src={coin.image?.large} alt={coin.name} />
          <h1>{coin.name}</h1>
          <span className="symbol-badge">{coin.symbol?.toUpperCase()}</span>
          <span className="rank-badge">Rank #{coin.market_cap_rank}</span>
        </div>

        {/* Price */}
        <div className="coin-price-section">
          <div className="current-price">
            {formatCurrency(currentPrice, currentPrice < 1 ? 6 : 2)}
          </div>
          <span className={`price-change ${getChangeClass(change24)}`}>
            {change24 >= 0 ? '▲' : '▼'} {formatPercent(change24)} (24h)
          </span>
        </div>

        {/* Candlestick Chart */}
        <div className="chart-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {coin.name} / USD
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '3px 10px', borderRadius: 20 }}>
                Candlestick
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, background: bullColor, borderRadius: 2 }}></span>
                <span style={{ color: 'var(--text-muted)' }}>Bullish</span>
                <span style={{ display: 'inline-block', width: 12, height: 12, background: bearColor, borderRadius: 2, marginLeft: 8 }}></span>
                <span style={{ color: 'var(--text-muted)' }}>Bearish</span>
              </span>
            </div>
            <div className="chart-timeframes">
              {TIMEFRAMES.map(tf => (
                <button key={tf.label} className={days === tf.days ? 'active' : ''} onClick={() => setDays(tf.days)}>
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-area" style={{ position: 'relative', minHeight: 380 }}>
            {chartLoading ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="loading-skeleton" style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 12px' }}></div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading chart data...</span>
                </div>
              </div>
            ) : ohlcData.length > 0 ? (
              <Chart
                ref={chartRef}
                type="candlestick"
                data={chartData}
                options={chartOptions}
                style={{ height: 380 }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 380, color: 'var(--text-muted)', fontSize: 14 }}>
                No chart data available for this timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="coin-stats-grid">
          <div>
            <div className="coin-stat-row">
              <span className="label">Market Cap</span>
              <span className="value">{formatCurrency(md.market_cap?.usd)}</span>
            </div>
            <div className="coin-stat-row">
              <span className="label">24h Volume</span>
              <span className="value">{formatCurrency(md.total_volume?.usd)}</span>
            </div>
            <div className="coin-stat-row">
              <span className="label">Fully Diluted Valuation</span>
              <span className="value">{formatCurrency(md.fully_diluted_valuation?.usd)}</span>
            </div>
            <div className="coin-stat-row">
              <span className="label">Vol / Market Cap</span>
              <span className="value">
                {md.market_cap?.usd ? ((md.total_volume?.usd / md.market_cap.usd) * 100).toFixed(2) + '%' : 'N/A'}
              </span>
            </div>
          </div>
          <div>
            <div className="coin-stat-row">
              <span className="label">Circulating Supply</span>
              <span className="value">{formatNumber(md.circulating_supply)} {coin.symbol?.toUpperCase()}</span>
            </div>
            <div className="coin-stat-row">
              <span className="label">Total Supply</span>
              <span className="value">{md.total_supply ? formatNumber(md.total_supply) : '∞'}</span>
            </div>
            <div className="coin-stat-row">
              <span className="label">Max Supply</span>
              <span className="value">{md.max_supply ? formatNumber(md.max_supply) : '∞'}</span>
            </div>
            <div className="coin-stat-row">
              <span className="label">All-Time High</span>
              <span className="value green" style={{ color: 'var(--green)' }}>{formatCurrency(md.ath?.usd)}</span>
            </div>
            <div className="coin-stat-row">
              <span className="label">All-Time Low</span>
              <span className="value red" style={{ color: 'var(--red)' }}>{formatCurrency(md.atl?.usd)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {coin.description?.en && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 24, marginTop: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>About {coin.name}</h2>
            <div
              style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: coin.description.en.split('. ').slice(0, 5).join('. ') + '.' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
