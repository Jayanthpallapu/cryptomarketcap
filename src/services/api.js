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



// China INU constants
const CHINAINU_PRICE_BEFORE = 0.171;
const CHINAINU_PRICE_AFTER  = 9.65;
// Phase timestamps (IST = UTC+5:30)
const CHINAINU_PUMP_TIME  = new Date('2026-05-16T10:00:00+05:30').getTime(); // 10 AM IST
const CHINAINU_SETTLE_TIME = new Date('2026-05-16T11:00:00+05:30').getTime(); // 11 AM IST
// % gain from 0.171 → 9.65
const CHINAINU_PUMP_PCT = parseFloat((((CHINAINU_PRICE_AFTER - CHINAINU_PRICE_BEFORE) / CHINAINU_PRICE_BEFORE) * 100).toFixed(2)); // ≈ 5543.27%

function getChinaINUMetrics(timestamp = Date.now()) {
  if (timestamp < CHINAINU_PUMP_TIME) {
    // Phase 1: pre-pump — static low price, existing big % history
    return {
      price: CHINAINU_PRICE_BEFORE,
      change1h:  0.00,
      change24h: 9000.00,
      change7d:  9200.00
    };
  } else if (timestamp < CHINAINU_SETTLE_TIME) {
    // Phase 2: pump window (10 AM–11 AM IST) — price jumped, 1h shows the spike
    return {
      price:     CHINAINU_PRICE_AFTER,
      change1h:  CHINAINU_PUMP_PCT,   // ~5543%
      change24h: 5600.00,
      change7d:  9700.00
    };
  } else {
    // Phase 3: post-settle (after 11 AM IST) — price stable, 1h locked at 0%
    return {
      price:     CHINAINU_PRICE_AFTER,
      change1h:  0.00,
      change24h: 5543.00,  // reflects 24h ago price was still $0.171
      change7d:  9700.00
    };
  }
}



// Bird constants
const BIRD_START_PRICE = 0.0003186;
const BIRD_START_TIME = new Date('2026-05-16T15:42:00+05:30').getTime();
const BIRD_THRESHOLD = BIRD_START_PRICE * 1.20; // 20% above start → freeze

function getBirdMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t, currentPrice) => {
    if (currentPrice >= BIRD_THRESHOLD) return 0;
    const seed = Math.floor(t / 3600000);
    const rand = ((seed * 3719 + 5281) % 233280) / 233280;
    // +0.67% to +0.97% per hour
    return parseFloat((0.67 + rand * (0.97 - 0.67)).toFixed(2));
  };

  let price = BIRD_START_PRICE;
  let price24hAgo = BIRD_START_PRICE;
  let price7dAgo = BIRD_START_PRICE;
  const t24hAgo = timestamp - 24 * ONE_HOUR_MS;
  const t7dAgo = timestamp - 7 * 24 * ONE_HOUR_MS;

  for (let t = BIRD_START_TIME; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
    const change = computeHourChange(t, price);
    price *= (1 + change / 100);
    if (t + ONE_HOUR_MS <= t24hAgo) price24hAgo = price;
    if (t + ONE_HOUR_MS <= t7dAgo) price7dAgo = price;
  }

  const change1h = computeHourChange(timestamp, price);
  if (Math.abs(timestamp - Date.now()) < ONE_HOUR_MS) {
    price *= (1 + change1h / 100);
  }
  const currentPrice = parseFloat(price.toFixed(8));

  // 24h change: from 24h-ago snapshot, else use initial values
  const change24h = price24hAgo !== BIRD_START_PRICE
    ? parseFloat((((price - price24hAgo) / price24hAgo) * 100).toFixed(2))
    : 11.5;

  // 7d change: from 7d-ago snapshot, else use initial values
  const change7d = price7dAgo !== BIRD_START_PRICE
    ? parseFloat((((price - price7dAgo) / price7dAgo) * 100).toFixed(2))
    : 32.0;

  return { price: currentPrice, change1h, change24h, change7d };
}

// Sphere constants
const SPHERE_START_PRICE = 0.04676;
const SPHERE_START_TIME = new Date('2026-05-17T10:00:00+05:30').getTime();
const SPHERE_THRESHOLD = SPHERE_START_PRICE * 1.20; // 20% above start

function getSphereMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t, currentPrice) => {
    if (currentPrice >= SPHERE_THRESHOLD) return 0;
    const seed = Math.floor(t / 3600000);
    const rand = ((seed * 4123 + 7891) % 233280) / 233280;
    // +0.87% to +1.97% per hour
    return parseFloat((0.87 + rand * (1.97 - 0.87)).toFixed(2));
  };

  let price = SPHERE_START_PRICE;
  let price24hAgo = SPHERE_START_PRICE;
  let price7dAgo = SPHERE_START_PRICE;
  const t24hAgo = timestamp - 24 * ONE_HOUR_MS;
  const t7dAgo = timestamp - 7 * 24 * ONE_HOUR_MS;

  for (let t = SPHERE_START_TIME; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
    const change = computeHourChange(t, price);
    price *= (1 + change / 100);
    if (t + ONE_HOUR_MS <= t24hAgo) price24hAgo = price;
    if (t + ONE_HOUR_MS <= t7dAgo) price7dAgo = price;
  }

  const change1h = computeHourChange(timestamp, price);
  if (Math.abs(timestamp - Date.now()) < ONE_HOUR_MS) {
    price *= (1 + change1h / 100);
  }
  const currentPrice = parseFloat(price.toFixed(5));

  // 24h change: from 24h-ago snapshot
  const change24h = parseFloat((((price - price24hAgo) / price24hAgo) * 100).toFixed(2));

  // 7d change: from 7d-ago snapshot
  const change7d = parseFloat((((price - price7dAgo) / price7dAgo) * 100).toFixed(2));

  return { price: currentPrice, change1h, change24h, change7d };
}

// AI constants
const AI_START_PRICE = 0.04038;
const AI_START_TIME = new Date('2026-05-18T16:00:00+05:30').getTime();
const AI_THRESHOLD = AI_START_PRICE * 1.10; // 10% above start

function getAIMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t, currentPrice) => {
    if (currentPrice >= AI_THRESHOLD) return 0;
    const seed = Math.floor(t / 3600000);
    const rand = ((seed * 5231 + 9871) % 233280) / 233280;
    // +0.32% to +0.48% per hour
    return parseFloat((0.32 + rand * (0.48 - 0.32)).toFixed(2));
  };

  let price = AI_START_PRICE;
  let price24hAgo = AI_START_PRICE;
  let price7dAgo = AI_START_PRICE;
  const t24hAgo = timestamp - 24 * ONE_HOUR_MS;
  const t7dAgo = timestamp - 7 * 24 * ONE_HOUR_MS;

  for (let t = AI_START_TIME; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
    const change = computeHourChange(t, price);
    price *= (1 + change / 100);
    if (t + ONE_HOUR_MS <= t24hAgo) price24hAgo = price;
    if (t + ONE_HOUR_MS <= t7dAgo) price7dAgo = price;
  }

  const change1h = computeHourChange(timestamp, price);
  if (Math.abs(timestamp - Date.now()) < ONE_HOUR_MS) {
    price *= (1 + change1h / 100);
  }
  const currentPrice = parseFloat(price.toFixed(5));

  // 24h change: from 24h-ago snapshot
  const change24h = parseFloat((((price - price24hAgo) / price24hAgo) * 100).toFixed(2));

  // 7d change: from 7d-ago snapshot
  const change7d = parseFloat((((price - price7dAgo) / price7dAgo) * 100).toFixed(2));

  return { price: currentPrice, change1h, change24h, change7d };
}

const CUSTOM_COINS = [
  {
    id: 'sphere',
    symbol: 'sphere',
    name: 'Sphere',
    image: '/sphere.png',
    get current_price() {
      return getSphereMetrics().price;
    },
    market_cap: 4676000,
    market_cap_rank: 10,
    total_volume: 500000,
    get price_change_percentage_1h_in_currency() {
      return getSphereMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getSphereMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getSphereMetrics().change7d;
    },
    circulating_supply: 100000000,
    max_supply: 100000000,
    sparkline_in_7d: {
      price: [0.03, 0.035, 0.04, 0.042, 0.044, 0.045, 0.04676]
    }
  },
  {
    id: 'china-inu',
    symbol: 'cinu',
    name: 'China INU',
    image: '/china_inu.png',
    get current_price() {
      return getChinaINUMetrics().price;
    },
    market_cap: 171000000,
    market_cap_rank: 1,
    total_volume: 28000000,
    get price_change_percentage_1h_in_currency() {
      return getChinaINUMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getChinaINUMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getChinaINUMetrics().change7d;
    },
    circulating_supply: 1000000000,
    max_supply: 1000000000,
    sparkline_in_7d: {
      price: [0.0017, 0.005, 0.015, 0.04, 0.08, 0.13, 0.171]
    }
  },
  {
    id: 'bird',
    symbol: 'bird',
    name: 'Bird',
    image: '/bird_coin.png',
    get current_price() {
      return getBirdMetrics().price;
    },
    market_cap: 3186000,
    market_cap_rank: 9,
    total_volume: 520000,
    get price_change_percentage_1h_in_currency() {
      return getBirdMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getBirdMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getBirdMetrics().change7d;
    },
    circulating_supply: 10000000000,
    max_supply: 10000000000,
    sparkline_in_7d: {
      price: [0.00024, 0.00026, 0.00028, 0.00029, 0.00030, 0.000314, 0.0003186]
    }
  },
  {
    id: 'artificial-intelligence',
    symbol: 'ai',
    name: 'Artificial Intelligence',
    image: '/artificial_intelligence.png',
    get current_price() {
      return getAIMetrics().price;
    },
    market_cap: 4038000,
    market_cap_rank: 11,
    total_volume: 100000,
    get price_change_percentage_1h_in_currency() {
      return getAIMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getAIMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getAIMetrics().change7d;
    },
    circulating_supply: 100000000,
    max_supply: 100000000,
    sparkline_in_7d: {
      price: [0.04038, 0.04038, 0.04038, 0.04038, 0.04038, 0.04038, 0.04038]
    }
  }
];

