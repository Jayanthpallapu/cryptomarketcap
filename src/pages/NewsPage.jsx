import { useState, useEffect, useMemo } from 'react'
import { getCryptoNews } from '../services/api'

function timeAgo(ms) {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const CATEGORY_COLORS = {
  BTC: '#f7931a', ETH: '#627eea', Trading: '#16c784',
  Regulation: '#ea3943', Mining: '#8b5cf6', ICO: '#3861FB',
  DeFi: '#06b6d4', NFT: '#ec4899', Altcoin: '#f59e0b'
}

const TIME_FILTERS = [
  { label: '24h', ms: 86400000 },
  { label: '7 days', ms: 7 * 86400000 },
  { label: '30 days', ms: 30 * 86400000 },
  { label: '3 months', ms: 90 * 86400000 },
  { label: 'All', ms: Infinity }
]

const PAGE_SIZE = 12

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [catFilter, setCatFilter] = useState('All')
  const [timeFilter, setTimeFilter] = useState('3 months')
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(1)
  const [view, setView] = useState('grid') // 'grid' | 'list'

  useEffect(() => {
    setLoading(true)
    getCryptoNews()
      .then(data => { setNews(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const allCategories = useMemo(() =>
    ['All', ...new Set(news.flatMap(n => n.categories))].filter(Boolean),
    [news]
  )

  const filtered = useMemo(() => {
    const cutoff = Date.now() - (TIME_FILTERS.find(t => t.label === timeFilter)?.ms || Infinity)
    return news.filter(a => {
      const matchTime = a.publishedAt >= cutoff
      const matchCat = catFilter === 'All' || a.categories.includes(catFilter)
      const matchSearch = !searchQ || a.title.toLowerCase().includes(searchQ.toLowerCase()) || a.source.toLowerCase().includes(searchQ.toLowerCase())
      return matchTime && matchCat && matchSearch
    })
  }, [news, catFilter, timeFilter, searchQ])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilter = (setter) => (val) => { setter(val); setPage(1) }

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="container">
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Crypto News</h1>
            <span style={{
              background: 'rgba(22,199,132,0.15)', color: '#16c784',
              padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5
            }}>
              <span style={{ width: 7, height: 7, background: '#16c784', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              LIVE
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>
              {filtered.length} articles
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Stay updated with the latest crypto market news from top sources worldwide.
          </p>
        </div>

        {/* Controls bar */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-light)',
          borderRadius: 16, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              placeholder="Search news..."
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setPage(1) }}
              style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 12px 8px 36px', fontSize: 13,
                color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Time filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TIME_FILTERS.map(tf => (
              <button key={tf.label} onClick={() => handleFilter(setTimeFilter)(tf.label)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${timeFilter === tf.label ? '#3861FB' : 'var(--border)'}`,
                background: timeFilter === tf.label ? 'rgba(56,97,251,0.12)' : 'transparent',
                color: timeFilter === tf.label ? '#3861FB' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}>
                {tf.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', padding: 2 }}>
            {[['grid', '⊞'], ['list', '☰']].map(([v, icon]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                background: view === v ? '#3861FB' : 'transparent',
                color: view === v ? '#fff' : 'var(--text-muted)'
              }}>{icon}</button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {allCategories.map(cat => (
            <button key={cat} onClick={() => handleFilter(setCatFilter)(cat)} style={{
              padding: '5px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${catFilter === cat ? (CATEGORY_COLORS[cat] || '#3861FB') : 'var(--border)'}`,
              background: catFilter === cat ? `${CATEGORY_COLORS[cat] || '#3861FB'}18` : 'transparent',
              color: catFilter === cat ? (CATEGORY_COLORS[cat] || '#3861FB') : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="loading-skeleton" style={{ height: 260, borderRadius: 16 }} />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h3 style={{ marginBottom: 8 }}>No articles found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {paginated.map(article => (
              <ArticleCard key={article.id} article={article} onClick={() => setSelected(article)} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paginated.map(article => (
              <ArticleRow key={article.id} article={article} onClick={() => setSelected(article)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 36 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13 }}
            >‹ Prev</button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const p = page <= 4 ? i + 1 : page + i - 3
              if (p < 1 || p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: 36, height: 36, borderRadius: 8, border: `1px solid ${page === p ? '#3861FB' : 'var(--border)'}`,
                  background: page === p ? '#3861FB' : 'var(--bg-card)',
                  color: page === p ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600
                }}>{p}</button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13 }}
            >Next ›</button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Page {page} of {totalPages}</span>
          </div>
        )}
      </div>

      {/* Article modal */}
      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function ArticleCard({ article, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(56,97,251,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-light)' }}
    >
      <div style={{ height: 168, background: '#161b22', overflow: 'hidden', position: 'relative' }}>
        {article.imageUrl
          ? <img src={article.imageUrl} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>📰</div>
        }
        {article.categories[0] && (
          <span style={{
            position: 'absolute', top: 10, left: 10, padding: '3px 10px', borderRadius: 20,
            fontSize: 10, fontWeight: 700, background: CATEGORY_COLORS[article.categories[0]] || '#3861FB', color: '#fff'
          }}>{article.categories[0]}</span>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h4>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.body?.slice(0, 120)}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {article.sourceImg && <img src={article.sourceImg} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} onError={e => { e.target.style.display = 'none' }} />}
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{article.source}</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </div>
  )
}

function ArticleRow({ article, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', gap: 16, background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,97,251,0.4)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'var(--bg-card)' }}
    >
      <div style={{ width: 120, height: 90, flexShrink: 0, background: '#161b22', overflow: 'hidden' }}>
        {article.imageUrl
          ? <img src={article.imageUrl} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📰</div>
        }
      </div>
      <div style={{ padding: '12px 16px 12px 0', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {article.categories.slice(0, 2).map(cat => (
            <span key={cat} style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${CATEGORY_COLORS[cat] || '#3861FB'}18`, color: CATEGORY_COLORS[cat] || '#3861FB' }}>{cat}</span>
          ))}
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          {article.sourceImg && <img src={article.sourceImg} alt="" style={{ width: 14, height: 14, borderRadius: '50%' }} onError={e => { e.target.style.display = 'none' }} />}
          <span>{article.source}</span>
          <span>•</span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </div>
  )
}

function ArticleModal({ article, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, maxWidth: 700, width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', animation: 'modalFadeIn 0.25s ease' }}>
        {article.imageUrl && (
          <div style={{ height: 260, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            <img src={article.imageUrl} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.parentNode.style.display = 'none' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.9) 0%, transparent 60%)' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        )}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {!article.imageUrl && <button onClick={onClose} style={{ float: 'right', border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>×</button>}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {article.categories.map(cat => <span key={cat} style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${CATEGORY_COLORS[cat] || '#3861FB'}18`, color: CATEGORY_COLORS[cat] || '#3861FB' }}>{cat}</span>)}
            {article.tags.map(tag => <span key={tag} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>#{tag}</span>)}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4, marginBottom: 16 }}>{article.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
            {article.sourceImg && <img src={article.sourceImg} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} onError={e => { e.target.style.display = 'none' }} />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{article.source}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(article.publishedAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 20 }}>{article.body}</p>
          <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: '#3861FB', color: '#fff', textDecoration: 'none' }}>
            Read Full Article →
          </a>
        </div>
      </div>
    </div>
  )
}
