import React, { useEffect, useState, useRef, useMemo } from 'react';
import { TrendingUp, AlertTriangle, DollarSign, Loader } from 'lucide-react';
import { logger } from '../../utils/logger';
import { generateRecommendations, type Product, type Recommendation } from '../../utils/openai';

interface RecommendationResponse {
  recommendations: Recommendation[];
}

interface AIRecommendationsProps {
  products: Product[];
}

const getPriorityColor = (priority: string) => {
  switch (priority.toUpperCase()) {
    case 'HIGH':
      return 'bg-red-500/10 text-red-500';
    case 'MEDIUM':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'LOW':
      return 'bg-green-500/10 text-green-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
};

const getTypeIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'RESTOCK':
      return <TrendingUp className="w-5 h-5 text-blue-500" />;
    case 'WARNING':
      return <AlertTriangle className="w-5 h-5 text-blue-500" />;
    case 'OPPORTUNITY':
      return <DollarSign className="w-5 h-5 text-blue-500" />;
    default:
      return null;
  }
};

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ products }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestMadeRef = useRef(false);

  // Get unique categories from recommendations
  const categories = useMemo(() => {
    const uniqueCategories = new Set(recommendations.map(rec => rec.product_type));
    return ['All', ...Array.from(uniqueCategories)].sort();
  }, [recommendations]);

  // Filter recommendations by category
  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === 'All') {
      return recommendations;
    }
    return recommendations.filter(rec => rec.product_type === selectedCategory);
  }, [recommendations, selectedCategory]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Check session storage first
      const storedRecommendations = sessionStorage.getItem('aiRecommendations');
      if (storedRecommendations) {
        setRecommendations(JSON.parse(storedRecommendations));
        logger.info('AIRecommendations', 'Using cached recommendations from session', {
          fileName: 'AIRecommendations.tsx'
        });
        return;
      }

      if (!products.length) {
        logger.info('AIRecommendations', 'No products to analyze', {
          fileName: 'AIRecommendations.tsx'
        });
        return;
      }

      if (requestMadeRef.current) {
        logger.info('AIRecommendations', 'Skipping duplicate request', {
          fileName: 'AIRecommendations.tsx'
        });
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        requestMadeRef.current = true;
        logger.info('AIRecommendations', 'Starting recommendation request', {
          fileName: 'AIRecommendations.tsx',
          productCount: products.length,
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            sales: p.sales,
            product_type: p.product_type,
            sku: p.sku
          }))
        });

        const data = await generateRecommendations(products);

        logger.success('AIRecommendations', 'Successfully fetched recommendations', {
          fileName: 'AIRecommendations.tsx',
          recommendationCount: data.recommendations.length,
          recommendations: data.recommendations.map(r => ({
            type: r.type,
            priority: r.priority,
            product_type: r.product_type,
            sku: r.sku
          }))
        });

        setRecommendations(data.recommendations);
        // Store recommendations in session storage
        sessionStorage.setItem('aiRecommendations', JSON.stringify(data.recommendations));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
        setError(errorMessage);
        logger.error('AIRecommendations', 'Error fetching recommendations', {
          fileName: 'AIRecommendations.tsx',
          error: err,
          errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [products]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">AI Recommendations</h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#1C1B23] text-gray-300 border border-gray-800 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredRecommendations
          .sort((a, b) => {
            const typeOrder = { RESTOCK: 1, OPPORTUNITY: 2, WARNING: 3 };
            const typeComparison = (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
            if (typeComparison !== 0) return typeComparison;
            
            const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
            return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          })
          .map((recommendation, index) => (
            <div
              key={index}
              className="bg-[#1C1B23] rounded-lg p-6 border-2 border-gray-800 hover:bg-[#1F1D2A] transition-colors duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 flex items-center gap-2">
                    {getTypeIcon(recommendation.type)}
                    {recommendation.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority}
                  </span>
                </div>
              </div>

              <p className="text-gray-400 mb-2">
                {recommendation.message}
              </p>
              {recommendation.sku && (
                <p className="text-gray-500 text-xs mb-2">
                  SKU: {recommendation.sku}
                </p>
              )}
              {recommendation.prediction && (
                <p className="text-blue-400 text-sm mt-2">
                  {recommendation.prediction}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
