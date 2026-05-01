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
        current_price: 0.014221,
        market_cap: 142210000,
        market_cap_rank: 1,
        price_change_percentage_24h: 920000,
        price_change_percentage_1h_in_currency: 430000,
        price_change_percentage_7d_in_currency: 1150000,
        total_volume: 50000000,
        circulating_supply: 1000000000,
        max_supply: 1000000000,
        sparkline_in_7d: { price: Array.from({length: 100}, () => Math.random() * 0.2 + 0.1) }
      },
      {
        id: 'starlink-2',
        symbol: 'starl',
        name: 'Starlink',
        image: 'https://coin-images.coingecko.com/coins/images/22049/large/starlink.png',
        current_price: 1.3,
        market_cap: 1300000000,
        market_cap_rank: 2,
        price_change_percentage_24h: 722000,
        price_change_percentage_1h_in_currency: 330000,
        price_change_percentage_7d_in_currency: 1320000,
        total_volume: 500000000,
        circulating_supply: 1000000000,
        max_supply: 1000000000,
        sparkline_in_7d: { price: Array.from({length: 100}, () => Math.random() * 50 + 20) }
      },
      {
        id: 'tesla-x',
        symbol: 'teslax',
        name: 'Tesla X',
        image: '/coins/tesla_x.png',
        current_price: 0.0433,
        market_cap: 433000000,
        market_cap_rank: 3,
        price_change_percentage_24h: 580000,
        price_change_percentage_1h_in_currency: 210000,
        price_change_percentage_7d_in_currency: 840000,
        total_volume: 80000000,
        circulating_supply: 1000000000,
        max_supply: 1000000000,
        sparkline_in_7d: { price: Array.from({length: 100}, () => Math.random() * 0.5 + 0.3) }
      },
      {
        id: 'space-x-meme',
        symbol: 'spacex',
        name: 'Space X meme',
        image: '/coins/spacex_meme.png',
        current_price: 0.02227,
        market_cap: 222700000,
        market_cap_rank: 4,
        price_change_percentage_24h: 420000,
        price_change_percentage_1h_in_currency: 150000,
        price_change_percentage_7d_in_currency: 610000,
        total_volume: 40000000,
        circulating_supply: 1000000000,
        max_supply: 1000000000,
        sparkline_in_7d: { price: Array.from({length: 100}, () => Math.random() * 0.3 + 0.2) }
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
            price_change_percentage_24h: { usd: 920000 },
            price: '$0.014221'
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
            price_change_percentage_24h: { usd: 722000 },
            price: '$1.3'
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
            price_change_percentage_24h: { usd: 580000 },
            price: '$0.0433'
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
            price_change_percentage_24h: { usd: 420000 },
            price: '$0.02227'
          }
        }
      }
    ];
    
    return [...customTrending, ...coins];
  });
}

export async function getCoinDetail(id) {
  if (id === 'starlink-2') {
    return {
      id: 'starlink-2',
      symbol: 'starl',
      name: 'Starlink',
      image: { large: 'https://coin-images.coingecko.com/coins/images/22049/large/starlink.png' },
      market_cap_rank: 2,
      market_data: {
        current_price: { usd: 1.3 },
        market_cap: { usd: 1300000000 },
        total_volume: { usd: 500000000 },
        price_change_percentage_24h: 722000,
        price_change_percentage_1h_in_currency: { usd: 330000 },
        price_change_percentage_7d_in_currency: { usd: 1320000 },
        circulating_supply: 1000000000,
        total_supply: 1000000000,
        max_supply: 1000000000,
        ath: { usd: 1.3 },
        atl: { usd: 0.000001 }
      },
      description: { en: 'Starlink is a decentralized virtual universe project.' }
    };
  }
  if (id === 'baby-elonx') {
    return {
      id: 'baby-elonx',
      symbol: 'elonx',
      name: 'Baby ElonX',
      image: { large: '/coins/baby_elonx.png' },
      market_cap_rank: 1,
      market_data: {
        current_price: { usd: 0.014221 },
        market_cap: { usd: 142210000 },
        total_volume: { usd: 50000000 },
        price_change_percentage_24h: 920000,
        price_change_percentage_1h_in_currency: { usd: 430000 },
        price_change_percentage_7d_in_currency: { usd: 1150000 },
        circulating_supply: 1000000000,
        total_supply: 1000000000,
        max_supply: 1000000000,
        ath: { usd: 0.014221 },
        atl: { usd: 0.000001 }
      },
      description: { en: 'Baby ElonX is a community-driven meme token.' }
    };
  }
  if (id === 'tesla-x') {
    return {
      id: 'tesla-x',
      symbol: 'teslax',
      name: 'Tesla X',
      image: { large: '/coins/tesla_x.png' },
      market_cap_rank: 3,
      market_data: {
        current_price: { usd: 0.0433 },
        market_cap: { usd: 433000000 },
        total_volume: { usd: 80000000 },
        price_change_percentage_24h: 580000,
        price_change_percentage_1h_in_currency: { usd: 210000 },
        price_change_percentage_7d_in_currency: { usd: 840000 },
        circulating_supply: 1000000000,
        total_supply: 1000000000,
        max_supply: 1000000000,
        ath: { usd: 0.0433 },
        atl: { usd: 0.000001 }
      },
      description: { en: 'Tesla X is a futuristic digital asset.' }
    };
  }
  if (id === 'space-x-meme') {
    return {
      id: 'space-x-meme',
      symbol: 'spacex',
      name: 'Space X meme',
      image: { large: '/coins/spacex_meme.png' },
      market_cap_rank: 4,
      market_data: {
        current_price: { usd: 0.02227 },
        market_cap: { usd: 222700000 },
        total_volume: { usd: 40000000 },
        price_change_percentage_24h: 420000,
        price_change_percentage_1h_in_currency: { usd: 150000 },
        price_change_percentage_7d_in_currency: { usd: 610000 },
        circulating_supply: 1000000000,
        total_supply: 1000000000,
        max_supply: 1000000000,
        ath: { usd: 0.02227 },
        atl: { usd: 0.000001 }
      },
      description: { en: 'Space X meme token for space enthusiasts.' }
    };
  }
  return cachedFetch(`coin_${id}`, CACHE_TTL.coinDetail, () =>
    fetchWithRetry(
      `${BASE}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`
    )
  );
}

export async function getCoinChart(id, days = 7) {
  if (id === 'starlink-2' || id === 'baby-elonx' || id === 'tesla-x' || id === 'space-x-meme') {
    const basePrice = {
      'starlink-2': 1.1,
      'baby-elonx': 0.012,
      'tesla-x': 0.04,
      'space-x-meme': 0.02
    }[id];
    
    const points = days === 'max' ? 100 : (days === 1 ? 24 : days * 12);
    const prices = Array.from({ length: points }, (_, i) => [
      Date.now() - (points - i) * (days === 1 ? 3600000 : 86400000 / 12),
      basePrice + Math.random() * (basePrice * 0.3)
    ]);
    return { prices };
  }
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
