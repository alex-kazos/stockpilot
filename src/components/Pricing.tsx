import React, { useState, useEffect } from 'react';
import { Check, Send } from 'lucide-react';
import { getCalApi } from "@calcom/embed-react";
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import EmailCaptureModal from './EmailCaptureModal';
import '../styles/paper-airplane.css';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({"namespace":"stock-pilot-custom-development-call"});
      cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
    })();
  }, []);

  const handleEmailSubmit = async () => {
    if (!email) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'waitlist'), {
        email,
        plan: 'ESSENTIALS',
        signupDate: new Date(),
        status: 'active'
      });

      setMessage('Thank you! We\'ll be in touch soon.');
      setEmail('');
      // Trigger animation
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 2000); // Extended animation duration to 2s
      // Clear success message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      setMessage('Something went wrong. Please try again.');
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      name: 'Inventory Essentials',
      price: 295,
      description: 'Complete inventory management solution with AI-powered features and chatbot support.',
      features: [
        'Single Platform Connections (E-commerce & POS)',
        'Real-time Stock Monitoring',
        'AI Recommendations',
        'AI Co-pilot Chatbot'
      ]
    },
    {
      name: 'Custom',
      price: 'Custom',
      description: 'Tailored solutions for enterprises with complex requirements and custom integration needs.',
      features: [
        'Unlimited Data Source Integration',
        'Custom Dashboard Development',
        'Custom Platform Integrations',
        'Dedicated Developer',
        'Dedicated Solution architect'
      ]
    }
  ];

  return (
    <section id="pricing" className="py-8 md:py-16 relative">
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pricing
          </h2>
          <div className="flex items-center justify-center mt-8 space-x-4">
            <span className={`text-sm transition-colors duration-200 ${!isYearly ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            
            {/* Toggle Switch */}
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-12 h-6 rounded-full bg-[#12121E] transition-colors duration-200 focus:outline-none"
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[#6366F1] shadow-lg transform transition-transform duration-300 ease-in-out ${
                  isYearly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            
            <span className={`text-sm transition-colors duration-200 ${isYearly ? 'text-white' : 'text-gray-400'}`}>
              Yearly
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {plans.map((plan, index) => (
              <div key={index} className="relative group">
                {/* Animated gradient border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-emerald-500/30 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-500" />
                
                <div className="relative bg-[#1A1A27] rounded-xl p-5 md:p-6 h-full backdrop-blur-sm flex flex-col">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {plan.name}
                    </h3>
                    
                    <p className="text-gray-200 text-sm mb-4">
                      {plan.description}
                    </p>

                    <div className="flex items-baseline mb-6">
                      {typeof plan.price === 'number' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-2xl md:text-3xl font-bold text-white">
                            €{isYearly ? Math.round(plan.price * 0.80) : plan.price}
                          </span>
                          <span className="text-gray-400 ml-2">/Month</span>
                          {isYearly && (
                            <div className="transform -rotate-2">
                              <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-sm font-medium animate-bounce">
                                -20%
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xl md:text-2xl text-white">Custom Pricing</span>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-indigo-500" />
                          </div>
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {index === 1 ? (
                    <button 
                      className="w-full py-2.5 rounded-lg transition-colors duration-200 bg-green-500 hover:bg-green-600 text-white"
                      data-cal-namespace="stock-pilot-custom-development-call"
                      data-cal-link="mvasilakis/stock-pilot-custom-development-call"
                      data-cal-config='{"layout":"month_view"}'
                    >
                      Book a Call
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Join as a Founding Member for 50% off!"
                          className="flex-1 px-3 py-2 bg-[#12121E] border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button
                          onClick={handleEmailSubmit}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                        >
                          {isSubmitting ? 'Joining...' : 'Waitlist'}
                        </button>
                        {showAnimation && (
                          <Send className="paper-airplane fly-away" />
                        )}
                      </div>
                      {message && (
                        <div className="text-sm text-green-400">
                          {message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <EmailCaptureModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </section>
  );
}