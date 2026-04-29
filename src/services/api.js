// All API calls go through /api/coingecko
// In Development: Vite dev server proxy (vite.config.js)
// In Production: Vercel Serverless Function (api/coingecko/[...path].js)
const BASE = '/api/coingecko';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ─── In-Memory Cache ────────────────────────────────────────────────
const cache = new Map();

function getCached(key, ttlMs) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttlMs) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

const CACHE_TTL = {
  global: 3 * 60 * 1000,
  coins: 3 * 60 * 1000,
  trending: 5 * 60 * 1000,
  coinDetail: 3 * 60 * 1000,
  chart: 5 * 60 * 1000,
  search: 2 * 60 * 1000,
  exchanges: 5 * 60 * 1000,
};

// ─── Fetch with Retry ───────────────────────────────────────────────
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (res.status === 429) {
        console.warn(`Rate limit hit (attempt ${i + 1}), waiting...`);
        await delay(3000 * (i + 1));
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await delay(2000 * (i + 1));
    }
  }
  throw new Error('Failed to fetch after multiple retries');
}

// ─── Cached fetch wrapper ───────────────────────────────────────────
async function cachedFetch(cacheKey, ttl, fetchFn) {
  const cached = getCached(cacheKey, ttl);
  if (cached) return cached;

  const data = await fetchFn();
  setCache(cacheKey, data);
  return data;
}

// ─── API Functions ──────────────────────────────────────────────────
export async function getGlobalData() {
  return cachedFetch('global', CACHE_TTL.global, async () => {
    const data = await fetchWithRetry(`${BASE}/global`);
    return data.data;
  });
}

export async function getCoins(page = 1, perPage = 100, order = 'market_cap_desc') {
  const key = `coins_${page}_${perPage}_${order}`;
  return cachedFetch(key, CACHE_TTL.coins, () =>
    fetchWithRetry(
      `${BASE}/coins/markets?vs_currency=usd&order=${order}&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`
    )
  );
}

export async function getTrending() {
  return cachedFetch('trending', CACHE_TTL.trending, async () => {
    const data = await fetchWithRetry(`${BASE}/search/trending`);
    return data.coins || [];
  });
}

export async function getCoinDetail(id) {
  return cachedFetch(`coin_${id}`, CACHE_TTL.coinDetail, () =>
    fetchWithRetry(
      `${BASE}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`
    )
  );
}

export async function getCoinChart(id, days = 7) {
  return cachedFetch(`chart_${id}_${days}`, CACHE_TTL.chart, () =>
    fetchWithRetry(
      `${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    )
  );
}

export async function searchCoins(query) {
  return cachedFetch(`search_${query}`, CACHE_TTL.search, async () => {
    const data = await fetchWithRetry(`${BASE}/search?query=${encodeURIComponent(query)}`);
    return data.coins || [];
  });
}

export async function getExchanges(page = 1, perPage = 100) {
  return cachedFetch(`exchanges_${page}_${perPage}`, CACHE_TTL.exchanges, () =>
    fetchWithRetry(`${BASE}/exchanges?per_page=${perPage}&page=${page}`)
  );
}
