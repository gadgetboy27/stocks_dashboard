// Mock stock data for demo purposes when API is rate limited or unavailable
// This provides a fallback so users can see the feature working

export const mockStockQuotes = {
  IBM: {
    symbol: 'IBM',
    price: 186.45,
    change: 2.15,
    changePercent: 1.17,
    volume: 3456789,
    latestTradingDay: '2024-12-06',
    previousClose: 184.30,
    open: 185.20,
    high: 187.80,
    low: 184.90,
  },
  MSFT: {
    symbol: 'MSFT',
    price: 378.91,
    change: -1.24,
    changePercent: -0.33,
    volume: 21345678,
    latestTradingDay: '2024-12-06',
    previousClose: 380.15,
    open: 379.50,
    high: 381.20,
    low: 377.85,
  },
  AAPL: {
    symbol: 'AAPL',
    price: 193.58,
    change: 1.87,
    changePercent: 0.98,
    volume: 45678901,
    latestTradingDay: '2024-12-06',
    previousClose: 191.71,
    open: 192.30,
    high: 194.25,
    low: 191.90,
  },
  GOOGL: {
    symbol: 'GOOGL',
    price: 141.23,
    change: -0.56,
    changePercent: -0.39,
    volume: 18234567,
    latestTradingDay: '2024-12-06',
    previousClose: 141.79,
    open: 141.50,
    high: 142.10,
    low: 140.85,
  },
  TSLA: {
    symbol: 'TSLA',
    price: 238.45,
    change: 5.67,
    changePercent: 2.44,
    volume: 98765432,
    latestTradingDay: '2024-12-06',
    previousClose: 232.78,
    open: 235.20,
    high: 240.15,
    low: 234.50,
  },
};

// Generate mock daily data for the past 30 days
export const generateMockDailyData = (symbol, days = 30) => {
  const data = [];
  const basePrice = mockStockQuotes[symbol]?.price || 100;
  const today = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue; // eslint-disable-line no-continue
    }

    // Random walk with slight upward bias
    const randomChange = (Math.random() - 0.48) * 5;
    const price = basePrice + randomChange - (i * 0.1);
    const open = price + (Math.random() - 0.5) * 2;
    const close = price + (Math.random() - 0.5) * 2;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;

    data.push({
      x: new Date(date),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 5000000,
    });
  }

  return data;
};

export const mockSearchResults = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States', currency: 'USD' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Equity', region: 'United States', currency: 'USD' },
  { symbol: 'IBM', name: 'International Business Machines', type: 'Equity', region: 'United States', currency: 'USD' },
];
