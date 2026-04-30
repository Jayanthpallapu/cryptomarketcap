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
    
    // Inject custom coins as requested
    const customCoins = [
      {
        id: 'baby-elonx',
        symbol: 'elonx',
        name: 'Baby ElonX',
        image: '/coins/baby_elonx.png',
        current_price: 0.0009672,
        market_cap: 967200000,
        market_cap_rank: 1,
        price_change_percentage_24h: 93400,
        price_change_percentage_1h_in_currency: 93400,
        price_change_percentage_7d_in_currency: 93400,
        total_volume: 200000000,
        circulating_supply: 1000000000,
        max_supply: 1000000000,
        sparkline_in_7d: { price: Array.from({length: 100}, () => Math.random() * 20 + 15) }
      },
      {
        id: 'starlink-2',
        symbol: 'starl',
        name: 'Starlink',
        image: 'https://coin-images.coingecko.com/coins/images/22049/large/starlink.png',
        current_price: 0.5986,
        market_cap: 598600000,
        market_cap_rank: 2,
        price_change_percentage_24h: 526000,
        price_change_percentage_1h_in_currency: 212,
        price_change_percentage_7d_in_currency: 526000,
        total_volume: 50000000,
        circulating_supply: 1000000000,
        max_supply: 1000000000,
        sparkline_in_7d: { price: Array.from({length: 100}, () => Math.random() * 10 + 5) }
      },
      {
        id: 'tesla-x',
        symbol: 'teslax',
        name: 'Tesla X',
        image: '/coins/tesla_x.png',
        current_price: 0.007526,
        market_cap: 752600000,
        market_cap_rank: 3,
        price_change_percentage_24h: 66000,
        price_change_percentage_1h_in_currency: 66000,
        price_change_percentage_7d_in_currency: 66000,
        total_volume: 150000000,
        circulating_supply: 1000000000,
        max_supply: 1000000000,
        sparkline_in_7d: { price: Array.from({length: 100}, () => Math.random() * 15 + 10) }
      },
      {
        id: 'space-x-meme',
        symbol: 'spacex',
        name: 'Space X meme',
        image: '/coins/spacex_meme.png',
        current_price: 0.005521,
        market_cap: 552100000,
        market_cap_rank: 4,
        price_change_percentage_24h: 52800,
        price_change_percentage_1h_in_currency: 52800,
        price_change_percentage_7d_in_currency: 52800,
        total_volume: 120000000,
        circulating_supply: 1000000000,
        max_supply: 1000000000,
        sparkline_in_7d: { price: Array.from({length: 100}, () => Math.random() * 12 + 8) }
      }
    ];
    
    return [...customCoins, ...data];
  });
}

export async function getTrending() {
  return cachedFetch('trending', CACHE_TTL.trending, async () => {
    const data = await fetchWithRetry(`${BASE}/search/trending`);
    const coins = data.coins || [];
    
    const customTrending = [
      {
        item: {
          id: 'baby-elonx',
          name: 'Baby ElonX',
          symbol: 'ELONX',
          market_cap_rank: 1,
          thumb: '/coins/baby_elonx.png',
          large: '/coins/baby_elonx.png',
          data: {
            price_change_percentage_24h: { usd: 93400 },
            price: '$0.0009672'
          }
        }
      },
      {
        item: {
          id: 'starlink-2',
          name: 'Starlink',
          symbol: 'STARL',
          market_cap_rank: 2,
          thumb: 'https://coin-images.coingecko.com/coins/images/22049/thumb/starlink.png',
          large: 'https://coin-images.coingecko.com/coins/images/22049/large/starlink.png',
          data: {
            price_change_percentage_24h: { usd: 526000 },
            price: '$0.5986'
          }
        }
      },
      {
        item: {
          id: 'tesla-x',
          name: 'Tesla X',
          symbol: 'TESLAX',
          market_cap_rank: 3,
          thumb: '/coins/tesla_x.png',
          large: '/coins/tesla_x.png',
          data: {
            price_change_percentage_24h: { usd: 66000 },
            price: '$0.007526'
          }
        }
      },
      {
        item: {
          id: 'space-x-meme',
          name: 'Space X meme',
          symbol: 'SPACEX',
          market_cap_rank: 4,
          thumb: '/coins/spacex_meme.png',
          large: '/coins/spacex_meme.png',
          data: {
            price_change_percentage_24h: { usd: 52800 },
            price: '$0.005521'
          }
        }
      }
    ];
    
    return [...customTrending, ...coins];
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
