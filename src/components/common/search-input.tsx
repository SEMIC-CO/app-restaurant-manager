import { Search } from 'lucide-react';
import { Input } from '@/components/ui';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Search input with icon for filtering products
 */
export function SearchInput({ 
  value, 
  onChange, 
  placeholder = 'Buscar sabor o producto...' 
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}
