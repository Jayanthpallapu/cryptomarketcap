import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { searchCoins } from '../services/api'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const debounceRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setShowResults(false); setQuery('') }, [location])

  const handleSearch = (val) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setResults([]); setShowResults(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const coins = await searchCoins(val)
        setResults(coins.slice(0, 8))
        setShowResults(true)
      } catch(e) { console.error(e) }
    }, 300)
  }

  const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item'

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-logo">
          <svg viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#3861FB"/>
                <stop offset="100%" stopColor="#17C3B2"/>
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="16" fill="url(#logoGrad)"/>
            <text x="16" y="22" fontFamily="Inter" fontSize="18" fontWeight="800" fill="white" textAnchor="middle">C</text>
          </svg>
          <span className="logo-text">CryptoMarketCap</span>
        </Link>

        <div className="navbar-nav">
          <div className={isActive('/')}>
            <Link to="/">Cryptocurrencies</Link>
            <div className="nav-dropdown">
              <Link to="/">Ranking</Link>
              <Link to="/trending">Trending</Link>
              <Link to="/gainers-losers">Gainers & Losers</Link>
              <Link to="/new">Recently Added</Link>
            </div>
          </div>
          <div className={isActive('/exchanges')}>
            <Link to="/exchanges">Exchanges</Link>
          </div>
          <div className={isActive('/trending')}>
            <Link to="/trending">Trending</Link>
          </div>
          <div className="nav-item" onClick={() => {
            const el = document.getElementById('news-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              navigate('/');
              setTimeout(() => {
                document.getElementById('news-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }}>
            News
          </div>
          <div className="nav-item">
            Learn
            <div className="nav-dropdown">
              <a href="#" onClick={e=>e.preventDefault()}>Academy</a>
              <a href="#" onClick={e=>e.preventDefault()}>Glossary</a>
              <a href="#" onClick={e=>e.preventDefault()}>Research</a>
            </div>
          </div>
        </div>

        <div className="search-box" ref={searchRef}>
          <span className="search-icon">🔍</span>
          <input
            id="search-input"
            type="text"
            placeholder="Search coin, token, or exchange..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
          />
          {showResults && results.length > 0 && (
            <div className="search-results-dropdown fade-in">
              {results.map(coin => (
                <div
                  key={coin.id}
                  className="search-result-item"
                  onClick={() => navigate(`/coin/${coin.id}`)}
                >
                  <img src={coin.thumb} alt={coin.name} />
                  <div className="coin-info">
                    <div className="coin-name">{coin.name}</div>
                    <div className="coin-symbol">{coin.symbol}</div>
                  </div>
                  {coin.market_cap_rank && <span className="coin-rank">#{coin.market_cap_rank}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="navbar-actions">
          <Link to="/watchlist" className="btn btn-ghost">★ Watchlist</Link>
        </div>
      </div>
    </nav>
  )
}
