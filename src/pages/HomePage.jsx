import { useState, useEffect } from 'react'
import { getGlobalData, getCoins, getTrending } from '../services/api'
import { formatCurrency, formatPercent, getChangeClass } from '../utils/format'
import CoinTable from '../components/CoinTable'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const [global, setGlobal] = useState(null)
  const [trending, setTrending] = useState([])
  const [gainers, setGainers] = useState([])
  const [newCoins, setNewCoins] = useState([])

  useEffect(() => {
    getGlobalData().then(setGlobal).catch(console.error)
    getTrending().then(data => setTrending(data.slice(0, 3))).catch(console.error)
    getCoins(1, 100).then(data => {
      if (!Array.isArray(data)) return
      const g = [...data].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)).slice(0, 3)
      setGainers(g)
      setNewCoins(data.slice(0, 3))
    }).catch(console.error)
  }, [])

  const mcapChange = global?.market_cap_change_percentage_24h_usd || 0

  const MiniCard = ({ title, link, type }) => {
    const data = type === 'trending' ? trending : type === 'gainers' ? gainers : newCoins
    return (
      <div className="stat-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <Link to={link} style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 600 }}>More ›</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.length === 0 ? [1,2,3].map(i => <div key={i} className="loading-skeleton" style={{ height: 20, borderRadius: 4 }} />) : 
           data.map((item, i) => {
            const coin = type === 'trending' ? item.item : item
            const change = type === 'trending' ? coin.data?.price_change_percentage_24h?.usd : coin.price_change_percentage_24h
            return (
              <Link key={coin.id} to={`/coin/${coin.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 10 }}>{i + 1}</span>
                <img src={coin.thumb || coin.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{coin.name}</span>
                <span className={getChangeClass(change)} style={{ fontSize: 12, fontWeight: 600 }}>
                  {change >= 0 ? '▲' : '▼'}{formatPercent(change)}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 30 }}>
             <MiniCard title="🔥 Trending" link="/trending" type="trending" />
             <MiniCard title="📈 Top Gainers" link="/gainers-losers" type="gainers" />
             <MiniCard title="🆕 Recently Added" link="/new" type="new" />
          </div>
        </div>
      </section>

      <section className="container">
        <CoinTable />
      </section>
    </div>
  )
}
