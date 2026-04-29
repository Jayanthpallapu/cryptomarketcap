import { useState, useEffect } from 'react'
import { getCoins } from '../services/api'
import { formatCurrency, formatPercent, getChangeClass, getChangeArrow } from '../utils/format'
import { Link } from 'react-router-dom'

export default function GainersLosersPage() {
  const [gainers, setGainers] = useState([])
  const [losers, setLosers] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('24h') // 1h, 24h, 7d

  useEffect(() => {
    setLoading(true)
    getCoins(1, 100).then(data => {
      const sorted = [...(data || [])]
      
      const key = timeframe === '1h' ? 'price_change_percentage_1h_in_currency' : 
                  timeframe === '7d' ? 'price_change_percentage_7d_in_currency' : 
                  'price_change_percentage_24h'

      const g = sorted.filter(c => (c[key] || 0) > 0).sort((a, b) => (b[key] || 0) - (a[key] || 0)).slice(0, 50)
      const l = sorted.filter(c => (c[key] || 0) < 0).sort((a, b) => (a[key] || 0) - (b[key] || 0)).slice(0, 50)
      
      setGainers(g)
      setLosers(l)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [timeframe])

  const Table = ({ coins, title, color }) => (
    <div className="crypto-table-wrapper" style={{ flex: 1, minWidth: '300px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: color }}>{title}</h2>
      <table className="crypto-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>#</th>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th>Price</th>
            <th>{timeframe} %</th>
          </tr>
        </thead>
        <tbody>
          {coins.map(coin => {
            const change = timeframe === '1h' ? coin.price_change_percentage_1h_in_currency : 
                           timeframe === '7d' ? coin.price_change_percentage_7d_in_currency : 
                           coin.price_change_percentage_24h
            return (
              <tr key={coin.id} className="fade-in">
                <td className="rank-cell">{coin.market_cap_rank}</td>
                <td>
                  <Link to={`/coin/${coin.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={coin.image} alt={coin.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    <span className="name">{coin.name}</span>
                    <span className="symbol" style={{ fontSize: 11 }}>{coin.symbol?.toUpperCase()}</span>
                  </Link>
                </td>
                <td className="price-cell">{formatCurrency(coin.current_price)}</td>
                <td>
                  <div className={`change-cell ${getChangeClass(change)}`}>
                    <span className="arrow">{getChangeArrow(change)}</span>
                    {formatPercent(change)}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Top Gainers & Losers</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Cryptocurrencies with the largest percentage change in the last {timeframe}.
          </p>
        </div>
        <div className="chart-timeframes">
          {['1h', '24h', '7d'].map(tf => (
            <button 
              key={tf} 
              className={timeframe === tf ? 'active' : ''} 
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>{Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton-row" />)}</div>
          <div style={{ flex: 1 }}>{Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton-row" />)}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Table coins={gainers} title="Top Gainers" color="var(--green)" />
          <Table coins={losers} title="Top Losers" color="var(--red)" />
        </div>
      )}
    </div>
  )
}
