import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTrending } from '../services/api'
import { formatCurrency, formatPercent, getChangeClass } from '../utils/format'

export default function TrendingPage() {
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrending().then(data => { setTrending(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="container" style={{paddingTop:30,paddingBottom:40}}>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:8}}>🔥 Trending Cryptocurrencies</h1>
      <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:24}}>
        Discover the most searched and trending coins in the last 24 hours.
      </p>

      {loading ? (
        <div className="trending-grid">
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className="trending-card">
              <div className="loading-skeleton" style={{width:'100%',height:80,borderRadius:12}}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="trending-grid">
          {trending.map((item, i) => {
            const coin = item.item
            const price = coin.data?.price || 0
            const change = coin.data?.price_change_percentage_24h?.usd || 0
            return (
              <Link to={`/coin/${coin.id}`} key={coin.id}>
                <div className="trending-card fade-in" style={{animationDelay:`${i*50}ms`}}>
                  <div className="card-header">
                    <img src={coin.thumb} alt={coin.name} />
                    <div className="info">
                      <h3>{coin.name}</h3>
                      <span>{coin.symbol} · #{coin.market_cap_rank || coin.score + 1}</span>
                    </div>
                    <span style={{marginLeft:'auto',fontSize:16,fontWeight:700}}>#{i + 1}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div className="card-price">
                      {typeof price === 'string' ? price : formatCurrency(price, price < 0.01 ? 8 : 2)}
                    </div>
                    <div className={`card-change ${getChangeClass(change)}`}>
                      {change >= 0 ? '▲' : '▼'} {formatPercent(change)}
                    </div>
                  </div>
                  {coin.data?.sparkline && (
                    <img src={coin.data.sparkline} alt="sparkline" style={{width:'100%',height:50,marginTop:8,opacity:0.7}} />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
