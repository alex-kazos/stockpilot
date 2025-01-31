import React from 'react';
import { ProductSalesStockChart } from '../analytics/ProductSalesStockChart';
import { InventoryAlerts } from '../analytics/InventoryAlerts';
import { AIRecommendations } from './AIRecommendations';
import { ProductTables } from '../analytics/ProductTables';
import { AIStockPredictions } from '../analytics/AIStockPredictions';
import { DashboardCard } from './DashboardCard';
import { DashboardProduct, DashboardOrder, TransformedProduct } from '../../types/dashboard';
import { FilterProvider } from '../../contexts/FilterContext';

// DashboardGrid: A grid component that displays various analytics and data about
// the products and orders in the store.
interface DashboardGridProps {
  // products: An array of products in the store.
  products: DashboardProduct[];
  // orders: An array of orders in the store.
  orders: DashboardOrder[];
  // transformedProducts: An array of products transformed for use in the AI
  // recommendations component.
  transformedProducts: TransformedProduct[];
}

// Render the DashboardGrid component.
export const DashboardGrid: React.FC<DashboardGridProps> = ({
  products,
  orders,
  transformedProducts,
}) => {

  console.log('DashboardGrid: Products received', products.length);
  console.log('DashboardGrid: Orders received', orders.length);
  console.log('DashboardGrid: TransformedProducts received', transformedProducts.length);


  return (
    <FilterProvider>
      {/* The grid container. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/*The unified analytics dashboard card combining sales chart and alerts*/}
        <DashboardCard className="md:col-span-2 flex flex-col gap-6">
          <div className="w-full">
            <ProductSalesStockChart products={products} orders={orders} />
          </div>
          <div className="border-t border-gray-700 pt-6">
            <InventoryAlerts products={products} orders={orders} />
          </div>
        </DashboardCard>

        {/*The AI recommendations card.*/}
        <DashboardCard>
          <AIRecommendations products={transformedProducts} />
        </DashboardCard>

        {/*The product tables card.*/}
        <DashboardCard className="md:col-span-2">
          <ProductTables products={products} orders={orders} />
        </DashboardCard>

        {/* The AI stock predictions card.*/}
        <DashboardCard className="md:col-span-2">
          <AIStockPredictions products={products} orders={orders} />
        </DashboardCard>
      </div>
    </FilterProvider>
  );
};