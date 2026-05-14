// CoinGecko Free Public API - Last Deploy: 2026-05-12T17:18:40+05:30
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

// Oil Lab constants
const OILLAB_START_PRICE = 0.13;
const OILLAB_START_TIME = Date.now();

function getOilLabMetrics() {
  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (timestamp) => {
    const seed = Math.floor(timestamp / 10000);
    const rand = ((seed * 1357 + 2468) % 233280) / 233280;
    // User requested: 1.05% to 2.76% randomly increase
    return parseFloat((1.05 + (rand * (2.76 - 1.05))).toFixed(2));
  };

  let price = OILLAB_START_PRICE;
  
  for (let t = OILLAB_START_TIME; t + ONE_HOUR_MS <= now; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(now);
  price *= (1 + change1h / 100);
  const currentPrice = parseFloat(price.toFixed(4));

  // Calculate realistic 24h and 7d changes based on the new positive trend
  const change24h = parseFloat((45.2 + change1h).toFixed(2));
  const change7d = parseFloat((315.4 + change1h).toFixed(2));

  return { price: currentPrice, change1h, change24h, change7d };
}



// Baby Trump constants
const BABYTRUMP_START_PRICE = 8.016;
const BABYTRUMP_START_TIME = Date.now();

function getBabyTrumpMetrics() {
  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (timestamp) => {
    const seed = Math.floor(timestamp / 10000);
    const rand = ((seed * 5432 + 9876) % 233280) / 233280;
    return parseFloat((2.03 + (rand * (3.03 - 2.03))).toFixed(2));
  };

  let price = BABYTRUMP_START_PRICE;
  for (let t = BABYTRUMP_START_TIME; t + ONE_HOUR_MS <= now; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(now);
  
  price *= (1 + change1h / 100);
  price = parseFloat(price.toFixed(4));

  const change24h = parseFloat((2420 + change1h).toFixed(2));
  const change7d = parseFloat((2420 + change1h).toFixed(2));

  return { price, change1h, change24h, change7d };
}

// trump tmp constants
const TRUMPTMP_START_PRICE = 13.98;
// Start from 6:30 AM IST on May 11, 2026
const TRUMPTMP_START_TIME = new Date('2026-05-12T13:58:00+05:30').getTime();

function getTrumpTMPMetrics() {
  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const t24hAgo = now - 24 * ONE_HOUR_MS;
  const t7dAgo = now - 7 * 24 * ONE_HOUR_MS;

  const getDynamicChange = (timestamp) => {
    const seed = Math.floor(timestamp / 10000);
    const rand = ((seed * 3456 + 7890) % 233280) / 233280;
    // Randomly negative between 2.45% and 0.76%
    return parseFloat((-2.45 + (rand * (2.45 - 0.76))).toFixed(2));
  };

  let price = TRUMPTMP_START_PRICE;
  let price24hAgo = TRUMPTMP_START_PRICE;
  let price7dAgo = TRUMPTMP_START_PRICE;

  // Accumulate price changes since start
  for (let t = TRUMPTMP_START_TIME; t + ONE_HOUR_MS <= now; t += ONE_HOUR_MS) {
    const change = getDynamicChange(t);
    price *= (1 + change / 100);
    
    if (t + ONE_HOUR_MS <= t24hAgo) price24hAgo = price;
    if (t + ONE_HOUR_MS <= t7dAgo) price7dAgo = price;
  }

  const change1h = parseFloat((0.08 + Math.random() * (0.19 - 0.08)).toFixed(2));
  
  // Apply current hour's change to the final price
  price *= (1 + change1h / 100);
  const currentPrice = parseFloat(price.toFixed(4));

  // Calculate 24h and 7d changes based on historical accumulation
  const change24h = parseFloat((((price - price24hAgo) / price24hAgo) * 100).toFixed(2));
  const change7d = parseFloat((((price - price7dAgo) / price7dAgo) * 100).toFixed(2));

  return { price: currentPrice, change1h, change24h, change7d };
}

// Trump US constants
const TRUMPUS_START_PRICE = 3.25;
const TRUMPUS_START_TIME = Date.now();

function getTrumpUSMetrics() {
  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (timestamp) => {
    const seed = Math.floor(timestamp / 10000);
    const rand = ((seed * 2345 + 6789) % 233280) / 233280;
    // Random between 0.33% and 1.08%
    return parseFloat((0.33 + (rand * (1.08 - 0.33))).toFixed(2));
  };

  let price = TRUMPUS_START_PRICE;
  for (let t = TRUMPUS_START_TIME; t + ONE_HOUR_MS <= now; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(now);
  
  price *= (1 + change1h / 100);
  price = parseFloat(price.toFixed(4));

  const change24h = parseFloat((55 + change1h).toFixed(2));
  const change7d = parseFloat((675 + change1h).toFixed(2));

  return { price, change1h, change24h, change7d };
}

// BlackRock Contract constants
const BLACKROCK_TARGET_TIME = new Date('2026-05-13T15:00:00+05:30').getTime();

function getBlackRockMetrics() {
  const now = Date.now();

  const computeHourChange = (timestamp) => {
    const seed = Math.floor(timestamp / 10000);
    const rand = ((seed * 7890 + 1234) % 233280) / 233280;
    // Generate a dynamic percentage change
    return parseFloat((1.15 + (rand * (2.45 - 1.15))).toFixed(2));
  };

  const change1h = computeHourChange(now);
  
  // Price is 6.32, but becomes 7.03 at 3 PM IST
  let price = now >= BLACKROCK_TARGET_TIME ? 7.03 : 6.32;
  
  // Apply dynamic 1h change to the price to keep it active
  price *= (1 + change1h / 100);
  
  // Add up the 1 hr % change to 24 hrs & 7 Days
  const change24h = parseFloat((1300 + change1h).toFixed(2));
  const change7d = parseFloat((2300000 + change1h).toFixed(2));

  return { price: parseFloat(price.toFixed(2)), change1h, change24h, change7d };
}


// OSRO constants
const OSRO_START_PRICE = 1.02;
const OSRO_START_TIME = Date.now();

function getOSROMetrics() {
  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (timestamp) => {
    const seed = Math.floor(timestamp / 10000);
    const rand = ((seed * 3333 + 7777) % 233280) / 233280;
    // Drastically reduced 1h % change to show correction (e.g. -2.15% to -5.45%)
    return parseFloat((-5.45 + (rand * (-2.15 - -5.45))).toFixed(2));
  };

  let price = OSRO_START_PRICE;
  
  for (let t = OSRO_START_TIME; t + ONE_HOUR_MS <= now; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(now);
  price *= (1 + change1h / 100);
  
  const currentPrice = parseFloat(price.toFixed(4));

  // The 24h and 7d percentages are also reduced to normal numbers
  const change24h = parseFloat((-18.5 + change1h).toFixed(2));
  const change7d = parseFloat((-8.4 + change1h).toFixed(2));

  return { 
    price: currentPrice, 
    change1h, 
    change24h, 
    change7d 
  };
}

const CUSTOM_COINS = [
  {
    id: 'osro',
    symbol: 'osro',
    name: 'OSRO',
    image: '/osro.png',
    get current_price() {
      return getOSROMetrics().price;
    },
    market_cap: 850000000,
    market_cap_rank: 2,
    total_volume: 35000000,
    get price_change_percentage_1h_in_currency() {
      return getOSROMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getOSROMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getOSROMetrics().change7d;
    },
    circulating_supply: 100000000,
    max_supply: 100000000,
    sparkline_in_7d: {
      price: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.65]
    }
  },
  {
    id: 'oil-lab',
    symbol: 'oil',
    name: 'Oil Lab',
    image: '/oil_lab.png',
    get current_price() {
      return getOilLabMetrics().price;
    },
    market_cap: 8500000,
    market_cap_rank: 6,
    total_volume: 1250000,
    get price_change_percentage_1h_in_currency() {
      return getOilLabMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getOilLabMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getOilLabMetrics().change7d;
    },
    circulating_supply: 301180000,
    max_supply: 1000000000,
    sparkline_in_7d: {
      price: [0.000002, 0.000005, 0.000015, 0.0001, 0.005, 0.02, 0.02822]
    }
  },

  {
    id: 'baby-trump',
    symbol: 'babytrump',
    name: 'Baby Trump',
    image: 'https://coin-images.coingecko.com/coins/images/38010/large/photo_2024-02-22_13.png',
    get current_price() {
      return getBabyTrumpMetrics().price;
    },
    market_cap: 1500000,
    market_cap_rank: 7,
    total_volume: 450000,
    get price_change_percentage_1h_in_currency() {
      return getBabyTrumpMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getBabyTrumpMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getBabyTrumpMetrics().change7d;
    },
    circulating_supply: 1000000000,
    max_supply: 1000000000,
    sparkline_in_7d: {
      price: [0.000017, 0.000016, 0.000016, 0.000015, 0.000016, 0.000015, 0.000015]
    }
  },
  {
    id: 'trump-tmp',
    symbol: 'tmp',
    name: 'trump tmp',
    image: '/trump_fight.png',
    get current_price() {
      return getTrumpTMPMetrics().price;
    },
    market_cap: 12500000,
    market_cap_rank: 4,
    total_volume: 2500000,
    get price_change_percentage_1h_in_currency() {
      return getTrumpTMPMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getTrumpTMPMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getTrumpTMPMetrics().change7d;
    },
    circulating_supply: 45000000,
    max_supply: 100000000,
    sparkline_in_7d: {
      price: [5.8, 5.9, 6.0, 6.1, 6.15, 6.2, 6.22]
    }
  },
  {
    id: 'trump-us',
    symbol: 'us',
    name: 'Trump US',
    image: '/trump_us.png',
    get current_price() {
      return getTrumpUSMetrics().price;
    },
    market_cap: 85000000,
    market_cap_rank: 3,
    total_volume: 12000000,
    get price_change_percentage_1h_in_currency() {
      return getTrumpUSMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getTrumpUSMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getTrumpUSMetrics().change7d;
    },
    circulating_supply: 27000000,
    max_supply: 100000000,
    sparkline_in_7d: {
      price: [2.5, 2.7, 2.9, 3.0, 3.1, 3.12, 3.15]
    }
  },
  {
    id: 'blackrock-contract',
    symbol: 'blc',
    name: 'BlackRock Contract',
    image: '/blackrock_contract_logo.png',
    get current_price() {
      return getBlackRockMetrics().price;
    },
    market_cap: 950000000,
    market_cap_rank: 1,
    total_volume: 45000000,
    get price_change_percentage_1h_in_currency() {
      return getBlackRockMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getBlackRockMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getBlackRockMetrics().change7d;
    },
    circulating_supply: 100000000,
    max_supply: 100000000,
    sparkline_in_7d: {
      price: [1.2, 1.8, 2.5, 3.2, 3.8, 4.0, 4.12]
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
        en: coin.id === 'oil-lab'
            ? 'Oil Lab is a pioneering decentralized science (DeSci) token focused on optimizing energy extraction and sustainable oil research.'
            : coin.id === 'baby-trump'
              ? 'Baby Trump is a community-driven meme coin.'
                : coin.id === 'trump-tmp'
                  ? 'trump tmp is a high-performance presidential utility token.'
                  : coin.id === 'trump-us'
                    ? 'Trump US is a premium digital asset representing excellence and growth.'
                    : coin.id === 'blackrock-contract'
                      ? 'BlackRock Contract is an institutional-grade digital asset with unprecedented growth metrics.'
                      : coin.id === 'osro'
                        ? 'OSRO is a revolutionary digital asset with immense growth potential.'
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
