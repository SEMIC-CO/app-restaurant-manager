import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * Horizontal scrollable category tabs for filtering products
 */
export function CategoryTabs({ 
  categories, 
  activeCategory, 
  onCategoryChange 
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
            activeCategory === category.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border hover:bg-accent'
          )}
        >
          {category.icon && <span>{category.icon}</span>}
          {category.name}
        </button>
      ))}
    </div>
  );
}
