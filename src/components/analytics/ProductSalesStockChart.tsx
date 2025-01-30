import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardProduct, DashboardOrder } from '../../types/dashboard';
import { mergeProductsBySku } from '../../utils/productMerger';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Calendar } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';

interface ProductSalesStockChartProps {
  products: DashboardProduct[];
  orders: DashboardOrder[];
}

interface ChartDataItem {
  name: string;
  fullName: string;
  sku: string;
  sales: number;
  stock: number;
  category: string;
}

interface DateRange {
  from: string;
  to: string;
}

interface SortConfig {
  key: 'name' | 'sales' | 'stock';
  direction: 'asc' | 'desc';
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const { fullName, sku } = payload[0]?.payload || {};
    return (
        <div className="bg-[#1A1A27] p-4 rounded-lg shadow-lg border-0">
          <p className="text-white font-medium mb-2 text-base">{fullName}</p>
          <p className="text-gray-400 text-xs mb-3">SKU: {sku || 'N/A'}</p>
          {payload.map((entry: any, index: number) => (
              <p key={index} className={`text-sm font-medium ${entry.name === 'Stock' ? 'text-indigo-400' : 'text-emerald-400'} mb-1`}>
                {entry.name}: {entry.value.toLocaleString()}
              </p>
          ))}
        </div>
    );
  }
  return null;
};

