# Copilot Instructions for Restaurant Management App

## Project Overview
A React 19 + TypeScript restaurant POS (Point of Sale) application for managing orders, products, and payments. Built with Vite 7, Tailwind CSS 4, and shadcn/ui.

## Tech Stack
- **Framework**: React 19 with TypeScript 5.9
- **Build Tool**: Vite 7 with `@vitejs/plugin-react-swc` (SWC for Fast Refresh)
- **Styling**: Tailwind CSS 4 with CSS variables for theming
- **UI Components**: shadcn/ui (Radix primitives + Tailwind)
- **State Management**: Zustand (stores in `src/store/`)
- **Routing**: React Router DOM 7
- **Package Manager**: pnpm

## Developer Commands
```bash
pnpm dev       # Start dev server with HMR
pnpm build     # TypeScript check + production build
pnpm lint      # Run ESLint on all files
pnpm preview   # Preview production build locally
```

## Project Structure
```
src/
├── app/
│   └── layout/           # Layout components (POSLayout, KitchenLayout, DashboardLayout)
├── components/
│   ├── ui/               # shadcn/ui primitives (Button, Card, Input, Badge)
│   ├── common/           # Shared components (Header, Navbar, CategoryTabs, SearchInput, StatusBadge, UserMenu)
│   ├── pos/              # POS components (ProductCard, ProductGrid, OrderTicket, OrderItemRow)
│   ├── kitchen/          # Kitchen components (KitchenSidebar, KitchenHeader, TicketCard, TicketFilters)
│   ├── delivery/         # Delivery components (DeliveryStats, DeliveryOrderCard, DeliverySearch, DeliverySection)
│   └── analytics/        # Analytics components (AnalyticsStats, FlavorRankingChart, SalesMixChart, ProductTable)
├── features/
│   ├── pos/              # POS page - Product selection and order management
│   ├── kitchen/          # Kitchen page - Order queue for kitchen staff
│   ├── delivery/         # Delivery page - Order handoff and invoicing
│   └── analytics/        # Analytics page - Sales insights and reports
├── store/                # Zustand stores (cart-store, orders-store)
├── services/             # API/data services (product-service, order-service)
├── hooks/                # Custom React hooks (useProducts, useCategories)
├── types/                # TypeScript type definitions
├── lib/                  # Utility functions (cn for class merging)
└── utils/                # Helper functions (formatCurrency, formatRelativeTime)
```

## Routes
- `/` - POS page (product grid + order ticket)
- `/cocina` - Kitchen panel (ticket queue with timers)
- `/entregas` - Delivery control (ready orders + pending invoices)
- `/analisis` - Analytics dashboard (stats, charts, product table)

## Code Conventions

### Imports
- Use `@/` path alias for all src imports: `import { Button } from '@/components/ui'`
- Group imports: React → third-party → @/ aliases → relative

### Components
- Function components with hooks only (no class components)
- Single responsibility: one component per file
- Export named components, use barrel files (`index.ts`) for re-exports
- Props interfaces defined in the same file as component

### Styling
- Tailwind CSS 4 classes for all styling
- Use `cn()` utility from `@/lib/utils` for conditional classes
- shadcn/ui components support `variant` and `size` props via CVA
- Theme colors via CSS variables defined in `@theme inline` block (see `src/index.css`)
- Primary color: Orange (#f97316)

### Layouts
- `POSLayout` - Header + main content + fixed right sidebar for POS
- `KitchenLayout` - Left sidebar (counts) + header + main content for kitchen
- `DashboardLayout` - Full-width with top navbar for dashboard pages

### State Management
- Zustand stores in `src/store/` with typed state and actions
- Cart state: `useCartStore` for current order items
- Global state: `useOrdersStore` for order management

### Types
- All domain types in `src/types/index.ts`
- Key types: `Product`, `Order`, `OrderItem`, `PaymentMethod`
- Status types use union literals: `OrderStatus`, `PaymentStatus`

## Key Patterns

### Adding a shadcn/ui component
Components are in `src/components/ui/`. Use existing patterns (Button, Card) as reference.

### Creating a new feature
1. Add types to `src/types/index.ts`
2. Create service in `src/services/`
3. Create store if needed in `src/store/`
4. Build components in `src/components/{feature}/`
5. Create layout if needed in `src/app/layout/`
6. Create page in `src/features/{feature}/`
7. Add route in `src/App.tsx`

### Formatting utilities
Use `src/utils/format.ts`: `formatCurrency()`, `formatRelativeTime()`, `formatOrderNumber()`

### Formatting utilities
Use `src/utils/format.ts`: `formatCurrency()`, `formatRelativeTime()`, `formatOrderNumber()`
