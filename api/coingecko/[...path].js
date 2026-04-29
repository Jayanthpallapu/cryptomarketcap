// Vercel Serverless Function: Proxy for CoinGecko API
// This runs on the server, keeping the API key hidden and providing server-side caching.

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Simple in-memory cache (persists across warm function invocations)
const cache = {};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract the API path from the request URL
  // e.g. /api/coingecko/coins/markets?vs_currency=usd → /coins/markets?vs_currency=usd
  const fullPath = req.url.replace(/^\/api\/coingecko/, '');
  const targetUrl = `${COINGECKO_BASE}${fullPath}`;

  // Cache key is the full target URL
  const cacheKey = targetUrl;
  const CACHE_TTL = 120_000; // 2 minutes

  // Return cached response if fresh
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json(cached.data);
  }

  try {
    const apiKey = process.env.VITE_CG_API_KEY || process.env.CG_API_KEY;
    const headers = { 'Accept': 'application/json' };
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }

    const response = await fetch(targetUrl, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CoinGecko error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        error: `CoinGecko API returned ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    // Cache the successful response
    cache[cacheKey] = { data, timestamp: Date.now() };

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch from CoinGecko' });
  }
}
