import React, { useState } from 'react';

const newsData = [
  {
    id: 1,
    title: "OSRO Coin Database Hacked: Quantum Fake Price Hiking Detected",
    excerpt: "OSRO Coin Database has been hacked in the quantum fake price hiking with the fake money please ignore the price and the actual price is now reflecting. Hackers deployed an unprecedented quantum-computing exploit to inject artificial liquidity into the system, temporarily skyrocketing displayed values across major trackers. The core database has now been fortified, the illicit quantum nodes isolated, and actual market prices are correctly reflecting on all dashboards.",
    date: "Just now",
    source: "CryptoMarketCap Security Alert",
    featured: true,
    gradient: "linear-gradient(135deg, #1a0505 0%, #4a0f0f 100%)"
  },
  {
    id: 2,
    title: "Global Crypto Adoption Accelerates in Emerging Markets",
    excerpt: "New reports show a 45% increase in cryptocurrency adoption across South America and Southeast Asia, driven by inflation concerns and mobile payment infrastructure improvements.",
    date: "2 hours ago",
    source: "Global Finance",
    featured: false,
    gradient: "linear-gradient(135deg, #0b1a30 0%, #173b6c 100%)"
  },
  {
    id: 3,
    title: "Institutional Giants Prepare Major Bitcoin ETF Inflows",
    excerpt: "Top-tier asset managers are signaling a fresh wave of allocations toward Spot Bitcoin ETFs, as regulatory clarity improves and client demand reaches new all-time highs.",
    date: "5 hours ago",
    source: "MarketWatch Crypto",
    featured: false,
    gradient: "linear-gradient(135deg, #1f1205 0%, #4a2f0f 100%)"
  },
  {
    id: 4,
    title: "Ethereum Foundation Unveils New Scaling Roadmap",
    excerpt: "The latest developer call highlighted massive improvements coming to Layer-2 networks, targeting sub-cent transaction fees and significantly higher throughput for the Ethereum ecosystem.",
    date: "8 hours ago",
    source: "ETH Daily News",
    featured: false,
    gradient: "linear-gradient(135deg, #0f051a 0%, #2f0f4a 100%)"
  }
];

export default function NewsSection() {
  const [selectedNews, setSelectedNews] = useState(null);

  return (
    <section id="news-section" className="news-section container">
      <div className="news-section-header">
        <h2>
          <svg className="fire-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path>
          </svg>
          Latest Crypto News
        </h2>
      </div>
      
      <div className="news-grid">
        {newsData.map(news => (
          <div key={news.id} className={`news-card ${news.featured ? 'featured' : ''}`} onClick={() => setSelectedNews(news)}>
            <div 
              className="news-image" 
              style={{ background: news.gradient }}
            >
              <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            </div>
            
            <div className="news-content">
              <div className="news-date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {news.date}
              </div>
              <h3 className="news-title">{news.title}</h3>
              <p className="news-excerpt">{news.excerpt}</p>
              <div className="news-footer">
                <span className="news-source">{news.source}</span>
                <span className="news-read-more" onClick={(e) => { e.stopPropagation(); setSelectedNews(news); }}>Read Full Story →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedNews && (
        <div className="news-modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="news-modal" onClick={e => e.stopPropagation()}>
            <button className="news-modal-close" onClick={() => setSelectedNews(null)}>×</button>
            <div className="news-modal-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {selectedNews.date}
            </div>
            <h2 className="news-modal-title" style={{ color: selectedNews.featured ? 'var(--red)' : 'var(--text-primary)' }}>
              {selectedNews.title}
            </h2>
            <div className="news-modal-content">
              {selectedNews.excerpt}
              <br/><br/>
              <em>This is a full story preview based on the excerpt. In a real environment, the complete article body would be fetched from the database or API.</em>
            </div>
            <div className="news-modal-source">Source: {selectedNews.source}</div>
          </div>
        </div>
      )}
    </section>
  );
}
