import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCoins } from '../services/api'
import { formatCurrency, formatNumber, formatPercent, getChangeClass, getChangeArrow, formatSupply } from '../utils/format'
import Sparkline from './Sparkline'

const TABS = [
  { id: 'all', label: '🏆 Top' },
  { id: 'trending', label: '🔥 Trending' },
  { id: 'watchlist', label: '⭐ Watchlist' },
  { id: 'gainers', label: '📈 Gainers' },
  { id: 'losers', label: '📉 Losers' },
  { id: 'new', label: '🆕 New', badge: true }
]

export default function CoinTable() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage] = useState(100)
  const [activeTab, setActiveTab] = useState('all')
  const [sortKey, setSortKey] = useState('market_cap_rank')
  const [sortDir, setSortDir] = useState('asc')
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]') } catch { return [] }
  })

  useEffect(() => {
    const fetchData = (isBackground = false) => {
      if (!isBackground) {
        setLoading(true)
      }
      setError(null)
      getCoins(page, perPage)
        .then(data => { 
          if (data && Array.isArray(data) && data.length > 0) {
            setCoins(data)
            setError(null)
          } else if (!isBackground && coins.length === 0) {
            setError('No data available. Please try again later.')
          }
          setLoading(false) 
        })
        .catch((err) => {
          console.error(err)
          if (!isBackground && coins.length === 0) {
            setError(err.message || 'An error occurred while fetching data.')
          }
          setLoading(false)
        })
    }

    fetchData(false)
    const interval = setInterval(() => fetchData(true), 300000) // Background refresh every 5 minutes
    return () => clearInterval(interval)
  }, [page, perPage])

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites])

  const toggleFav = (e, id) => {
    e.preventDefault(); e.stopPropagation()
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'market_cap_rank' ? 'asc' : 'desc') }
  }

  let displayCoins = [...coins]

  // Tab filters
  if (activeTab === 'watchlist') displayCoins = displayCoins.filter(c => favorites.includes(c.id))
  else if (activeTab === 'gainers') displayCoins = displayCoins.filter(c => (c.price_change_percentage_24h || 0) > 0).sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
  else if (activeTab === 'losers') displayCoins = displayCoins.filter(c => (c.price_change_percentage_24h || 0) < 0).sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
  else if (activeTab === 'trending') displayCoins = displayCoins.sort((a, b) => (b.price_change_percentage_24h_in_currency || b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h_in_currency || a.price_change_percentage_24h || 0)).slice(0, 20)

  // Sorting
  if (activeTab === 'all') {
    displayCoins.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (va == null) va = 0; if (vb == null) vb = 0
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
  }

  const SortIcon = ({ col }) => (
    <span className="sort-icon">{sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  )

  return (
    <div>
      <div className="table-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.badge && <span className="new-badge">NEW</span>}
          </button>
        ))}
      </div>

      <div className="table-controls">
        <div className="filter-group">
          <button className="filter-btn active">All Cryptocurrencies</button>
          <button className="filter-btn">Coins</button>
          <button className="filter-btn">Tokens</button>
        </div>
        <div className="filter-group">
          <span style={{fontSize:13,color:'var(--text-muted)'}}>Show rows:</span>
          <select className="rows-select" defaultValue="100">
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="crypto-table-wrapper">
        {error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ marginBottom: 12 }}>Unable to load data</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              {error.includes('429') ? 'Rate limit exceeded. CoinGecko allows limited calls on the free plan. Please wait a minute and try again.' : error}
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry Now</button>
          </div>
        ) : loading ? (
          <div>{Array.from({length:20}).map((_,i) => (
            <div key={i} className="skeleton-row">
              <div className="loading-skeleton skeleton-text w-60" style={{height:14}}></div>
              <div className="loading-skeleton skeleton-circle"></div>
              <div className="loading-skeleton skeleton-text w-100" style={{height:14}}></div>
              <div className="loading-skeleton skeleton-text w-80" style={{height:14}}></div>
              <div className="loading-skeleton skeleton-text w-60" style={{height:14}}></div>
              <div className="loading-skeleton skeleton-text w-60" style={{height:14}}></div>
              <div className="loading-skeleton skeleton-text w-80" style={{height:14}}></div>
              <div className="loading-skeleton skeleton-text w-100" style={{height:14}}></div>
              <div className="loading-skeleton skeleton-text w-120" style={{height:14}}></div>
            </div>
          ))}</div>
        ) : (
          <table className="crypto-table">
            <thead>
              <tr>
                <th style={{width:30}}></th>
                <th onClick={() => handleSort('market_cap_rank')} className={sortKey==='market_cap_rank'?'sorted':''}>
                  # <SortIcon col="market_cap_rank"/>
                </th>
                <th onClick={() => handleSort('name')} className={sortKey==='name'?'sorted':''} style={{minWidth:200}}>
                  Name <SortIcon col="name"/>
                </th>
                <th onClick={() => handleSort('current_price')} className={sortKey==='current_price'?'sorted':''}>
                  Price <SortIcon col="current_price"/>
                </th>
                <th onClick={() => handleSort('price_change_percentage_1h_in_currency')} className={sortKey==='price_change_percentage_1h_in_currency'?'sorted':''}>
                  1h % <SortIcon col="price_change_percentage_1h_in_currency"/>
                </th>
                <th onClick={() => handleSort('price_change_percentage_24h')} className={sortKey==='price_change_percentage_24h'?'sorted':''}>
                  24h % <SortIcon col="price_change_percentage_24h"/>
                </th>
                <th onClick={() => handleSort('price_change_percentage_7d_in_currency')} className={sortKey==='price_change_percentage_7d_in_currency'?'sorted':''}>
                  7d % <SortIcon col="price_change_percentage_7d_in_currency"/>
                </th>
                <th onClick={() => handleSort('market_cap')} className={sortKey==='market_cap'?'sorted':''}>
                  Market Cap <SortIcon col="market_cap"/>
                </th>
                <th onClick={() => handleSort('total_volume')} className={sortKey==='total_volume'?'sorted':''}>
                  Volume(24h) <SortIcon col="total_volume"/>
                </th>
                <th>Circulating Supply</th>
                <th style={{textAlign:'right'}}>Last 7 Days</th>
              </tr>
            </thead>
            <tbody>
              {displayCoins.map((coin, index) => {
                const h1 = coin.price_change_percentage_1h_in_currency
                const h24 = coin.price_change_percentage_24h
                const d7 = coin.price_change_percentage_7d_in_currency
                const sparkData = coin.sparkline_in_7d?.price || []
                const sparkColor = d7 >= 0 ? '#16c784' : '#ea3943'
                const supplyPercent = coin.max_supply ? ((coin.circulating_supply / coin.max_supply) * 100) : null

                return (
                  <tr key={coin.id}>
                    <td className={`star-cell ${favorites.includes(coin.id) ? 'favorited' : ''}`} onClick={e => toggleFav(e, coin.id)}>
                      {favorites.includes(coin.id) ? '★' : '☆'}
                    </td>
                    <td className="rank-cell">{activeTab === 'all' ? (page - 1) * perPage + index + 1 : index + 1}</td>
                    <td>
                      <Link to={`/coin/${coin.id}`} style={{display:'flex',alignItems:'center',gap:12}}>
                        <div className="coin-name-cell">
                          <img src={coin.image} alt={coin.name} loading="lazy" />
                          <span className="name">{coin.name}</span>
                          <span className="symbol">{coin.symbol?.toUpperCase()}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="price-cell">{formatCurrency(coin.current_price)}</td>
                    <td><div className={`change-cell ${getChangeClass(h1)}`}><span className="arrow">{getChangeArrow(h1)}</span>{formatPercent(h1)}</div></td>
                    <td><div className={`change-cell ${getChangeClass(h24)}`}><span className="arrow">{getChangeArrow(h24)}</span>{formatPercent(h24)}</div></td>
                    <td><div className={`change-cell ${getChangeClass(d7)}`}><span className="arrow">{getChangeArrow(d7)}</span>{formatPercent(d7)}</div></td>
                    <td className="mcap-cell">{formatCurrency(coin.market_cap)}</td>
                    <td className="volume-cell">{formatCurrency(coin.total_volume)}</td>
                    <td>
                      <div className="supply-cell">
                        <span>{formatSupply(coin.circulating_supply, coin.symbol)}</span>
                        {supplyPercent != null && (
                          <div className="supply-bar">
                            <div className="supply-bar-fill" style={{width: `${Math.min(supplyPercent, 100)}%`}}></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="sparkline-cell">
                      <Sparkline data={sparkData} color={sparkColor} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {activeTab === 'all' && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
          {[1,2,3,4,5].map(p => (
            <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
          ))}
          <span style={{color:'var(--text-muted)',padding:'0 4px'}}>...</span>
          <button onClick={() => setPage(50)}>50</button>
          <button disabled={page >= 50} onClick={() => setPage(p => p + 1)}>Next ›</button>
        </div>
      )}
    </div>
  )
}
