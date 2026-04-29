import { useState, useEffect } from 'react'
import { getGlobalData } from '../services/api'
import { formatCurrency, formatPercent, getChangeClass } from '../utils/format'
import CoinTable from '../components/CoinTable'

export default function HomePage() {
  const [global, setGlobal] = useState(null)

  useEffect(() => {
    getGlobalData().then(setGlobal).catch(console.error)
  }, [])

  const mcapChange = global?.market_cap_change_percentage_24h_usd || 0

  return (
    <div>
      <section className="market-overview">
        <div className="container">
          <h1>Today's Cryptocurrency Prices by Market Cap</h1>
          <p className="subtitle">
            The global crypto market cap is{' '}
            <span className={`highlight ${getChangeClass(mcapChange)}`}>
              {global ? formatCurrency(global.total_market_cap?.usd) : '...'}</span>,
            a <span className={`highlight ${getChangeClass(mcapChange)}`}>
              {mcapChange >= 0 ? '' : '-'}{formatPercent(mcapChange)}
            </span> {mcapChange >= 0 ? 'increase' : 'decrease'} over the last day.
          </p>

          <div className="market-stats-cards">
            <div className="stat-card">
              <div className="card-label">Market Cap</div>
              <div className="card-value">{global ? formatCurrency(global.total_market_cap?.usd) : '...'}</div>
              <div className={`card-change ${getChangeClass(mcapChange)}`}>
                {mcapChange >= 0 ? '▲' : '▼'} {formatPercent(mcapChange)}
              </div>
            </div>
            <div className="stat-card">
              <div className="card-label">24h Volume</div>
              <div className="card-value">{global ? formatCurrency(global.total_volume?.usd) : '...'}</div>
            </div>
            <div className="stat-card">
              <div className="card-label">BTC Dominance</div>
              <div className="card-value">{global?.market_cap_percentage?.btc?.toFixed(1) || '0'}%</div>
            </div>
            <div className="stat-card">
              <div className="card-label">Active Coins</div>
              <div className="card-value">{global?.active_cryptocurrencies?.toLocaleString() || '...'}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <CoinTable />
      </section>
    </div>
  )
}
