import React, { useMemo } from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { DashboardProduct, DashboardOrder } from '../../types/dashboard';
import { mergeProductsBySku } from '../../utils/productMerger';
import { useFilter } from '../../contexts/FilterContext';

interface InventoryAlertsProps {
  products: DashboardProduct[];
  orders: DashboardOrder[];
}

export function InventoryAlerts({ products, orders }: InventoryAlertsProps) {
  const {
    searchQuery,
    selectedCategory,
    selectedTimeRange,
    customDateRange,
    useCustomDateRange,
    stockRange,
    salesRange
  } = useFilter();

  // Get merged and filtered products
  const filteredProducts = useMemo(() => {
    const { from, to } = useCustomDateRange
      ? { from: new Date(customDateRange.from), to: new Date(customDateRange.to) }
      : (() => {
          const now = new Date();
          const to = now;
          let from = new Date();
          
          switch (selectedTimeRange) {
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
            default:
              from.setMonth(now.getMonth() - 12);
          }
          return { from, to };
        })();

    const dateRange = { from: from.toISOString(), to: to.toISOString() };
    let mergedProducts = mergeProductsBySku(products, orders, selectedCategory, dateRange);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      mergedProducts = mergedProducts.filter(
        product => 
          product.name.toLowerCase().includes(query) || 
          product.sku.toLowerCase().includes(query)
      );
    }

    // Apply stock range filter
    if (stockRange.min !== undefined || stockRange.max !== null) {
      mergedProducts = mergedProducts.filter(product => {
        const stockInRange = (stockRange.min === undefined || product.stock >= stockRange.min) &&
                           (stockRange.max === null || product.stock <= stockRange.max);
        return stockInRange;
      });
    }

    // Apply sales range filter
    if (salesRange.min !== undefined || salesRange.max !== null) {
      mergedProducts = mergedProducts.filter(product => {
        const salesInRange = (salesRange.min === undefined || product.sales >= salesRange.min) &&
                           (salesRange.max === null || product.sales <= salesRange.max);
        return salesInRange;
      });
    }

    return mergedProducts;
  }, [products, orders, selectedCategory, selectedTimeRange, searchQuery, customDateRange, useCustomDateRange, stockRange, salesRange]);

  // Find low stock items (less than 10 units)
  const lowStockItems = filteredProducts
    .filter(product => product.stock < 10 && product.stock > 0)
    .slice(0, 3); // Show top 3 low stock items

  // Find out of stock items
  const outOfStockItems = filteredProducts
    .filter(product => product.stock === 0)
    .slice(0, 3); // Show top 3 out of stock items

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Low Stock Alerts */}
      <div
        className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1F1D2A] transition-colors duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-amber-500">Low Stock</h3>
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <div className="space-y-4">
          {lowStockItems.length > 0 ? (
            lowStockItems.map(product => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <p className="text-gray-300 font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    SKU: {product.sku} | {product.stock} units remaining
                  </p>
                  <p className="text-sm text-gray-500">
                    Stock Level: {product.stock} 
                  </p>
                </div>
                <span className="text-amber-500 text-sm font-medium whitespace-nowrap">
                  Low Stock
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No low stock items</p>
          )}
        </div>
      </div>

      {/* Out of Stock Alerts */}
      <div
        className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1F1D2A] transition-colors duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-500">Out of Stock</h3>
          <TrendingDown className="w-5 h-5 text-red-500" />
        </div>
        <div className="space-y-4">
          {outOfStockItems.length > 0 ? (
            outOfStockItems.map(product => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <p className="text-gray-300 font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    SKU: {product.sku}
                  </p>
                  <p className="text-sm text-gray-500">
                    Stock Level: {product.stock} 
                  </p>
                </div>
                <span className="text-red-500 text-sm font-medium whitespace-nowrap">
                  Out of Stock
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No out of stock items</p>
          )}
        </div>
      </div>
    </div>
  );
}