export async function getGlobalData() {
  const cached = getCached('global', CACHE_TTL.global);
  if (cached) return cached;

  const seed = Math.floor(Date.now() / 3600000);
  const rand = (n) => ((seed * n + 12345) % 1000) / 1000;

  try {
    const data = await fetchWithRetry(`${BASE}/global`);
    const result = data.data;

    if (result) {
      const mcJitter = 1 + (rand(7) * 0.01 - 0.005);
      if (result.total_market_cap) Object.keys(result.total_market_cap).forEach(k => { result.total_market_cap[k] *= mcJitter; });
      const volJitter = 1 + (rand(13) * 0.04 - 0.02);
      if (result.total_volume) Object.keys(result.total_volume).forEach(k => { result.total_volume[k] *= volJitter; });
      if (result.market_cap_percentage) {
        result.market_cap_percentage.btc = (result.market_cap_percentage.btc || 58) + (rand(17) * 0.2 - 0.1);
        result.market_cap_percentage.eth = (result.market_cap_percentage.eth || 10) + (rand(19) * 0.2 - 0.1);
      }
      result.active_cryptocurrencies += Math.floor(rand(23) * 20 - 10);
      result.markets += Math.floor(rand(29) * 5 - 2);
      result.fear_greed_index = Math.floor(35 + (rand(31) * 30));
      setCache('global', result);
      return result;
    }
  } catch (e) {
    console.warn('CoinGecko global API unavailable, using fallback stats:', e.message);
  }

  // Realistic fallback when API is unreachable
  const fallback = {
    active_cryptocurrencies: 14800 + Math.floor(rand(23) * 20),
    markets: 1100 + Math.floor(rand(29) * 5),
    total_market_cap: { usd: 2.85e12 * (1 + rand(7) * 0.01 - 0.005) },
    total_volume: { usd: 1.2e11 * (1 + rand(13) * 0.04 - 0.02) },
    market_cap_percentage: {
      btc: 57.8 + rand(17) * 0.2,
      eth: 11.4 + rand(19) * 0.2
    },
    market_cap_change_percentage_24h_usd: -0.5 + rand(41) * 1.5,
    fear_greed_index: Math.floor(35 + rand(31) * 30)
  };
  return fallback;
}

