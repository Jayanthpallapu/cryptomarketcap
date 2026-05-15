import { useState, useEffect } from 'react';
import { getCryptoNews } from '../services/api';

function timeAgo(ms) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CATEGORY_COLORS = {
  BTC: '#f7931a',
  ETH: '#627eea',
  Trading: '#16c784',
  Regulation: '#ea3943',
  Mining: '#8b5cf6',
  ICO: '#3861FB',
  DeFi: '#06b6d4',
  NFT: '#ec4899'
};

export default function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    setLoading(true);
    getCryptoNews()
      .then(data => { setNews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Get unique categories from news
  const allCategories = ['All', ...new Set(news.flatMap(n => n.categories))].filter(Boolean);
  const filtered = filter === 'All' ? news : news.filter(n => n.categories.includes(filter));
  const featured = filtered[0];
  const rest = filtered.slice(1, 13);

  return (
    <section id="news-section" style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📰</span>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Crypto News</h2>
            <span style={{
              background: 'rgba(22,199,132,0.15)', color: '#16c784',
              padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              <span style={{ width: 6, height: 6, background: '#16c784', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
              LIVE
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Past 24 hours • Auto-refreshes every 10 min</span>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: '5px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${filter === cat ? CATEGORY_COLORS[cat] || '#3861FB' : 'var(--border)'}`,
              background: filter === cat ? `${CATEGORY_COLORS[cat] || '#3861FB'}20` : 'transparent',
              color: filter === cat ? (CATEGORY_COLORS[cat] || '#3861FB') : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="loading-skeleton" style={{ height: 240, borderRadius: 16 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p>No news available right now. Try again soon.</p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <div
                onClick={() => setSelected(featured)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                  borderRadius: 20, overflow: 'hidden', marginBottom: 20, cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; }}
              >
                {/* Image */}
                <div style={{ position: 'relative', minHeight: 280, background: '#161b22', overflow: 'hidden' }}>
                  {featured.imageUrl ? (
                    <img
                      src={featured.imageUrl} alt={featured.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>📰</div>
                  )}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                    <span style={{ background: '#3861FB', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>FEATURED</span>
                  </div>
                </div>
                {/* Content */}
                <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {featured.categories.map(cat => (
                        <span key={cat} style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: `${CATEGORY_COLORS[cat] || '#3861FB'}20`,
                          color: CATEGORY_COLORS[cat] || '#3861FB'
                        }}>{cat}</span>
                      ))}
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.4, marginBottom: 12, color: 'var(--text-primary)' }}>
                      {featured.title}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                      {featured.body?.slice(0, 200)}...
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {featured.sourceImg && (
                        <img src={featured.sourceImg} alt={featured.source} style={{ width: 20, height: 20, borderRadius: '50%' }} onError={e => { e.target.style.display = 'none'; }} />
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{featured.source}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(featured.publishedAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* News grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {rest.map(article => (
                <div
                  key={article.id}
                  onClick={() => setSelected(article)}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                    borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(56,97,251,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
                >
                  {/* Article image */}
                  <div style={{ height: 160, background: '#161b22', position: 'relative', overflow: 'hidden' }}>
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl} alt={article.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                        onError={e => { e.target.parentNode.style.background = '#1c2333'; e.target.style.display = 'none'; }}
                        onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📰</div>
                    )}
                    {/* Category badge */}
                    {article.categories[0] && (
                      <span style={{
                        position: 'absolute', top: 10, left: 10,
                        padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: CATEGORY_COLORS[article.categories[0]] || '#3861FB',
                        color: '#fff'
                      }}>{article.categories[0]}</span>
                    )}
                  </div>

                  {/* Article content */}
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 8, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.title}
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.body?.slice(0, 120)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {article.sourceImg && (
                          <img src={article.sourceImg} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{article.source}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(article.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, backdropFilter: 'blur(6px)'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 20, maxWidth: 680, width: '100%', maxHeight: '90vh',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)', animation: 'modalFadeIn 0.25s ease'
            }}
          >
            {/* Modal image */}
            {selected.imageUrl && (
              <div style={{ height: 260, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <img src={selected.imageUrl} alt={selected.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.parentNode.style.display = 'none'; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.9) 0%, transparent 60%)' }} />
                <button onClick={() => setSelected(null)} style={{
                  position: 'absolute', top: 14, right: 14, width: 36, height: 36,
                  borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)',
                  color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>×</button>
              </div>
            )}

            {/* Modal content */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {!selected.imageUrl && (
                <button onClick={() => setSelected(null)} style={{
                  float: 'right', border: 'none', background: 'none',
                  color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1
                }}>×</button>
              )}

              {/* Categories */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {selected.categories.map(cat => (
                  <span key={cat} style={{
                    padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: `${CATEGORY_COLORS[cat] || '#3861FB'}20`,
                    color: CATEGORY_COLORS[cat] || '#3861FB'
                  }}>{cat}</span>
                ))}
                {selected.tags.map(tag => (
                  <span key={tag} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>#{tag}</span>
                ))}
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4, marginBottom: 14 }}>{selected.title}</h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
                {selected.sourceImg && (
                  <img src={selected.sourceImg} alt={selected.source} style={{ width: 28, height: 28, borderRadius: '50%' }} onError={e => { e.target.style.display = 'none'; }} />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{selected.source}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(selected.publishedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{timeAgo(selected.publishedAt)}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 20 }}>
                {selected.body}
              </p>

              <a
                href={selected.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: '#3861FB', color: '#fff', textDecoration: 'none',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => { e.target.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.target.style.opacity = '1'; }}
              >
                Read Full Article →
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
