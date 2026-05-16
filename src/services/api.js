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

// Musk Mini X constants
const MUSKMINI_START_PRICE = 0.07496;
const MUSKMINI_THRESHOLD = MUSKMINI_START_PRICE * 1.30; // 30% above start
const MUSKMINI_START_TIME = new Date('2026-05-14T00:00:00+05:30').getTime();

function getMuskMiniXMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t, currentPrice) => {
    const seed = Math.floor(t / 3600000); // Hourly seed
    const rand = ((seed * 6173 + 3141) % 233280) / 233280;
    if (currentPrice < MUSKMINI_THRESHOLD) {
      // Phase 1: 3.56% to 4.96% increase per hour
      return parseFloat((3.56 + (rand * (4.96 - 3.56))).toFixed(2));
    } else {
      // Phase 2: once 30% gained, slow to 0.01% to 0.04%
      return parseFloat((0.01 + (rand * (0.04 - 0.01))).toFixed(2));
    }
  };

  let price = MUSKMINI_START_PRICE;
  let price24hAgo = MUSKMINI_START_PRICE;
  let price7dAgo = MUSKMINI_START_PRICE;
  const t24hAgo = timestamp - 24 * ONE_HOUR_MS;
  const t7dAgo = timestamp - 7 * 24 * ONE_HOUR_MS;

  for (let t = MUSKMINI_START_TIME; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
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

  const change24h = price24hAgo !== MUSKMINI_START_PRICE
    ? parseFloat((((price - price24hAgo) / price24hAgo) * 100).toFixed(2))
    : 34.6;
  const change7d = price7dAgo !== MUSKMINI_START_PRICE
    ? parseFloat((((price - price7dAgo) / price7dAgo) * 100).toFixed(2))
    : 76.0;

  return { price: currentPrice, change1h, change24h, change7d };
}

// Oil Lab constants
const OILLAB_START_PRICE = 0.13;
const OILLAB_START_TIME = Date.now();

function getOilLabMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t) => {
    const seed = Math.floor(t / 3600000);
    const rand = ((seed * 1357 + 2468) % 233280) / 233280;
    return parseFloat((1.05 + (rand * (2.76 - 1.05))).toFixed(2));
  };

  let price = OILLAB_START_PRICE;
  for (let t = OILLAB_START_TIME; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(timestamp);
  if (Math.abs(timestamp - Date.now()) < ONE_HOUR_MS) {
    price *= (1 + change1h / 100);
  }
  const currentPrice = parseFloat(price.toFixed(4));
  const change24h = parseFloat((45.2 + change1h).toFixed(2));
  const change7d = parseFloat((315.4 + change1h).toFixed(2));

  return { price: currentPrice, change1h, change24h, change7d };
}

// Baby Trump constants
const BABYTRUMP_START_PRICE = 8.016;
const BABYTRUMP_START_TIME = Date.now();

function getBabyTrumpMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t) => {
    const seed = Math.floor(t / 3600000);
    const rand = ((seed * 5432 + 9876) % 233280) / 233280;
    return parseFloat((2.03 + (rand * (3.03 - 2.03))).toFixed(2));
  };

  let price = BABYTRUMP_START_PRICE;
  for (let t = BABYTRUMP_START_TIME; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(timestamp);
  if (Math.abs(timestamp - Date.now()) < ONE_HOUR_MS) {
    price *= (1 + change1h / 100);
  }
  const currentPrice = parseFloat(price.toFixed(4));
  const change24h = parseFloat((4.5 + change1h).toFixed(2));
  const change7d = parseFloat((12.4 + change1h).toFixed(2));

  return { price: currentPrice, change1h, change24h, change7d };
}

// trump tmp constants
const TRUMPTMP_START_PRICE = 13.98;
// Start from 6:30 AM IST on May 11, 2026
const TRUMPTMP_START_TIME = new Date('2026-05-12T13:58:00+05:30').getTime();

function getTrumpTMPMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t) => {
    const seed = Math.floor(t / 3600000);
    const rand = ((seed * 2468 + 1357) % 233280) / 233280;
    // -2.45% and 0.76% (randomly decrease)
    return parseFloat((-2.45 + (rand * (0.76 - -2.45))).toFixed(2));
  };

  let price = TRUMPTMP_START_PRICE;
  for (let t = TRUMPTMP_START_TIME; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(timestamp);
  if (Math.abs(timestamp - Date.now()) < ONE_HOUR_MS) {
    price *= (1 + change1h / 100);
  }
  const currentPrice = parseFloat(price.toFixed(2));
  const change24h = parseFloat((-5.8 + change1h).toFixed(2));
  const change7d = parseFloat((-14.2 + change1h).toFixed(2));

  return { price: currentPrice, change1h, change24h, change7d };
}

