// Vercel Serverless Function: Proxy for CoinGecko API
// Keeps API key server-side and adds caching

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Simple in-memory cache
const cache = {};
const CACHE_TTL = 120000; // 2 minutes

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Build the CoinGecko URL from the incoming request
    // req.url will be something like: /api/coingecko/coins/markets?vs_currency=usd
    const apiPath = req.url.replace(/^\/api\/coingecko\/?/, '/');
    const targetUrl = `${COINGECKO_BASE}${apiPath}`;

    // Check cache
    const cached = cache[targetUrl];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
      return res.status(200).json(cached.data);
    }

    // Build headers with API key
    const apiKey = process.env.CG_API_KEY || process.env.VITE_CG_API_KEY || '';
    const headers = { 'Accept': 'application/json' };
    if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

    // Fetch from CoinGecko
    const response = await fetch(targetUrl, { headers });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`CoinGecko ${response.status}: ${text.slice(0, 200)}`);
      return res.status(response.status).json({
        error: `CoinGecko returned ${response.status}`,
        message: text.slice(0, 200)
      });
    }

    const data = await response.json();

    // Cache successful response
    cache[targetUrl] = { data, ts: Date.now() };

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).json({ error: 'Proxy failed', message: err.message });
  }
}
