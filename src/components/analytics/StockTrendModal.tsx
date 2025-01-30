import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';

interface StockTrendModalProps {
  product: {
    name: string;
    sku: string;
    currentStock: number;
    predictedDemand: number;
    confidence: number;
    trend: number;
    historicalSales: number[];
    trendlineData: {
      historical: number[];
      future: number[];
    };
    seasonalityFactor: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const StockTrendModal: React.FC<StockTrendModalProps> = ({ product, isOpen, onClose }) => {
  if (!isOpen) return null;

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Get current month index
  const currentMonth = new Date().getMonth();

  // Prepare data for the chart
  const chartData = [...product.historicalSales].map((sales, index) => {
    const monthIndex = (currentMonth - (11 - index) + 12) % 12;
    return {
      month: months[monthIndex],
      sales,
      trend: product.trendlineData.historical[index],
      isFuture: false
    };
  });

  // Add future predictions
  product.trendlineData.future.forEach((prediction, index) => {
    const monthIndex = (currentMonth + index + 1) % 12;
    chartData.push({
      month: months[monthIndex],
      sales: null,
      trend: prediction,
      isFuture: true
    });
  });

  // Calculate min and max for Y axis
  const allValues = [
    ...product.historicalSales,
    ...product.trendlineData.historical,
    ...product.trendlineData.future
  ];
  const yMax = Math.max(...allValues) * 1.2;
  const yMin = Math.min(0, ...allValues);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1A1A27] rounded-lg shadow-xl w-[90vw] max-w-4xl">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white">{product.name}</h3>
            <p className="text-sm text-gray-400">SKU: {product.sku}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1E1E2D] p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Current Stock</p>
              <p className="text-xl font-medium text-white">{product.currentStock}</p>
            </div>
            <div className="bg-[#1E1E2D] p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Predicted Demand</p>
              <p className="text-xl font-medium text-white">{product.predictedDemand}</p>
            </div>
            <div className="bg-[#1E1E2D] p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Confidence</p>
              <p className="text-xl font-medium text-white">{product.confidence}%</p>
            </div>
            <div className="bg-[#1E1E2D] p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Seasonality Factor</p>
              <p className="text-xl font-medium text-white">
                {(product.seasonalityFactor * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="h-[400px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3B" />
                <XAxis
                  dataKey="month"
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                  domain={[yMin, yMax]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A27',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem'
                  }}
                  labelStyle={{ color: '#D1D5DB' }}
                  itemStyle={{ color: '#D1D5DB' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ fill: '#6366F1', r: 4 }}
                  name="Historical Sales"
                />
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#22C55E"
                  strokeWidth={2}
                  strokeDasharray={chartData.map(d => d.isFuture ? "3 3" : "0")}
                  dot={{ fill: '#22C55E', r: 4 }}
                  name="Trend & Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="bg-[#1E1E2D] p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">Insights</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Trend Direction: {product.trend > 0 ? 'Upward' : product.trend < 0 ? 'Downward' : 'Stable'} ({Math.abs(product.trend).toFixed(1)}%)</li>
              <li>• Seasonality Impact: {product.seasonalityFactor > 1.1 ? 'High' : product.seasonalityFactor < 0.9 ? 'Low' : 'Normal'}</li>
              <li>• Stock Coverage: {(product.currentStock / product.predictedDemand).toFixed(1)} months at predicted demand</li>
              {product.confidence < 70 && (
                <li className="text-yellow-400">• Note: Low confidence prediction due to variable historical data</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