// Trump US constants
const TRUMPUS_START_PRICE = 3.25;
const TRUMPUS_START_TIME = Date.now();

function getTrumpUSMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t) => {
    const seed = Math.floor(t / 3600000);
    const rand = ((seed * 2345 + 6789) % 233280) / 233280;
    return parseFloat((0.33 + (rand * (1.08 - 0.33))).toFixed(2));
  };

  let price = TRUMPUS_START_PRICE;
  for (let t = TRUMPUS_START_TIME; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(timestamp);
  if (Math.abs(timestamp - Date.now()) < ONE_HOUR_MS) {
    price *= (1 + change1h / 100);
  }
  const currentPrice = parseFloat(price.toFixed(4));
  const change24h = parseFloat((55 + change1h).toFixed(2));
  const change7d = parseFloat((675 + change1h).toFixed(2));

  return { price: currentPrice, change1h, change24h, change7d };
}

// BlackRock Contract constants
const BLACKROCK_TARGET_TIME = new Date('2026-05-13T15:00:00+05:30').getTime();

function getBlackRockMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t) => {
    const seed = Math.floor(t / 3600000);
    const rand = ((seed * 8765 + 4321) % 233280) / 233280;
    return parseFloat((0.85 + (rand * (1.45 - 0.85))).toFixed(2));
  };

  let startPrice = timestamp >= BLACKROCK_TARGET_TIME ? 7.03 : 6.32;
  let price = startPrice;
  const startTime = timestamp >= BLACKROCK_TARGET_TIME ? BLACKROCK_TARGET_TIME : (timestamp - 7 * 24 * ONE_HOUR_MS);

  for (let t = startTime; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(timestamp);
  if (Math.abs(timestamp - Date.now()) < ONE_HOUR_MS) {
    price *= (1 + change1h / 100);
  }
  const currentPrice = parseFloat(price.toFixed(2));
  const change24h = parseFloat((12.5 + change1h).toFixed(2));
  const change7d = parseFloat((85.2 + change1h).toFixed(2));

  return { price: currentPrice, change1h, change24h, change7d };
}


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

// OSRO constants
const OSRO_START_PRICE = 1.02;
const OSRO_START_TIME = Date.now();

function getOSROMetrics(timestamp = Date.now()) {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const computeHourChange = (t) => {
    const seed = Math.floor(t / 3600000); // Hourly seed
    const rand = ((seed * 7173 + 4141) % 233280) / 233280;
    // Drastically reduced 1h % change to show correction (e.g. -2.15% to -5.45%)
    return parseFloat((-5.45 + (rand * (-2.15 - -5.45))).toFixed(2));
  };

  let price = OSRO_START_PRICE;

  for (let t = OSRO_START_TIME; t + ONE_HOUR_MS <= timestamp; t += ONE_HOUR_MS) {
    const change = computeHourChange(t);
    price *= (1 + change / 100);
  }

  const change1h = computeHourChange(timestamp);
  // Only apply the "current" hour change if we are looking at "now"
  if (Math.abs(timestamp - Date.now()) < ONE_HOUR_MS) {
    price *= (1 + change1h / 100);
  }

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

const CUSTOM_COINS = [
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
  },
  {
    id: 'musk-mini-x',
    symbol: 'mmx',
    name: 'Musk Mini X',
    image: '/musk_mini_x.png',
    get current_price() {
      return getMuskMiniXMetrics().price;
    },
    market_cap: 7496000,
    market_cap_rank: 8,
    total_volume: 950000,
    get price_change_percentage_1h_in_currency() {
      return getMuskMiniXMetrics().change1h;
    },
    get price_change_percentage_24h() {
      return getMuskMiniXMetrics().change24h;
    },
    get price_change_percentage_7d_in_currency() {
      return getMuskMiniXMetrics().change7d;
    },
    circulating_supply: 100000000,
    max_supply: 1000000000,
    sparkline_in_7d: {
      price: [0.03, 0.04, 0.05, 0.055, 0.06, 0.065, 0.07496]
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
              : coin.id === 'oil-lab'
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
                    : coin.id === 'bird'
                      ? 'Bird is a community-driven token soaring through the crypto skies, combining viral meme energy with real DeFi utility.'
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
      'osro': getOSROMetrics,
      'musk-mini-x': getMuskMiniXMetrics,
      'oil-lab': getOilLabMetrics,
      'baby-trump': getBabyTrumpMetrics,
      'trump-tmp': getTrumpTMPMetrics,
      'trump-us': getTrumpUSMetrics,
      'blackrock-contract': getBlackRockMetrics,
      'bird': getBirdMetrics
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
