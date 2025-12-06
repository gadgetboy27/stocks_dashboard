# Stock Comparison Dashboard - User Guide

## Overview

The Stock Comparison Dashboard is a powerful feature that allows you to compare multiple stock tickers side-by-side with real-time data visualization and metrics.

## Features

### 1. Multi-Stock Comparison
- Add unlimited stocks to compare simultaneously
- View overlaid price charts for easy visual comparison
- Color-coded lines for each stock ticker

### 2. Real-Time Data
- Live stock quotes with current price, change, and percentage
- Automatic data refresh capability
- Multiple timeframe options: 1D, 5D, 1M, 3M, 1Y

### 3. Dynamic Stock Management
- **Search**: Type any stock ticker (e.g., AAPL, TSLA, GOOGL) to search
- **Add**: Click on search results to add stocks to comparison
- **Remove**: Click the X button on any stock card to remove it
- **Quick Add**: Click the "Add Stock" card to focus search

### 4. Comprehensive Metrics
Each stock displays:
- Current Price
- Price Change ($ and %)
- Open, High, Low prices
- Trading Volume
- Visual indicators (↑ green for gains, ↓ red for losses)

### 5. Interactive Charts
- Synchronized time ranges across all stocks
- Zoom and crosshair functionality
- Tooltips showing exact values
- Responsive design for all screen sizes

## Getting Started

### Setup API Key (Recommended)

1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
3. Add your API key to `.env`:
   ```env
   REACT_APP_ALPHA_VANTAGE_KEY=your_actual_api_key_here
   ```
4. Restart the development server:
   ```bash
   npm start
   ```

**Note**: The demo key has limited symbols. For full access to all stocks, use your own API key.

### Usage

1. Navigate to "Stock Comparison" in the sidebar (Apps section)
2. Use the search bar to find stocks by ticker symbol
3. Click on search results to add them to the comparison
4. Select different time ranges to view historical performance
5. Click the refresh button to update all data
6. Remove stocks by clicking the X button on their cards

## API Providers

### Currently Supported:
- **Alpha Vantage** (Primary) - Free tier: 5 calls/min, 500 calls/day
- **Finnhub** (Optional) - Free tier: 60 calls/min

### API Provider Architecture

The app is built with a modular API service layer that supports multiple providers. You can easily switch between providers or add new ones by modifying `/src/services/stockApi.js`.

To use Finnhub instead:
```javascript
import { stockApi, API_PROVIDERS } from '../services/stockApi';

// Switch provider
stockApi.setProvider(API_PROVIDERS.FINNHUB);
```

## Time Range Options

- **1D**: Intraday data with 5-minute intervals (last ~6.5 hours of trading)
- **5D**: 5 days of daily closing prices
- **1M**: 1 month of historical data
- **3M**: 3 months of historical data
- **1Y**: 1 year of historical data

## Tips & Best Practices

1. **API Rate Limits**: Be mindful of API rate limits. The demo key is very limited.
2. **Stock Selection**: Start with 2-3 stocks for clearer comparisons
3. **Time Ranges**: Use 1D for intraday trading, longer ranges for trend analysis
4. **Refresh Wisely**: Refresh button fetches new data but counts against API limits
5. **Search by Symbol**: Use exact ticker symbols for best results (AAPL, not Apple)

## Common Stock Tickers

- **Tech**: AAPL (Apple), MSFT (Microsoft), GOOGL (Google), AMZN (Amazon), META (Meta)
- **Auto**: TSLA (Tesla), F (Ford), GM (General Motors)
- **Finance**: JPM (JPMorgan), BAC (Bank of America), GS (Goldman Sachs)
- **Retail**: WMT (Walmart), TGT (Target), COST (Costco)

## Troubleshooting

### "API rate limit exceeded"
- Using the demo key? Get your own free API key
- Hit your daily limit? Wait 24 hours or upgrade your API plan
- Try reducing refresh frequency

### "No data available for symbol"
- Verify the ticker symbol is correct
- Some symbols may not be available with the demo key
- Try with your own API key

### "Invalid symbol"
- Double-check the ticker spelling
- Use the search feature instead of typing directly
- Some international stocks may require exchange prefix (e.g., TSX:SHOP)

## Future Enhancements

Potential features for future development:
- API provider selection dropdown in the UI
- Save favorite watchlists to local storage
- Technical indicators (RSI, MACD, Moving Averages)
- Stock news integration
- Export comparison data to CSV
- Real-time WebSocket updates
- Cryptocurrency support
- Portfolio tracking

## Architecture

```
src/
├── services/
│   └── stockApi.js          # API service layer (multi-provider support)
├── pages/
│   └── StockComparison.jsx  # Main comparison page component
└── data/
    └── dummy.js             # Navigation configuration
```

## Contributing

To add a new API provider:

1. Add provider constant to `API_PROVIDERS` in `stockApi.js`
2. Add API key configuration
3. Implement provider-specific methods:
   - `getQuote(symbol)`
   - `getIntradayData(symbol, interval)`
   - `getDailyData(symbol, outputSize)`
   - `searchSymbols(keywords)`
4. Update provider switch cases

## Resources

- [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/)
- [Finnhub API Docs](https://finnhub.io/docs/api)
- [Syncfusion Charts](https://ej2.syncfusion.com/react/documentation/chart/getting-started/)

---

**Enjoy comparing stocks!** 📈📊
