import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { POSLayout } from '@/app/layout';
import { CategoryTabs, SearchInput } from '@/components/common';
import { ProductGrid, OrderTicket } from '@/components/pos';
import { useProducts, useCategories } from '@/hooks';
import { useCartStore } from '@/store';
import type { Product } from '@/types';

/**
 * Main POS page - Product selection and order management
 */
export function POSPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { categories } = useCategories();
  const { products, loading } = useProducts(activeCategory);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
    });
  };

  const handleCharge = () => {
    navigate('/checkout');
  };

  const handleSave = () => {
    // TODO: Implement save order
    console.log('Saving order...');
  };

  // Filter products by search query
  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <POSLayout
      main={
        <div className="space-y-6">
          {/* Filters row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
          </div>

          {/* Product grid */}
          <ProductGrid
            products={filteredProducts}
            onAddToCart={handleAddToCart}
            loading={loading}
          />
        </div>
      }
      sidebar={
        <OrderTicket
          orderNumber="#ORD-3942"
          tableNumber={4}
          onCharge={handleCharge}
          onSave={handleSave}
        />
      }
    />
  );
}
