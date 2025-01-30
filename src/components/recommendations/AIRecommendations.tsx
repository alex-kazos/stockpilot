import React from 'react';
import { AlertData } from '../../types/product';
import AlertBadge from './AlertBadge';

interface AIRecommendationsProps {
  alerts: AlertData[];
}

export default function AIRecommendations({ alerts }: AIRecommendationsProps) {
  // Only show top 3 alerts
  const topAlerts = alerts.slice(0, 3);

  return (
    <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">AI Recommendations</h3>
        {alerts.length > 3 && (
          <span className="text-gray-400 text-sm">
            +{alerts.length - 3} more alerts
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {topAlerts.map((alert) => (
          <div 
            key={alert.id}
            className="bg-gray-900/50 rounded-xl p-4 hover:bg-gray-900/70 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <AlertBadge type={alert.type} priority={alert.priority} />
              {alert.potentialRevenue && (
                <span className="text-blue-400 text-sm">
                  €{alert.potentialRevenue.toLocaleString('en-EU', { 
                    maximumFractionDigits: 0 
                  })} potential revenue
                </span>
              )}
            </div>
            
            <p className="text-gray-300 mb-2">{alert.message}</p>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">SKU: {alert.product.sku}</span>
              <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
                Take Action →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}