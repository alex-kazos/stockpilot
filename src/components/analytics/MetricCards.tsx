import React from 'react';
import { MetricCardsProps } from '../../types/props';
import { CubeIcon, ShoppingCartIcon, CurrencyDollarIcon, ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid';

export const MetricCards: React.FC<MetricCardsProps> = ({ products, orders }) => {
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Calculate inventory turnover ratio
  const totalInventory = products.reduce((sum, product) => sum + (product.variants?.[0]?.inventory_quantity || 0), 0);
  const costOfGoodsSold = orders.reduce((sum, order) => {
    return sum + order.line_items.reduce((itemSum, item) => {
      const product = products.find(p => p.variants?.some(v => v.id === item.variant_id));
      const cost = product?.variants?.[0]?.price || 0;
      return itemSum + (parseFloat(cost) * item.quantity);
    }, 0);
  }, 0);
  const turnoverRatio = totalInventory > 0 ? (costOfGoodsSold / totalInventory).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1F1D2A] transition-colors duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-400 text-sm font-medium">Total Products</h3>
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <CubeIcon className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
        <p className="text-white text-2xl font-bold mt-2">{totalProducts}</p>
      </div>
      
      <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1F1D2A] transition-colors duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-400 text-sm font-medium">Total Orders</h3>
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <ShoppingCartIcon className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
        <p className="text-white text-2xl font-bold mt-2">{totalOrders}</p>
      </div>
      
      <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1F1D2A] transition-colors duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-400 text-sm font-medium">Total Revenue</h3>
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <CurrencyDollarIcon className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
        <p className="text-white text-2xl font-bold mt-2">
          ${totalRevenue.toFixed(2)}
        </p>
      </div>
      
      <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1F1D2A] transition-colors duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-400 text-sm font-medium">Average Order Value</h3>
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <ChartBarIcon className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
        <p className="text-white text-2xl font-bold mt-2">
          ${averageOrderValue.toFixed(2)}
        </p>
      </div>

      <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1F1D2A] transition-colors duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-400 text-sm font-medium">Turnover Ratio</h3>
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
        <p className="text-white text-2xl font-bold mt-2">{turnoverRatio}x</p>
      </div>
    </div>
  );
};
