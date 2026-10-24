# Plan de Modificación - Módulo de Pedidos

## Estado Actual: PLAN.md creado

### Obives
1. Modificar `OrdersPage` para que muestre cards de pedidos existentes en lugar de grid de productos
2. Agregar botón "Crear Nueva Orden" que abra un formulario modal
3. El formulario debe permitir seleccionar: Para Llevar, Mesa, Domicilio
4. El formulario debe permitir seleccionar productos como aparece actualmente
5. Al crear el pedido, guardar con la opción de tipo de servicio seleccionada

### Cambios Realizados

#### 1. PLAN.md
- Archivo creado para tracking de planes y estado de ejecución

### Pending Changes

#### 2. Tipos (`src/types/index.ts`)
- Agregar campo `orderType` a `CreateOrderPayload` con valores: 'para-llevar', 'mesa', 'domicilio'

#### 3. OrdersPage (`src/features/orders/orders-page.tsx`)
- Cambiar el contenido principal de mostrar `ProductGrid` a mostrar `OrderCards`
- Agregar botón "Crear Nueva Orden" en la sección superior
- Al hacer clic, abrir un `Dialog` con:
  - Selector de tipo de orden (Para Llevar/Mesa/Domicilio)
  - selector de mesa (cuando tipo sea "mesa")
  - Grid de productos para agregar al pedido
  - Input nombre de cliente
  - Botón guardar para crear el pedido

#### 4. Formulario de Creación de Pedido
- Reutilizar componentes existentes: `Dialog`, `Select`, `ProductGrid` adaptado
- Manejo de estado local en el dialog para items del pedido
- Al submit: crear orden vía `orderService.create()` y agregar al store

### Dependencias del API
- `POST /api/v1/orders` - ya existe en `order-service.ts`
- El payload ya tiene: `customerName`, `tableNumber`, `idTable`, `discount`, `notes`, `items`
- Se necesita agregar `orderType` al payload

### Verificación
- `pnpm exec tsc -b` debe pasar sin errores
- `pnpm lint` no debe tener errores nuevos