export async function getCoins(page = 1, perPage = 100, order = 'market_cap_desc') {
  const key = `coins_${page}_${perPage}_${order}`;

  // Check cache first
  const cached = getCached(key, CACHE_TTL.coins);
  if (cached) return cached;

  if (page === 1) {
    // Always return custom coins immediately, then try to merge real coins
    try {
      const data = await fetchWithRetry(
        `${BASE}/coins/markets?vs_currency=usd&order=${order}&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`
      );
      if (Array.isArray(data)) {
        const result = [...CUSTOM_COINS, ...data];
        setCache(key, result);
        return result;
      }
    } catch (e) {
      console.warn('CoinGecko API unavailable, showing custom coins only:', e.message);
    }
    // Fallback: return just custom coins if API fails
    return CUSTOM_COINS;
  }

  // For page > 1, try the real API
  try {
    const data = await fetchWithRetry(
      `${BASE}/coins/markets?vs_currency=usd&order=${order}&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`
    );
    if (Array.isArray(data)) {
      setCache(key, data);
      return data;
    }
  } catch (e) {
    console.warn('CoinGecko API unavailable for page', page, e.message);
  }
  return [];
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
    const chartData = await getCoinChart(id, 'max');
    const ohlc = chartData.ohlc || [];
    const ath = ohlc.length > 0 ? Math.max(...ohlc.map(d => d.h)) : coin.current_price * 1.1;
    const atl = ohlc.length > 0 ? Math.min(...ohlc.map(d => d.l)) : coin.current_price * 0.9;

    return {
      ...coin,
      image: {
        thumb: coin.image,
        small: coin.image,
        large: coin.image
      },
      description: {
        en: coin.id === 'china-inu'
              ? 'China INU is a community-driven meme token inspired by Chinese culture and the viral Shiba Inu movement, combining Eastern heritage with the explosive energy of DeFi.'
              : coin.id === 'bird'
                ? 'Bird is a community-driven token soaring through the crypto skies, combining viral meme energy with real DeFi utility.'
                : 'A custom community-driven token.'
      },
      market_data: {
        current_price: { usd: coin.current_price },
        market_cap: { usd: coin.market_cap },
        total_volume: { usd: coin.total_volume },
        price_change_percentage_1h_in_currency: { usd: coin.price_change_percentage_1h_in_currency },
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
        circulating_supply: coin.circulating_supply,
        total_supply: coin.circulating_supply * (Math.floor(Math.random() * 2) + 6),
        max_supply: coin.max_supply,
        ath: { usd: ath },
        atl: { usd: atl },
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
    const now = Date.now();
    const numCandles = days === 1 ? 48 : days === 7 ? 84 : days === 30 ? 90 : 120;
    const daysNum = days === 'max' ? 365 : days;
    const intervalMs = daysNum * 24 * 3600000 / numCandles;
    const ohlc = [];
    const prices = [];
    const volumes = [];

    const metricsMap = {
      'china-inu': getChinaINUMetrics,
      'bird': getBirdMetrics,
      'artificial-intelligence': getAIMetrics
    };

    const getMetrics = metricsMap[id];

    if (getMetrics) {
      for (let i = 0; i < numCandles; i++) {
        const t = now - (numCandles - i) * intervalMs;
        const open = getMetrics(t).price;
        const nextT = Math.min(t + intervalMs, now);
        const close = getMetrics(nextT).price;
        const volatility = 0.005;
        const high = Math.max(open, close) * (1 + Math.random() * volatility);
        const low = Math.min(open, close) * (1 - Math.random() * volatility);

        // ApexCharts candlestick format: {x: timestamp, y: [open, high, low, close]}
        ohlc.push({
          x: t,
          y: [
            parseFloat(open.toFixed(8)),
            parseFloat(high.toFixed(8)),
            parseFloat(low.toFixed(8)),
            parseFloat(close.toFixed(8))
          ]
        });
        prices.push([t, close]);
        volumes.push([t, (custom.total_volume / numCandles) * (0.5 + Math.random())]);
      }
    }
    return { prices, ohlc, volumes };
  }

  // For real coins: fetch OHLC + price from CoinGecko
  const ohlcDays = days === 'max' ? 365 : days;
  const [priceData, ohlcData] = await Promise.allSettled([
    cachedFetch(`chart_${id}_${days}`, CACHE_TTL.chart, () =>
      fetchWithRetry(`${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`)
    ),
    cachedFetch(`ohlc_${id}_${ohlcDays}`, CACHE_TTL.chart, () =>
      fetchWithRetry(`${BASE}/coins/${id}/ohlc?vs_currency=usd&days=${ohlcDays}`)
    )
  ]);

  const prices = priceData.status === 'fulfilled' ? (priceData.value.prices || []) : [];
  const volumes = priceData.status === 'fulfilled' ? (priceData.value.total_volumes || []) : [];
  const rawOhlc = ohlcData.status === 'fulfilled' && Array.isArray(ohlcData.value) ? ohlcData.value : [];
  // Convert to ApexCharts candlestick format: {x, y:[o,h,l,c]}
  const ohlc = rawOhlc.map(([t, o, h, l, c]) => ({ x: t, y: [o, h, l, c] }));

  return { prices, ohlc, volumes };
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

const NEWS_TTL = 10 * 60 * 1000; // 10 minutes

export async function getCryptoNews() {
  const cached = getCached('crypto_news', NEWS_TTL);
  if (cached) return cached;

  try {
    const res = await fetch(
      '/news-api/data/v2/news/?lang=EN&categories=BTC,ETH,Trading,Regulation,Mining,ICO,Altcoin,DeFi&sortOrder=latest&limit=200',
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const articles = json.Data || [];

    const result = articles.map(a => ({
      id: a.id,
      title: a.title,
      body: a.body,
      imageUrl: a.imageurl,
      url: a.url,
      source: a.source_info?.name || a.source || 'CryptoNews',
      sourceImg: a.source_info?.img || '',
      publishedAt: a.published_on * 1000,
      tags: (a.tags || '').split('|').filter(Boolean).slice(0, 4),
      categories: (a.categories || '').split('|').filter(Boolean).slice(0, 3)
    }));

    setCache('crypto_news', result);
    return result;
  } catch (e) {
    console.warn('News API failed:', e.message);
    return [];
  }
}
