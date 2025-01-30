import React from 'react';
import { AlertPriority, AlertType } from '../../types/product';
import { TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

interface AlertBadgeProps {
  type: AlertType;
  priority: AlertPriority;
}

export default function AlertBadge({ type, priority }: AlertBadgeProps) {
  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500/20 text-red-500';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-500';
      case 'LOW': return 'bg-green-500/20 text-green-500';
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'RESTOCK': return <TrendingUp className="w-4 h-4" />;
      case 'OPPORTUNITY': return <DollarSign className="w-4 h-4" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 px-2 py-1 rounded-md ${getPriorityColor(priority)}`}>
      {getTypeIcon(type)}
      <span className="text-xs font-medium">{type}</span>
    </div>
  );
}