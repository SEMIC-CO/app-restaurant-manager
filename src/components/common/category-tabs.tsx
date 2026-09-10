import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * Horizontal scrollable category tabs for filtering products.
 *
 * Estilo alineado con el item activo/inactivo del ConfigSidebar:
 * - Radio: rounded-lg (igual que el sidebar)
 * - Estado inactivo: text-muted-foreground + border (mejor percepción visual)
 * - Estado activo:   bg-primary text-primary-foreground
 */
export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            {category.icon && <span>{category.icon}</span>}
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
