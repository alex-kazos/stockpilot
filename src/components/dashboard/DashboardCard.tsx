import React from 'react';

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`col-span-2 bg-[#1C1B23] p-6 rounded-lg border border-gray-800 ${className}`}>
      {children}
    </div>
  );
};
