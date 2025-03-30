import { Linkedin } from 'lucide-react';

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
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex items-center space-x-6">
                <a 
                  href="https://www.linkedin.com/in/marios-vasilakis/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  <span>Marios Vasilakis </span>
                </a>
                <a 
                  href="https://x.com/M__Vasilakis"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <XIcon />
                  <span>M__Vasilakis</span>
                </a>
                <a
                    href="https://www.linkedin.com/in/alex-kazos/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  <span>Alex Kazos </span>
                </a>
                <a
                    href="https://x.com/a_kazos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <XIcon />
                  <span>a_kazos</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}