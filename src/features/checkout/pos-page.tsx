import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { POSLayout } from "@/app/layout";
import {
  CategoryTabs,
  SearchInput,
  ConfigSidebar,
  AppHeader,
} from "@/components/common";
import { ProductGrid, OrderTicket } from "@/components/pos";
import { useProducts, useCategories } from "@/hooks";
import { useCartStore } from "@/store";
import type { Product } from "@/types";

export function POSPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { categories } = useCategories('productos');
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

  const handleCharge = () => navigate("/checkout");
  const handleSave = () => console.log("Saving order...");

  const filteredProducts = searchQuery
    ? products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : products;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
        <ConfigSidebar />
      </aside>

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>
        <POSLayout
          main={
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CategoryTabs
                  categories={categories}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
                <div className="w-full sm:w-72">
                  <SearchInput value={searchQuery} onChange={setSearchQuery} />
                </div>
              </div>

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
      </div>
    </div>
  );
}
