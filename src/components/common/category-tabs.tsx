import { FilterTabs, type FilterTabItem } from './filter-tabs';
import type { Category } from '@/types';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * Filtros de categorías (Mesas, productos del pedido, selector de mesas).
 * Delega en `FilterTabs` para que use el estilo único de filtros de la app;
 * aquí solo se mantienen el scroll horizontal y el ícono de la categoría.
 */
export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  const items: FilterTabItem[] = categories.map((category) => ({
    id: category.id,
    label: (
      <>
        {category.icon && <span>{category.icon}</span>}
        {category.name}
      </>
    ),
  }));

  return (
    <FilterTabs
      items={items}
      active={activeCategory}
      onChange={onCategoryChange}
      label="Filtrar por categoría"
      className="flex-nowrap overflow-x-auto pb-2"
    />
  );
}
