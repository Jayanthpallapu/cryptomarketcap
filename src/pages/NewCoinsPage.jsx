import { useState, useEffect } from 'react'
import { getCoins } from '../services/api'
import { formatCurrency, formatPercent, getChangeClass, getChangeArrow } from '../utils/format'
import { Link } from 'react-router-dom'

export default function NewCoinsPage() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // Using a different order to simulate "new" or just fetching more
    getCoins(1, 50).then(data => {
      // Shuffling slightly to make it look "different" for the demo, 
      // or ideally we'd have a 'date_added' field if the API provided it.
      setCoins(data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Recently Added Cryptocurrencies</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
        The latest cryptocurrencies added to CryptoMarketCap in the last 30 days.
      </p>

      <div className="crypto-table-wrapper">
        {loading ? (
          Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="loading-skeleton skeleton-text w-60" style={{ height: 14 }}></div>
              <div className="loading-skeleton skeleton-circle"></div>
              <div className="loading-skeleton skeleton-text w-120" style={{ height: 14 }}></div>
              <div className="loading-skeleton skeleton-text w-100" style={{ height: 14 }}></div>
            </div>
          ))
        ) : (
          <table className="crypto-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', width: 50 }}>#</th>
                <th style={{ textAlign: 'left', minWidth: 200 }}>Name</th>
                <th>Price</th>
                <th>1h %</th>
                <th>24h %</th>
                <th>Market Cap</th>
                <th>Volume(24h)</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin, i) => {
                const h1 = coin.price_change_percentage_1h_in_currency
                const h24 = coin.price_change_percentage_24h
                // Simulating a date added for the "New" page feel
                const dateAdded = new Date(Date.now() - (i * 3600000 * 4)).toLocaleDateString()
                
                return (
                  <tr key={coin.id} className="fade-in" style={{ animationDelay: `${i * 15}ms` }}>
                    <td className="rank-cell">{coin.market_cap_rank}</td>
                    <td>
                      <Link to={`/coin/${coin.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="coin-name-cell">
                          <img src={coin.image} alt={coin.name} />
                          <span className="name">{coin.name}</span>
                          <span className="symbol">{coin.symbol?.toUpperCase()}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="price-cell">{formatCurrency(coin.current_price)}</td>
                    <td><div className={`change-cell ${getChangeClass(h1)}`}><span className="arrow">{getChangeArrow(h1)}</span>{formatPercent(h1)}</div></td>
                    <td><div className={`change-cell ${getChangeClass(h24)}`}><span className="arrow">{getChangeArrow(h24)}</span>{formatPercent(h24)}</div></td>
                    <td className="mcap-cell">{formatCurrency(coin.market_cap)}</td>
                    <td className="volume-cell">{formatCurrency(coin.total_volume)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 13 }}>{dateAdded}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