export const ProductSalesStockChart: React.FC<ProductSalesStockChartProps> = ({ products, orders }) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTimeRange,
    setSelectedTimeRange,
    customDateRange,
    setCustomDateRange,
    useCustomDateRange,
    setUseCustomDateRange,
    stockRange,
    setStockRange,
    salesRange,
    setSalesRange
  } = useFilter();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'sales', direction: 'desc' });

  const ITEMS_PER_PAGE = 10;

  const getDateRange = (range: string): { from: Date; to: Date } => {
    if (useCustomDateRange) {
      return {
        from: new Date(customDateRange.from),
        to: new Date(customDateRange.to)
      };
    }

    const now = new Date();
    const to = now;
    let from = new Date();

    switch (range) {
      case 'Last 12 Months':
        from.setMonth(now.getMonth() - 12);
        break;
      case 'Last 6 Months':
        from.setMonth(now.getMonth() - 6);
        break;
      case 'Last 30 Days':
        from.setDate(now.getDate() - 30);
        break;
      case 'Last Week':
        from.setDate(now.getDate() - 7);
        break;
      case 'Custom':
        return {
          from: new Date(customDateRange.from),
          to: new Date(customDateRange.to)
        };
      default:
        from.setMonth(now.getMonth() - 12);
    }
    return { from, to };
  };

  const categories = useMemo(() => {
    const uniqueCategories = new Set(products
        .map(product => product.product_type || 'Uncategorized')
        .filter(category => category.toLowerCase() !== 'all')
    );
    return ['All', ...Array.from(uniqueCategories)];
  }, [products]);

  const filteredAndSortedData: ChartDataItem[] = useMemo(() => {
    const { from, to } = getDateRange(useCustomDateRange ? 'Custom' : selectedTimeRange);
    const dateRange = { from: from.toISOString(), to: to.toISOString() };

    let mergedProducts = mergeProductsBySku(products, orders, selectedCategory, dateRange);

    // Convert to chart data format
    let chartItems = mergedProducts.map(product => ({
      name: product.name.length > 20 ? `${product.name.substring(0, 10)}...` : product.name,
      fullName: product.name,
      sku: product.sku,
      stock: product.stock,
      sales: product.sales,
      category: product.product_type
    }));

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      chartItems = chartItems.filter(item =>
          item.fullName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query)
      );
    }

    // Apply stock range filter
    if (stockRange.min > 0 || stockRange.max) {
      chartItems = chartItems.filter(item =>
          item.stock >= stockRange.min &&
          (!stockRange.max || item.stock <= stockRange.max)
      );
    }

    // Apply sales range filter
    if (salesRange.min > 0 || salesRange.max) {
      chartItems = chartItems.filter(item =>
          item.sales >= salesRange.min &&
          (!salesRange.max || item.sales <= salesRange.max)
      );
    }

    // Apply sorting
    chartItems.sort((a, b) => {
      const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
      if (sortConfig.key === 'name') {
        return multiplier * a.fullName.localeCompare(b.fullName);
      }
      return multiplier * (a[sortConfig.key] - b[sortConfig.key]);
    });

    return chartItems;
  }, [products, orders, selectedCategory, selectedTimeRange, searchQuery, sortConfig, stockRange, salesRange, useCustomDateRange, customDateRange]);

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
  const chartData = filteredAndSortedData.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPage(prev => Math.max(1, prev - 1));
    } else {
      setCurrentPage(prev => Math.min(totalPages, prev + 1));
    }
  };

  return (
      <div className="w-full h-full">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1F1D2A] text-gray-300 border border-gray-700 rounded-lg pl-10 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-[#1C1B23] transition-colors duration-200"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#1F1D2A] text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-[#1C1B23] transition-colors duration-200"
              >
                {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                  value={useCustomDateRange ? 'Custom' : selectedTimeRange}
                  onChange={(e) => {
                    if (e.target.value === 'Custom') {
                      setUseCustomDateRange(true);
                    } else {
                      setUseCustomDateRange(false);
                      setSelectedTimeRange(e.target.value);
                    }
                  }}
                  className="bg-[#1F1D2A] text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-[#1C1B23] transition-colors duration-200"
              >
                <option value="Last 12 Months">Last 12 Months</option>
                <option value="Last 6 Months">Last 6 Months</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last Week">Last Week</option>
                <option value="Custom">Custom Range</option>
              </select>
            </div>
            {useCustomDateRange && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-300" />
                  <input
                      type="date"
                      value={customDateRange.from}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="bg-[#1F1D2A] text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-[#1C1B23] transition-colors duration-200"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                      type="date"
                      value={customDateRange.to}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="bg-[#1F1D2A] text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-[#1C1B23] transition-colors duration-200"
                  />
                </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <input
                  type="number"
                  placeholder="Min Stock"
                  value={stockRange.min || ''}
                  onChange={(e) => setStockRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                  className="w-32 bg-[#1F1D2A] text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-[#1C1B23] transition-colors duration-200"
              />
              <span className="text-gray-400">-</span>
              <input
                  type="number"
                  placeholder="Max Stock"
                  value={stockRange.max || ''}
                  onChange={(e) => setStockRange(prev => ({ ...prev, max: Number(e.target.value) || null }))}
                  className="w-32 bg-[#1F1D2A] text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-[#1C1B23] transition-colors duration-200"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                  type="number"
                  placeholder="Min Sales"
                  value={salesRange.min || ''}
                  onChange={(e) => setSalesRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                  className="w-32 bg-[#1F1D2A] text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-[#1C1B23] transition-colors duration-200"
              />
              <span className="text-gray-400">-</span>
              <input
                  type="number"
                  placeholder="Max Sales"
                  value={salesRange.max || ''}
                  onChange={(e) => setSalesRange(prev => ({ ...prev, max: Number(e.target.value) || null }))}
                  className="w-32 bg-[#1F1D2A] text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-[#1C1B23] transition-colors duration-200"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                  onClick={() => handleSort('name')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm ${
                      sortConfig.key === 'name' ? 'text-indigo-400' : 'text-gray-400'
                  } hover:bg-[#1C1B23] transition-colors duration-200`}
              >
                <span>Name</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>
              <button
                  onClick={() => handleSort('sales')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm ${
                      sortConfig.key === 'sales' ? 'text-indigo-400' : 'text-gray-400'
                  } hover:bg-[#1C1B23] transition-colors duration-200`}
              >
                <span>Sales</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>
              <button
                  onClick={() => handleSort('stock')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm ${
                      sortConfig.key === 'stock' ? 'text-indigo-400' : 'text-gray-400'
                  } hover:bg-[#1C1B23] transition-colors duration-200`}
              >
                <span>Stock</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-300 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
              <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-300 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-4 hover:bg-[#1F1D2A] transition-colors duration-200">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2B3B" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#1A1A27',
                    border: 'none',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
              />
              <Legend />
              <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
              />
              <Bar
                  dataKey="stock"
                  name="Stock"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
  );
};