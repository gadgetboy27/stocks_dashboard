// Stock API Service Layer
// Supports multiple API providers with a unified interface

const API_PROVIDERS = {
  ALPHA_VANTAGE: 'alphavantage',
  FINNHUB: 'finnhub',
  YAHOO: 'yahoo',
};

// API Keys - Users should add their own keys here or use environment variables
const API_KEYS = {
  ALPHA_VANTAGE: process.env.REACT_APP_ALPHA_VANTAGE_KEY || 'demo', // 'demo' key has limited symbols
  FINNHUB: process.env.REACT_APP_FINNHUB_KEY || '',
};

class StockApiService {
  constructor(provider = API_PROVIDERS.ALPHA_VANTAGE) {
    this.provider = provider;
  }

  /**
   * Get real-time quote for a stock
   * @param {string} symbol - Stock ticker symbol
   * @returns {Promise<Object>} Stock quote data
   */
  async getQuote(symbol) {
    try {
      switch (this.provider) {
        case API_PROVIDERS.ALPHA_VANTAGE:
          return await this.getAlphaVantageQuote(symbol);
        case API_PROVIDERS.FINNHUB:
          return await this.getFinnhubQuote(symbol);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get historical intraday data
   * @param {string} symbol - Stock ticker symbol
   * @param {string} interval - Time interval (1min, 5min, 15min, 30min, 60min)
   * @returns {Promise<Array>} Historical data points
   */
  async getIntradayData(symbol, interval = '5min') {
    try {
      switch (this.provider) {
        case API_PROVIDERS.ALPHA_VANTAGE:
          return await this.getAlphaVantageIntraday(symbol, interval);
        case API_PROVIDERS.FINNHUB:
          return await this.getFinnhubCandles(symbol);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`Error fetching intraday data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get daily historical data
   * @param {string} symbol - Stock ticker symbol
   * @param {string} outputSize - 'compact' (100 days) or 'full' (20+ years)
   * @returns {Promise<Array>} Historical daily data
   */
  async getDailyData(symbol, outputSize = 'compact') {
    try {
      switch (this.provider) {
        case API_PROVIDERS.ALPHA_VANTAGE:
          return await this.getAlphaVantageDaily(symbol, outputSize);
        case API_PROVIDERS.FINNHUB:
          return await this.getFinnhubDaily(symbol);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`Error fetching daily data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Search for stock symbols
   * @param {string} keywords - Search keywords
   * @returns {Promise<Array>} Matching symbols
   */
  async searchSymbols(keywords) {
    try {
      switch (this.provider) {
        case API_PROVIDERS.ALPHA_VANTAGE:
          return await this.searchAlphaVantage(keywords);
        case API_PROVIDERS.FINNHUB:
          return await this.searchFinnhub(keywords);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('Error searching symbols:', error);
      throw error;
    }
  }

  // Alpha Vantage API Methods
  // eslint-disable-next-line class-methods-use-this
  async getAlphaVantageQuote(symbol) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message']) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }

    if (data.Note) {
      throw new Error('API rate limit exceeded. Please try again later or add your own API key.');
    }

    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      throw new Error(`No data available for symbol: ${symbol}`);
    }

    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume'], 10),
      latestTradingDay: quote['07. latest trading day'],
      previousClose: parseFloat(quote['08. previous close']),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async getAlphaVantageIntraday(symbol, interval = '5min') {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message']) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }

    if (data.Note) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    const timeSeries = data[`Time Series (${interval})`];
    if (!timeSeries) {
      throw new Error(`No intraday data available for ${symbol}`);
    }

    return Object.entries(timeSeries).map(([timestamp, values]) => ({
      x: new Date(timestamp),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10),
    })).reverse();
  }

  // eslint-disable-next-line class-methods-use-this
  async getAlphaVantageDaily(symbol, outputSize = 'compact') {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message']) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }

    if (data.Note) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error(`No daily data available for ${symbol}`);
    }

    return Object.entries(timeSeries).map(([date, values]) => ({
      x: new Date(date),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10),
    })).reverse();
  }

  // eslint-disable-next-line class-methods-use-this
  async searchAlphaVantage(keywords) {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Note) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    const matches = data.bestMatches || [];
    return matches.map((match) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      currency: match['8. currency'],
    }));
  }

  // Finnhub API Methods (for future use)
  // eslint-disable-next-line class-methods-use-this
  async getFinnhubQuote(symbol) {
    if (!API_KEYS.FINNHUB) {
      throw new Error('Finnhub API key not configured');
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEYS.FINNHUB}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async getFinnhubCandles(symbol) {
    if (!API_KEYS.FINNHUB) {
      throw new Error('Finnhub API key not configured');
    }

    const to = Math.floor(Date.now() / 1000);
    const from = to - 24 * 60 * 60; // Last 24 hours

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=5&from=${from}&to=${to}&token=${API_KEYS.FINNHUB}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.s === 'no_data') {
      throw new Error(`No data available for ${symbol}`);
    }

    return data.t.map((timestamp, index) => ({
      x: new Date(timestamp * 1000),
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index],
    }));
  }

  // eslint-disable-next-line class-methods-use-this
  async getFinnhubDaily(symbol) {
    // Similar to candles but with daily resolution
    if (!API_KEYS.FINNHUB) {
      throw new Error('Finnhub API key not configured');
    }

    const to = Math.floor(Date.now() / 1000);
    const from = to - 90 * 24 * 60 * 60; // Last 90 days

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${API_KEYS.FINNHUB}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.s === 'no_data') {
      throw new Error(`No data available for ${symbol}`);
    }

    return data.t.map((timestamp, index) => ({
      x: new Date(timestamp * 1000),
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index],
    }));
  }

  // eslint-disable-next-line class-methods-use-this
  async searchFinnhub(keywords) {
    if (!API_KEYS.FINNHUB) {
      throw new Error('Finnhub API key not configured');
    }

    const url = `https://finnhub.io/api/v1/search?q=${keywords}&token=${API_KEYS.FINNHUB}`;
    const response = await fetch(url);
    const data = await response.json();

    return (data.result || []).map((item) => ({
      symbol: item.symbol,
      name: item.description,
      type: item.type,
    }));
  }

  // Utility method to change provider
  setProvider(provider) {
    if (!Object.values(API_PROVIDERS).includes(provider)) {
      throw new Error(`Invalid provider: ${provider}`);
    }
    this.provider = provider;
  }

  getProvider() {
    return this.provider;
  }

  // eslint-disable-next-line class-methods-use-this
  getAvailableProviders() {
    return Object.values(API_PROVIDERS);
  }
}

// Export singleton instance
export const stockApi = new StockApiService();
export { API_PROVIDERS, StockApiService };
