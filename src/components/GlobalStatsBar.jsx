import { useState, useEffect } from 'react'
import { getGlobalData } from '../services/api'
import { formatCurrency, formatNumber, formatPercent } from '../utils/format'

export default function GlobalStatsBar() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getGlobalData().then(setData).catch(console.error)
    const interval = setInterval(() => {
      getGlobalData().then(setData).catch(console.error)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return (
    <div className="global-stats-bar">
      <div className="container">
        <div className="loading-skeleton skeleton-text w-120" style={{height:12}}></div>
      </div>
    </div>
  )

  const mcapChange = data.market_cap_change_percentage_24h_usd
  const fearIndex = 40 // Simulated
  const fearLabel = fearIndex <= 25 ? 'Extreme Fear' : fearIndex <= 45 ? 'Fear' : fearIndex <= 55 ? 'Neutral' : fearIndex <= 75 ? 'Greed' : 'Extreme Greed'
  const fearClass = fearIndex <= 45 ? 'fear' : fearIndex <= 55 ? 'neutral' : 'greed'

  return (
    <div className="global-stats-bar">
      <div className="container">
        <div className="stat-item">
          <span className="stat-label">Cryptos:</span>
          <span className="stat-value">{formatNumber(data.active_cryptocurrencies)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Exchanges:</span>
          <span className="stat-value">{data.markets}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Market Cap:</span>
          <span className="stat-value">{formatCurrency(data.total_market_cap?.usd)}</span>
          <span className={`stat-value ${mcapChange >= 0 ? 'green' : 'red'}`}>
            {mcapChange >= 0 ? '▲' : '▼'}{formatPercent(mcapChange)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">24h Vol:</span>
          <span className="stat-value">{formatCurrency(data.total_volume?.usd)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Dominance:</span>
          <span className="stat-value">
            BTC: {data.market_cap_percentage?.btc?.toFixed(1)}%
            {' '}ETH: {data.market_cap_percentage?.eth?.toFixed(1)}%
          </span>
        </div>
        <div className="stat-item">
          <span className={`fear-greed-badge ${fearClass}`}>
            😨 {fearIndex}/100 {fearLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
