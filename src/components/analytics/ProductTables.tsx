import React from 'react';
import { ArrowDown, ArrowUp, MoreVertical } from 'lucide-react';
import { Product, Order } from '../../types/shopify';
import { mergeProductsBySku } from '../../utils/productMerger';

interface ProductTablesProps {
  products: Product[];
  orders: Order[];
}

interface ProductPerformance {
  id: string;
  name: string;
  sku: string;
  stock: number;
  sales: number;
  revenue: number;
  margin: number;
}

export function ProductTables({ products, orders }: ProductTablesProps) {
  if (!products || !Array.isArray(products)) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400">No product data available</p>
      </div>
    );
  }

  // Use mergeProductsBySku to handle product names correctly
  const mergedProducts = mergeProductsBySku(products, orders);
  
  // Transform merged products into performance data
  const productPerformance = mergedProducts.reduce<Record<string, ProductPerformance>>((acc, product) => {
    const revenue = (orders || [])
      .flatMap(order => order.line_items || [])
      .filter(item => item.product_id === product.id)
      .reduce((total, item) => total + (parseFloat(item.price || '0') * (item.quantity || 0)), 0);

    // Calculate margin (placeholder calculation)
    const margin = revenue * 0.3; // 30% margin assumption

    acc[product.sku] = {
      id: product.id,
      name: product.name, // This will now include all variant names if they exist
      sku: product.sku,
      stock: product.stock,
      sales: product.sales,
      revenue,
      margin
    };

    return acc;
  }, {});

  const performanceData = Object.values(productPerformance);

  if (performanceData.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400">No product performance data available</p>
      </div>
    );
  }

  // Convert to array and sort by sales
  const performanceArray = performanceData;

  // Top selling products (by number of sales)
  const topSellers = [...performanceArray]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Slow moving products (lowest sales)
  const slowMoving = [...performanceArray]
    .sort((a, b) => a.sales - b.sales)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Selling Products */}
      <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1F1D2A] transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-white">Top Selling Products</h3>
          </div>
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-800">
                <th className="pb-3 text-sm font-medium text-gray-400">Product Name</th>
                <th className="pb-3 text-sm font-medium text-gray-400">Total Revenue</th>
                <th className="pb-3 text-sm font-medium text-gray-400">N of Sales</th>
                <th className="pb-3 text-sm font-medium text-gray-400">% Margin</th>
              </tr>
            </thead>
            <tbody>
              {topSellers.map(product => (
                <tr 
                  key={product.id}
                  className="border-b border-gray-800/50 hover:bg-[#1F1D2A] transition-colors duration-200"
                >
                  <td className="py-3">
                    <div className="flex flex-col">
                      <span className="text-gray-300">{product.name}</span>
                      <span className="text-sm text-gray-500">{product.sku}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-gray-300">${product.revenue.toFixed(2)}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-gray-300">{product.sales}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-emerald-500">{product.margin.toFixed(0)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slow Moving Products */}
      <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1F1D2A] transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-white">Slow Moving Products</h3>
          </div>
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-800">
                <th className="pb-3 text-sm font-medium text-gray-400">Product Name</th>
                <th className="pb-3 text-sm font-medium text-gray-400">Total Revenue</th>
                <th className="pb-3 text-sm font-medium text-gray-400">N of Sales</th>
                <th className="pb-3 text-sm font-medium text-gray-400">% Margin</th>
              </tr>
            </thead>
            <tbody>
              {slowMoving.map(product => (
                <tr 
                  key={product.id}
                  className="border-b border-gray-800/50 hover:bg-[#1F1D2A] transition-colors duration-200"
                >
                  <td className="py-3">
                    <div className="flex flex-col">
                      <span className="text-gray-300">{product.name}</span>
                      <span className="text-sm text-gray-500">{product.sku}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-gray-300">${product.revenue.toFixed(2)}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-gray-300">{product.sales}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-red-500">{product.margin.toFixed(0)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}