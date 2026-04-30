export function formatCurrency(num, decimals = 2) {
  if (num == null || isNaN(num)) return '$0.00';
  if (Math.abs(num) >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
  if (Math.abs(num) >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
  if (Math.abs(num) >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
  if (Math.abs(num) >= 1e3) return '$' + Number(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (Math.abs(num) < 0.01) return '$' + num.toFixed(6);
  return '$' + num.toFixed(decimals);
}

export function formatNumber(num, decimals = 0) {
  if (num == null || isNaN(num)) return '0';
  if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return Number(num).toLocaleString('en-US', { maximumFractionDigits: decimals });
}

export function formatPercent(num) {
  if (num == null || isNaN(num)) return '0.00%';
  const absNum = Math.abs(num);
  if (absNum >= 1000) {
    const val = num / 1000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'k%';
  }
  return absNum.toFixed(2) + '%';
}

export function getChangeClass(num) {
  if (num == null) return '';
  return num >= 0 ? 'green' : 'red';
}

export function getChangeArrow(num) {
  if (num == null) return '';
  return num >= 0 ? '▲' : '▼';
}

export function formatSupply(num, symbol) {
  if (num == null) return 'N/A';
  return formatNumber(num) + (symbol ? ' ' + symbol.toUpperCase() : '');
}
