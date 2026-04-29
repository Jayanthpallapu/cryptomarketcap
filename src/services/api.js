// Using a relative path for both Dev and Production.
// In Dev: Vite handles the proxy (vite.config.js)
// In Production: Vercel handles the proxy (vercel.json)
const BASE = '/api/coingecko';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ─── In-Memory Cache ────────────────────────────────────────────────
// Prevents redundant API calls when navigating between pages.
// Each cache entry expires after its TTL (time-to-live).
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

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  global: 2 * 60 * 1000,       // 2 minutes
  coins: 3 * 60 * 1000,        // 3 minutes
  trending: 5 * 60 * 1000,     // 5 minutes
  coinDetail: 2 * 60 * 1000,   // 2 minutes
  chart: 3 * 60 * 1000,        // 3 minutes
  search: 60 * 1000,           // 1 minute
  exchanges: 5 * 60 * 1000,    // 5 minutes
};

// ─── Fetch with Retry ───────────────────────────────────────────────
async function fetchWithRetry(url, retries = 3) {
  const apiKey = import.meta.env.VITE_CG_API_KEY;
  const headers = { 'Accept': 'application/json' };

  // CoinGecko Demo API uses x-cg-demo-api-key header
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers });

      // Handle Rate Limiting
      if (res.status === 429) {
        console.warn('Rate limit hit, retrying...');
        await delay(3000 * (i + 1));
        continue;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await delay(1500 * (i + 1));
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
