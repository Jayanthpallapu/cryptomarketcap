import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCoins } from '../services/api'
import { formatCurrency, formatPercent, getChangeClass, getChangeArrow, formatSupply } from '../utils/format'
import Sparkline from '../components/Sparkline'

export default function WatchlistPage() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]') } catch { return [] }
  })

  useEffect(() => {
    if (favorites.length === 0) { setLoading(false); return }
    getCoins(1, 250).then(data => {
      const filtered = (data || []).filter(c => favorites.includes(c.id))
      setCoins(filtered)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [favorites])

  const removeFav = (id) => {
    const updated = favorites.filter(f => f !== id)
    setFavorites(updated)
    localStorage.setItem('favorites', JSON.stringify(updated))
  }

  return (
    <div className="container" style={{paddingTop:30,paddingBottom:40}}>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:8}}>⭐ My Watchlist</h1>
      <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:24}}>
        Track your favorite coins. Click the star on any coin to add it here.
      </p>

      {favorites.length === 0 ? (
        <div style={{textAlign:'center',padding:60}}>
          <div style={{fontSize:48,marginBottom:16}}>⭐</div>
          <h2 style={{marginBottom:8}}>Your watchlist is empty</h2>
          <p style={{color:'var(--text-muted)',marginBottom:20}}>Start adding coins by clicking the star icon on the homepage.</p>
          <Link to="/" className="btn btn-primary">Browse Coins</Link>
        </div>
      ) : loading ? (
        <div>{Array.from({length:5}).map((_,i)=>(
          <div key={i} className="skeleton-row">
            <div className="loading-skeleton skeleton-text w-60" style={{height:14}}></div>
            <div className="loading-skeleton skeleton-circle"></div>
            <div className="loading-skeleton skeleton-text w-100" style={{height:14}}></div>
          </div>
        ))}</div>
      ) : (
        <div className="crypto-table-wrapper">
          <table className="crypto-table">
            <thead>
              <tr>
                <th style={{width:30}}></th>
                <th style={{textAlign:'left'}}>#</th>
                <th style={{textAlign:'left',minWidth:200}}>Name</th>
                <th>Price</th>
                <th>24h %</th>
                <th>7d %</th>
                <th>Market Cap</th>
                <th>Volume(24h)</th>
                <th>Last 7 Days</th>
              </tr>
            </thead>
            <tbody>
              {coins.map(coin => {
                const h24 = coin.price_change_percentage_24h
                const d7 = coin.price_change_percentage_7d_in_currency
                const sparkData = coin.sparkline_in_7d?.price || []
                const sparkColor = d7 >= 0 ? '#16c784' : '#ea3943'
                return (
                  <tr key={coin.id} className="fade-in">
                    <td className="star-cell favorited" onClick={() => removeFav(coin.id)}>★</td>
                    <td className="rank-cell">{coin.market_cap_rank}</td>
                    <td><Link to={`/coin/${coin.id}`} style={{display:'flex',alignItems:'center',gap:12}}>
                      <div className="coin-name-cell">
                        <img src={coin.image} alt={coin.name} />
                        <span className="name">{coin.name}</span>
                        <span className="symbol">{coin.symbol?.toUpperCase()}</span>
                      </div>
                    </Link></td>
                    <td className="price-cell">{formatCurrency(coin.current_price)}</td>
                    <td><div className={`change-cell ${getChangeClass(h24)}`}><span className="arrow">{getChangeArrow(h24)}</span>{formatPercent(h24)}</div></td>
                    <td><div className={`change-cell ${getChangeClass(d7)}`}><span className="arrow">{getChangeArrow(d7)}</span>{formatPercent(d7)}</div></td>
                    <td className="mcap-cell">{formatCurrency(coin.market_cap)}</td>
                    <td className="volume-cell">{formatCurrency(coin.total_volume)}</td>
                    <td className="sparkline-cell"><Sparkline data={sparkData} color={sparkColor}/></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
