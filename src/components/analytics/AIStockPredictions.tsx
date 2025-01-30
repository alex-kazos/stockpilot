import React, { useState, useMemo } from 'react';
import { TrendingUp, ArrowUpCircle, ArrowDownCircle, MinusCircle, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { StockTrendModal } from './StockTrendModal';
import { Product, Order } from '../../types/shopify';
import { mergeProductsBySku } from '../../utils/productMerger';
import { calculateAdvancedPrediction, generateTrendlinePoints } from '../../utils/predictionModels';
import { useFilter } from '../../contexts/FilterContext';

interface AIStockPredictionsProps {
  products: Product[];
  orders: Order[];
}

interface ProductPrediction {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  predictedDemand: number;
  confidence: number;
  trend: number;
  stockCoverage: string;
  historicalSales: number[];
  trendlineData: {
    historical: number[];
    future: number[];
  };
  seasonalityFactor: number;
}

const getAction = (current: number, predicted: number, trend: number) => {
  if (current < predicted && trend > 0) {
    return {
      label: 'Urgent Restock',
      icon: <ArrowUpCircle className="w-4 h-4" />,
      className: 'bg-red-400/10 text-red-400 border border-red-400/20',
      priority: 1
    };
  } else if (current < predicted) {
    return {
      label: 'Restock Soon',
      icon: <ArrowUpCircle className="w-4 h-4" />,
      className: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20',
      priority: 2
    };
  } else if (current > predicted * 2 && trend < 0) {
    return {
      label: 'Excess Stock',
      icon: <ArrowDownCircle className="w-4 h-4" />,
      className: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
      priority: 3
    };
  }
  return {
    label: 'Optimal',
    icon: <MinusCircle className="w-4 h-4" />,
    className: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
    priority: 4
  };
};

export function AIStockPredictions({ products, orders }: AIStockPredictionsProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductPrediction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const itemsPerPage = 5;

  const { categories } = useFilter();

  // Get merged and filtered products
  const predictions = useMemo(() => {
    // First merge products
    const mergedProducts = mergeProductsBySku(products, orders);

    // Then calculate predictions for each product
    return mergedProducts.map(product => {
      // Get historical sales data (last 12 months)
      const historicalSales = Array(12).fill(0);
      
      orders.forEach(order => {
        if (!order.created_at) return;
        
        const orderDate = new Date(order.created_at);
        const monthIndex = orderDate.getMonth();
        
        const productItems = order.line_items?.filter(item => 
          item.product_id === product.id
        ) || [];
        
        productItems.forEach(item => {
          historicalSales[monthIndex] += item.quantity || 0;
        });
      });

      // Calculate reorder point
      const avgMonthlySales = historicalSales.reduce((sum, val) => sum + val, 0) / 12;
      const reorderPoint = Math.ceil(avgMonthlySales * 1.5); // 1.5 months of stock

      const {
        predictedDemand,
        confidence,
        trend,
        trendline,
        seasonalityFactor
      } = calculateAdvancedPrediction(historicalSales, product.stock, reorderPoint);

      // Generate trendline data for visualization
      const trendlineData = generateTrendlinePoints(historicalSales, trendline);

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.product_type || 'Uncategorized',
        currentStock: product.stock,
        predictedDemand,
        confidence,
        trend,
        stockCoverage: calculateStockCoverage(product.stock, predictedDemand),
        historicalSales,
        trendlineData,
        seasonalityFactor
      };
    });
  }, [products, orders]);

  // Apply filters
  const filteredPredictions = useMemo(() => {
    return predictions.filter(prediction => {
      // Apply category filter
      if (selectedCategory !== 'All' && prediction.category !== selectedCategory) {
        return false;
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          prediction.name.toLowerCase().includes(query) ||
          prediction.sku.toLowerCase().includes(query) ||
          prediction.category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [predictions, selectedCategory, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPredictions.length / itemsPerPage);
  const paginatedPredictions = filteredPredictions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleTrendClick = (prediction: ProductPrediction) => {
    setSelectedProduct(prediction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Get unique categories from products
  const uniqueCategories = useMemo(() => {
    const categorySet = new Set(['All']);
    predictions.forEach(prediction => {
      if (prediction.category) {
        categorySet.add(prediction.category);
      }
    });
    return Array.from(categorySet);
  }, [predictions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#1E1E2D] text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {uniqueCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#1E1E2D] text-white border border-gray-700 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-7 gap-4 py-4 items-center text-base bg-[#1C1B23] border border-gray-800/10 rounded-lg px-4">
        <div className="col-span-2 font-semibold text-white">Products</div>
        <div className="text-center font-semibold text-white">Stock</div>
        <div className="text-center font-semibold text-white">Predicted</div>
        <div className="text-center font-semibold text-white">Confidence</div>
        <div className="text-center font-semibold text-white">Actions</div>
        <div className="text-center font-semibold text-white">Trendlines</div>
      </div>

      {/* Separator Line */}
      <div className="border-t border-gray-700"></div>

      <div className="grid gap-4">
        {paginatedPredictions.map(prediction => (
          <div
            key={prediction.id}
            className="grid grid-cols-7 gap-4 py-4 items-center text-sm bg-[#1C1B23] border border-gray-800/10 rounded-lg px-4 hover:bg-[#1F1D2A] transition-colors duration-200"
          >
            <div className="col-span-2">
              <div className="font-medium text-white">{prediction.name}</div>
              <div className="text-sm text-gray-500">{prediction.sku}</div>
            </div>
            <div className="text-center text-gray-300">{prediction.currentStock}</div>
            <div className="text-center">
              <span className="text-gray-300">{prediction.predictedDemand}</span>
              <span className={`ml-2 text-xs ${prediction.trend > 0 ? 'text-emerald-400' : prediction.trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                ({prediction.trend > 0 ? '+' : ''}{Math.round(prediction.trend)}%)
              </span>
            </div>
            <div className="text-center text-gray-300">{prediction.confidence}%</div>
            <div className="flex justify-center">
              <button
                className={`px-3 py-1.5 rounded-full ${getAction(prediction.currentStock, prediction.predictedDemand, prediction.trend).className} flex items-center gap-1.5 hover:opacity-80 transition-opacity duration-200`}
              >
                {getAction(prediction.currentStock, prediction.predictedDemand, prediction.trend).icon}
                <span>{getAction(prediction.currentStock, prediction.predictedDemand, prediction.trend).label}</span>
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => handleTrendClick(prediction)}
                className="px-3 py-1.5 text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 hover:bg-indigo-400/10 rounded-lg transition-all duration-200"
              >
                <TrendingUp className="w-4 h-4" />
                <span>View Trends</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2 text-sm text-gray-400 justify-end">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="p-1 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span>
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="p-1 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {selectedProduct && (
        <StockTrendModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          product={selectedProduct}
        />
      )}
    </div>
  );
}

function calculateStockCoverage(currentStock: number, predictedDemand: number): string {
  if (predictedDemand === 0) return 'Infinity';
  const coverageMonths = currentStock / predictedDemand;
  
  if (coverageMonths <= 1) return 'Critical';
  if (coverageMonths <= 2) return 'Low';
  if (coverageMonths <= 4) return 'Adequate';
  return 'Excess';
}