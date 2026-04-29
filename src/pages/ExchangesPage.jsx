import { useState, useEffect } from 'react'
import { getExchanges } from '../services/api'
import { formatCurrency, formatNumber } from '../utils/format'

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExchanges(1, 50).then(data => { setExchanges(data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="container" style={{paddingTop:30,paddingBottom:40}}>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:8}}>Top Crypto Exchanges Ranked by Trust Score</h1>
      <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:24}}>
        CryptoMarketCap ranks and scores exchanges based on traffic, liquidity, trading volumes, and confidence in the legitimacy of reported trading volumes.
      </p>

      <div className="crypto-table-wrapper">
        {loading ? (
          Array.from({length:15}).map((_,i) => (
            <div key={i} className="skeleton-row">
              <div className="loading-skeleton skeleton-text w-60" style={{height:14}}></div>
              <div className="loading-skeleton skeleton-circle"></div>
              <div className="loading-skeleton skeleton-text w-120" style={{height:14}}></div>
              <div className="loading-skeleton skeleton-text w-100" style={{height:14}}></div>
            </div>
          ))
        ) : (
          <table className="crypto-table exchanges-table">
            <thead>
              <tr>
                <th style={{textAlign:'left',width:50}}>#</th>
                <th style={{textAlign:'left',minWidth:200}}>Exchange</th>
                <th>Trust Score</th>
                <th>24h Volume (Normalized)</th>
                <th>24h Volume</th>
                <th>Year Established</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {exchanges.map((ex, i) => (
                <tr key={ex.id} className="fade-in" style={{animationDelay:`${i*15}ms`}}>
                  <td className="rank-cell">{i + 1}</td>
                  <td>
                    <div className="coin-name-cell">
                      <img src={ex.image} alt={ex.name} style={{width:28,height:28,borderRadius:6}} />
                      <span className="name">{ex.name}</span>
                    </div>
                  </td>
                  <td style={{textAlign:'right'}}>
                    <div className="trust-score">
                      <span className={`trust-dot ${ex.trust_score >= 8 ? 'high' : ex.trust_score >= 5 ? 'medium' : 'low'}`}></span>
                      {ex.trust_score}/10
                    </div>
                  </td>
                  <td style={{textAlign:'right'}}>{formatCurrency(ex.trade_volume_24h_btc_normalized * 60000)}</td>
                  <td style={{textAlign:'right'}}>{formatCurrency(ex.trade_volume_24h_btc * 60000)}</td>
                  <td style={{textAlign:'right'}}>{ex.year_established || 'N/A'}</td>
                  <td style={{textAlign:'right'}}>{ex.country || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
