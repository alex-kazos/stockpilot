import React from 'react';

interface ErrorStateProps {
  message: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return (
    <div className="min-h-screen bg-[#13111C] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">Failed to load store data</p>
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
};
