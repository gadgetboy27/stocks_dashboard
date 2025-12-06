import React, { useState, useEffect } from 'react';
import { MdAddCircleOutline, MdRefresh } from 'react-icons/md';
import { IoMdClose } from 'react-icons/io';
import { AiOutlineSearch, AiOutlineRise, AiOutlineFall } from 'react-icons/ai';
import { ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, LineSeries, DateTime, Legend, Tooltip, Crosshair, Zoom } from '@syncfusion/ej2-react-charts';

import { stockApi } from '../services/stockApi';
import { useStateContext } from '../contexts/ContextProvider';
import { Header } from '../components';

const StockComparison = () => {
  const { currentColor, currentMode } = useStateContext();

  // State management
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({});
  const [timeRange, setTimeRange] = useState('1D'); // 1D, 5D, 1M, 3M, 1Y
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper functions
  const getRandomColor = () => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addStock = async (symbol) => {
    // Check if already added
    if (stocks.find((s) => s.symbol === symbol)) {
      setError(`${symbol} is already added`);
      return;
    }

    // Add stock to list
    const newStock = {
      symbol,
      quote: null,
      color: getRandomColor(),
    };

    setStocks((prev) => [...prev, newStock]);
    setSearchQuery('');
    setSearchResults([]);

    // Fetch data will be triggered by useEffect
  };

  const fetchStockData = async (symbol) => {
    setLoading((prev) => ({ ...prev, [symbol]: true }));
    setError(null);

    try {
      // Fetch quote data
      const quote = await stockApi.getQuote(symbol);

      // Fetch historical data based on time range
      let historicalData;
      if (timeRange === '1D') {
        historicalData = await stockApi.getIntradayData(symbol, '5min');
        // Limit to today's data
        historicalData = historicalData.slice(-78); // Last ~6.5 hours of trading
      } else {
        historicalData = await stockApi.getDailyData(symbol, 'compact');

        // Filter based on time range
        const now = new Date();
        const daysMap = { '5D': 5, '1M': 30, '3M': 90, '1Y': 365 };
        const days = daysMap[timeRange] || 30;
        const cutoffDate = new Date(now.setDate(now.getDate() - days));
        historicalData = historicalData.filter((d) => new Date(d.x) >= cutoffDate);
      }

      // Update stock with quote
      setStocks((prev) => prev.map((s) => (s.symbol === symbol ? { ...s, quote } : s)));

      // Update chart data
      setChartData((prev) => ({
        ...prev,
        [symbol]: historicalData,
      }));
    } catch (err) {
      console.error(`Error fetching data for ${symbol}:`, err);
      setError(err.message);

      // Remove stock if fetch fails
      setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
    } finally {
      setLoading((prev) => ({ ...prev, [symbol]: false }));
    }
  };

  const loadInitialStocks = async () => {
    // Using symbols that work with Alpha Vantage demo key
    const defaultStocks = ['IBM', 'MSFT'];
    // eslint-disable-next-line no-restricted-syntax
    for (const symbol of defaultStocks) {
      // eslint-disable-next-line no-await-in-loop
      await addStock(symbol);
    }
  };

  const fetchAllStockData = async () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const stock of stocks) {
      if (!stock.quote || !chartData[stock.symbol]) {
        // eslint-disable-next-line no-await-in-loop
        await fetchStockData(stock.symbol);
      }
    }
  };

  // Load sample stocks on mount
  useEffect(() => {
    loadInitialStocks();
  }, []); // eslint-disable-line

  // Fetch data when stocks or time range changes
  useEffect(() => {
    if (stocks.length > 0) {
      fetchAllStockData();
    }
  }, [stocks, timeRange, refreshKey]); // eslint-disable-line

  const handleSearch = async (query) => {
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await stockApi.searchSymbols(query);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  };

  const removeStock = (symbol) => {
    setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
    setChartData((prev) => {
      const newData = { ...prev };
      delete newData[symbol];
      return newData;
    });
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatVolume = (vol) => {
    if (vol === null || vol === undefined) return 'N/A';
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toString();
  };

  // Chart configuration
  const primaryXAxis = {
    valueType: 'DateTime',
    labelFormat: timeRange === '1D' ? 'HH:mm' : 'MMM dd',
    intervalType: timeRange === '1D' ? 'Hours' : 'Days',
    edgeLabelPlacement: 'Shift',
    majorGridLines: { width: 0 },
  };

  const primaryYAxis = {
    labelFormat: '$value',
    rangePadding: 'None',
    lineStyle: { width: 0 },
    majorTickLines: { width: 0 },
    minorTickLines: { width: 0 },
  };

  return (
    <div className="m-4 md:m-10 mt-24 p-10 bg-white dark:bg-secondary-dark-bg rounded-3xl">
      <Header category="Financial Analysis" title="Stock Comparison Dashboard" />

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xl">
            <IoMdClose />
          </button>
        </div>
      )}

      {/* Search and Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 min-w-64 relative">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
            <AiOutlineSearch className="text-xl text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search stocks (e.g., AAPL, TSLA, MSFT)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.symbol}
                  type="button"
                  onClick={() => addStock(result.symbol)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-600"
                >
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {result.symbol}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {result.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {['1D', '5D', '1M', '3M', '1Y'].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={timeRange === range ? { backgroundColor: currentColor } : {}}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Refresh data"
        >
          <MdRefresh className="text-xl" />
        </button>
      </div>

      {/* Stock Cards - Comparison Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stocks.map((stock) => {
          const { quote } = stock;
          const isPositive = quote?.change >= 0;
          const isLoading = loading[stock.symbol];

          return (
            <div
              key={stock.symbol}
              className="relative bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-l-4"
              style={{ borderLeftColor: stock.color }}
            >
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeStock(stock.symbol)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <IoMdClose className="text-xl" />
              </button>

              {/* Symbol and Name */}
              <div className="mb-3">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {stock.symbol}
                </h3>
                <div className="flex items-center mt-1">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: stock.color }}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Chart Color
                  </span>
                </div>
              </div>

              {isLoading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
                  <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
              )}
              {!isLoading && quote && (
                <>
                  {/* Price */}
                  <div className="mb-2">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      ${formatNumber(quote.price)}
                    </div>
                  </div>

                  {/* Change */}
                  <div className="flex items-center mb-3">
                    {isPositive ? (
                      <AiOutlineRise className="text-green-500 text-xl mr-1" />
                    ) : (
                      <AiOutlineFall className="text-red-500 text-xl mr-1" />
                    )}
                    <span
                      className={`font-semibold ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatNumber(quote.change)} ({formatNumber(quote.changePercent)}%)
                    </span>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Open:</span>
                      <span className="ml-1 font-semibold text-gray-800 dark:text-gray-200">
                        ${formatNumber(quote.open)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">High:</span>
                      <span className="ml-1 font-semibold text-gray-800 dark:text-gray-200">
                        ${formatNumber(quote.high)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Low:</span>
                      <span className="ml-1 font-semibold text-gray-800 dark:text-gray-200">
                        ${formatNumber(quote.low)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Vol:</span>
                      <span className="ml-1 font-semibold text-gray-800 dark:text-gray-200">
                        {formatVolume(quote.volume)}
                      </span>
                    </div>
                  </div>
                </>
              )}
              {!isLoading && !quote && (
                <div className="text-center py-4 text-gray-500">No data</div>
              )}
            </div>
          );
        })}

        {/* Add Stock Card */}
        <button
          type="button"
          onClick={() => document.querySelector('input[placeholder*="Search stocks"]').focus()}
          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex flex-col items-center justify-center min-h-48"
        >
          <MdAddCircleOutline className="text-5xl text-gray-400 mb-2" />
          <span className="text-gray-600 dark:text-gray-400">Add Stock to Compare</span>
        </button>
      </div>

      {/* Comparison Chart */}
      {stocks.length > 0 && Object.keys(chartData).length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Price Comparison - {timeRange}
          </h3>
          <ChartComponent
            id="stock-comparison-chart"
            primaryXAxis={primaryXAxis}
            primaryYAxis={primaryYAxis}
            chartArea={{ border: { width: 0 } }}
            tooltip={{
              enable: true,
              shared: true,
              format: '{point.x} : <b>{point.y}</b>',
            }}
            crosshair={{ enable: true }}
            background={currentMode === 'Dark' ? '#1F2937' : '#F9FAFB'}
            height="450px"
            legendSettings={{
              visible: true,
              position: 'Top',
              textStyle: { color: currentMode === 'Dark' ? '#E5E7EB' : '#1F2937' },
            }}
          >
            <Inject services={[LineSeries, DateTime, Legend, Tooltip, Crosshair, Zoom]} />
            <SeriesCollectionDirective>
              {stocks.map((stock) => {
                const data = chartData[stock.symbol];
                if (!data || data.length === 0) return null;

                return (
                  <SeriesDirective
                    key={stock.symbol}
                    dataSource={data}
                    xName="x"
                    yName="close"
                    name={stock.symbol}
                    type="Line"
                    width="2"
                    marker={{ visible: false }}
                    fill={stock.color}
                  />
                );
              })}
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>
      )}

      {/* Empty State */}
      {stocks.length === 0 && (
        <div className="text-center py-16">
          <MdAddCircleOutline className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No stocks added yet
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Search and add stocks to start comparing
          </p>
        </div>
      )}

      {/* API Info Footer */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Using Alpha Vantage API with demo key (only works with IBM, MSFT, and a few other symbols).
          To access all stocks (AAPL, GOOGL, TSLA, etc.), get your free API key from{' '}
          <a
            href="https://www.alphavantage.co/support/#api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            alphavantage.co
          </a>
          {' '}and add it to a <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code> file as{' '}
          <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">REACT_APP_ALPHA_VANTAGE_KEY</code>
        </p>
      </div>
    </div>
  );
};

export default StockComparison;
