// Stock API Service Layer
// Supports multiple API providers with a unified interface

import { mockStockQuotes, generateMockDailyData, mockSearchResults } from '../data/mockStockData';

const API_PROVIDERS = {
  ALPHA_VANTAGE: 'alphavantage',
  FINNHUB: 'finnhub',
  YAHOO: 'yahoo',
};

// Flag to use mock data (automatically enabled when API fails)
let useMockData = false;

// API Keys - Users should add their own keys here or use environment variables
const API_KEYS = {
  ALPHA_VANTAGE: process.env.REACT_APP_ALPHA_VANTAGE_KEY || 'demo', // 'demo' key has limited symbols
  FINNHUB: process.env.REACT_APP_FINNHUB_KEY || '',
};

class StockApiService {
  constructor(provider = API_PROVIDERS.YAHOO) {
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
        case API_PROVIDERS.YAHOO:
          return await this.getYahooQuote(symbol);
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
        case API_PROVIDERS.YAHOO:
          return await this.getYahooDaily(symbol, outputSize);
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
        case API_PROVIDERS.YAHOO:
          return await this.searchYahoo(keywords);
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
    // Use mock data if flag is set or if demo key
    if (useMockData || API_KEYS.ALPHA_VANTAGE === 'demo') {
      console.log(`Using mock data for ${symbol} quote (API key: ${API_KEYS.ALPHA_VANTAGE})`);
      const mockQuote = mockStockQuotes[symbol];
      if (mockQuote) {
        return mockQuote;
      }
      throw new Error(`Mock data not available for symbol: ${symbol}`);
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
    const response = await fetch(url);
    const data = await response.json();

    console.log(`Alpha Vantage Quote API response for ${symbol}:`, data);

    if (data['Error Message']) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }

    if (data.Note || data.Information) {
      // Enable mock data for future calls
      useMockData = true;
      console.warn('API rate limited - switching to mock data');
      return this.getAlphaVantageQuote(symbol); // Retry with mock data
    }

    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      console.error('API Response keys:', Object.keys(data));
      // Fall back to mock data
      useMockData = true;
      return this.getAlphaVantageQuote(symbol);
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
    // Use mock data if flag is set or if demo key
    if (useMockData || API_KEYS.ALPHA_VANTAGE === 'demo') {
      console.log(`Using mock data for ${symbol} daily (API key: ${API_KEYS.ALPHA_VANTAGE})`);
      const days = outputSize === 'full' ? 365 : 100;
      return generateMockDailyData(symbol, days);
    }

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
    const response = await fetch(url);
    const data = await response.json();

    console.log(`Alpha Vantage API response for ${symbol}:`, data);

    if (data['Error Message']) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }

    if (data.Note || data.Information) {
      // Enable mock data for future calls
      useMockData = true;
      console.warn('API rate limited - switching to mock data');
      return this.getAlphaVantageDaily(symbol, outputSize);
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      console.error('API Response keys:', Object.keys(data));
      // Fall back to mock data
      useMockData = true;
      return this.getAlphaVantageDaily(symbol, outputSize);
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
    // Use mock data if flag is set or if demo key
    if (useMockData || API_KEYS.ALPHA_VANTAGE === 'demo') {
      console.log(`Using mock search results for "${keywords}"`);
      return mockSearchResults.filter((stock) =>
        stock.symbol.toLowerCase().includes(keywords.toLowerCase()) ||
        stock.name.toLowerCase().includes(keywords.toLowerCase())
      );
    }

    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Note || data.Information) {
      useMockData = true;
      console.warn('API rate limited - switching to mock data for search');
      return this.searchAlphaVantage(keywords);
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

  // Yahoo Finance API Methods
  // eslint-disable-next-line class-methods-use-this
  async getYahooQuote(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log(`Yahoo Finance Quote API response for ${symbol}:`, data);

      if (data.chart.error) {
        throw new Error(`Invalid symbol: ${symbol}`);
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];

      // Get the latest values
      const latestIndex = quote.close.length - 1;
      const currentPrice = meta.regularMarketPrice || quote.close[latestIndex];
      const previousClose = meta.chartPreviousClose || meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      return {
        symbol: meta.symbol,
        price: parseFloat(currentPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: quote.volume[latestIndex] || 0,
        latestTradingDay: new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0],
        previousClose: parseFloat(previousClose.toFixed(2)),
        open: quote.open[latestIndex] || currentPrice,
        high: quote.high[latestIndex] || currentPrice,
        low: quote.low[latestIndex] || currentPrice,
      };
    } catch (error) {
      console.error(`Yahoo Finance error for ${symbol}:`, error);
      throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async getYahooDaily(symbol, outputSize = 'compact') {
    try {
      // Calculate date range based on outputSize
      const period2 = Math.floor(Date.now() / 1000); // Current time
      const daysBack = outputSize === 'full' ? 365 * 5 : 100; // 5 years or 100 days
      const period1 = period2 - (daysBack * 24 * 60 * 60);

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
      const response = await fetch(url);
      const data = await response.json();

      console.log(`Yahoo Finance Daily API response for ${symbol}:`, data);

      if (data.chart.error) {
        throw new Error(`Invalid symbol: ${symbol}`);
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];

      // Transform to our standard format
      return timestamps.map((timestamp, index) => ({
        x: new Date(timestamp * 1000),
        open: parseFloat((quote.open[index] || 0).toFixed(2)),
        high: parseFloat((quote.high[index] || 0).toFixed(2)),
        low: parseFloat((quote.low[index] || 0).toFixed(2)),
        close: parseFloat((quote.close[index] || 0).toFixed(2)),
        volume: quote.volume[index] || 0,
      }));
    } catch (error) {
      console.error(`Yahoo Finance daily data error for ${symbol}:`, error);
      throw new Error(`Failed to fetch daily data for ${symbol}: ${error.message}`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async searchYahoo(keywords) {
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(keywords)}&quotesCount=10&newsCount=0`;
      const response = await fetch(url);
      const data = await response.json();

      console.log(`Yahoo Finance search results for "${keywords}":`, data);

      if (!data.quotes || data.quotes.length === 0) {
        return [];
      }

      return data.quotes
        .filter((item) => item.quoteType === 'EQUITY') // Only show stocks
        .map((item) => ({
          symbol: item.symbol,
          name: item.longname || item.shortname || item.symbol,
          type: item.quoteType,
          region: item.exchDisp || 'N/A',
          currency: item.currency || 'USD',
        }));
    } catch (error) {
      console.error('Yahoo Finance search error:', error);
      // Fall back to mock data on error
      console.log(`Using mock search results for "${keywords}"`);
      return mockSearchResults.filter((stock) =>
        stock.symbol.toLowerCase().includes(keywords.toLowerCase()) ||
        stock.name.toLowerCase().includes(keywords.toLowerCase())
      );
    }
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
