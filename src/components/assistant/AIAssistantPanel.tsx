import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Brain, Loader2, PlusCircle, Settings } from 'lucide-react';
import { useAIAssistant } from '../../contexts/AIAssistantContext';
import { DashboardProduct, DashboardOrder } from '../../types/dashboard';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: DashboardProduct[];
  orders: DashboardOrder[];
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isOpen,
  onClose,
  products,
  orders
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, sendMessage, startNewChat, hasValidApiKey } = useAIAssistant();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  if (!isOpen) return null;

  const suggestedQuestions = [
    "What are my top-selling products?",
    "Which products need restocking?",
    "Show me sales trends for this month",
    "Analyze my inventory efficiency",
    "Predict next month's sales"
  ];

  return (
    <div className="fixed right-0 top-0 h-screen w-[400px] bg-[#1C1B23] border-l-2 border-gray-800 shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-gray-800">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-500" />
          <div>
            <h2 className="text-xl font-bold text-white">StockPilot AI</h2>
            <p className="text-sm text-gray-400">Your inventory expert</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white flex items-center gap-1"
            aria-label="Start new chat"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-sm">New Chat</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {!hasValidApiKey ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Settings className="w-16 h-16 text-gray-400 mb-6" />
          <h3 className="text-xl font-semibold text-white mb-3">OpenAI API Key Required</h3>
          <p className="text-gray-400 text-center mb-6">
            You need to add your OpenAI API key in Settings to use the AI Assistant.
          </p>
          <Link 
            to={ROUTES.SETTINGS} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      ) : (
        <>
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              message.role !== 'system' && (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-[#2A2A3A] text-gray-300'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              )
            ))}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-3">Suggested questions:</p>
              <div className="space-y-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => sendMessage(question)}
                    disabled={isLoading}
                    className="w-full p-3 bg-[#13111C] hover:bg-[#1A1B23] text-left rounded-lg border border-gray-800 text-gray-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your inventory..."
                className="flex-1 bg-[#13111C] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
