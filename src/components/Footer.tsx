import React from 'react';
import { MapPin, Mail, Linkedin, Instagram } from 'lucide-react';

const XIcon = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 24 24" 
    aria-hidden="true" 
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[#1E1E2D] py-16 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Company Info */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-[#22C55E] hover:text-[#22C55E]/80 transition-colors mb-3">
              <a href="https://essentur.com" target="_blank" rel="noopener noreferrer">
                Made by Essentur
              </a>
            </h3>
            <p className="text-gray-400 max-w-md">
              Your AI Idea, Built by Those Who Launch Their Own.
            </p>
          </div>

          {/* Contact and Social */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Address Section */}
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Address</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-400">
                  <Mail className="w-5 h-5" />
                  <a href="mailto:info@essentur.com" className="hover:text-white transition-colors">
                    info@essentur.com
                  </a>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <MapPin className="w-5 h-5" />
                  <span>Athens, Greece</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex items-center space-x-6">
                <a 
                  href="https://linkedin.com/company/essentur" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  <span>LinkedIn</span>
                </a>
                <a 
                  href="https://x.com/essenturhq" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <XIcon />
                  <span>X (prev Twitter)</span>
                </a>
                <a 
                  href="https://instagram.com/essenturhq" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="mt-12 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-center">
              Developed by Essentur
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}