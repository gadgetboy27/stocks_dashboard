# Build and Deploy a React Admin Dashboard App With Theming, Tables, Charts, Calendar, Kanban and More
![Shoppy](https://i.ibb.co/W6g39w3/image.png)

## Introduction
This is a code repository for the corresponding video tutorial, enhanced with a powerful **Stock Comparison Dashboard** feature.

If you want to get a finished, highly customizable Material UI version of a similar dashboard, check out [Flexy React Material Dashboard](https://www.wrappixel.com/templates/flexy-react-material-dashboard-admin/?ref=257&campaign=Flexy).

## New Feature: Stock Comparison Dashboard

Compare multiple stock tickers side-by-side with real-time data and interactive charts!

### Features:
- **Multi-Stock Comparison**: Add and compare unlimited stocks simultaneously
- **Real-Time Data**: Live stock quotes via Alpha Vantage API (or Finnhub)
- **Dynamic Management**: Search, add, and remove stocks on-the-fly
- **Interactive Charts**: Overlaid price comparison with multiple timeframes (1D, 5D, 1M, 3M, 1Y)
- **Comprehensive Metrics**: Price, change %, volume, open, high, low for each stock
- **Modular API Architecture**: Easy to switch between API providers or add new ones

### Quick Start:

1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Add your API key to `.env`:
   ```
   REACT_APP_ALPHA_VANTAGE_KEY=your_api_key_here
   ```
4. Navigate to **Stock Comparison** in the Apps menu

For detailed documentation, see [STOCK_COMPARISON_GUIDE.md](./STOCK_COMPARISON_GUIDE.md)

## Launch your development career with project-based coaching - https://www.jsmastery.pro
