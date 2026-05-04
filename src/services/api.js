// CoinGecko Free Public API - No API key required
const BASE = 'https://api.coingecko.com/api/v3';

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

// Cache everything for 1 hour to stay within free API limits
const ONE_HOUR = 60 * 60 * 1000;

const CACHE_TTL = {
  global: ONE_HOUR,
  coins: 5 * 60 * 1000,
  trending: 5 * 60 * 1000,
  coinDetail: ONE_HOUR,
  chart: ONE_HOUR,
  search: 5 * 60 * 1000,
  exchanges: ONE_HOUR,
};

// ─── Fetch with Retry ───────────────────────────────────────────────
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (res.status === 429) {
        console.warn(`Rate limit hit (attempt ${i + 1}/${retries}), waiting...`);
        await delay(5000 * (i + 1));
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
// ─── API Functions ──────────────────────────────────────────────────
const CUSTOM_COINS = [
  {
    id: 'musk-meme',
    symbol: 'muskmeme',
    name: 'Musk meme',
    image: '/musk-meme.png',
    current_price: 0.005374,
    market_cap: 15200450,
    market_cap_rank: 1,
    total_volume: 8450000,
    get price_change_percentage_1h_in_currency() {
      return Math.random() * 0.2;
    },
    price_change_percentage_24h: 100,
    price_change_percentage_7d_in_currency: 100,
    circulating_supply: 2828000000,
    max_supply: 10000000000,
    sparkline_in_7d: {
      price: [0.0048, 0.0049, 0.0051, 0.0050, 0.0052, 0.0053, 0.005374]
    }
  }
];

export async function getGlobalData() {
  return cachedFetch('global', CACHE_TTL.global, async () => {
    const data = await fetchWithRetry(`${BASE}/global`);
    return data.data;
  });
}

export async function getCoins(page = 1, perPage = 100, order = 'market_cap_desc') {
  const key = `coins_${page}_${perPage}_${order}`;
  return cachedFetch(key, CACHE_TTL.coins, async () => {
    const data = await fetchWithRetry(
      `${BASE}/coins/markets?vs_currency=usd&order=${order}&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`
    );
    
    // Inject custom coins if on the first page
    if (page === 1 && Array.isArray(data)) {
      return [...CUSTOM_COINS, ...data];
    }
    
    return data;
  });
}

export async function getTrending() {
  return cachedFetch('trending', CACHE_TTL.trending, async () => {
    const data = await fetchWithRetry(`${BASE}/search/trending`);
    const coins = data.coins || [];
    
    // Format custom coins for trending structure
    const customTrending = CUSTOM_COINS.map(coin => ({
      item: {
        id: coin.id,
        coin_id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        market_cap_rank: coin.market_cap_rank,
        thumb: coin.image,
        small: coin.image,
        large: coin.image,
        slug: coin.id,
        price_btc: 0.0000001, // dummy
        score: 0,
        data: {
          price: coin.current_price,
          price_change_percentage_24h: { usd: coin.price_change_percentage_24h },
          market_cap: `$${coin.market_cap.toLocaleString()}`,
          total_volume: `$${coin.total_volume.toLocaleString()}`,
          sparkline: coin.image
        }
      }
    }));

    return [...customTrending, ...coins];
  });
}

export async function getCoinDetail(id) {
  const custom = CUSTOM_COINS.find(c => c.id === id);
  if (custom) {
    const coin = { ...custom }; // Capture values once
    return {
      ...coin,
      description: { en: 'Musk meme is a community-driven token inspired by the visionary Elon Musk.' },
      market_data: {
        current_price: { usd: coin.current_price },
        market_cap: { usd: coin.market_cap },
        total_volume: { usd: coin.total_volume },
        price_change_percentage_1h_in_currency: { usd: coin.price_change_percentage_1h_in_currency },
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
        circulating_supply: coin.circulating_supply,
        max_supply: coin.max_supply,
        sparkline_7d: coin.sparkline_in_7d
      }
    };
  }

  return cachedFetch(`coin_${id}`, CACHE_TTL.coinDetail, () =>
    fetchWithRetry(
      `${BASE}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`
    )
  );
}

export async function getCoinChart(id, days = 7) {
  const custom = CUSTOM_COINS.find(c => c.id === id);
  if (custom) {
    // Return dummy chart data
    const prices = [];
    const now = Date.now();
    for (let i = 0; i < 100; i++) {
      prices.push([now - (100 - i) * 3600000, custom.current_price * (0.9 + Math.random() * 0.2)]);
    }
    return { prices };
  }

  return cachedFetch(`chart_${id}_${days}`, CACHE_TTL.chart, () =>
    fetchWithRetry(
      `${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    )
  );
}

export async function searchCoins(query) {
  const normalizedQuery = query.toLowerCase();
  const customMatch = CUSTOM_COINS.filter(c => 
    c.name.toLowerCase().includes(normalizedQuery) || 
    c.symbol.toLowerCase().includes(normalizedQuery)
  ).map(c => ({
    id: c.id,
    name: c.name,
    api_symbol: c.symbol,
    symbol: c.symbol,
    market_cap_rank: c.market_cap_rank,
    thumb: c.image,
    large: c.image
  }));

  return cachedFetch(`search_${query}`, CACHE_TTL.search, async () => {
    const data = await fetchWithRetry(`${BASE}/search?query=${encodeURIComponent(query)}`);
    const coins = data.coins || [];
    return [...customMatch, ...coins];
  });
}

export async function getExchanges(page = 1, perPage = 100) {
  return cachedFetch(`exchanges_${page}_${perPage}`, CACHE_TTL.exchanges, () =>
    fetchWithRetry(`${BASE}/exchanges?per_page=${perPage}&page=${page}`)
  );
}
