const BASE = '/api/coingecko';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) { await delay(2000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await delay(1000 * (i + 1));
    }
  }
  throw new Error('Failed to fetch after multiple retries');
}

export async function getGlobalData() {
  const data = await fetchWithRetry(`${BASE}/global`);
  return data.data;
}

export async function getCoins(page = 1, perPage = 100, order = 'market_cap_desc') {
  return fetchWithRetry(
    `${BASE}/coins/markets?vs_currency=usd&order=${order}&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`
  );
}

export async function getTrending() {
  const data = await fetchWithRetry(`${BASE}/search/trending`);
  return data.coins || [];
}

export async function getCoinDetail(id) {
  return fetchWithRetry(
    `${BASE}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`
  );
}

export async function getCoinChart(id, days = 7) {
  return fetchWithRetry(
    `${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
  );
}

export async function searchCoins(query) {
  const data = await fetchWithRetry(`${BASE}/search?query=${encodeURIComponent(query)}`);
  return data.coins || [];
}

export async function getExchanges(page = 1, perPage = 100) {
  return fetchWithRetry(`${BASE}/exchanges?per_page=${perPage}&page=${page}`);
}
