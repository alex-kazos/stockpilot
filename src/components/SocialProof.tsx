import React from 'react';
import { BarChart2, Clock, Target } from 'lucide-react';

export default function SocialProof() {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            End Stock Anxiety
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 text-center max-w-4xl mx-auto mb-16">
            Tired of running out of bestsellers or overstocking what doesn't sell? Stock Pilot's AI 
            tells you exactly what's moving and what's not. Get instant alerts and 
            recommendations to keep your shelves and storage perfectly balanced—no guessing, 
            no stress.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <BarChart2 className="w-6 h-6 text-indigo-400" />,
                title: "Turn Data into Decisions",
                description: "Running a business is hard enough without sifting through endless spreadsheets. With Stock Pilot, you get clear, actionable insights—like which products to promote or where to restock—delivered straight to your dashboard. Decisions get easier, faster, and smarter."
              },
              {
                icon: <Clock className="w-6 h-6 text-indigo-400" />,
                title: "Save Time, Skip the Headaches",
                description: "Stop wasting hours trying to make sense of your data. With Stock Pilot's natural language feature, you can just ask: 'What's my top-selling product?' or 'Which store needs restocking?' It's like having a retail analyst on call 24/7."
              },
              {
                icon: <Target className="w-6 h-6 text-indigo-400" />,
                title: "Grow Without Guessing",
                description: "Whether you're opening a new location or scaling your online store, Stock Pilot helps you stay ahead of demand. Predict trends, avoid costly mistakes, and grow your business with confidence—backed by AI insights that actually work."
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                {/* Hover gradient */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-emerald-500/30 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-500" />
                
                <div className="relative bg-[#1A1A27] p-6 rounded-xl backdrop-blur-sm h-full flex flex-col">
                  <div className="bg-[#12121E] w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}