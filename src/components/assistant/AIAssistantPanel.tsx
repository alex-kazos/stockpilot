import React, { useState } from 'react';
import { X, Send, Brain } from 'lucide-react';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-[400px] bg-[#1C1B23] border-l-2 border-gray-800 shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-gray-800">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-500" />
          <div>
            <h2 className="text-xl font-bold text-white">StockPilot AI</h2>
            <p className="text-sm text-gray-400">How can I help you today?</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="Close assistant"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Example suggested questions */}
          <button className="w-full p-3 bg-[#13111C] hover:bg-[#1A1B23] text-left rounded-lg border border-gray-800 text-gray-300 text-sm transition-colors">
            How can I improve my store's performance?
          </button>
          <button className="w-full p-3 bg-[#13111C] hover:bg-[#1A1B23] text-left rounded-lg border border-gray-800 text-gray-300 text-sm transition-colors">
            Show me my top-selling products this month
          </button>
          <button className="w-full p-3 bg-[#13111C] hover:bg-[#1A1B23] text-left rounded-lg border border-gray-800 text-gray-300 text-sm transition-colors">
            What are the current inventory alerts?
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t-2 border-gray-800">
        <div className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
            className="w-full p-3 pr-12 bg-[#13111C] border-2 border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-500 transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 text-center">
          Responses may have errors, so trust your expertise
        </p>
      </div>
    </div>
  );
};
