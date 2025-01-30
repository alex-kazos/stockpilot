import React, { useState } from 'react';
import { Bell, BarChart3, Menu, X, Store, Brain, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleCheckout = () => {
    window.open(import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_URL, '_blank');
  };

  return (
    <>
      {/* Navigation Bar */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center">
        <div className="max-w-6xl w-full mx-4">
          <header className="backdrop-blur-md bg-[#1A1A27]/90 border border-gray-800/50 rounded-full px-6 shadow-xl">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <button 
                onClick={scrollToTop}
                className="flex items-center space-x-2 transition-transform hover:scale-105"
              >
                <Store className="w-7 h-7 text-[#6366F1]" />
                <span className="text-white text-lg font-bold">StockPilot</span>
              </button>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-gray-400 hover:text-white"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <button 
                  onClick={() => scrollToSection('dashboard')}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Sneak Peek
                </button>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Pricing
                </button>
                <button
                  // onClick={() => navigate(ROUTES.AUTH)}
                  onClick={() => scrollToSection('pricing')}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] rounded-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] transition-transform duration-200"
                >
                  Coming Soon
                </button>
              </nav>
            </div>
          </header>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-2 backdrop-blur-md bg-[#1A1A27]/90 border border-gray-800/50 rounded-xl p-4 shadow-xl">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  scrollToSection('dashboard');
                  setIsMenuOpen(false);
                }}
                className="text-gray-400 hover:text-white transition-colors duration-200 text-left px-4 py-2 hover:bg-gray-800/50 rounded-lg"
              >
                Sneak Peek
              </button>
              <button 
                onClick={() => {
                  scrollToSection('pricing');
                  setIsMenuOpen(false);
                }}
                className="text-gray-400 hover:text-white transition-colors duration-200 text-left px-4 py-2 hover:bg-gray-800/50 rounded-lg"
              >
                Pricing
              </button>
              <button 
                onClick={() => {
                  // navigate(ROUTES.AUTH);
                  scrollToSection('pricing');
                  setIsMenuOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Coming Soon
              </button>
            </nav>
          </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <span className="px-4 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm mb-6">
                Designed for e-Commerce Stores
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Losing Money on Stock-outs, Overstocking or Missed sales?
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8">
                Save thousands on stock investments with our AI-powered inventory management solution.
              </p>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-4">
                  <button
                    className="bg-[#6366F1] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-600 transition-transform hover:scale-105"
                    onClick={() => scrollToSection('pricing')}
                  >
                    Coming Soon
                  </button>
                  {/*<button*/}
                  {/*  className="px-8 py-3 rounded-lg text-lg font-medium border-2 border-[#6366F1] hover:border-indigo-600 transition-transform hover:scale-105"*/}
                  {/*  onClick={() => scrollToSection('dashboard')}*/}
                  {/*>*/}
                  {/*  View Demo*/}
                  {/*</button>*/}
                </div>
                <p className="text-gray-400 text-sm">Join the Waitlist</p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
              {[
                {
                  icon: <Brain className="w-6 h-6 text-indigo-400" />,
                  title: "Your AI Growth Partner",
                  description: "Get real-time insights to predict stock-outs, recommend cross-sells, and align inventory with demand—your 24/7 retail analyst."
                },
                {
                  icon: <BarChart3 className="w-6 h-6 text-indigo-400" />,
                  title: "Unified Intelligence Hub",
                  description: "Say goodbye to messy spreadsheets and disconnected systems. All your sales channels in one place, with AI insights that guide every decision."
                },
                {
                  icon: <MessageSquare className="w-6 h-6 text-indigo-400" />,
                  title: "Talk to Your Data",
                  description: "No more endless searches for data. Just ask what you need to know, and get instant, actionable insights to drive your business forward."
                }
              ].map((feature, index) => (
                <div key={index} className="relative group h-full">
                  {/* Hover gradient */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-emerald-500/30 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-500" />
                  
                  <div className="relative bg-[#1A1A27] p-8 rounded-xl backdrop-blur-sm h-full flex flex-col">
                    <div className="bg-[#12121E] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-3 min-h-[48px]">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}