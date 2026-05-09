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

// Star Coin constants
const STAR_START_PRICE = 12.50; // updated price per request
const STAR_START_TIME = Date.now();

function getStarMetrics() {
  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;

  // Helper to compute 1h change for a given timestamp
  const computeHourChange = (timestamp) => {
    if (timestamp - STAR_START_TIME < ONE_HOUR_MS) {
      return 2.16;
    }
    // Deterministic random for consistent 1h changes within a 10‑second window
    const seed = Math.floor(timestamp / 10000);
    const rand = ((seed * 6271 + 13337) % 233280) / 233280;
    // 0.85% to 1.73% fluctuation
    return parseFloat((0.85 + (rand * (1.73 - 0.85))).toFixed(2));
  };

  // Calculate cumulative price based on past full hours
  let price = STAR_START_PRICE;
  for (let t = STAR_START_TIME; t + ONE_HOUR_MS <= now; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }
  price = parseFloat(price.toFixed(4));

  // Current hour's change
  const change1h = computeHourChange(now);

  // 24h and 7d change (unchanged logic)
  // Fixed 24h and 7d change at 1400%
  const changeLong = 1400;

  return {
    price,
    change1h,
    changeLong
  };
}

// Base ball beer constants
const BBB_START_PRICE = 0.77;
const BBB_START_TIME = Date.now();

function getBBBMetrics() {
  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (timestamp) => {
    if (timestamp - BBB_START_TIME < ONE_HOUR_MS) {
      return 1.22;
    }
    const seed = Math.floor(timestamp / 10000);
    const rand = ((seed * 7253 + 12345) % 233280) / 233280;
    return parseFloat((0.23 + (rand * (0.76 - 0.23))).toFixed(2));
  };

  let price = BBB_START_PRICE;
  for (let t = BBB_START_TIME; t + ONE_HOUR_MS <= now; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }
  price = parseFloat(price.toFixed(4));

  const change1h = computeHourChange(now);
  const change24h = 21;
  const change7d = 24;

  return { price, change1h, change24h, change7d };
}

const CUSTOM_COINS = [

  {
    id: 'star-coin',
    symbol: 'star',
    name: 'Star Coin',
    image: 'https://coin-images.coingecko.com/coins/images/20921/large/stc.png',
    get current_price() {
      return getStarMetrics().price;
    },
    market_cap: 8540000,
    market_cap_rank: 2,
    total_volume: 1200000,
    get price_change_percentage_1h_in_currency() {
      return getStarMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getStarMetrics().changeLong;
    },
    get price_change_percentage_7d_in_currency() {
      return getStarMetrics().changeLong;
    },
    circulating_supply: 7360000,
    max_supply: 20000000,
    sparkline_in_7d: {
      price: [9.5, 9.8, 10.0, 10.1, 10.12, 10.12, 10.12]
    }
  },
  {
    id: 'baseball-beer',
    symbol: 'bbb',
    name: 'Base ball Beer',
    image: 'https://coin-images.coingecko.com/coins/images/38123/large/beer_%281%29.jpg',
    get current_price() {
      return getBBBMetrics().price;
    },
    market_cap: 3200000,
    market_cap_rank: 5,
    total_volume: 850000,
    get price_change_percentage_1h_in_currency() {
      return getBBBMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getBBBMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getBBBMetrics().change7d;
    },
    circulating_supply: 15000000,
    max_supply: 50000000,
    sparkline_in_7d: {
      price: [0.60, 0.63, 0.65, 0.64, 0.66, 0.69, 0.72]
    }
  },
  {
    id: 'baby-trump',
    symbol: 'babytrump',
    name: 'Baby Trump',
    image: 'https://coin-images.coingecko.com/coins/images/38010/large/photo_2024-02-22_13.png',
    get current_price() {
      return 8.016;
    },
    market_cap: 1500000,
    market_cap_rank: 7,
    total_volume: 450000,
    get price_change_percentage_1h_in_currency() {
      return 100;
    },
    get price_change_percentage_24h() {
      return 2420;
    },
    get price_change_percentage_7d_in_currency() {
      return 2420;
    },
    circulating_supply: 1000000000,
    max_supply: 1000000000,
    sparkline_in_7d: {
      price: [0.000017, 0.000016, 0.000016, 0.000015, 0.000016, 0.000015, 0.000015]
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
      description: { 
        en: coin.id === 'star-coin' 
          ? 'Star Coin is a premium utility token powering the next generation of decentralized star-mapping and navigation services.' 
          : coin.id === 'baseball-beer'
            ? 'Base ball Beer is a community-driven token celebrating baseball culture and craft beer communities.'
            : coin.id === 'baby-trump'
              ? 'Baby Trump is a community-driven meme coin.'
              : 'Musk meme is a community-driven token inspired by the visionary Elon Musk.' 
      },
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
